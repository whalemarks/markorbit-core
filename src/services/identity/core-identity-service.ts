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

export const CORE_IDENTITY_TYPES = [
  'Human',
  'System',
  'AIAgent',
  'ServiceAccount',
  'ExternalActor',
  'Unknown'
] as const;
export type CoreIdentityType = (typeof CORE_IDENTITY_TYPES)[number];

export const CORE_IDENTITY_STATUSES = [
  'Draft',
  'Active',
  'Suspended',
  'ReviewRequired',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreIdentityStatus = (typeof CORE_IDENTITY_STATUSES)[number];

export const CORE_IDENTITY_LINK_TYPES = [
  'UserAccount',
  'OrganizationMember',
  'SystemActor',
  'AIAgentActor',
  'ExternalContact',
  'ServiceAccount',
  'Unknown'
] as const;
export type CoreIdentityLinkType = (typeof CORE_IDENTITY_LINK_TYPES)[number];

export const CORE_IDENTITY_IMPLEMENTED_OPERATIONS = [
  'createIdentity',
  'getIdentity',
  'updateIdentity',
  'changeIdentityStatus',
  'linkIdentity',
  'validateIdentityReference',
  'resolveIdentity',
  'archiveIdentity'
] as const;

export const CORE_IDENTITY_MINIMUM_CAPABILITIES = [
  'create stable governed actor identity references',
  'read safe identity summaries without sensitive metadata exposure',
  'update non-sensitive identity metadata without changing immutable identity id',
  'controlled identity lifecycle and suspension enforcement',
  'governed user, organization, system, AI agent, external contact, and service-account reference linkage',
  'duplicate target-link prevention for deterministic identity resolution',
  'explicit identity reference validation',
  'resolve identity from an allowed linked reference',
  'permission and policy check hooks without granting authorization',
  'human review preservation for AI-initiated human identity changes',
  'authentication, password, OAuth, SAML, and credential storage exclusion',
  'safe error return',
  'event trace handoff for mutation',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive',
  'cross-organization non-enumeration'
] as const;

const CONTRACT_ID = 'core-service-identity-resolution-service-contract';
const IDENTITY_OBJECT_TYPE = 'identity-record';
const IDENTITY_DOMAIN: CoreDomainId = 'identity';
const IDENTITY_OBJECT_CONTRACT_ID = 'core-object-identity-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreIdentityStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Active: 'active',
  Suspended: 'inactive',
  ReviewRequired: 'draft',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Active',
  'Draft->ReviewRequired',
  'Draft->Archived',
  'ReviewRequired->Active',
  'ReviewRequired->Archived',
  'Active->Suspended',
  'Active->ReviewRequired',
  'Active->Archived',
  'Suspended->Active',
  'Suspended->ReviewRequired',
  'Suspended->Archived',
  'Archived->DeletedReferenceOnly'
]);

const linkTargets: Record<
  Exclude<CoreIdentityLinkType, 'Unknown'>,
  { readonly objectType: string; readonly domainId: CoreDomainId }
> = {
  UserAccount: { objectType: 'user-record', domainId: 'user' },
  OrganizationMember: {
    objectType: 'organization-record',
    domainId: 'organization'
  },
  SystemActor: { objectType: 'identity-record', domainId: 'identity' },
  AIAgentActor: { objectType: 'agent-record', domainId: 'agent' },
  ExternalContact: {
    objectType: 'communication-record',
    domainId: 'communication'
  },
  ServiceAccount: { objectType: 'identity-record', domainId: 'identity' }
};

export interface CoreIdentityGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreIdentityLink {
  readonly linkType: CoreIdentityLinkType;
  readonly linkedObjectReferenceId: string;
}

export interface CoreIdentityServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly identityType: CoreIdentityType;
  readonly identityStatus: CoreIdentityStatus;
  readonly displayReference: string;
  readonly providerReference: string | null;
  readonly sourceReference: string;
  readonly links: readonly CoreIdentityLink[];
  readonly aiInitiated: boolean;
  readonly agentContractReferenceId: string | null;
}

export interface CoreIdentitySafeView {
  readonly [key: string]: unknown;
  readonly identityReferenceId: string;
  readonly identityType: CoreIdentityType;
  readonly identityStatus: CoreIdentityStatus;
  readonly displayReferencePresent: boolean;
  readonly providerReferencePresent: boolean;
  readonly linkCount: number;
  readonly linkedObjectTypes: readonly CoreIdentityLinkType[];
  readonly aiInitiated: boolean;
  readonly grantsPermission: false;
  readonly authenticationImplemented: false;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreIdentityReferenceValidationResult {
  readonly isValid: boolean;
  readonly identityReferenceId: string;
  readonly identityType: CoreIdentityType | null;
  readonly status: CoreIdentityStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Suspended'
    | 'ReviewRequired'
    | 'Archived'
    | 'DeletedReferenceOnly'
    | 'PolicyRestricted';
  readonly policyHint: 'Allowed' | 'Restricted' | null;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreIdentityServiceStore {
  get(id: string): CoreIdentityServiceRecord | undefined;
  list(): readonly CoreIdentityServiceRecord[];
  insert(
    record: CoreIdentityServiceRecord
  ): CoreBehaviorResult<CoreIdentityServiceRecord>;
  replace(
    record: CoreIdentityServiceRecord
  ): CoreBehaviorResult<CoreIdentityServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreIdentityTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreIdentityServiceDependencies {
  readonly store: CoreIdentityServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CoreIdentityTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    identityReferenceId: string,
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
  record: CoreIdentityServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreIdentityGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  ) {
    return safe(
      'IdentityNotFound',
      'Reference',
      'Identity was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function ensureGovernance(
  context: CoreIdentityGovernanceContext,
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
    context.audit.targetObjectType !== IDENTITY_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Identity governance context is invalid.',
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
  governance: CoreIdentityGovernanceContext,
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
  current: CoreIdentityServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.identityStatus
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

function safeView(record: CoreIdentityServiceRecord): CoreIdentitySafeView {
  return {
    identityReferenceId: record.objectRecord.publicReferenceId,
    identityType: record.identityType,
    identityStatus: record.identityStatus,
    displayReferencePresent: Boolean(record.displayReference),
    providerReferencePresent: Boolean(record.providerReference),
    linkCount: record.links.length,
    linkedObjectTypes: [...new Set(record.links.map((link) => link.linkType))],
    aiInitiated: record.aiInitiated,
    grantsPermission: false,
    authenticationImplemented: false,
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CoreIdentityServiceRecord
): CoreBehaviorResult<CoreIdentityServiceRecord> {
  if (!included(CORE_IDENTITY_TYPES, record.identityType))
    return safe(
      'InvalidIdentityType',
      'Validation',
      'Identity type is invalid.'
    );
  if (!included(CORE_IDENTITY_STATUSES, record.identityStatus))
    return safe(
      'InvalidIdentityStatus',
      'State',
      'Identity status is invalid.'
    );
  if (!opaque.test(record.displayReference))
    return safe(
      'InvalidIdentityDisplayReference',
      'Validation',
      'Identity display reference is invalid.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'IdentitySourceReferenceRequired',
      'Validation',
      'Identity source reference is required.'
    );
  if (
    record.objectRecord.objectType !== IDENTITY_OBJECT_TYPE ||
    record.objectRecord.domainId !== IDENTITY_DOMAIN ||
    record.objectRecord.objectContractId !== IDENTITY_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.identityStatus]
  ) {
    return safe(
      'IdentityObjectMismatch',
      'Validation',
      'Identity Object contract is inconsistent.'
    );
  }
  if (record.aiInitiated && !opaque.test(record.agentContractReferenceId ?? ''))
    return safe(
      'InvalidIdentityRecord',
      'Agent',
      'AI-initiated Identity requires an Agent Contract reference.'
    );
  return { ok: true, value: immutable(record) };
}

function traceRecord(input: {
  readonly id: CoreEventId;
  readonly action: CoreEventAction;
  readonly eventType: string;
  readonly identityReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreIdentityGovernanceContext;
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
      domainId: IDENTITY_DOMAIN,
      object: {
        id: createCoreObjectId(input.identityReferenceId),
        type: createCoreObjectType(IDENTITY_OBJECT_TYPE),
        domainId: IDENTITY_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryIdentityServiceStore implements CoreIdentityServiceStore {
  readonly #records = new Map<string, CoreIdentityServiceRecord>();

  get(id: string): CoreIdentityServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  list(): readonly CoreIdentityServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CoreIdentityServiceRecord
  ): CoreBehaviorResult<CoreIdentityServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe(
        'IdentityAlreadyExists',
        'Conflict',
        'Identity already exists.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CoreIdentityServiceRecord
  ): CoreBehaviorResult<CoreIdentityServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe('IdentityNotFound', 'Reference', 'Identity was not found.');
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreIdentityService {
  constructor(readonly deps: CoreIdentityServiceDependencies) {}

  createIdentity(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly identityType: unknown;
    readonly displayReference: string;
    readonly status?: unknown;
    readonly providerReference?: string | null;
    readonly sourceReference: string;
    readonly aiInitiated?: boolean;
    readonly agentContractReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentityServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'identity.create',
      permission: 'identity:create',
      policyScope: 'identity.write',
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
      input.publicReferenceRecord.objectType !== IDENTITY_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== IDENTITY_DOMAIN
    )
      return safe(
        'InvalidIdentityReference',
        'Reference',
        'Identity reference is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_IDENTITY_TYPES, input.identityType))
      return safe(
        'InvalidIdentityType',
        'Validation',
        'Identity type is invalid.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_IDENTITY_STATUSES, status) ||
      !['Draft', 'Active', 'ReviewRequired'].includes(status)
    )
      return safe(
        'InvalidIdentityStatus',
        'State',
        'Identity creation status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.displayReference))
      return safe(
        'InvalidIdentityDisplayReference',
        'Validation',
        'Identity display reference is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.sourceReference))
      return safe(
        'IdentitySourceReferenceRequired',
        'Validation',
        'Identity source reference is required.',
        input.governance.correlationId
      );
    if (input.providerReference && !opaque.test(input.providerReference))
      return safe(
        'InvalidIdentityReference',
        'Reference',
        'Identity provider reference is invalid.',
        input.governance.correlationId
      );
    if (input.aiInitiated && !opaque.test(input.agentContractReferenceId ?? ''))
      return safe(
        'InvalidIdentityRecord',
        'Agent',
        'AI-initiated Identity requires an Agent Contract reference.',
        input.governance.correlationId
      );
    if (
      input.aiInitiated &&
      input.identityType === 'Human' &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'IdentityHumanCreationReviewRequired',
        'HumanReview',
        'AI-initiated human Identity creation requires approved human review.',
        input.governance.correlationId
      );

    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createIdentity'),
        operationName: 'createIdentity',
        request: {
          target,
          identityType: input.identityType,
          displayReference: input.displayReference,
          status,
          providerReference: input.providerReference ?? null,
          sourceReference: input.sourceReference,
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
            'IdentityAlreadyExists',
            'Conflict',
            'Identity already exists.'
          );
        const record: CoreIdentityServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: statusToObjectStatus[status as CoreIdentityStatus]
          },
          identityType: input.identityType as CoreIdentityType,
          identityStatus: status as CoreIdentityStatus,
          displayReference: input.displayReference,
          providerReference: input.providerReference ?? null,
          sourceReference: input.sourceReference,
          links: [],
          aiInitiated: input.aiInitiated ?? false,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const traced = this.appendTrace({
          operation: 'createIdentity',
          target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: CORE_EVENT_ACTIONS.created,
          eventType: 'identity.created',
          governance: input.governance,
          payload: {
            identityReferenceId: target,
            identityType: record.identityType,
            status: record.identityStatus,
            aiInitiated: record.aiInitiated,
            grantsPermission: false,
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

  getIdentity(input: {
    readonly identityReferenceId: string;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentitySafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'identity.get',
      permission: 'identity:read',
      policyScope: 'identity.read',
      target: input.identityReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.identityReferenceId);
    if (!record)
      return safe(
        'IdentityNotFound',
        'Reference',
        'Identity was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scoped.ok ? { ok: true, value: safeView(record) } : scoped;
  }

  updateIdentity(input: {
    readonly identityReferenceId: string;
    readonly displayReference?: string;
    readonly providerReference?: string | null;
    readonly metadata?: CoreJsonObject;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentityServiceRecord> {
    if (
      input.displayReference !== undefined &&
      !opaque.test(input.displayReference)
    )
      return safe(
        'InvalidIdentityDisplayReference',
        'Validation',
        'Identity display reference is invalid.',
        input.governance.correlationId
      );
    if (input.providerReference && !opaque.test(input.providerReference))
      return safe(
        'InvalidIdentityReference',
        'Reference',
        'Identity provider reference is invalid.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'updateIdentity',
      governanceOperation: 'identity.update',
      permission: 'identity:update',
      policyScope: 'identity.write',
      identityReferenceId: input.identityReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        displayReference: input.displayReference ?? null,
        providerReference: input.providerReference ?? null,
        metadata: input.metadata ?? null
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'identity.updated',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(current.identityStatus)
          ? safe(
              'InvalidIdentityTransition',
              'State',
              'Archived Identity cannot be updated.',
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
        displayReference:
          input.displayReference === undefined
            ? current.displayReference
            : input.displayReference,
        providerReference:
          input.providerReference === undefined
            ? current.providerReference
            : input.providerReference
      }),
      payload: () => ({
        identityReferenceId: input.identityReferenceId,
        displayReferenceChanged: input.displayReference !== undefined,
        providerReferenceChanged: input.providerReference !== undefined,
        sensitiveMetadataOmitted: true
      })
    });
  }

  changeIdentityStatus(input: {
    readonly identityReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentityServiceRecord> {
    if (!included(CORE_IDENTITY_STATUSES, input.nextStatus))
      return safe(
        'InvalidIdentityStatus',
        'State',
        'Identity status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReference))
      return safe(
        'IdentityReasonReferenceRequired',
        'Validation',
        'Identity status reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'changeIdentityStatus',
      governanceOperation: 'identity.status.change',
      permission: 'identity:status',
      policyScope: 'identity.status',
      identityReferenceId: input.identityReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference
      },
      action: CORE_EVENT_ACTIONS.statusChanged,
      eventType: 'identity.status.changed',
      before: (current) => {
        if (
          !lifecycleTransitions.has(
            `${current.identityStatus}->${input.nextStatus}`
          )
        )
          return safe(
            'InvalidIdentityTransition',
            'State',
            'Identity status transition is not allowed.',
            input.governance.correlationId
          );
        if (
          current.identityStatus === 'Suspended' &&
          input.nextStatus === 'Active' &&
          input.governance.review.reviewDecision !== 'Approved'
        )
          return safe(
            'HumanReviewRequired',
            'HumanReview',
            'Reactivating a suspended Identity requires approved human review.',
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
          input.nextStatus as CoreIdentityStatus
        ),
        identityStatus: input.nextStatus as CoreIdentityStatus
      }),
      payload: (next, previous) => ({
        identityReferenceId: input.identityReferenceId,
        previousStatus: previous.identityStatus,
        nextStatus: next.identityStatus,
        reasonReferencePresent: true
      })
    });
  }

  linkIdentity(input: {
    readonly identityReferenceId: string;
    readonly linkType: unknown;
    readonly linkedObjectReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentityServiceRecord> {
    if (
      !included(CORE_IDENTITY_LINK_TYPES, input.linkType) ||
      input.linkType === 'Unknown'
    )
      return safe(
        'InvalidIdentityLinkType',
        'Validation',
        'Identity link type is invalid.',
        input.governance.correlationId
      );
    const expected = linkTargets[input.linkType];
    const related = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.linkedObjectReferenceId,
      expectedObjectType: expected.objectType,
      expectedDomain: expected.domainId
    });
    if (!related.ok)
      return safe(
        'InvalidLinkTarget',
        'Reference',
        'Identity link target is invalid.',
        input.governance.correlationId
      );
    const duplicateAcrossIdentity = this.deps.store
      .list()
      .some((record) =>
        record.links.some(
          (link) =>
            link.linkType === input.linkType &&
            link.linkedObjectReferenceId === input.linkedObjectReferenceId &&
            record.objectRecord.publicReferenceId !== input.identityReferenceId
        )
      );
    if (duplicateAcrossIdentity)
      return safe(
        'DuplicateIdentityLink',
        'Conflict',
        'Identity link target is already associated with another Identity.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'linkIdentity',
      governanceOperation: 'identity.link',
      permission: 'identity:link',
      policyScope: 'identity.relationship',
      identityReferenceId: input.identityReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        linkType: input.linkType,
        linkedObjectReferenceId: input.linkedObjectReferenceId
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'identity.linked',
      before: (current) => {
        if (current.identityStatus !== 'Active')
          return safe(
            'InvalidIdentityStatus',
            'State',
            'Only an active Identity may receive a new governed link.',
            input.governance.correlationId
          );
        if (
          current.links.some(
            (link) =>
              link.linkType === input.linkType &&
              link.linkedObjectReferenceId === input.linkedObjectReferenceId
          )
        )
          return safe(
            'DuplicateIdentityLink',
            'Conflict',
            'Identity link already exists.',
            input.governance.correlationId
          );
        if (
          current.aiInitiated &&
          input.linkType === 'UserAccount' &&
          input.governance.review.reviewDecision !== 'Approved'
        )
          return safe(
            'HumanReviewRequired',
            'HumanReview',
            'AI-initiated User linkage requires approved human review.',
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
        links: [
          ...current.links,
          {
            linkType: input.linkType as CoreIdentityLinkType,
            linkedObjectReferenceId: input.linkedObjectReferenceId
          }
        ]
      }),
      payload: (next) => ({
        identityReferenceId: input.identityReferenceId,
        linkType: input.linkType as CoreIdentityLinkType,
        linkCount: next.links.length,
        linkedObjectDetailsOmitted: true,
        grantsPermission: false
      })
    });
  }

  validateIdentityReference(input: {
    readonly identityReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentityReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'identity.reference.validate',
      permission: 'identity:read',
      policyScope: 'identity.reference',
      target: input.identityReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.requestingService))
      return safe(
        'InvalidIdentityRequestingService',
        'Validation',
        'Requesting service reference is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.identityReferenceId);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          identityReferenceId: input.identityReferenceId,
          identityType: null,
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
          identityReferenceId: input.identityReferenceId,
          identityType: null,
          status: null,
          reasonCode: 'NotFound',
          policyHint: null,
          restrictedFieldsOmitted: true
        }
      };
    const reasonCode =
      record.identityStatus === 'Suspended'
        ? 'Suspended'
        : record.identityStatus === 'ReviewRequired'
          ? 'ReviewRequired'
          : record.identityStatus === 'Archived'
            ? 'Archived'
            : record.identityStatus === 'DeletedReferenceOnly'
              ? 'DeletedReferenceOnly'
              : record.identityStatus === 'Active'
                ? 'Valid'
                : 'ReviewRequired';
    return {
      ok: true,
      value: {
        isValid: reasonCode === 'Valid',
        identityReferenceId: input.identityReferenceId,
        identityType: record.identityType,
        status: record.identityStatus,
        reasonCode,
        policyHint: 'Allowed',
        restrictedFieldsOmitted: true
      }
    };
  }

  resolveIdentity(input: {
    readonly linkType: unknown;
    readonly linkedObjectReferenceId: string;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentitySafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'identity.resolve',
      permission: 'identity:read',
      policyScope: 'identity.resolve',
      target: input.linkedObjectReferenceId
    });
    if (!governed.ok) return governed;
    if (
      !included(CORE_IDENTITY_LINK_TYPES, input.linkType) ||
      input.linkType === 'Unknown' ||
      !opaque.test(input.linkedObjectReferenceId)
    )
      return safe(
        'InvalidIdentityResolveReference',
        'Reference',
        'Identity resolution reference is invalid.',
        input.governance.correlationId
      );
    const matches = this.deps.store
      .list()
      .filter(
        (record) =>
          (!input.governance.authorizedOrganizationReferenceId ||
            organizationScopeOf(record) ===
              input.governance.authorizedOrganizationReferenceId) &&
          record.links.some(
            (link) =>
              link.linkType === input.linkType &&
              link.linkedObjectReferenceId === input.linkedObjectReferenceId
          )
      );
    if (matches.length !== 1)
      return safe(
        'IdentityNotFound',
        'Reference',
        'Identity was not found.',
        input.governance.correlationId
      );
    if (matches[0].identityStatus !== 'Active')
      return safe(
        'InvalidIdentityStatus',
        'State',
        'Identity cannot be resolved in its current status.',
        input.governance.correlationId
      );
    return { ok: true, value: safeView(matches[0]) };
  }

  archiveIdentity(input: {
    readonly identityReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreIdentityGovernanceContext;
  }): CoreBehaviorResult<CoreIdentityServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'IdentityReasonReferenceRequired',
        'Validation',
        'Identity archive reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'archiveIdentity',
      governanceOperation: 'identity.archive',
      permission: 'identity:archive',
      policyScope: 'identity.status',
      identityReferenceId: input.identityReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: { reasonReference: input.reasonReference },
      action: CORE_EVENT_ACTIONS.archived,
      eventType: 'identity.archived',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(current.identityStatus)
          ? safe(
              'InvalidIdentityTransition',
              'State',
              'Identity is already archived.',
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
        identityStatus: 'Archived'
      }),
      payload: () => ({
        identityReferenceId: input.identityReferenceId,
        status: 'Archived',
        reasonReferencePresent: true
      })
    });
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CoreIdentityGovernanceContext;
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
        identityReferenceId: input.target,
        occurredAt: this.deps.now(),
        governance: input.governance,
        payload: input.payload
      })
    );
    return trace.ok
      ? trace
      : safe(
          'IdentityTraceFailed',
          'Event',
          'Identity Event trace handoff failed.',
          input.governance.correlationId
        );
  }

  private mutate(input: {
    readonly operationName: string;
    readonly governanceOperation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly identityReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreIdentityGovernanceContext;
    readonly request: CoreJsonObject;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly before?: (
      current: CoreIdentityServiceRecord
    ) => CoreBehaviorResult<null>;
    readonly apply: (
      current: CoreIdentityServiceRecord,
      now: string
    ) => CoreIdentityServiceRecord;
    readonly payload: (
      next: CoreIdentityServiceRecord,
      previous: CoreIdentityServiceRecord
    ) => CoreJsonObject;
  }): CoreBehaviorResult<CoreIdentityServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: input.governanceOperation,
      permission: input.permission,
      policyScope: input.policyScope,
      target: input.identityReferenceId
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.identityReferenceId);
    if (!current)
      return safe(
        'IdentityNotFound',
        'Reference',
        'Identity was not found.',
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
          identityReferenceId: input.identityReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const latest = this.deps.store.get(input.identityReferenceId);
        if (!latest)
          return safe(
            'IdentityNotFound',
            'Reference',
            'Identity was not found.'
          );
        const before = immutable(latest);
        const next = input.apply(latest, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const traced = this.appendTrace({
          operation: input.operationName,
          target: input.identityReferenceId,
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
