import { type CoreEventTraceRecord } from '../../behaviors/core-event-pagination-behavior.ts';
import {
  enforceCoreGovernedAction,
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext,
  type CorePolicyContext
} from '../../behaviors/core-governance-behavior.ts';
import { CoreIdempotencyRegistry } from '../../behaviors/core-idempotency-behavior.ts';
import {
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../../behaviors/core-reference-behavior.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreErrorCategory,
  type CoreErrorCode
} from '../../behaviors/core-safe-error.ts';
import type { CoreDomainId } from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  createCoreEventType,
  type CoreEventAction,
  type CoreEventId
} from '../../events/index.ts';
import type {
  CoreJsonObject,
  CoreMvpObjectBaseRecord
} from '../../objects/core-mvp-object-base-record.ts';
import type { CoreObjectStatus } from '../../objects/core-object-status.ts';
import {
  createCoreObjectId,
  createCoreObjectType
} from '../../objects/index.ts';

export const CORE_ORGANIZATION_TYPES = [
  'InternalOrganization',
  'CustomerOrganization',
  'PartnerOrganization',
  'AgentOrganization',
  'ServiceProviderOrganization',
  'SystemOrganization',
  'Unknown'
] as const;
export type CoreOrganizationType = (typeof CORE_ORGANIZATION_TYPES)[number];

export const CORE_ORGANIZATION_STATUSES = [
  'Draft',
  'Active',
  'Suspended',
  'ReviewRequired',
  'Inactive',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreOrganizationStatus =
  (typeof CORE_ORGANIZATION_STATUSES)[number];

export const CORE_ORGANIZATION_USER_LINK_TYPES = [
  'Owner',
  'Admin',
  'Member',
  'ExternalMember',
  'ServiceMember',
  'Viewer',
  'Unknown'
] as const;
export type CoreOrganizationUserLinkType =
  (typeof CORE_ORGANIZATION_USER_LINK_TYPES)[number];

export const CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS = [
  'createOrganization',
  'getOrganization',
  'updateOrganization',
  'changeOrganizationStatus',
  'linkOrganizationUser',
  'unlinkOrganizationUser',
  'validateOrganizationReference',
  'resolveOrganizationContext',
  'archiveOrganization'
] as const;

export const CORE_ORGANIZATION_MINIMUM_CAPABILITIES = [
  'create stable governed organization operating-context references',
  'read safe organization summaries without confidential metadata exposure',
  'update governed organization metadata without changing immutable organization id',
  'controlled organization lifecycle and inactive-state enforcement',
  'explicit user-to-organization linkage and unlinkage',
  'optional identity attribution for organization user links',
  'explicit organization reference validation',
  'resolve active organization context from direct or user reference',
  'permission and policy hooks without granting authorization',
  'human review preservation for AI-initiated sensitive organization changes',
  'customer, partner, agent, service-provider, billing, and authentication boundary exclusion',
  'safe error return',
  'event trace handoff for mutation',
  'event failure rollback',
  'idempotency handling for duplicate-sensitive mutation',
  'cross-organization non-enumeration'
] as const;

const CONTRACT_ID = 'core-service-organization-service-contract';
const ORGANIZATION_OBJECT_TYPE = 'organization-record';
const ORGANIZATION_DOMAIN: CoreDomainId = 'organization';
const ORGANIZATION_OBJECT_CONTRACT_ID =
  'core-object-organization-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreOrganizationStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Active: 'active',
  Suspended: 'inactive',
  ReviewRequired: 'draft',
  Inactive: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Active',
  'Draft->ReviewRequired',
  'Draft->Inactive',
  'Draft->Archived',
  'ReviewRequired->Active',
  'ReviewRequired->Inactive',
  'ReviewRequired->Archived',
  'Active->Suspended',
  'Active->ReviewRequired',
  'Active->Inactive',
  'Active->Archived',
  'Suspended->Active',
  'Suspended->ReviewRequired',
  'Suspended->Inactive',
  'Suspended->Archived',
  'Inactive->Active',
  'Inactive->ReviewRequired',
  'Inactive->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreOrganizationGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreOrganizationUserLink {
  readonly userReferenceId: string;
  readonly identityReferenceId: string | null;
  readonly linkType: CoreOrganizationUserLinkType;
}

export interface CoreOrganizationServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly organizationType: CoreOrganizationType;
  readonly organizationStatus: CoreOrganizationStatus;
  readonly nameReference: string;
  readonly sourceReference: string;
  readonly parentOrganizationReferenceId: string | null;
  readonly ownerIdentityReferenceId: string | null;
  readonly userLinks: readonly CoreOrganizationUserLink[];
  readonly aiInitiated: boolean;
  readonly agentContractReferenceId: string | null;
}

export interface CoreOrganizationSafeView {
  readonly [key: string]: unknown;
  readonly organizationReferenceId: string;
  readonly organizationType: CoreOrganizationType;
  readonly organizationStatus: CoreOrganizationStatus;
  readonly nameReferencePresent: boolean;
  readonly parentOrganizationReferencePresent: boolean;
  readonly ownerIdentityReferencePresent: boolean;
  readonly userLinkCount: number;
  readonly userLinkTypes: readonly CoreOrganizationUserLinkType[];
  readonly aiInitiated: boolean;
  readonly grantsPermission: false;
  readonly evaluatesPolicy: false;
  readonly billingImplemented: false;
  readonly authenticationImplemented: false;
  readonly businessPartyObjectsCreated: false;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreOrganizationReferenceValidationResult {
  readonly isValid: boolean;
  readonly organizationReferenceId: string;
  readonly organizationType: CoreOrganizationType | null;
  readonly status: CoreOrganizationStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Inactive'
    | 'Suspended'
    | 'ReviewRequired'
    | 'Archived'
    | 'DeletedReferenceOnly'
    | 'PolicyRestricted';
  readonly policyHint: 'Allowed' | 'Restricted' | null;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreOrganizationServiceStore {
  get(id: string): CoreOrganizationServiceRecord | undefined;
  list(): readonly CoreOrganizationServiceRecord[];
  insert(
    record: CoreOrganizationServiceRecord
  ): CoreBehaviorResult<CoreOrganizationServiceRecord>;
  replace(
    record: CoreOrganizationServiceRecord
  ): CoreBehaviorResult<CoreOrganizationServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreOrganizationTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreOrganizationServiceDependencies {
  readonly store: CoreOrganizationServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CoreOrganizationTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    organizationReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
}

function immutable<T>(value: T): T {
  const cloned = structuredClone(value);
  const freeze = (candidate: unknown): void => {
    if (typeof candidate !== 'object' || candidate === null) return;
    for (const nested of Object.values(candidate)) freeze(nested);
    Object.freeze(candidate);
  };
  freeze(cloned);
  return cloned;
}

function safe<T = never>(
  code: CoreErrorCode,
  category: CoreErrorCategory,
  message: string,
  correlationId?: string
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({ code, category, message, correlationId })
  };
}

function included<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function organizationScopeOf(
  record: CoreOrganizationServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreOrganizationGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  ) {
    return safe(
      'OrganizationNotFound',
      'Reference',
      'Organization was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function ensureGovernance(
  context: CoreOrganizationGovernanceContext,
  expected: {
    readonly operation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly target: string;
  }
): CoreBehaviorResult<null> {
  if (
    context.permission.correlationId !== context.correlationId ||
    context.policy.correlationId !== context.correlationId ||
    context.audit.correlationId !== context.correlationId ||
    context.permission.intendedOperation !== expected.operation ||
    context.policy.intendedOperation !== expected.operation ||
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== ORGANIZATION_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Organization governance context is invalid.',
      context.correlationId
    );
  }
  const governed = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  return governed.ok ? { ok: true, value: null } : governed;
}

function idempotencyScope(
  governance: CoreOrganizationGovernanceContext,
  operation: string
): string {
  return [
    CONTRACT_ID,
    operation,
    governance.authorizedOrganizationReferenceId ??
      governance.permission.actorReferenceId ??
      'anonymous'
  ].join('|');
}

function updatedObject(
  current: CoreOrganizationServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.organizationStatus
): CoreMvpObjectBaseRecord {
  return {
    ...current.objectRecord,
    status: statusToObjectStatus[status],
    version: current.objectRecord.version
      ? { ...current.objectRecord.version, updatedAt: now }
      : undefined,
    auditMetadata: {
      ...current.objectRecord.auditMetadata,
      updatedAt: now,
      updatedByReferenceId:
        actorReferenceId ??
        current.objectRecord.auditMetadata.createdByReferenceId
    }
  };
}

function safeView(
  record: CoreOrganizationServiceRecord
): CoreOrganizationSafeView {
  return {
    organizationReferenceId: record.objectRecord.publicReferenceId,
    organizationType: record.organizationType,
    organizationStatus: record.organizationStatus,
    nameReferencePresent: Boolean(record.nameReference),
    parentOrganizationReferencePresent: Boolean(
      record.parentOrganizationReferenceId
    ),
    ownerIdentityReferencePresent: Boolean(record.ownerIdentityReferenceId),
    userLinkCount: record.userLinks.length,
    userLinkTypes: [...new Set(record.userLinks.map((link) => link.linkType))],
    aiInitiated: record.aiInitiated,
    grantsPermission: false,
    evaluatesPolicy: false,
    billingImplemented: false,
    authenticationImplemented: false,
    businessPartyObjectsCreated: false,
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CoreOrganizationServiceRecord
): CoreBehaviorResult<CoreOrganizationServiceRecord> {
  if (!included(CORE_ORGANIZATION_TYPES, record.organizationType))
    return safe(
      'InvalidOrganizationType',
      'Validation',
      'Organization type is invalid.'
    );
  if (!included(CORE_ORGANIZATION_STATUSES, record.organizationStatus))
    return safe(
      'InvalidOrganizationStatus',
      'State',
      'Organization status is invalid.'
    );
  if (!opaque.test(record.nameReference))
    return safe(
      'OrganizationNameReferenceRequired',
      'Validation',
      'Organization name reference is required.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'OrganizationSourceReferenceRequired',
      'Validation',
      'Organization source reference is required.'
    );
  if (
    record.objectRecord.objectType !== ORGANIZATION_OBJECT_TYPE ||
    record.objectRecord.domainId !== ORGANIZATION_DOMAIN ||
    record.objectRecord.objectContractId !== ORGANIZATION_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !==
      statusToObjectStatus[record.organizationStatus]
  ) {
    return safe(
      'OrganizationObjectMismatch',
      'Validation',
      'Organization Object contract is inconsistent.'
    );
  }
  if (record.aiInitiated && !opaque.test(record.agentContractReferenceId ?? ''))
    return safe(
      'InvalidOrganizationRecord',
      'Agent',
      'AI-initiated Organization requires an Agent Contract reference.'
    );
  if (
    record.parentOrganizationReferenceId &&
    !opaque.test(record.parentOrganizationReferenceId)
  )
    return safe(
      'InvalidOrganizationReference',
      'Reference',
      'Parent Organization reference is invalid.'
    );
  if (
    record.ownerIdentityReferenceId &&
    !opaque.test(record.ownerIdentityReferenceId)
  )
    return safe(
      'InvalidIdentityReference',
      'Reference',
      'Owner Identity reference is invalid.'
    );
  return { ok: true, value: immutable(record) };
}

function traceRecord(input: {
  readonly id: CoreEventId;
  readonly action: CoreEventAction;
  readonly eventType: string;
  readonly organizationReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreOrganizationGovernanceContext;
  readonly payload: CoreJsonObject;
}): CoreEventTraceRecord {
  return {
    auditContextReferenceId: input.governance.auditContextReferenceId,
    visibility: 'Restricted',
    event: {
      id: input.id,
      type: createCoreEventType(
        input.eventType.replaceAll('.', '-').replaceAll('_', '-')
      ),
      action: input.action,
      domainId: ORGANIZATION_DOMAIN,
      object: {
        id: createCoreObjectId(input.organizationReferenceId),
        type: createCoreObjectType(ORGANIZATION_OBJECT_TYPE),
        domainId: ORGANIZATION_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryOrganizationServiceStore implements CoreOrganizationServiceStore {
  readonly #records = new Map<string, CoreOrganizationServiceRecord>();

  get(id: string): CoreOrganizationServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  list(): readonly CoreOrganizationServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CoreOrganizationServiceRecord
  ): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe(
        'OrganizationAlreadyExists',
        'Conflict',
        'Organization already exists.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CoreOrganizationServiceRecord
  ): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe(
        'OrganizationNotFound',
        'Reference',
        'Organization was not found.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreOrganizationService {
  constructor(readonly deps: CoreOrganizationServiceDependencies) {}

  createOrganization(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly organizationType: unknown;
    readonly nameReference: string;
    readonly status?: unknown;
    readonly sourceReference: string;
    readonly parentOrganizationReferenceId?: string | null;
    readonly ownerIdentityReferenceId?: string | null;
    readonly aiInitiated?: boolean;
    readonly agentContractReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'organization.create',
      permission: 'organization:create',
      policyScope: 'organization.write',
      target
    });
    if (!governed.ok) return governed;
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scoped.ok) return scoped;
    if (
      input.publicReferenceRecord.referenceId !== target ||
      input.publicReferenceRecord.objectType !== ORGANIZATION_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== ORGANIZATION_DOMAIN
    )
      return safe(
        'InvalidOrganizationReference',
        'Reference',
        'Organization reference is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_ORGANIZATION_TYPES, input.organizationType))
      return safe(
        'InvalidOrganizationType',
        'Validation',
        'Organization type is invalid.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_ORGANIZATION_STATUSES, status) ||
      !['Draft', 'Active', 'ReviewRequired'].includes(status)
    )
      return safe(
        'InvalidOrganizationStatus',
        'State',
        'Organization creation status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.nameReference))
      return safe(
        'OrganizationNameReferenceRequired',
        'Validation',
        'Organization name reference is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.sourceReference))
      return safe(
        'OrganizationSourceReferenceRequired',
        'Validation',
        'Organization source reference is required.',
        input.governance.correlationId
      );
    if (input.aiInitiated && !opaque.test(input.agentContractReferenceId ?? ''))
      return safe(
        'InvalidOrganizationRecord',
        'Agent',
        'AI-initiated Organization requires an Agent Contract reference.',
        input.governance.correlationId
      );
    if (
      input.aiInitiated &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'OrganizationCreationReviewRequired',
        'HumanReview',
        'AI-initiated Organization creation requires approved human review.',
        input.governance.correlationId
      );
    const related = this.validateOptionalReferences({
      parentOrganizationReferenceId:
        input.parentOrganizationReferenceId ?? null,
      ownerIdentityReferenceId: input.ownerIdentityReferenceId ?? null,
      correlationId: input.governance.correlationId
    });
    if (!related.ok) return related;

    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'createOrganization'
        ),
        operationName: 'createOrganization',
        request: {
          target,
          organizationType: input.organizationType,
          nameReference: input.nameReference,
          status,
          sourceReference: input.sourceReference,
          parentOrganizationReferenceId:
            input.parentOrganizationReferenceId ?? null,
          ownerIdentityReferenceId: input.ownerIdentityReferenceId ?? null,
          aiInitiated: input.aiInitiated ?? false,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe(
            'OrganizationAlreadyExists',
            'Conflict',
            'Organization already exists.'
          );
        const record: CoreOrganizationServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: statusToObjectStatus[status as CoreOrganizationStatus]
          },
          organizationType: input.organizationType as CoreOrganizationType,
          organizationStatus: status as CoreOrganizationStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference,
          parentOrganizationReferenceId:
            input.parentOrganizationReferenceId ?? null,
          ownerIdentityReferenceId: input.ownerIdentityReferenceId ?? null,
          userLinks: [],
          aiInitiated: input.aiInitiated ?? false,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const traced = this.appendTrace({
          operation: 'createOrganization',
          target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: CORE_EVENT_ACTIONS.created,
          eventType: 'organization.created',
          governance: input.governance,
          payload: {
            organizationReferenceId: target,
            organizationType: record.organizationType,
            status: record.organizationStatus,
            aiInitiated: record.aiInitiated,
            grantsPermission: false,
            businessPartyObjectsCreated: false,
            sensitiveMetadataOmitted: true
          }
        });
        if (!traced.ok) {
          this.deps.store.remove(target);
          return traced;
        }
        return inserted;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }

  getOrganization(input: {
    readonly organizationReferenceId: string;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'organization.get',
      permission: 'organization:read',
      policyScope: 'organization.read',
      target: input.organizationReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.organizationReferenceId);
    if (!record)
      return safe(
        'OrganizationNotFound',
        'Reference',
        'Organization was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scoped.ok ? { ok: true, value: safeView(record) } : scoped;
  }

  updateOrganization(input: {
    readonly organizationReferenceId: string;
    readonly nameReference?: string;
    readonly parentOrganizationReferenceId?: string | null;
    readonly ownerIdentityReferenceId?: string | null;
    readonly metadata?: CoreJsonObject;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    if (input.nameReference !== undefined && !opaque.test(input.nameReference))
      return safe(
        'OrganizationNameReferenceRequired',
        'Validation',
        'Organization name reference is invalid.',
        input.governance.correlationId
      );
    const related = this.validateOptionalReferences({
      parentOrganizationReferenceId:
        input.parentOrganizationReferenceId === undefined
          ? null
          : input.parentOrganizationReferenceId,
      ownerIdentityReferenceId:
        input.ownerIdentityReferenceId === undefined
          ? null
          : input.ownerIdentityReferenceId,
      correlationId: input.governance.correlationId,
      skipNull: true
    });
    if (!related.ok) return related;
    if (
      (input.parentOrganizationReferenceId !== undefined ||
        input.ownerIdentityReferenceId !== undefined) &&
      input.governance.review.humanReviewRequired &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'HumanReviewRequired',
        'HumanReview',
        'Sensitive Organization relationship change requires approved human review.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'updateOrganization',
      governanceOperation: 'organization.update',
      permission: 'organization:update',
      policyScope: 'organization.write',
      organizationReferenceId: input.organizationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nameReference: input.nameReference ?? null,
        parentOrganizationReferenceId:
          input.parentOrganizationReferenceId ?? null,
        ownerIdentityReferenceId: input.ownerIdentityReferenceId ?? null,
        metadata: input.metadata ?? null
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'organization.updated',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(
          current.organizationStatus
        )
          ? safe(
              'InvalidOrganizationTransition',
              'State',
              'Archived Organization cannot be updated.',
              input.governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: {
          ...updatedObject(
            current,
            now,
            input.governance.permission.actorReferenceId
          ),
          metadata:
            input.metadata === undefined
              ? current.objectRecord.metadata
              : immutable(input.metadata)
        },
        nameReference:
          input.nameReference === undefined
            ? current.nameReference
            : input.nameReference,
        parentOrganizationReferenceId:
          input.parentOrganizationReferenceId === undefined
            ? current.parentOrganizationReferenceId
            : input.parentOrganizationReferenceId,
        ownerIdentityReferenceId:
          input.ownerIdentityReferenceId === undefined
            ? current.ownerIdentityReferenceId
            : input.ownerIdentityReferenceId
      }),
      payload: () => ({
        organizationReferenceId: input.organizationReferenceId,
        nameReferenceChanged: input.nameReference !== undefined,
        parentReferenceChanged:
          input.parentOrganizationReferenceId !== undefined,
        ownerIdentityChanged: input.ownerIdentityReferenceId !== undefined,
        sensitiveMetadataOmitted: true
      })
    });
  }

  changeOrganizationStatus(input: {
    readonly organizationReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    if (!included(CORE_ORGANIZATION_STATUSES, input.nextStatus))
      return safe(
        'InvalidOrganizationStatus',
        'State',
        'Organization status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReference))
      return safe(
        'OrganizationReasonReferenceRequired',
        'Validation',
        'Organization status reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'changeOrganizationStatus',
      governanceOperation: 'organization.status.change',
      permission: 'organization:status',
      policyScope: 'organization.status',
      organizationReferenceId: input.organizationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference
      },
      action: CORE_EVENT_ACTIONS.statusChanged,
      eventType: 'organization.status.changed',
      before: (current) => {
        if (
          !lifecycleTransitions.has(
            `${current.organizationStatus}->${input.nextStatus}`
          )
        )
          return safe(
            'InvalidOrganizationTransition',
            'State',
            'Organization status transition is not allowed.',
            input.governance.correlationId
          );
        if (
          ['Suspended', 'Inactive'].includes(current.organizationStatus) &&
          input.nextStatus === 'Active' &&
          input.governance.review.reviewDecision !== 'Approved'
        )
          return safe(
            'HumanReviewRequired',
            'HumanReview',
            'Reactivating Organization requires approved human review.',
            input.governance.correlationId
          );
        return { ok: true, value: null };
      },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          input.nextStatus as CoreOrganizationStatus
        ),
        organizationStatus: input.nextStatus as CoreOrganizationStatus
      }),
      payload: (next, previous) => ({
        organizationReferenceId: input.organizationReferenceId,
        previousStatus: previous.organizationStatus,
        nextStatus: next.organizationStatus,
        reasonReferencePresent: true
      })
    });
  }

  linkOrganizationUser(input: {
    readonly organizationReferenceId: string;
    readonly userReferenceId: string;
    readonly identityReferenceId?: string | null;
    readonly linkType: unknown;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    if (
      !included(CORE_ORGANIZATION_USER_LINK_TYPES, input.linkType) ||
      input.linkType === 'Unknown'
    )
      return safe(
        'InvalidOrganizationUserLinkType',
        'Validation',
        'Organization User link type is invalid.',
        input.governance.correlationId
      );
    const user = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.userReferenceId,
      expectedObjectType: 'user-record',
      expectedDomain: 'user'
    });
    if (!user.ok)
      return safe(
        'InvalidUserReference',
        'Reference',
        'User reference is invalid.',
        input.governance.correlationId
      );
    if (input.identityReferenceId) {
      const identity = this.deps.relatedReferenceRegistry.resolve({
        referenceId: input.identityReferenceId,
        expectedObjectType: 'identity-record',
        expectedDomain: 'identity'
      });
      if (!identity.ok)
        return safe(
          'InvalidIdentityReference',
          'Reference',
          'Identity reference is invalid.',
          input.governance.correlationId
        );
    }
    if (
      ['Owner', 'Admin'].includes(input.linkType) &&
      input.governance.review.humanReviewRequired &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'HumanReviewRequired',
        'HumanReview',
        'Privileged Organization User linkage requires approved human review.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'linkOrganizationUser',
      governanceOperation: 'organization.user.link',
      permission: 'organization:user:link',
      policyScope: 'organization.relationship',
      organizationReferenceId: input.organizationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        userReferenceId: input.userReferenceId,
        identityReferenceId: input.identityReferenceId ?? null,
        linkType: input.linkType
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'organization.user.linked',
      before: (current) => {
        if (current.organizationStatus !== 'Active')
          return safe(
            'InvalidOrganizationStatus',
            'State',
            'Only active Organization may receive a User link.',
            input.governance.correlationId
          );
        if (
          current.userLinks.some(
            (link) => link.userReferenceId === input.userReferenceId
          )
        )
          return safe(
            'DuplicateOrganizationUserLink',
            'Conflict',
            'Organization User link already exists.',
            input.governance.correlationId
          );
        return { ok: true, value: null };
      },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId
        ),
        userLinks: [
          ...current.userLinks,
          {
            userReferenceId: input.userReferenceId,
            identityReferenceId: input.identityReferenceId ?? null,
            linkType: input.linkType as CoreOrganizationUserLinkType
          }
        ]
      }),
      payload: (next) => ({
        organizationReferenceId: input.organizationReferenceId,
        userReferenceId: input.userReferenceId,
        linkType: input.linkType as CoreOrganizationUserLinkType,
        linkCount: next.userLinks.length,
        grantsPermission: false,
        linkedIdentityPresent: Boolean(input.identityReferenceId)
      })
    });
  }

  unlinkOrganizationUser(input: {
    readonly organizationReferenceId: string;
    readonly userReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'OrganizationReasonReferenceRequired',
        'Validation',
        'Organization User unlink reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'unlinkOrganizationUser',
      governanceOperation: 'organization.user.unlink',
      permission: 'organization:user:unlink',
      policyScope: 'organization.relationship',
      organizationReferenceId: input.organizationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        userReferenceId: input.userReferenceId,
        reasonReference: input.reasonReference
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'organization.user.unlinked',
      before: (current) => {
        const link = current.userLinks.find(
          (entry) => entry.userReferenceId === input.userReferenceId
        );
        if (!link)
          return safe(
            'OrganizationUserLinkNotFound',
            'Reference',
            'Organization User link was not found.',
            input.governance.correlationId
          );
        if (
          link.linkType === 'Owner' &&
          input.governance.review.reviewDecision !== 'Approved'
        )
          return safe(
            'HumanReviewRequired',
            'HumanReview',
            'Removing Organization Owner requires approved human review.',
            input.governance.correlationId
          );
        return { ok: true, value: null };
      },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId
        ),
        userLinks: current.userLinks.filter(
          (link) => link.userReferenceId !== input.userReferenceId
        )
      }),
      payload: (next) => ({
        organizationReferenceId: input.organizationReferenceId,
        userReferenceId: input.userReferenceId,
        linkCount: next.userLinks.length,
        reasonReferencePresent: true,
        grantsPermission: false
      })
    });
  }

  validateOrganizationReference(input: {
    readonly organizationReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'organization.reference.validate',
      permission: 'organization:read',
      policyScope: 'organization.reference',
      target: input.organizationReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.requestingService))
      return safe(
        'InvalidOrganizationRequestingService',
        'Validation',
        'Requesting service reference is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.organizationReferenceId);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          organizationReferenceId: input.organizationReferenceId,
          organizationType: null,
          status: null,
          reasonCode: 'NotFound',
          policyHint: null,
          restrictedFieldsOmitted: true
        }
      };
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scoped.ok)
      return {
        ok: true,
        value: {
          isValid: false,
          organizationReferenceId: input.organizationReferenceId,
          organizationType: null,
          status: null,
          reasonCode: 'NotFound',
          policyHint: null,
          restrictedFieldsOmitted: true
        }
      };
    const reasonCode =
      record.organizationStatus === 'Inactive'
        ? 'Inactive'
        : record.organizationStatus === 'Suspended'
          ? 'Suspended'
          : record.organizationStatus === 'ReviewRequired'
            ? 'ReviewRequired'
            : record.organizationStatus === 'Archived'
              ? 'Archived'
              : record.organizationStatus === 'DeletedReferenceOnly'
                ? 'DeletedReferenceOnly'
                : record.organizationStatus === 'Active'
                  ? 'Valid'
                  : 'ReviewRequired';
    return {
      ok: true,
      value: {
        isValid: reasonCode === 'Valid',
        organizationReferenceId: input.organizationReferenceId,
        organizationType: record.organizationType,
        status: record.organizationStatus,
        reasonCode,
        policyHint: 'Allowed',
        restrictedFieldsOmitted: true
      }
    };
  }

  resolveOrganizationContext(input: {
    readonly organizationReferenceId?: string | null;
    readonly userReferenceId?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationSafeView> {
    const target =
      input.organizationReferenceId ?? input.userReferenceId ?? 'unknown';
    const governed = ensureGovernance(input.governance, {
      operation: 'organization.context.resolve',
      permission: 'organization:read',
      policyScope: 'organization.resolve',
      target
    });
    if (!governed.ok) return governed;
    if (
      Boolean(input.organizationReferenceId) ===
        Boolean(input.userReferenceId) ||
      !opaque.test(target)
    )
      return safe(
        'InvalidOrganizationResolveReference',
        'Reference',
        'Organization context resolution reference is invalid.',
        input.governance.correlationId
      );
    let matches: readonly CoreOrganizationServiceRecord[];
    if (input.organizationReferenceId) {
      const record = this.deps.store.get(input.organizationReferenceId);
      matches = record ? [record] : [];
    } else {
      const userReferenceId = input.userReferenceId as string;
      const user = this.deps.relatedReferenceRegistry.resolve({
        referenceId: userReferenceId,
        expectedObjectType: 'user-record',
        expectedDomain: 'user'
      });
      if (!user.ok)
        return safe(
          'InvalidUserReference',
          'Reference',
          'User reference is invalid.',
          input.governance.correlationId
        );
      matches = this.deps.store
        .list()
        .filter((record) =>
          record.userLinks.some(
            (link) => link.userReferenceId === userReferenceId
          )
        );
    }
    const scopedMatches = matches.filter(
      (record) =>
        !input.governance.authorizedOrganizationReferenceId ||
        organizationScopeOf(record) ===
          input.governance.authorizedOrganizationReferenceId
    );
    if (scopedMatches.length !== 1)
      return safe(
        'OrganizationNotFound',
        'Reference',
        'Organization was not found.',
        input.governance.correlationId
      );
    if (scopedMatches[0].organizationStatus !== 'Active')
      return safe(
        'InvalidOrganizationStatus',
        'State',
        'Organization cannot be resolved in its current status.',
        input.governance.correlationId
      );
    return { ok: true, value: safeView(scopedMatches[0]) };
  }

  archiveOrganization(input: {
    readonly organizationReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
  }): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'OrganizationReasonReferenceRequired',
        'Validation',
        'Organization archive reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'archiveOrganization',
      governanceOperation: 'organization.archive',
      permission: 'organization:archive',
      policyScope: 'organization.status',
      organizationReferenceId: input.organizationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: { reasonReference: input.reasonReference },
      action: CORE_EVENT_ACTIONS.archived,
      eventType: 'organization.archived',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(
          current.organizationStatus
        )
          ? safe(
              'InvalidOrganizationTransition',
              'State',
              'Organization is already archived.',
              input.governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          'Archived'
        ),
        organizationStatus: 'Archived'
      }),
      payload: () => ({
        organizationReferenceId: input.organizationReferenceId,
        status: 'Archived',
        reasonReferencePresent: true
      })
    });
  }

  private validateOptionalReferences(input: {
    readonly parentOrganizationReferenceId: string | null;
    readonly ownerIdentityReferenceId: string | null;
    readonly correlationId: string;
    readonly skipNull?: boolean;
  }): CoreBehaviorResult<null> {
    if (input.parentOrganizationReferenceId) {
      const parent = this.deps.relatedReferenceRegistry.resolve({
        referenceId: input.parentOrganizationReferenceId,
        expectedObjectType: ORGANIZATION_OBJECT_TYPE,
        expectedDomain: ORGANIZATION_DOMAIN
      });
      if (!parent.ok)
        return safe(
          'InvalidOrganizationReference',
          'Reference',
          'Parent Organization reference is invalid.',
          input.correlationId
        );
    }
    if (input.ownerIdentityReferenceId) {
      const identity = this.deps.relatedReferenceRegistry.resolve({
        referenceId: input.ownerIdentityReferenceId,
        expectedObjectType: 'identity-record',
        expectedDomain: 'identity'
      });
      if (!identity.ok)
        return safe(
          'InvalidIdentityReference',
          'Reference',
          'Owner Identity reference is invalid.',
          input.correlationId
        );
    }
    return { ok: true, value: null };
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CoreOrganizationGovernanceContext;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CoreEventTraceRecord> {
    const trace = this.deps.tracePort.append(
      traceRecord({
        id: this.deps.traceEventIdFactory(
          input.operation,
          input.target,
          input.idempotencyKey
        ),
        action: input.action,
        eventType: input.eventType,
        organizationReferenceId: input.target,
        occurredAt: this.deps.now(),
        governance: input.governance,
        payload: input.payload
      })
    );
    return trace.ok
      ? trace
      : safe(
          'OrganizationTraceFailed',
          'Event',
          'Organization Event trace handoff failed.',
          input.governance.correlationId
        );
  }

  private mutate(input: {
    readonly operationName: string;
    readonly governanceOperation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly organizationReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrganizationGovernanceContext;
    readonly request: CoreJsonObject;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly before?: (
      current: CoreOrganizationServiceRecord
    ) => CoreBehaviorResult<null>;
    readonly apply: (
      current: CoreOrganizationServiceRecord,
      now: string
    ) => CoreOrganizationServiceRecord;
    readonly payload: (
      next: CoreOrganizationServiceRecord,
      previous: CoreOrganizationServiceRecord
    ) => CoreJsonObject;
  }): CoreBehaviorResult<CoreOrganizationServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: input.governanceOperation,
      permission: input.permission,
      policyScope: input.policyScope,
      target: input.organizationReferenceId
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.organizationReferenceId);
    if (!current)
      return safe(
        'OrganizationNotFound',
        'Reference',
        'Organization was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(current)
    );
    if (!scoped.ok) return scoped;
    const precondition = input.before?.(current);
    if (precondition && !precondition.ok) return precondition;
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          input.operationName
        ),
        operationName: input.operationName,
        request: {
          organizationReferenceId: input.organizationReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const latest = this.deps.store.get(input.organizationReferenceId);
        if (!latest)
          return safe(
            'OrganizationNotFound',
            'Reference',
            'Organization was not found.'
          );
        const before = immutable(latest);
        const next = input.apply(latest, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const traced = this.appendTrace({
          operation: input.operationName,
          target: input.organizationReferenceId,
          idempotencyKey: input.idempotencyKey ?? '',
          action: input.action,
          eventType: input.eventType,
          governance: input.governance,
          payload: input.payload(valid.value, before)
        });
        if (!traced.ok) {
          this.deps.store.replace(before);
          return traced;
        }
        return replaced;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }
}
