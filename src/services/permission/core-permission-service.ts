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

export const CORE_PERMISSION_TYPES = [
  'ActionPermission',
  'ResourcePermission',
  'DomainPermission',
  'ServicePermission',
  'AdminPermission',
  'AIAgentPermission',
  'SystemPermission',
  'Unknown'
] as const;
export type CorePermissionType = (typeof CORE_PERMISSION_TYPES)[number];

export const CORE_PERMISSION_STATUSES = [
  'Draft',
  'Active',
  'Suspended',
  'ReviewRequired',
  'Deprecated',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CorePermissionStatus = (typeof CORE_PERMISSION_STATUSES)[number];

export const CORE_PERMISSION_DECISIONS = [
  'Allowed',
  'Denied',
  'ReviewRequired',
  'NotFound',
  'Suspended',
  'PolicyRequired',
  'Unknown'
] as const;
export type CorePermissionDecision = (typeof CORE_PERMISSION_DECISIONS)[number];

export const CORE_PERMISSION_EFFECTS = [
  'Allow',
  'Deny',
  'ReviewRequired'
] as const;
export type CorePermissionEffect = (typeof CORE_PERMISSION_EFFECTS)[number];

export const CORE_PERMISSION_ACTION_TYPES = [
  'Create',
  'Read',
  'Update',
  'Delete',
  'Archive',
  'Link',
  'Unlink',
  'Evaluate',
  'Approve',
  'Reject',
  'Assign',
  'Execute',
  'Export',
  'Send',
  'Import',
  'Unknown'
] as const;
export type CorePermissionActionType =
  (typeof CORE_PERMISSION_ACTION_TYPES)[number];

export const CORE_PERMISSION_ACTOR_TYPES = [
  'Identity',
  'User',
  'Organization',
  'AIAgent',
  'SystemActor'
] as const;
export type CorePermissionActorType =
  (typeof CORE_PERMISSION_ACTOR_TYPES)[number];

export const CORE_PERMISSION_IMPLEMENTED_OPERATIONS = [
  'createPermission',
  'getPermission',
  'updatePermission',
  'changePermissionStatus',
  'evaluatePermission',
  'validatePermissionReference',
  'listActorPermissions',
  'archivePermission'
] as const;

export const CORE_PERMISSION_MINIMUM_CAPABILITIES = [
  'create stable governed Permission rules for recognized actors, actions, resources, and scopes',
  'read safe Permission summaries without unrelated grant or protected-resource disclosure',
  'update governed Permission rule metadata without changing immutable Permission id or actor ownership',
  'controlled Permission lifecycle including suspended, review-required, deprecated, archived, and reference-only states',
  'deterministic actor-action-resource evaluation with explicit Allow, Deny, ReviewRequired, PolicyRequired, Suspended, and NotFound outcomes',
  'explicit Permission reference validation without exposing unrelated rules',
  'safe actor Permission listing within authorized organization context',
  'recognized Identity, User, Organization, AI Agent, and System Actor reference validation',
  'task assignment and organization membership inference exclusion',
  'Policy evaluation exclusion with policy-required handoff preserved',
  'workflow approval and professional judgment exclusion',
  'AI self-grant prohibition and governed human review for AI or high-risk Permission creation and escalation',
  'safe error return',
  'event trace handoff for mutation and governed evaluation',
  'event failure rollback for mutation',
  'idempotency handling for duplicate-sensitive mutation',
  'cross-organization non-enumeration'
] as const;

const CONTRACT_ID = 'core-service-permission-evaluation-service-contract';
const PERMISSION_OBJECT_TYPE = 'permission-record';
const PERMISSION_DOMAIN: CoreDomainId = 'permission';
const PERMISSION_OBJECT_CONTRACT_ID = 'core-object-permission-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const resourceTypePattern = /^[a-z][a-z0-9-]{1,63}$/;

const statusToObjectStatus: Record<CorePermissionStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Active: 'active',
  Suspended: 'inactive',
  ReviewRequired: 'draft',
  Deprecated: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Active',
  'Draft->ReviewRequired',
  'Draft->Archived',
  'Active->Suspended',
  'Active->ReviewRequired',
  'Active->Deprecated',
  'Active->Archived',
  'Suspended->Active',
  'Suspended->ReviewRequired',
  'Suspended->Deprecated',
  'Suspended->Archived',
  'ReviewRequired->Active',
  'ReviewRequired->Suspended',
  'ReviewRequired->Deprecated',
  'ReviewRequired->Archived',
  'Deprecated->Archived',
  'Archived->DeletedReferenceOnly'
]);

const actorTargets: Record<
  CorePermissionActorType,
  { readonly objectType: string; readonly domainId: CoreDomainId }
> = {
  Identity: { objectType: 'identity-record', domainId: 'identity' },
  User: { objectType: 'user-record', domainId: 'user' },
  Organization: {
    objectType: 'organization-record',
    domainId: 'organization'
  },
  AIAgent: { objectType: 'agent-record', domainId: 'agent' },
  SystemActor: { objectType: 'identity-record', domainId: 'identity' }
};

export interface CorePermissionServiceGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CorePermissionServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly permissionType: CorePermissionType;
  readonly permissionStatus: CorePermissionStatus;
  readonly actorReferenceId: string;
  readonly actorType: CorePermissionActorType;
  readonly action: CorePermissionActionType;
  readonly resourceType: string;
  readonly resourceReferenceId: string | null;
  readonly organizationReferenceId: string | null;
  readonly scopeReference: string;
  readonly effect: CorePermissionEffect;
  readonly conditionReference: string | null;
  readonly sourceReference: string;
  readonly policyRequired: boolean;
  readonly reviewRequired: boolean;
  readonly aiInitiated: boolean;
  readonly agentContractReferenceId: string | null;
}

export interface CorePermissionSafeView {
  readonly [key: string]: unknown;
  readonly permissionReferenceId: string;
  readonly permissionType: CorePermissionType;
  readonly permissionStatus: CorePermissionStatus;
  readonly actorReferenceId: string;
  readonly actorType: CorePermissionActorType;
  readonly action: CorePermissionActionType;
  readonly resourceType: string;
  readonly resourceReferencePresent: boolean;
  readonly organizationReferencePresent: boolean;
  readonly effect: CorePermissionEffect;
  readonly policyRequired: boolean;
  readonly reviewRequired: boolean;
  readonly aiInitiated: boolean;
  readonly taskAssignmentGrantsPermission: false;
  readonly organizationMembershipGrantsPermission: false;
  readonly evaluatesPolicy: false;
  readonly authenticationImplemented: false;
  readonly restrictedFieldsOmitted: true;
}

export interface CorePermissionEvaluationResult {
  readonly decision: CorePermissionDecision;
  readonly actorReferenceId: string;
  readonly action: CorePermissionActionType;
  readonly resourceType: string;
  readonly resourceReferenceId: string;
  readonly matchedPermissionReferenceId: string | null;
  readonly reasonCode:
    | 'ExplicitAllow'
    | 'ExplicitDeny'
    | 'PermissionReviewRequired'
    | 'PolicyConstraintRequired'
    | 'PermissionSuspended'
    | 'NoMatchingPermission';
  readonly policyRequired: boolean;
  readonly reviewRequired: boolean;
  readonly auditRequired: true;
  readonly taskAssignmentInferred: false;
  readonly organizationMembershipInferred: false;
  readonly restrictedFieldsOmitted: true;
}

export interface CorePermissionReferenceValidationResult {
  readonly isValid: boolean;
  readonly permissionReferenceId: string;
  readonly status: CorePermissionStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Suspended'
    | 'ReviewRequired'
    | 'Deprecated'
    | 'Archived'
    | 'DeletedReferenceOnly'
    | 'PolicyRestricted';
  readonly policyHint: 'Allowed' | 'Restricted' | null;
  readonly restrictedFieldsOmitted: true;
}

export interface CorePermissionServiceStore {
  get(id: string): CorePermissionServiceRecord | undefined;
  list(): readonly CorePermissionServiceRecord[];
  insert(
    record: CorePermissionServiceRecord
  ): CoreBehaviorResult<CorePermissionServiceRecord>;
  replace(
    record: CorePermissionServiceRecord
  ): CoreBehaviorResult<CorePermissionServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CorePermissionTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CorePermissionServiceDependencies {
  readonly store: CorePermissionServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CorePermissionTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    permissionReferenceId: string,
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
  record: CorePermissionServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function effectiveOrganizationScope(
  record: CorePermissionServiceRecord
): string | null {
  return record.organizationReferenceId ?? organizationScopeOf(record);
}

function enforcePermissionScope(
  governance: CorePermissionServiceGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  )
    return safe(
      'PermissionNotFound',
      'Reference',
      'Permission was not found.',
      governance.correlationId
    );
  return { ok: true, value: null };
}

function ensureGovernance(
  context: CorePermissionServiceGovernanceContext,
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
    context.audit.targetObjectType !== PERMISSION_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  )
    return safe(
      'AuditContextMissing',
      'Validation',
      'Permission governance context is invalid.',
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
  governance: CorePermissionServiceGovernanceContext,
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
  current: CorePermissionServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.permissionStatus
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

function safeView(record: CorePermissionServiceRecord): CorePermissionSafeView {
  return {
    permissionReferenceId: record.objectRecord.publicReferenceId,
    permissionType: record.permissionType,
    permissionStatus: record.permissionStatus,
    actorReferenceId: record.actorReferenceId,
    actorType: record.actorType,
    action: record.action,
    resourceType: record.resourceType,
    resourceReferencePresent: Boolean(record.resourceReferenceId),
    organizationReferencePresent: Boolean(record.organizationReferenceId),
    effect: record.effect,
    policyRequired: record.policyRequired,
    reviewRequired: record.reviewRequired,
    aiInitiated: record.aiInitiated,
    taskAssignmentGrantsPermission: false,
    organizationMembershipGrantsPermission: false,
    evaluatesPolicy: false,
    authenticationImplemented: false,
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CorePermissionServiceRecord
): CoreBehaviorResult<CorePermissionServiceRecord> {
  if (!included(CORE_PERMISSION_TYPES, record.permissionType))
    return safe(
      'InvalidPermissionType',
      'Validation',
      'Permission type is invalid.'
    );
  if (!included(CORE_PERMISSION_STATUSES, record.permissionStatus))
    return safe(
      'InvalidPermissionStatus',
      'State',
      'Permission status is invalid.'
    );
  if (!included(CORE_PERMISSION_ACTOR_TYPES, record.actorType))
    return safe(
      'InvalidActorReference',
      'Reference',
      'Permission actor type is invalid.'
    );
  if (!opaque.test(record.actorReferenceId))
    return safe(
      'ActorReferenceRequired',
      'Reference',
      'Permission requires an actor reference.'
    );
  if (
    !included(CORE_PERMISSION_ACTION_TYPES, record.action) ||
    record.action === 'Unknown'
  )
    return safe(
      'InvalidPermissionAction',
      'Validation',
      'Permission action is invalid.'
    );
  if (!resourceTypePattern.test(record.resourceType))
    return safe(
      'ResourceTypeRequired',
      'Validation',
      'Permission resource type is required.'
    );
  if (
    record.resourceReferenceId !== null &&
    !opaque.test(record.resourceReferenceId)
  )
    return safe(
      'InvalidResourceReference',
      'Reference',
      'Permission resource reference is invalid.'
    );
  if (!opaque.test(record.scopeReference))
    return safe(
      'ScopeReferenceRequired',
      'Validation',
      'Permission scope reference is required.'
    );
  if (!included(CORE_PERMISSION_EFFECTS, record.effect))
    return safe(
      'InvalidPermissionEffect',
      'Validation',
      'Permission effect is invalid.'
    );
  if (
    record.organizationReferenceId !== null &&
    !opaque.test(record.organizationReferenceId)
  )
    return safe(
      'InvalidOrganizationReference',
      'Reference',
      'Permission Organization reference is invalid.'
    );
  if (
    record.conditionReference !== null &&
    !opaque.test(record.conditionReference)
  )
    return safe(
      'InvalidPermissionRecord',
      'Validation',
      'Permission condition reference is invalid.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'PermissionSourceReferenceRequired',
      'Validation',
      'Permission source reference is required.'
    );
  if (
    record.objectRecord.objectType !== PERMISSION_OBJECT_TYPE ||
    record.objectRecord.domainId !== PERMISSION_DOMAIN ||
    record.objectRecord.objectContractId !== PERMISSION_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.permissionStatus]
  )
    return safe(
      'PermissionObjectMismatch',
      'Validation',
      'Permission Object contract is inconsistent.'
    );
  if (record.aiInitiated && !opaque.test(record.agentContractReferenceId ?? ''))
    return safe(
      'InvalidPermissionRecord',
      'Agent',
      'AI-initiated Permission requires an Agent Contract reference.'
    );
  return { ok: true, value: immutable(record) };
}

function traceRecord(input: {
  readonly id: CoreEventId;
  readonly action: CoreEventAction;
  readonly eventType: string;
  readonly permissionReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CorePermissionServiceGovernanceContext;
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
      domainId: PERMISSION_DOMAIN,
      object: {
        id: createCoreObjectId(input.permissionReferenceId),
        type: createCoreObjectType(PERMISSION_OBJECT_TYPE),
        domainId: PERMISSION_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryPermissionServiceStore implements CorePermissionServiceStore {
  readonly #records = new Map<string, CorePermissionServiceRecord>();

  get(id: string): CorePermissionServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  list(): readonly CorePermissionServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CorePermissionServiceRecord
  ): CoreBehaviorResult<CorePermissionServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe(
        'PermissionAlreadyExists',
        'Conflict',
        'Permission already exists.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CorePermissionServiceRecord
  ): CoreBehaviorResult<CorePermissionServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe(
        'PermissionNotFound',
        'Reference',
        'Permission was not found.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CorePermissionService {
  constructor(readonly deps: CorePermissionServiceDependencies) {}

  createPermission(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly permissionType: unknown;
    readonly actorReferenceId: string;
    readonly actorType: unknown;
    readonly action: unknown;
    readonly resourceType: string;
    readonly resourceReferenceId?: string | null;
    readonly organizationReferenceId?: string | null;
    readonly scopeReference: string;
    readonly effect: unknown;
    readonly conditionReference?: string | null;
    readonly status?: unknown;
    readonly sourceReference: string;
    readonly policyRequired?: boolean;
    readonly reviewRequired?: boolean;
    readonly aiInitiated?: boolean;
    readonly agentContractReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<CorePermissionServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.create',
      permission: 'permission:create',
      policyScope: 'permission.write',
      target
    });
    if (!governed.ok) return governed;
    const organizationReferenceId =
      input.organizationReferenceId ?? organizationScopeOf(input.objectRecord);
    const scoped = enforcePermissionScope(
      input.governance,
      organizationReferenceId
    );
    if (!scoped.ok) return scoped;
    if (
      input.publicReferenceRecord.referenceId !== target ||
      input.publicReferenceRecord.objectType !== PERMISSION_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== PERMISSION_DOMAIN
    )
      return safe(
        'InvalidPermissionReference',
        'Reference',
        'Permission reference is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_PERMISSION_TYPES, input.permissionType))
      return safe(
        'InvalidPermissionType',
        'Validation',
        'Permission type is invalid.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_PERMISSION_STATUSES, status) ||
      !['Draft', 'Active', 'ReviewRequired'].includes(status)
    )
      return safe(
        'InvalidPermissionStatus',
        'State',
        'Permission creation status is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_PERMISSION_ACTOR_TYPES, input.actorType))
      return safe(
        'InvalidActorReference',
        'Reference',
        'Permission actor type is invalid.',
        input.governance.correlationId
      );
    if (
      !included(CORE_PERMISSION_ACTION_TYPES, input.action) ||
      input.action === 'Unknown'
    )
      return safe(
        'InvalidPermissionAction',
        'Validation',
        'Permission action is invalid.',
        input.governance.correlationId
      );
    if (!resourceTypePattern.test(input.resourceType))
      return safe(
        'ResourceTypeRequired',
        'Validation',
        'Permission resource type is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.scopeReference))
      return safe(
        'ScopeReferenceRequired',
        'Validation',
        'Permission scope reference is required.',
        input.governance.correlationId
      );
    if (!included(CORE_PERMISSION_EFFECTS, input.effect))
      return safe(
        'InvalidPermissionEffect',
        'Validation',
        'Permission effect is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.sourceReference))
      return safe(
        'PermissionSourceReferenceRequired',
        'Validation',
        'Permission source reference is required.',
        input.governance.correlationId
      );
    const actor = this.validateActorReference(
      input.actorReferenceId,
      input.actorType,
      input.governance.correlationId
    );
    if (!actor.ok) return actor;
    const organization = this.validateOrganizationReference(
      organizationReferenceId,
      input.governance.correlationId
    );
    if (!organization.ok) return organization;
    const resource = this.validateResourceReference(
      input.resourceType,
      input.resourceReferenceId ?? null,
      input.governance.correlationId
    );
    if (!resource.ok) return resource;
    const aiInitiated = input.aiInitiated ?? false;
    if (aiInitiated && !opaque.test(input.agentContractReferenceId ?? ''))
      return safe(
        'InvalidPermissionRecord',
        'Agent',
        'AI-initiated Permission requires an Agent Contract reference.',
        input.governance.correlationId
      );
    if (
      aiInitiated &&
      input.actorType === 'AIAgent' &&
      input.actorReferenceId === input.governance.permission.actorReferenceId
    )
      return safe(
        'PermissionSelfGrantNotAllowed',
        'Agent',
        'AI actors cannot grant Permission to themselves.',
        input.governance.correlationId
      );
    const highRisk =
      aiInitiated ||
      ['AdminPermission', 'AIAgentPermission', 'SystemPermission'].includes(
        input.permissionType
      );
    if (highRisk && input.governance.review.reviewDecision !== 'Approved')
      return safe(
        'PermissionCreationReviewRequired',
        'HumanReview',
        'High-risk Permission creation requires approved human review.',
        input.governance.correlationId
      );

    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'createPermission'
        ),
        operationName: 'createPermission',
        request: {
          target,
          permissionType: input.permissionType,
          actorReferenceId: input.actorReferenceId,
          actorType: input.actorType,
          action: input.action,
          resourceType: input.resourceType,
          resourceReferenceId: input.resourceReferenceId ?? null,
          organizationReferenceId,
          scopeReference: input.scopeReference,
          effect: input.effect,
          conditionReference: input.conditionReference ?? null,
          status,
          sourceReference: input.sourceReference,
          policyRequired: input.policyRequired ?? false,
          reviewRequired: input.reviewRequired ?? false,
          aiInitiated,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe(
            'PermissionAlreadyExists',
            'Conflict',
            'Permission already exists.'
          );
        const duplicate = this.deps.store
          .list()
          .some(
            (record) =>
              record.actorReferenceId === input.actorReferenceId &&
              record.actorType === input.actorType &&
              record.action === input.action &&
              record.resourceType === input.resourceType &&
              record.resourceReferenceId ===
                (input.resourceReferenceId ?? null) &&
              record.organizationReferenceId === organizationReferenceId &&
              record.scopeReference === input.scopeReference &&
              record.effect === input.effect &&
              !['Archived', 'DeletedReferenceOnly'].includes(
                record.permissionStatus
              )
          );
        if (duplicate)
          return safe(
            'PermissionAlreadyExists',
            'Conflict',
            'Equivalent Permission already exists.'
          );
        const record: CorePermissionServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: statusToObjectStatus[status as CorePermissionStatus]
          },
          permissionType: input.permissionType as CorePermissionType,
          permissionStatus: status as CorePermissionStatus,
          actorReferenceId: input.actorReferenceId,
          actorType: input.actorType as CorePermissionActorType,
          action: input.action as CorePermissionActionType,
          resourceType: input.resourceType,
          resourceReferenceId: input.resourceReferenceId ?? null,
          organizationReferenceId,
          scopeReference: input.scopeReference,
          effect: input.effect as CorePermissionEffect,
          conditionReference: input.conditionReference ?? null,
          sourceReference: input.sourceReference,
          policyRequired: input.policyRequired ?? false,
          reviewRequired: input.reviewRequired ?? false,
          aiInitiated,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const traced = this.appendTrace({
          operation: 'createPermission',
          target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: CORE_EVENT_ACTIONS.created,
          eventType: 'permission.created',
          governance: input.governance,
          payload: {
            permissionReferenceId: target,
            permissionType: record.permissionType,
            actorType: record.actorType,
            action: record.action,
            resourceType: record.resourceType,
            effect: record.effect,
            status: record.permissionStatus,
            policyRequired: record.policyRequired,
            reviewRequired: record.reviewRequired,
            aiInitiated: record.aiInitiated,
            protectedResourceDetailsOmitted: true
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

  getPermission(input: {
    readonly permissionReferenceId: string;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<CorePermissionSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.get',
      permission: 'permission:read',
      policyScope: 'permission.read',
      target: input.permissionReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.permissionReferenceId);
    if (!record)
      return safe(
        'PermissionNotFound',
        'Reference',
        'Permission was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePermissionScope(
      input.governance,
      effectiveOrganizationScope(record)
    );
    if (!scoped.ok) return scoped;
    return { ok: true, value: immutable(safeView(record)) };
  }

  updatePermission(input: {
    readonly permissionReferenceId: string;
    readonly action?: unknown;
    readonly resourceType?: string;
    readonly resourceReferenceId?: string | null;
    readonly organizationReferenceId?: string | null;
    readonly scopeReference?: string;
    readonly effect?: unknown;
    readonly conditionReference?: string | null;
    readonly sourceReference?: string;
    readonly policyRequired?: boolean;
    readonly reviewRequired?: boolean;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<CorePermissionServiceRecord> {
    const target = input.permissionReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.update',
      permission: 'permission:update',
      policyScope: 'permission.write',
      target
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reasonReference))
      return safe(
        'PermissionReasonReferenceRequired',
        'Validation',
        'Permission update reason reference is required.',
        input.governance.correlationId
      );
    const current = this.deps.store.get(target);
    if (!current)
      return safe(
        'PermissionNotFound',
        'Reference',
        'Permission was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePermissionScope(
      input.governance,
      effectiveOrganizationScope(current)
    );
    if (!scoped.ok) return scoped;
    if (
      input.action !== undefined &&
      (!included(CORE_PERMISSION_ACTION_TYPES, input.action) ||
        input.action === 'Unknown')
    )
      return safe(
        'InvalidPermissionAction',
        'Validation',
        'Permission action is invalid.',
        input.governance.correlationId
      );
    const nextResourceType = input.resourceType ?? current.resourceType;
    if (!resourceTypePattern.test(nextResourceType))
      return safe(
        'ResourceTypeRequired',
        'Validation',
        'Permission resource type is required.',
        input.governance.correlationId
      );
    const nextResourceReferenceId =
      input.resourceReferenceId === undefined
        ? current.resourceReferenceId
        : input.resourceReferenceId;
    const resource = this.validateResourceReference(
      nextResourceType,
      nextResourceReferenceId,
      input.governance.correlationId
    );
    if (!resource.ok) return resource;
    const nextOrganizationReferenceId =
      input.organizationReferenceId === undefined
        ? current.organizationReferenceId
        : input.organizationReferenceId;
    const targetScope = enforcePermissionScope(
      input.governance,
      nextOrganizationReferenceId ?? organizationScopeOf(current)
    );
    if (!targetScope.ok) return targetScope;
    const organization = this.validateOrganizationReference(
      nextOrganizationReferenceId,
      input.governance.correlationId
    );
    if (!organization.ok) return organization;
    if (
      input.scopeReference !== undefined &&
      !opaque.test(input.scopeReference)
    )
      return safe(
        'ScopeReferenceRequired',
        'Validation',
        'Permission scope reference is invalid.',
        input.governance.correlationId
      );
    if (
      input.effect !== undefined &&
      !included(CORE_PERMISSION_EFFECTS, input.effect)
    )
      return safe(
        'InvalidPermissionEffect',
        'Validation',
        'Permission effect is invalid.',
        input.governance.correlationId
      );
    if (
      input.conditionReference !== undefined &&
      input.conditionReference !== null &&
      !opaque.test(input.conditionReference)
    )
      return safe(
        'InvalidPermissionRecord',
        'Validation',
        'Permission condition reference is invalid.',
        input.governance.correlationId
      );
    if (
      input.sourceReference !== undefined &&
      !opaque.test(input.sourceReference)
    )
      return safe(
        'PermissionSourceReferenceRequired',
        'Validation',
        'Permission source reference is invalid.',
        input.governance.correlationId
      );
    const nextEffect =
      input.effect === undefined
        ? current.effect
        : (input.effect as CorePermissionEffect);
    const escalation =
      (current.effect !== 'Allow' && nextEffect === 'Allow') ||
      (current.policyRequired && input.policyRequired === false) ||
      (current.reviewRequired && input.reviewRequired === false) ||
      (current.resourceReferenceId !== null &&
        nextResourceReferenceId === null) ||
      (current.organizationReferenceId !== null &&
        nextOrganizationReferenceId === null);
    if (escalation && input.governance.review.reviewDecision !== 'Approved')
      return safe(
        'PermissionEscalationReviewRequired',
        'HumanReview',
        'Permission escalation requires approved human review.',
        input.governance.correlationId
      );

    return this.mutate({
      operation: 'updatePermission',
      target,
      idempotencyKey: input.idempotencyKey,
      request: {
        action: input.action ?? null,
        resourceType: input.resourceType ?? null,
        resourceReferenceId:
          input.resourceReferenceId === undefined
            ? '__unchanged__'
            : input.resourceReferenceId,
        organizationReferenceId:
          input.organizationReferenceId === undefined
            ? '__unchanged__'
            : input.organizationReferenceId,
        scopeReference: input.scopeReference ?? null,
        effect: input.effect ?? null,
        conditionReference:
          input.conditionReference === undefined
            ? '__unchanged__'
            : input.conditionReference,
        sourceReference: input.sourceReference ?? null,
        policyRequired: input.policyRequired ?? null,
        reviewRequired: input.reviewRequired ?? null,
        reasonReference: input.reasonReference
      },
      governance: input.governance,
      current,
      next: {
        ...current,
        objectRecord: updatedObject(
          current,
          this.deps.now(),
          input.governance.permission.actorReferenceId
        ),
        action:
          input.action === undefined
            ? current.action
            : (input.action as CorePermissionActionType),
        resourceType: nextResourceType,
        resourceReferenceId: nextResourceReferenceId,
        organizationReferenceId: nextOrganizationReferenceId,
        scopeReference: input.scopeReference ?? current.scopeReference,
        effect: nextEffect,
        conditionReference:
          input.conditionReference === undefined
            ? current.conditionReference
            : input.conditionReference,
        sourceReference: input.sourceReference ?? current.sourceReference,
        policyRequired: input.policyRequired ?? current.policyRequired,
        reviewRequired: input.reviewRequired ?? current.reviewRequired
      },
      eventType: 'permission.updated',
      eventAction: CORE_EVENT_ACTIONS.updated,
      payload: {
        permissionReferenceId: target,
        reasonReference: input.reasonReference,
        escalationReviewed: escalation,
        policyEvaluationPerformed: false,
        protectedResourceDetailsOmitted: true
      }
    });
  }

  changePermissionStatus(input: {
    readonly permissionReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<CorePermissionServiceRecord> {
    const target = input.permissionReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.status.change',
      permission: 'permission:status',
      policyScope: 'permission.status',
      target
    });
    if (!governed.ok) return governed;
    if (!included(CORE_PERMISSION_STATUSES, input.nextStatus))
      return safe(
        'InvalidPermissionStatus',
        'State',
        'Permission status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReference))
      return safe(
        'PermissionReasonReferenceRequired',
        'Validation',
        'Permission status reason reference is required.',
        input.governance.correlationId
      );
    const current = this.deps.store.get(target);
    if (!current)
      return safe(
        'PermissionNotFound',
        'Reference',
        'Permission was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePermissionScope(
      input.governance,
      effectiveOrganizationScope(current)
    );
    if (!scoped.ok) return scoped;
    if (current.permissionStatus === input.nextStatus)
      return { ok: true, value: current };
    if (
      !lifecycleTransitions.has(
        `${current.permissionStatus}->${input.nextStatus}`
      )
    )
      return safe(
        'InvalidPermissionTransition',
        'State',
        'Permission status transition is not allowed.',
        input.governance.correlationId
      );
    const activatingHighRisk =
      input.nextStatus === 'Active' &&
      ['AdminPermission', 'AIAgentPermission', 'SystemPermission'].includes(
        current.permissionType
      );
    if (
      activatingHighRisk &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'PermissionEscalationReviewRequired',
        'HumanReview',
        'High-risk Permission activation requires approved human review.',
        input.governance.correlationId
      );
    return this.mutate({
      operation: 'changePermissionStatus',
      target,
      idempotencyKey: input.idempotencyKey,
      request: {
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference
      },
      governance: input.governance,
      current,
      next: {
        ...current,
        permissionStatus: input.nextStatus,
        objectRecord: updatedObject(
          current,
          this.deps.now(),
          input.governance.permission.actorReferenceId,
          input.nextStatus
        )
      },
      eventType: 'permission.status.changed',
      eventAction: CORE_EVENT_ACTIONS.statusChanged,
      payload: {
        permissionReferenceId: target,
        previousStatus: current.permissionStatus,
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference,
        protectedResourceDetailsOmitted: true
      }
    });
  }

  evaluatePermission(input: {
    readonly requestingActorReferenceId: string;
    readonly actorType: unknown;
    readonly action: unknown;
    readonly resourceType: string;
    readonly resourceReferenceId: string;
    readonly organizationReferenceId?: string | null;
    readonly scopeReference?: string | null;
    readonly taskAssignmentReferenceId?: string | null;
    readonly organizationMembershipReferenceId?: string | null;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<CorePermissionEvaluationResult> {
    const target = input.requestingActorReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.evaluate',
      permission: 'permission:evaluate',
      policyScope: 'permission.evaluate',
      target
    });
    if (!governed.ok) return governed;
    if (!included(CORE_PERMISSION_ACTOR_TYPES, input.actorType))
      return safe(
        'InvalidActorReference',
        'Reference',
        'Permission evaluation actor type is invalid.',
        input.governance.correlationId
      );
    const actor = this.validateActorReference(
      input.requestingActorReferenceId,
      input.actorType,
      input.governance.correlationId
    );
    if (!actor.ok) return actor;
    if (
      !included(CORE_PERMISSION_ACTION_TYPES, input.action) ||
      input.action === 'Unknown'
    )
      return safe(
        'ActionRequired',
        'Validation',
        'Permission evaluation action is required.',
        input.governance.correlationId
      );
    if (!resourceTypePattern.test(input.resourceType))
      return safe(
        'ResourceTypeRequired',
        'Validation',
        'Permission evaluation resource type is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.resourceReferenceId))
      return safe(
        'ResourceReferenceRequired',
        'Reference',
        'Permission evaluation resource reference is required.',
        input.governance.correlationId
      );
    const resource = this.validateResourceReference(
      input.resourceType,
      input.resourceReferenceId,
      input.governance.correlationId
    );
    if (!resource.ok) return resource;
    const organization = this.validateOrganizationReference(
      input.organizationReferenceId ?? null,
      input.governance.correlationId
    );
    if (!organization.ok) return organization;
    const scoped = enforcePermissionScope(
      input.governance,
      input.organizationReferenceId ?? null
    );
    if (!scoped.ok) return scoped;
    if (
      input.scopeReference !== undefined &&
      input.scopeReference !== null &&
      !opaque.test(input.scopeReference)
    )
      return safe(
        'ScopeReferenceRequired',
        'Validation',
        'Permission evaluation scope reference is invalid.',
        input.governance.correlationId
      );

    const candidates = this.deps.store.list().filter((record) => {
      const recordOrganization = effectiveOrganizationScope(record);
      const organizationMatches =
        recordOrganization === null ||
        recordOrganization === (input.organizationReferenceId ?? null);
      const resourceMatches =
        record.resourceReferenceId === null ||
        record.resourceReferenceId === input.resourceReferenceId;
      const scopeMatches =
        input.scopeReference === undefined ||
        input.scopeReference === null ||
        record.scopeReference === input.scopeReference;
      return (
        record.actorReferenceId === input.requestingActorReferenceId &&
        record.actorType === input.actorType &&
        record.action === input.action &&
        record.resourceType === input.resourceType &&
        organizationMatches &&
        resourceMatches &&
        scopeMatches &&
        !['Archived', 'DeletedReferenceOnly', 'Deprecated'].includes(
          record.permissionStatus
        )
      );
    });

    const active = candidates.filter(
      (record) => record.permissionStatus === 'Active'
    );
    let matched: CorePermissionServiceRecord | null = null;
    let decision: CorePermissionDecision = 'NotFound';
    let reasonCode: CorePermissionEvaluationResult['reasonCode'] =
      'NoMatchingPermission';
    if (active.some((record) => record.effect === 'Deny')) {
      matched = active.find((record) => record.effect === 'Deny') ?? null;
      decision = 'Denied';
      reasonCode = 'ExplicitDeny';
    } else if (
      active.some(
        (record) => record.effect === 'ReviewRequired' || record.reviewRequired
      )
    ) {
      matched =
        active.find(
          (record) =>
            record.effect === 'ReviewRequired' || record.reviewRequired
        ) ?? null;
      decision = 'ReviewRequired';
      reasonCode = 'PermissionReviewRequired';
    } else if (
      active.some(
        (record) => record.effect === 'Allow' && record.policyRequired
      )
    ) {
      matched =
        active.find(
          (record) => record.effect === 'Allow' && record.policyRequired
        ) ?? null;
      decision = 'PolicyRequired';
      reasonCode = 'PolicyConstraintRequired';
    } else if (active.some((record) => record.effect === 'Allow')) {
      matched = active.find((record) => record.effect === 'Allow') ?? null;
      decision = 'Allowed';
      reasonCode = 'ExplicitAllow';
    } else if (
      candidates.some((record) => record.permissionStatus === 'Suspended')
    ) {
      matched =
        candidates.find((record) => record.permissionStatus === 'Suspended') ??
        null;
      decision = 'Suspended';
      reasonCode = 'PermissionSuspended';
    } else if (
      candidates.some((record) => record.permissionStatus === 'ReviewRequired')
    ) {
      matched =
        candidates.find(
          (record) => record.permissionStatus === 'ReviewRequired'
        ) ?? null;
      decision = 'ReviewRequired';
      reasonCode = 'PermissionReviewRequired';
    }

    const result: CorePermissionEvaluationResult = immutable({
      decision,
      actorReferenceId: input.requestingActorReferenceId,
      action: input.action as CorePermissionActionType,
      resourceType: input.resourceType,
      resourceReferenceId: input.resourceReferenceId,
      matchedPermissionReferenceId:
        matched?.objectRecord.publicReferenceId ?? null,
      reasonCode,
      policyRequired: decision === 'PolicyRequired',
      reviewRequired: decision === 'ReviewRequired',
      auditRequired: true,
      taskAssignmentInferred: false,
      organizationMembershipInferred: false,
      restrictedFieldsOmitted: true
    });
    const traced = this.appendTrace({
      operation: 'evaluatePermission',
      target: matched?.objectRecord.publicReferenceId ?? target,
      idempotencyKey: input.governance.correlationId,
      action:
        decision === 'Denied' || decision === 'Suspended'
          ? CORE_EVENT_ACTIONS.blocked
          : CORE_EVENT_ACTIONS.emitted,
      eventType: 'permission.evaluated',
      governance: input.governance,
      payload: {
        requestingActorReferenceId: input.requestingActorReferenceId,
        action: input.action as CorePermissionActionType,
        resourceType: input.resourceType,
        decision,
        matchedPermissionReferenceId:
          matched?.objectRecord.publicReferenceId ?? null,
        policyRequired: result.policyRequired,
        reviewRequired: result.reviewRequired,
        taskAssignmentInferred: false,
        organizationMembershipInferred: false,
        protectedResourceDetailsOmitted: true
      }
    });
    return traced.ok ? { ok: true, value: result } : traced;
  }

  validatePermissionReference(input: {
    readonly permissionReferenceId: string;
    readonly requestingDomain: string;
    readonly requestingService: string;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<CorePermissionReferenceValidationResult> {
    const target = input.permissionReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.reference.validate',
      permission: 'permission:read',
      policyScope: 'permission.reference',
      target
    });
    if (!governed.ok) return governed;
    if (
      !resourceTypePattern.test(input.requestingDomain) ||
      !resourceTypePattern.test(input.requestingService)
    )
      return safe(
        'InvalidPermissionRequestingService',
        'Validation',
        'Permission requesting service is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(target);
    if (!record) {
      return {
        ok: true,
        value: immutable({
          isValid: false,
          permissionReferenceId: target,
          status: null,
          reasonCode: 'NotFound',
          policyHint: null,
          restrictedFieldsOmitted: true
        })
      };
    }
    const scoped = enforcePermissionScope(
      input.governance,
      effectiveOrganizationScope(record)
    );
    if (!scoped.ok) return scoped;
    let reasonCode: CorePermissionReferenceValidationResult['reasonCode'] =
      'Valid';
    if (record.permissionStatus === 'Suspended') reasonCode = 'Suspended';
    else if (record.permissionStatus === 'ReviewRequired')
      reasonCode = 'ReviewRequired';
    else if (record.permissionStatus === 'Deprecated')
      reasonCode = 'Deprecated';
    else if (record.permissionStatus === 'Archived') reasonCode = 'Archived';
    else if (record.permissionStatus === 'DeletedReferenceOnly')
      reasonCode = 'DeletedReferenceOnly';
    else if (input.governance.policy.policyDecision === 'Restricted')
      reasonCode = 'PolicyRestricted';
    const result: CorePermissionReferenceValidationResult = immutable({
      isValid: reasonCode === 'Valid' && record.permissionStatus === 'Active',
      permissionReferenceId: target,
      status: record.permissionStatus,
      reasonCode,
      policyHint:
        input.governance.policy.policyDecision === 'Restricted'
          ? 'Restricted'
          : 'Allowed',
      restrictedFieldsOmitted: true
    });
    const traced = this.appendTrace({
      operation: 'validatePermissionReference',
      target,
      idempotencyKey: input.governance.correlationId,
      action: CORE_EVENT_ACTIONS.emitted,
      eventType: 'permission.reference.validated',
      governance: input.governance,
      payload: {
        permissionReferenceId: target,
        requestingDomain: input.requestingDomain,
        requestingService: input.requestingService,
        isValid: result.isValid,
        reasonCode: result.reasonCode,
        unrelatedRulesOmitted: true
      }
    });
    return traced.ok ? { ok: true, value: result } : traced;
  }

  listActorPermissions(input: {
    readonly actorReferenceId: string;
    readonly actorType: unknown;
    readonly organizationReferenceId?: string | null;
    readonly includeInactive?: boolean;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<readonly CorePermissionSafeView[]> {
    const target = input.actorReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.actor.list',
      permission: 'permission:read',
      policyScope: 'permission.read',
      target
    });
    if (!governed.ok) return governed;
    if (!included(CORE_PERMISSION_ACTOR_TYPES, input.actorType))
      return safe(
        'InvalidActorReference',
        'Reference',
        'Permission actor type is invalid.',
        input.governance.correlationId
      );
    const actor = this.validateActorReference(
      input.actorReferenceId,
      input.actorType,
      input.governance.correlationId
    );
    if (!actor.ok) return actor;
    const scoped = enforcePermissionScope(
      input.governance,
      input.organizationReferenceId ?? null
    );
    if (!scoped.ok) return scoped;
    const allowedStatuses = input.includeInactive
      ? new Set(CORE_PERMISSION_STATUSES)
      : new Set<CorePermissionStatus>(['Active']);
    const values = this.deps.store
      .list()
      .filter(
        (record) =>
          record.actorReferenceId === input.actorReferenceId &&
          record.actorType === input.actorType &&
          allowedStatuses.has(record.permissionStatus) &&
          (input.organizationReferenceId === undefined ||
            effectiveOrganizationScope(record) ===
              input.organizationReferenceId)
      )
      .filter((record) => {
        const scope = enforcePermissionScope(
          input.governance,
          effectiveOrganizationScope(record)
        );
        return scope.ok;
      })
      .map(safeView);
    return { ok: true, value: immutable(values) };
  }

  archivePermission(input: {
    readonly permissionReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePermissionServiceGovernanceContext;
  }): CoreBehaviorResult<CorePermissionServiceRecord> {
    const target = input.permissionReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'permission.archive',
      permission: 'permission:archive',
      policyScope: 'permission.status',
      target
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reasonReference))
      return safe(
        'PermissionReasonReferenceRequired',
        'Validation',
        'Permission archive reason reference is required.',
        input.governance.correlationId
      );
    const current = this.deps.store.get(target);
    if (!current)
      return safe(
        'PermissionNotFound',
        'Reference',
        'Permission was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePermissionScope(
      input.governance,
      effectiveOrganizationScope(current)
    );
    if (!scoped.ok) return scoped;
    if (current.permissionStatus === 'Archived')
      return { ok: true, value: current };
    if (!lifecycleTransitions.has(`${current.permissionStatus}->Archived`))
      return safe(
        'InvalidPermissionTransition',
        'State',
        'Permission cannot be archived from its current status.',
        input.governance.correlationId
      );
    return this.mutate({
      operation: 'archivePermission',
      target,
      idempotencyKey: input.idempotencyKey,
      request: { reasonReference: input.reasonReference },
      governance: input.governance,
      current,
      next: {
        ...current,
        permissionStatus: 'Archived',
        objectRecord: updatedObject(
          current,
          this.deps.now(),
          input.governance.permission.actorReferenceId,
          'Archived'
        )
      },
      eventType: 'permission.archived',
      eventAction: CORE_EVENT_ACTIONS.archived,
      payload: {
        permissionReferenceId: target,
        previousStatus: current.permissionStatus,
        nextStatus: 'Archived',
        reasonReference: input.reasonReference,
        protectedResourceDetailsOmitted: true
      }
    });
  }

  private validateActorReference(
    actorReferenceId: string,
    actorType: CorePermissionActorType,
    correlationId: string
  ): CoreBehaviorResult<CoreReferenceRecord> {
    if (!opaque.test(actorReferenceId))
      return safe(
        'ActorReferenceRequired',
        'Reference',
        'Permission actor reference is required.',
        correlationId
      );
    const expected = actorTargets[actorType];
    const resolved = this.deps.relatedReferenceRegistry.resolve({
      referenceId: actorReferenceId,
      expectedObjectType: expected.objectType,
      expectedDomain: expected.domainId
    });
    return resolved.ok
      ? resolved
      : safe(
          'InvalidActorReference',
          'Reference',
          'Permission actor reference is invalid.',
          correlationId
        );
  }

  private validateOrganizationReference(
    organizationReferenceId: string | null,
    correlationId: string
  ): CoreBehaviorResult<CoreReferenceRecord | null> {
    if (organizationReferenceId === null) return { ok: true, value: null };
    const resolved = this.deps.relatedReferenceRegistry.resolve({
      referenceId: organizationReferenceId,
      expectedObjectType: 'organization-record',
      expectedDomain: 'organization'
    });
    return resolved.ok
      ? resolved
      : safe(
          'InvalidOrganizationReference',
          'Reference',
          'Permission Organization reference is invalid.',
          correlationId
        );
  }

  private validateResourceReference(
    resourceType: string,
    resourceReferenceId: string | null,
    correlationId: string
  ): CoreBehaviorResult<CoreReferenceRecord | null> {
    if (resourceReferenceId === null) return { ok: true, value: null };
    if (!resourceTypePattern.test(resourceType))
      return safe(
        'ResourceTypeRequired',
        'Validation',
        'Permission resource type is invalid.',
        correlationId
      );
    const resolved = this.deps.relatedReferenceRegistry.resolve({
      referenceId: resourceReferenceId,
      expectedObjectType: `${resourceType}-record`,
      expectedDomain: resourceType
    });
    return resolved.ok
      ? resolved
      : safe(
          'InvalidResourceReference',
          'Reference',
          'Permission resource reference is invalid.',
          correlationId
        );
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CorePermissionServiceGovernanceContext;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CoreEventTraceRecord> {
    const record = traceRecord({
      id: this.deps.traceEventIdFactory(
        input.operation,
        input.target,
        input.idempotencyKey
      ),
      action: input.action,
      eventType: input.eventType,
      permissionReferenceId: input.target,
      occurredAt: this.deps.now(),
      governance: input.governance,
      payload: input.payload
    });
    const appended = this.deps.tracePort.append(record);
    return appended.ok
      ? appended
      : safe(
          'PermissionTraceFailed',
          'Event',
          'Permission Event trace handoff failed.',
          input.governance.correlationId
        );
  }

  private mutate<TRequest>(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey?: string | null;
    readonly request: TRequest;
    readonly governance: CorePermissionServiceGovernanceContext;
    readonly current: CorePermissionServiceRecord;
    readonly next: CorePermissionServiceRecord;
    readonly eventType: string;
    readonly eventAction: CoreEventAction;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CorePermissionServiceRecord> {
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, input.operation),
        operationName: input.operation,
        request: input.request,
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const valid = validateRecord(input.next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const traced = this.appendTrace({
          operation: input.operation,
          target: input.target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: input.eventAction,
          eventType: input.eventType,
          governance: input.governance,
          payload: input.payload
        });
        if (!traced.ok) {
          this.deps.store.replace(input.current);
          return traced;
        }
        return replaced;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }
}
