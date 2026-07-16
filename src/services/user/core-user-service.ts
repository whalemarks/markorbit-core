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

export const CORE_USER_TYPES = [
  'InternalUser',
  'ExternalUser',
  'CustomerPortalUser',
  'AgentPortalUser',
  'ServiceProviderPortalUser',
  'SystemLinkedUser',
  'Unknown'
] as const;
export type CoreUserType = (typeof CORE_USER_TYPES)[number];

export const CORE_USER_STATUSES = [
  'Draft',
  'Invited',
  'Active',
  'Suspended',
  'ReviewRequired',
  'Inactive',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreUserStatus = (typeof CORE_USER_STATUSES)[number];

export const CORE_USER_ORGANIZATION_LINK_TYPES = [
  'Member',
  'Admin',
  'Owner',
  'ExternalMember',
  'ServiceMember',
  'Viewer',
  'Unknown'
] as const;
export type CoreUserOrganizationLinkType =
  (typeof CORE_USER_ORGANIZATION_LINK_TYPES)[number];

export const CORE_USER_IMPLEMENTED_OPERATIONS = [
  'createUser',
  'getUser',
  'updateUser',
  'changeUserStatus',
  'linkUserIdentity',
  'linkUserOrganization',
  'unlinkUserOrganization',
  'validateUserReference',
  'resolveUserByIdentity',
  'archiveUser'
] as const;

export const CORE_USER_MINIMUM_CAPABILITIES = [
  'create stable governed account-participant references that require Identity',
  'read safe User summaries without confidential profile or membership exposure',
  'update non-sensitive User metadata without changing immutable User id',
  'controlled User lifecycle including invited, suspended, inactive, archived, and reference-only states',
  'governed sensitive User-to-Identity relinking with human review',
  'explicit User-to-Organization linkage and unlinkage without implicit email-domain membership',
  'explicit User reference validation with optional Organization-context requirement',
  'deterministic User resolution by active Identity reference',
  'permission and policy hooks without granting authorization or evaluating contextual policy',
  'human review preservation for AI-initiated User creation and privileged relationship changes',
  'authentication, password, OAuth, SAML, session, and token implementation exclusion',
  'Customer, Agent, Partner, and Service Provider contact auto-creation exclusion',
  'safe error return',
  'event trace handoff for mutation',
  'event failure rollback',
  'idempotency handling for duplicate-sensitive mutation',
  'cross-organization non-enumeration'
] as const;

const CONTRACT_ID = 'core-service-user-service-contract';
const USER_OBJECT_TYPE = 'user-record';
const USER_DOMAIN: CoreDomainId = 'user';
const USER_OBJECT_CONTRACT_ID = 'core-object-user-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreUserStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Invited: 'draft',
  Active: 'active',
  Suspended: 'inactive',
  ReviewRequired: 'draft',
  Inactive: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Invited',
  'Draft->Active',
  'Draft->ReviewRequired',
  'Draft->Archived',
  'Invited->Active',
  'Invited->ReviewRequired',
  'Invited->Inactive',
  'Invited->Archived',
  'Active->Suspended',
  'Active->ReviewRequired',
  'Active->Inactive',
  'Active->Archived',
  'Suspended->Active',
  'Suspended->ReviewRequired',
  'Suspended->Inactive',
  'Suspended->Archived',
  'ReviewRequired->Active',
  'ReviewRequired->Suspended',
  'ReviewRequired->Inactive',
  'ReviewRequired->Archived',
  'Inactive->Active',
  'Inactive->ReviewRequired',
  'Inactive->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreUserGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreUserOrganizationLink {
  readonly organizationReferenceId: string;
  readonly linkType: CoreUserOrganizationLinkType;
}

export interface CoreUserServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly userType: CoreUserType;
  readonly userStatus: CoreUserStatus;
  readonly displayNameReference: string;
  readonly identityReferenceId: string;
  readonly sourceReference: string;
  readonly organizationLinks: readonly CoreUserOrganizationLink[];
  readonly aiInitiated: boolean;
  readonly agentContractReferenceId: string | null;
}

export interface CoreUserSafeView {
  readonly [key: string]: unknown;
  readonly userReferenceId: string;
  readonly userType: CoreUserType;
  readonly userStatus: CoreUserStatus;
  readonly identityReferenceId: string;
  readonly displayNameReferencePresent: boolean;
  readonly organizationLinkCount: number;
  readonly organizationLinkTypes: readonly CoreUserOrganizationLinkType[];
  readonly aiInitiated: boolean;
  readonly grantsPermission: false;
  readonly evaluatesPolicy: false;
  readonly authenticationImplemented: false;
  readonly businessContactObjectsCreated: false;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreUserReferenceValidationResult {
  readonly isValid: boolean;
  readonly userReferenceId: string;
  readonly identityReferenceId: string | null;
  readonly status: CoreUserStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Inactive'
    | 'Suspended'
    | 'Archived'
    | 'ReviewRequired'
    | 'OrganizationRequired'
    | 'PolicyRestricted';
  readonly organizationContextHint: 'Linked' | 'None' | null;
  readonly policyHint: 'Allowed' | 'Restricted' | null;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreUserServiceStore {
  get(id: string): CoreUserServiceRecord | undefined;
  list(): readonly CoreUserServiceRecord[];
  insert(
    record: CoreUserServiceRecord
  ): CoreBehaviorResult<CoreUserServiceRecord>;
  replace(
    record: CoreUserServiceRecord
  ): CoreBehaviorResult<CoreUserServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreUserTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreUserServiceDependencies {
  readonly store: CoreUserServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CoreUserTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    userReferenceId: string,
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
  record: CoreUserServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceUserScope(
  governance: CoreUserGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  )
    return safe(
      'UserNotFound',
      'Reference',
      'User was not found.',
      governance.correlationId
    );
  return { ok: true, value: null };
}

function enforceOrganizationTargetScope(
  governance: CoreUserGovernanceContext,
  organizationReferenceId: string
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  )
    return safe(
      'OrganizationNotFound',
      'Reference',
      'Organization was not found.',
      governance.correlationId
    );
  return { ok: true, value: null };
}

function ensureGovernance(
  context: CoreUserGovernanceContext,
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
    context.audit.targetObjectType !== USER_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  )
    return safe(
      'AuditContextMissing',
      'Validation',
      'User governance context is invalid.',
      context.correlationId
    );
  const governed = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  return governed.ok ? { ok: true, value: null } : governed;
}

function idempotencyScope(
  governance: CoreUserGovernanceContext,
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
  current: CoreUserServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.userStatus
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

function safeView(record: CoreUserServiceRecord): CoreUserSafeView {
  return {
    userReferenceId: record.objectRecord.publicReferenceId,
    userType: record.userType,
    userStatus: record.userStatus,
    identityReferenceId: record.identityReferenceId,
    displayNameReferencePresent: Boolean(record.displayNameReference),
    organizationLinkCount: record.organizationLinks.length,
    organizationLinkTypes: [
      ...new Set(record.organizationLinks.map((link) => link.linkType))
    ],
    aiInitiated: record.aiInitiated,
    grantsPermission: false,
    evaluatesPolicy: false,
    authenticationImplemented: false,
    businessContactObjectsCreated: false,
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CoreUserServiceRecord
): CoreBehaviorResult<CoreUserServiceRecord> {
  if (!included(CORE_USER_TYPES, record.userType))
    return safe('InvalidUserType', 'Validation', 'User type is invalid.');
  if (!included(CORE_USER_STATUSES, record.userStatus))
    return safe('InvalidUserStatus', 'State', 'User status is invalid.');
  if (!opaque.test(record.displayNameReference))
    return safe(
      'UserDisplayNameReferenceRequired',
      'Validation',
      'User display-name reference is required.'
    );
  if (!opaque.test(record.identityReferenceId))
    return safe(
      'IdentityRequired',
      'Reference',
      'User requires an Identity reference.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'UserSourceReferenceRequired',
      'Validation',
      'User source reference is required.'
    );
  if (
    record.objectRecord.objectType !== USER_OBJECT_TYPE ||
    record.objectRecord.domainId !== USER_DOMAIN ||
    record.objectRecord.objectContractId !== USER_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.userStatus]
  )
    return safe(
      'UserObjectMismatch',
      'Validation',
      'User Object contract is inconsistent.'
    );
  if (record.aiInitiated && !opaque.test(record.agentContractReferenceId ?? ''))
    return safe(
      'InvalidUserRecord',
      'Agent',
      'AI-initiated User requires an Agent Contract reference.'
    );
  const organizationIds = new Set<string>();
  for (const link of record.organizationLinks) {
    if (
      !opaque.test(link.organizationReferenceId) ||
      !included(CORE_USER_ORGANIZATION_LINK_TYPES, link.linkType) ||
      link.linkType === 'Unknown'
    )
      return safe(
        'InvalidOrganizationReference',
        'Reference',
        'User Organization link is invalid.'
      );
    if (organizationIds.has(link.organizationReferenceId))
      return safe(
        'DuplicateUserOrganizationLink',
        'Conflict',
        'User Organization link already exists.'
      );
    organizationIds.add(link.organizationReferenceId);
  }
  return { ok: true, value: immutable(record) };
}

function traceRecord(input: {
  readonly id: CoreEventId;
  readonly action: CoreEventAction;
  readonly eventType: string;
  readonly userReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreUserGovernanceContext;
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
      domainId: USER_DOMAIN,
      object: {
        id: createCoreObjectId(input.userReferenceId),
        type: createCoreObjectType(USER_OBJECT_TYPE),
        domainId: USER_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryUserServiceStore implements CoreUserServiceStore {
  readonly #records = new Map<string, CoreUserServiceRecord>();

  get(id: string): CoreUserServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  list(): readonly CoreUserServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CoreUserServiceRecord
  ): CoreBehaviorResult<CoreUserServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe('UserAlreadyExists', 'Conflict', 'User already exists.');
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CoreUserServiceRecord
  ): CoreBehaviorResult<CoreUserServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe('UserNotFound', 'Reference', 'User was not found.');
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreUserService {
  constructor(readonly deps: CoreUserServiceDependencies) {}

  createUser(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly userType: unknown;
    readonly displayNameReference: string;
    readonly identityReferenceId: string;
    readonly status?: unknown;
    readonly sourceReference: string;
    readonly organizationLinks?: readonly CoreUserOrganizationLink[];
    readonly aiInitiated?: boolean;
    readonly agentContractReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'user.create',
      permission: 'user:create',
      policyScope: 'user.write',
      target
    });
    if (!governed.ok) return governed;
    const scoped = enforceUserScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scoped.ok) return scoped;
    if (
      input.publicReferenceRecord.referenceId !== target ||
      input.publicReferenceRecord.objectType !== USER_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== USER_DOMAIN
    )
      return safe(
        'InvalidUserReference',
        'Reference',
        'User reference is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_USER_TYPES, input.userType))
      return safe(
        'InvalidUserType',
        'Validation',
        'User type is invalid.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_USER_STATUSES, status) ||
      !['Draft', 'Invited', 'Active', 'ReviewRequired'].includes(status)
    )
      return safe(
        'InvalidUserStatus',
        'State',
        'User creation status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.displayNameReference))
      return safe(
        'UserDisplayNameReferenceRequired',
        'Validation',
        'User display-name reference is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.sourceReference))
      return safe(
        'UserSourceReferenceRequired',
        'Validation',
        'User source reference is required.',
        input.governance.correlationId
      );
    const identity = this.validateIdentityReference(
      input.identityReferenceId,
      input.governance.correlationId
    );
    if (!identity.ok) return identity;
    const initialLinks = input.organizationLinks ?? [];
    for (const link of initialLinks) {
      const organization = this.validateOrganizationReference(
        link.organizationReferenceId,
        input.governance.correlationId
      );
      if (!organization.ok) return organization;
      if (
        !included(CORE_USER_ORGANIZATION_LINK_TYPES, link.linkType) ||
        link.linkType === 'Unknown'
      )
        return safe(
          'InvalidUserOrganizationLinkType',
          'Validation',
          'User Organization link type is invalid.',
          input.governance.correlationId
        );
      const targetScope = enforceOrganizationTargetScope(
        input.governance,
        link.organizationReferenceId
      );
      if (!targetScope.ok) return targetScope;
    }
    if (input.aiInitiated && !opaque.test(input.agentContractReferenceId ?? ''))
      return safe(
        'InvalidUserRecord',
        'Agent',
        'AI-initiated User requires an Agent Contract reference.',
        input.governance.correlationId
      );
    if (
      input.aiInitiated &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'UserCreationReviewRequired',
        'HumanReview',
        'AI-initiated User creation requires approved human review.',
        input.governance.correlationId
      );

    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createUser'),
        operationName: 'createUser',
        request: {
          target,
          userType: input.userType,
          displayNameReference: input.displayNameReference,
          identityReferenceId: input.identityReferenceId,
          status,
          sourceReference: input.sourceReference,
          organizationLinks: initialLinks,
          aiInitiated: input.aiInitiated ?? false,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe('UserAlreadyExists', 'Conflict', 'User already exists.');
        if (
          this.deps.store
            .list()
            .some(
              (record) =>
                record.identityReferenceId === input.identityReferenceId
            )
        )
          return safe(
            'DuplicateUserIdentityLink',
            'Conflict',
            'Identity is already linked to a User.'
          );
        const record: CoreUserServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: statusToObjectStatus[status as CoreUserStatus]
          },
          userType: input.userType as CoreUserType,
          userStatus: status as CoreUserStatus,
          displayNameReference: input.displayNameReference,
          identityReferenceId: input.identityReferenceId,
          sourceReference: input.sourceReference,
          organizationLinks: initialLinks.map((link) => ({ ...link })),
          aiInitiated: input.aiInitiated ?? false,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const traced = this.appendTrace({
          operation: 'createUser',
          target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: CORE_EVENT_ACTIONS.created,
          eventType: 'user.created',
          governance: input.governance,
          payload: {
            userReferenceId: target,
            userType: record.userType,
            status: record.userStatus,
            identityReferenceId: record.identityReferenceId,
            organizationLinkCount: record.organizationLinks.length,
            aiInitiated: record.aiInitiated,
            grantsPermission: false,
            authenticationImplemented: false,
            businessContactObjectsCreated: false,
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

  getUser(input: {
    readonly userReferenceId: string;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'user.get',
      permission: 'user:read',
      policyScope: 'user.read',
      target: input.userReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.userReferenceId);
    if (!record)
      return safe(
        'UserNotFound',
        'Reference',
        'User was not found.',
        input.governance.correlationId
      );
    const scoped = enforceUserScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scoped.ok ? { ok: true, value: safeView(record) } : scoped;
  }

  updateUser(input: {
    readonly userReferenceId: string;
    readonly displayNameReference?: string;
    readonly metadata?: CoreJsonObject;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    if (
      input.displayNameReference !== undefined &&
      !opaque.test(input.displayNameReference)
    )
      return safe(
        'UserDisplayNameReferenceRequired',
        'Validation',
        'User display-name reference is invalid.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'updateUser',
      governanceOperation: 'user.update',
      permission: 'user:update',
      policyScope: 'user.write',
      userReferenceId: input.userReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        displayNameReference: input.displayNameReference ?? null,
        metadata: input.metadata ?? null
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'user.updated',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(current.userStatus)
          ? safe(
              'InvalidUserStatus',
              'State',
              'Archived User cannot be updated.',
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
          metadata: input.metadata
            ? { ...current.objectRecord.metadata, ...input.metadata }
            : current.objectRecord.metadata
        },
        displayNameReference:
          input.displayNameReference ?? current.displayNameReference
      }),
      payload: () => ({
        userReferenceId: input.userReferenceId,
        displayNameReferenceUpdated: input.displayNameReference !== undefined,
        metadataUpdated: input.metadata !== undefined,
        restrictedFieldsOmitted: true
      })
    });
  }

  changeUserStatus(input: {
    readonly userReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    if (!included(CORE_USER_STATUSES, input.nextStatus))
      return safe(
        'InvalidUserStatus',
        'State',
        'User status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReference))
      return safe(
        'UserReasonReferenceRequired',
        'Validation',
        'User status reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'changeUserStatus',
      governanceOperation: 'user.status.change',
      permission: 'user:status',
      policyScope: 'user.status',
      userReferenceId: input.userReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference
      },
      action: CORE_EVENT_ACTIONS.statusChanged,
      eventType: 'user.status.changed',
      before: (current) => {
        if (
          !lifecycleTransitions.has(
            `${current.userStatus}->${input.nextStatus as CoreUserStatus}`
          )
        )
          return safe(
            'InvalidUserTransition',
            'State',
            'User status transition is not allowed.',
            input.governance.correlationId
          );
        if (
          ['Suspended', 'Inactive', 'ReviewRequired'].includes(
            current.userStatus
          ) &&
          input.nextStatus === 'Active' &&
          input.governance.review.reviewDecision !== 'Approved'
        )
          return safe(
            'HumanReviewRequired',
            'HumanReview',
            'Reactivating User requires approved human review.',
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
          input.nextStatus as CoreUserStatus
        ),
        userStatus: input.nextStatus as CoreUserStatus
      }),
      payload: (next, previous) => ({
        userReferenceId: input.userReferenceId,
        previousStatus: previous.userStatus,
        nextStatus: next.userStatus,
        reasonReferencePresent: true
      })
    });
  }

  linkUserIdentity(input: {
    readonly userReferenceId: string;
    readonly identityReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'UserReasonReferenceRequired',
        'Validation',
        'User Identity link reason reference is required.',
        input.governance.correlationId
      );
    const identity = this.validateIdentityReference(
      input.identityReferenceId,
      input.governance.correlationId
    );
    if (!identity.ok) return identity;
    if (input.governance.review.reviewDecision !== 'Approved')
      return safe(
        'HumanReviewRequired',
        'HumanReview',
        'Changing User Identity linkage requires approved human review.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'linkUserIdentity',
      governanceOperation: 'user.identity.link',
      permission: 'user:identity:link',
      policyScope: 'user.relationship',
      userReferenceId: input.userReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        identityReferenceId: input.identityReferenceId,
        reasonReference: input.reasonReference
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'user.identity.linked',
      before: (current) => {
        if (current.identityReferenceId === input.identityReferenceId)
          return safe(
            'DuplicateUserIdentityLink',
            'Conflict',
            'User Identity link already exists.',
            input.governance.correlationId
          );
        if (
          this.deps.store
            .list()
            .some(
              (record) =>
                record.objectRecord.publicReferenceId !==
                  input.userReferenceId &&
                record.identityReferenceId === input.identityReferenceId
            )
        )
          return safe(
            'DuplicateUserIdentityLink',
            'Conflict',
            'Identity is already linked to another User.',
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
        identityReferenceId: input.identityReferenceId
      }),
      payload: (next, previous) => ({
        userReferenceId: input.userReferenceId,
        previousIdentityReferenceId: previous.identityReferenceId,
        identityReferenceId: next.identityReferenceId,
        reasonReferencePresent: true,
        grantsPermission: false
      })
    });
  }

  linkUserOrganization(input: {
    readonly userReferenceId: string;
    readonly organizationReferenceId: string;
    readonly linkType: unknown;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    if (
      !included(CORE_USER_ORGANIZATION_LINK_TYPES, input.linkType) ||
      input.linkType === 'Unknown'
    )
      return safe(
        'InvalidUserOrganizationLinkType',
        'Validation',
        'User Organization link type is invalid.',
        input.governance.correlationId
      );
    const organization = this.validateOrganizationReference(
      input.organizationReferenceId,
      input.governance.correlationId
    );
    if (!organization.ok) return organization;
    const targetScope = enforceOrganizationTargetScope(
      input.governance,
      input.organizationReferenceId
    );
    if (!targetScope.ok) return targetScope;
    if (
      ['Owner', 'Admin'].includes(input.linkType) &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'HumanReviewRequired',
        'HumanReview',
        'Privileged User Organization linkage requires approved human review.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'linkUserOrganization',
      governanceOperation: 'user.organization.link',
      permission: 'user:organization:link',
      policyScope: 'user.relationship',
      userReferenceId: input.userReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        organizationReferenceId: input.organizationReferenceId,
        linkType: input.linkType
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'user.organization.linked',
      before: (current) => {
        if (!['Active', 'Invited'].includes(current.userStatus))
          return safe(
            'InvalidUserStatus',
            'State',
            'Only active or invited User may receive an Organization link.',
            input.governance.correlationId
          );
        if (
          current.organizationLinks.some(
            (link) =>
              link.organizationReferenceId === input.organizationReferenceId
          )
        )
          return safe(
            'DuplicateUserOrganizationLink',
            'Conflict',
            'User Organization link already exists.',
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
        organizationLinks: [
          ...current.organizationLinks,
          {
            organizationReferenceId: input.organizationReferenceId,
            linkType: input.linkType as CoreUserOrganizationLinkType
          }
        ]
      }),
      payload: (next) => ({
        userReferenceId: input.userReferenceId,
        organizationReferenceId: input.organizationReferenceId,
        linkType: input.linkType as CoreUserOrganizationLinkType,
        linkCount: next.organizationLinks.length,
        grantsPermission: false
      })
    });
  }

  unlinkUserOrganization(input: {
    readonly userReferenceId: string;
    readonly organizationReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'UserReasonReferenceRequired',
        'Validation',
        'User Organization unlink reason reference is required.',
        input.governance.correlationId
      );
    const targetScope = enforceOrganizationTargetScope(
      input.governance,
      input.organizationReferenceId
    );
    if (!targetScope.ok) return targetScope;
    return this.mutate({
      operationName: 'unlinkUserOrganization',
      governanceOperation: 'user.organization.unlink',
      permission: 'user:organization:unlink',
      policyScope: 'user.relationship',
      userReferenceId: input.userReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        organizationReferenceId: input.organizationReferenceId,
        reasonReference: input.reasonReference
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'user.organization.unlinked',
      before: (current) => {
        const link = current.organizationLinks.find(
          (entry) =>
            entry.organizationReferenceId === input.organizationReferenceId
        );
        if (!link)
          return safe(
            'UserOrganizationLinkNotFound',
            'Reference',
            'User Organization link was not found.',
            input.governance.correlationId
          );
        if (
          link.linkType === 'Owner' &&
          input.governance.review.reviewDecision !== 'Approved'
        )
          return safe(
            'HumanReviewRequired',
            'HumanReview',
            'Removing User Organization Owner link requires approved human review.',
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
        organizationLinks: current.organizationLinks.filter(
          (link) =>
            link.organizationReferenceId !== input.organizationReferenceId
        )
      }),
      payload: (next) => ({
        userReferenceId: input.userReferenceId,
        organizationReferenceId: input.organizationReferenceId,
        linkCount: next.organizationLinks.length,
        reasonReferencePresent: true,
        grantsPermission: false
      })
    });
  }

  validateUserReference(input: {
    readonly userReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly organizationReferenceId?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'user.reference.validate',
      permission: 'user:read',
      policyScope: 'user.reference',
      target: input.userReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.requestingService))
      return safe(
        'InvalidUserRequestingService',
        'Validation',
        'User requesting service is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.userReferenceId);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          userReferenceId: input.userReferenceId,
          identityReferenceId: null,
          status: null,
          reasonCode: 'NotFound',
          organizationContextHint: null,
          policyHint: null,
          restrictedFieldsOmitted: true
        }
      };
    const scoped = enforceUserScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scoped.ok)
      return {
        ok: true,
        value: {
          isValid: false,
          userReferenceId: input.userReferenceId,
          identityReferenceId: null,
          status: null,
          reasonCode: 'NotFound',
          organizationContextHint: null,
          policyHint: null,
          restrictedFieldsOmitted: true
        }
      };
    if (input.organizationReferenceId) {
      const organization = this.validateOrganizationReference(
        input.organizationReferenceId,
        input.governance.correlationId
      );
      if (!organization.ok) return organization;
      const targetScope = enforceOrganizationTargetScope(
        input.governance,
        input.organizationReferenceId
      );
      if (!targetScope.ok)
        return {
          ok: true,
          value: {
            isValid: false,
            userReferenceId: input.userReferenceId,
            identityReferenceId: null,
            status: null,
            reasonCode: 'NotFound',
            organizationContextHint: null,
            policyHint: null,
            restrictedFieldsOmitted: true
          }
        };
      if (
        !record.organizationLinks.some(
          (link) =>
            link.organizationReferenceId === input.organizationReferenceId
        )
      )
        return {
          ok: true,
          value: {
            isValid: false,
            userReferenceId: input.userReferenceId,
            identityReferenceId: record.identityReferenceId,
            status: record.userStatus,
            reasonCode: 'OrganizationRequired',
            organizationContextHint: 'None',
            policyHint: 'Allowed',
            restrictedFieldsOmitted: true
          }
        };
    }
    const statusReason: Record<
      Exclude<CoreUserStatus, 'Active'>,
      CoreUserReferenceValidationResult['reasonCode']
    > = {
      Draft: 'ReviewRequired',
      Invited: 'ReviewRequired',
      Suspended: 'Suspended',
      ReviewRequired: 'ReviewRequired',
      Inactive: 'Inactive',
      Archived: 'Archived',
      DeletedReferenceOnly: 'Archived'
    };
    const isValid = record.userStatus === 'Active';
    return {
      ok: true,
      value: {
        isValid,
        userReferenceId: input.userReferenceId,
        identityReferenceId: record.identityReferenceId,
        status: record.userStatus,
        reasonCode: isValid ? 'Valid' : statusReason[record.userStatus],
        organizationContextHint:
          record.organizationLinks.length > 0 ? 'Linked' : 'None',
        policyHint: 'Allowed',
        restrictedFieldsOmitted: true
      }
    };
  }

  resolveUserByIdentity(input: {
    readonly identityReferenceId: string;
    readonly organizationReferenceId?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'user.identity.resolve',
      permission: 'user:read',
      policyScope: 'user.resolve',
      target: input.identityReferenceId
    });
    if (!governed.ok) return governed;
    const identity = this.validateIdentityReference(
      input.identityReferenceId,
      input.governance.correlationId
    );
    if (!identity.ok) return identity;
    if (input.organizationReferenceId) {
      const organization = this.validateOrganizationReference(
        input.organizationReferenceId,
        input.governance.correlationId
      );
      if (!organization.ok) return organization;
      const targetScope = enforceOrganizationTargetScope(
        input.governance,
        input.organizationReferenceId
      );
      if (!targetScope.ok) return targetScope;
    }
    const matches = this.deps.store
      .list()
      .filter(
        (record) =>
          record.identityReferenceId === input.identityReferenceId &&
          (!input.organizationReferenceId ||
            record.organizationLinks.some(
              (link) =>
                link.organizationReferenceId === input.organizationReferenceId
            )) &&
          (!input.governance.authorizedOrganizationReferenceId ||
            organizationScopeOf(record) ===
              input.governance.authorizedOrganizationReferenceId)
      );
    if (matches.length !== 1)
      return safe(
        'UserNotFound',
        'Reference',
        'User was not found.',
        input.governance.correlationId
      );
    if (matches[0].userStatus !== 'Active')
      return safe(
        'InvalidUserStatus',
        'State',
        'User cannot be resolved in its current status.',
        input.governance.correlationId
      );
    return { ok: true, value: safeView(matches[0]) };
  }

  archiveUser(input: {
    readonly userReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'UserReasonReferenceRequired',
        'Validation',
        'User archive reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'archiveUser',
      governanceOperation: 'user.archive',
      permission: 'user:archive',
      policyScope: 'user.status',
      userReferenceId: input.userReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: { reasonReference: input.reasonReference },
      action: CORE_EVENT_ACTIONS.archived,
      eventType: 'user.archived',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(current.userStatus)
          ? safe(
              'InvalidUserTransition',
              'State',
              'User is already archived.',
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
        userStatus: 'Archived'
      }),
      payload: () => ({
        userReferenceId: input.userReferenceId,
        status: 'Archived',
        reasonReferencePresent: true
      })
    });
  }

  private validateIdentityReference(
    identityReferenceId: string,
    correlationId: string
  ): CoreBehaviorResult<CoreReferenceRecord> {
    if (!opaque.test(identityReferenceId))
      return safe(
        'IdentityRequired',
        'Reference',
        'User requires an Identity reference.',
        correlationId
      );
    const identity = this.deps.relatedReferenceRegistry.resolve({
      referenceId: identityReferenceId,
      expectedObjectType: 'identity-record',
      expectedDomain: 'identity'
    });
    if (!identity.ok || identity.value.status !== 'Active')
      return safe(
        'InvalidIdentityReference',
        'Reference',
        'Identity reference is invalid.',
        correlationId
      );
    return identity;
  }

  private validateOrganizationReference(
    organizationReferenceId: string,
    correlationId: string
  ): CoreBehaviorResult<CoreReferenceRecord> {
    if (!opaque.test(organizationReferenceId))
      return safe(
        'InvalidOrganizationReference',
        'Reference',
        'Organization reference is invalid.',
        correlationId
      );
    const organization = this.deps.relatedReferenceRegistry.resolve({
      referenceId: organizationReferenceId,
      expectedObjectType: 'organization-record',
      expectedDomain: 'organization'
    });
    if (!organization.ok || organization.value.status !== 'Active')
      return safe(
        'InvalidOrganizationReference',
        'Reference',
        'Organization reference is invalid.',
        correlationId
      );
    return organization;
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CoreUserGovernanceContext;
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
        userReferenceId: input.target,
        occurredAt: this.deps.now(),
        governance: input.governance,
        payload: input.payload
      })
    );
    return trace.ok
      ? trace
      : safe(
          'UserTraceFailed',
          'Event',
          'User Event trace handoff failed.',
          input.governance.correlationId
        );
  }

  private mutate(input: {
    readonly operationName: string;
    readonly governanceOperation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly userReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreUserGovernanceContext;
    readonly request: CoreJsonObject;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly before?: (
      current: CoreUserServiceRecord
    ) => CoreBehaviorResult<null>;
    readonly apply: (
      current: CoreUserServiceRecord,
      now: string
    ) => CoreUserServiceRecord;
    readonly payload: (
      next: CoreUserServiceRecord,
      previous: CoreUserServiceRecord
    ) => CoreJsonObject;
  }): CoreBehaviorResult<CoreUserServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: input.governanceOperation,
      permission: input.permission,
      policyScope: input.policyScope,
      target: input.userReferenceId
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.userReferenceId);
    if (!current)
      return safe(
        'UserNotFound',
        'Reference',
        'User was not found.',
        input.governance.correlationId
      );
    const scoped = enforceUserScope(
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
          userReferenceId: input.userReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const latest = this.deps.store.get(input.userReferenceId);
        if (!latest)
          return safe('UserNotFound', 'Reference', 'User was not found.');
        const before = immutable(latest);
        const next = input.apply(latest, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const traced = this.appendTrace({
          operation: input.operationName,
          target: input.userReferenceId,
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
