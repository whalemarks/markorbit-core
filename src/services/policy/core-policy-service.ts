import { type CoreEventTraceRecord } from '../../behaviors/core-event-pagination-behavior.ts';
import {
  createCoreAuditContext,
  enforceCoreHumanReview,
  enforceCorePermission,
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext
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
  CoreJsonValue,
  CoreMvpObjectBaseRecord
} from '../../objects/core-mvp-object-base-record.ts';
import type { CoreObjectStatus } from '../../objects/core-object-status.ts';
import {
  createCoreObjectId,
  createCoreObjectType
} from '../../objects/index.ts';
import type {
  CorePermissionActorType,
  CorePermissionDecision
} from '../permission/index.ts';
import { CORE_PERMISSION_ACTOR_TYPES } from '../permission/index.ts';

export const CORE_POLICY_TYPES = [
  'AccessPolicy',
  'DataPolicy',
  'ConfidentialityPolicy',
  'WorkflowPolicy',
  'AIAgentPolicy',
  'CommunicationPolicy',
  'DocumentPolicy',
  'EvidencePolicy',
  'OrganizationPolicy',
  'SystemPolicy',
  'Unknown'
] as const;
export type CorePolicyType = (typeof CORE_POLICY_TYPES)[number];

export const CORE_POLICY_STATUSES = [
  'Draft',
  'Active',
  'Suspended',
  'ReviewRequired',
  'Deprecated',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CorePolicyStatus = (typeof CORE_POLICY_STATUSES)[number];

export const CORE_POLICY_DECISIONS = [
  'Allowed',
  'Denied',
  'Restricted',
  'ReviewRequired',
  'ApprovalRequired',
  'RedactionRequired',
  'NotApplicable',
  'Unknown'
] as const;
export type CorePolicyDecision = (typeof CORE_POLICY_DECISIONS)[number];

export const CORE_POLICY_SCOPES = [
  'Global',
  'Organization',
  'Domain',
  'Service',
  'ObjectType',
  'Resource',
  'Jurisdiction',
  'Workflow',
  'AIAgent',
  'Unknown'
] as const;
export type CorePolicyScope = (typeof CORE_POLICY_SCOPES)[number];

export const CORE_POLICY_CONFIDENTIALITY_LEVELS = [
  'Public',
  'Internal',
  'Confidential',
  'Restricted',
  'Privileged',
  'Unknown'
] as const;
export type CorePolicyConfidentialityLevel =
  (typeof CORE_POLICY_CONFIDENTIALITY_LEVELS)[number];

export const CORE_POLICY_IMPLEMENTED_OPERATIONS = [
  'createPolicy',
  'getPolicy',
  'updatePolicy',
  'changePolicyStatus',
  'evaluatePolicy',
  'validatePolicyReference',
  'listApplicablePolicies',
  'archivePolicy'
] as const;

export const CORE_POLICY_MINIMUM_CAPABILITIES = [
  'create stable governed contextual Policy rules with controlled type, scope, lifecycle, decision, condition, source, actor, resource, organization, jurisdiction, workflow, confidentiality, and AI-boundary references',
  'read safe Policy summaries without exposing confidential conditions or protected resource details',
  'update governed Policy metadata and rule fields without changing immutable Policy id',
  'controlled Policy lifecycle including suspended, review-required, deprecated, archived, and reference-only states',
  'deterministic contextual evaluation after explicit Permission evaluation',
  'Permission denial and unknown Permission fail-closed before Policy allowance is considered',
  'explicit deny, non-disclosure restriction, block restriction, human review, approval, redaction, ordinary allow, and no-applicable-policy precedence',
  'policy-controlled behavior fails closed when Policy context or applicable Policy is missing',
  'redaction and non-disclosure guidance without protected data leakage',
  'explicit Policy reference validation without unrelated rule disclosure',
  'safe applicable Policy listing within authorized organization context',
  'recognized Identity, User, Organization, AI Agent, System Actor, Organization, Jurisdiction, and resource reference validation',
  'Permission grant ownership exclusion',
  'workflow approval execution exclusion',
  'professional judgment and jurisdiction legal-rule-engine exclusion',
  'AI protected-data, professional-conclusion, external-communication, and automated-execution actions require explicit Policy evaluation',
  'governed human review for AI-initiated, override-capable, or high-risk Policy creation and escalation',
  'safe error return',
  'event trace handoff for mutation and governed evaluation',
  'event failure rollback for mutation',
  'idempotency handling for duplicate-sensitive mutation',
  'cross-organization non-enumeration'
] as const;

const CONTRACT_ID = 'core-service-policy-evaluation-service-contract';
const POLICY_OBJECT_TYPE = 'permission-policy-record';
const POLICY_DOMAIN: CoreDomainId = 'policy';
const POLICY_OBJECT_CONTRACT_ID =
  'core-object-permission-policy-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const actionPattern = /^(\*|[a-z][a-z0-9:._-]{1,63})$/;
const resourceTypePattern = /^(\*|[a-z][a-z0-9-]{1,63})$/;

const statusToObjectStatus: Record<CorePolicyStatus, CoreObjectStatus> = {
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

export interface CorePolicyServiceGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CorePolicyServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly policyType: CorePolicyType;
  readonly policyStatus: CorePolicyStatus;
  readonly policyScope: CorePolicyScope;
  readonly decision: CorePolicyDecision;
  readonly actorReferenceId: string | null;
  readonly actorType: CorePermissionActorType | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceReferenceId: string | null;
  readonly organizationReferenceId: string | null;
  readonly jurisdictionReferenceId: string | null;
  readonly confidentialityLevel: CorePolicyConfidentialityLevel | null;
  readonly workflowStateReference: string | null;
  readonly conditionReference: string;
  readonly requiredContextAttributes: Readonly<CoreJsonObject>;
  readonly sourceReference: string;
  readonly reasonCode: string;
  readonly reviewRequired: boolean;
  readonly approvalRequired: boolean;
  readonly redactionRequired: boolean;
  readonly nonDisclosureRequired: boolean;
  readonly auditRequired: boolean;
  readonly aiSensitive: boolean;
  readonly aiInitiated: boolean;
  readonly agentContractReferenceId: string | null;
}

export interface CorePolicySafeView {
  readonly [key: string]: unknown;
  readonly policyReferenceId: string;
  readonly policyType: CorePolicyType;
  readonly policyStatus: CorePolicyStatus;
  readonly policyScope: CorePolicyScope;
  readonly decision: CorePolicyDecision;
  readonly actorReferencePresent: boolean;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceReferencePresent: boolean;
  readonly organizationReferencePresent: boolean;
  readonly jurisdictionReferencePresent: boolean;
  readonly confidentialityLevel: CorePolicyConfidentialityLevel | null;
  readonly workflowStateReferencePresent: boolean;
  readonly reviewRequired: boolean;
  readonly approvalRequired: boolean;
  readonly redactionRequired: boolean;
  readonly nonDisclosureRequired: boolean;
  readonly auditRequired: boolean;
  readonly aiSensitive: boolean;
  readonly grantsPermission: false;
  readonly executesApproval: false;
  readonly legalRuleEngineImplemented: false;
  readonly protectedConditionsOmitted: true;
  readonly restrictedFieldsOmitted: true;
}

export interface CorePolicyEvaluationResult {
  readonly decision: CorePolicyDecision;
  readonly actorReferenceId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceReferenceId: string;
  readonly matchedPolicyReferenceId: string | null;
  readonly reasonCode:
    | 'PermissionNotAllowed'
    | 'ExplicitPolicyDeny'
    | 'PolicyNonDisclosure'
    | 'PolicyRestrictedBlock'
    | 'PolicyReviewRequired'
    | 'PolicyApprovalRequired'
    | 'PolicyRedactionRequired'
    | 'ExplicitPolicyAllow'
    | 'NoApplicablePolicy'
    | 'PolicyNotRequired';
  readonly reviewRequired: boolean;
  readonly approvalRequired: boolean;
  readonly redactionRequired: boolean;
  readonly nonDisclosureRequired: boolean;
  readonly auditRequired: boolean;
  readonly mayProceed: boolean;
  readonly permissionGrantedByPolicy: false;
  readonly approvalExecutedByPolicy: false;
  readonly protectedConditionsOmitted: true;
  readonly restrictedFieldsOmitted: true;
}

export interface CorePolicyReferenceValidationResult {
  readonly isValid: boolean;
  readonly policyReferenceId: string;
  readonly status: CorePolicyStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Suspended'
    | 'ReviewRequired'
    | 'Deprecated'
    | 'Archived'
    | 'DeletedReferenceOnly'
    | 'PermissionRestricted';
  readonly policyHint: 'Allowed' | 'Restricted' | null;
  readonly protectedConditionsOmitted: true;
  readonly restrictedFieldsOmitted: true;
}

export interface CorePolicyServiceStore {
  get(id: string): CorePolicyServiceRecord | undefined;
  list(): readonly CorePolicyServiceRecord[];
  insert(
    record: CorePolicyServiceRecord
  ): CoreBehaviorResult<CorePolicyServiceRecord>;
  replace(
    record: CorePolicyServiceRecord
  ): CoreBehaviorResult<CorePolicyServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CorePolicyTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CorePolicyServiceDependencies {
  readonly store: CorePolicyServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CorePolicyTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    policyReferenceId: string,
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

function isJsonObject(value: unknown): value is CoreJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function organizationScopeOf(
  record: CorePolicyServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function effectiveOrganizationScope(
  record: CorePolicyServiceRecord
): string | null {
  return record.organizationReferenceId ?? organizationScopeOf(record);
}

function enforcePolicyScope(
  governance: CorePolicyServiceGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  )
    return safe(
      'PolicyNotFound',
      'Reference',
      'Policy was not found.',
      governance.correlationId
    );
  return { ok: true, value: null };
}

function ensureGovernance(
  context: CorePolicyServiceGovernanceContext,
  expected: {
    readonly operation: string;
    readonly permission: string;
    readonly target: string;
  }
): CoreBehaviorResult<null> {
  if (
    context.permission.correlationId !== context.correlationId ||
    context.audit.correlationId !== context.correlationId ||
    context.permission.intendedOperation !== expected.operation ||
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== POLICY_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !opaque.test(context.auditContextReferenceId)
  )
    return safe(
      'AuditContextMissing',
      'Validation',
      'Policy governance context is invalid.',
      context.correlationId
    );
  const permission = enforceCorePermission(context.permission);
  if (!permission.ok) return permission;
  const review = enforceCoreHumanReview(context.review);
  if (!review.ok) return review;
  const audit = createCoreAuditContext(context.audit);
  return audit.ok ? { ok: true, value: null } : audit;
}

function idempotencyScope(
  governance: CorePolicyServiceGovernanceContext,
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
  current: CorePolicyServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.policyStatus
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

function safeView(record: CorePolicyServiceRecord): CorePolicySafeView {
  return {
    policyReferenceId: record.objectRecord.publicReferenceId,
    policyType: record.policyType,
    policyStatus: record.policyStatus,
    policyScope: record.policyScope,
    decision: record.decision,
    actorReferencePresent: Boolean(record.actorReferenceId),
    action: record.action,
    resourceType: record.resourceType,
    resourceReferencePresent: Boolean(record.resourceReferenceId),
    organizationReferencePresent: Boolean(record.organizationReferenceId),
    jurisdictionReferencePresent: Boolean(record.jurisdictionReferenceId),
    confidentialityLevel: record.confidentialityLevel,
    workflowStateReferencePresent: Boolean(record.workflowStateReference),
    reviewRequired: record.reviewRequired,
    approvalRequired: record.approvalRequired,
    redactionRequired: record.redactionRequired,
    nonDisclosureRequired: record.nonDisclosureRequired,
    auditRequired: record.auditRequired,
    aiSensitive: record.aiSensitive,
    grantsPermission: false,
    executesApproval: false,
    legalRuleEngineImplemented: false,
    protectedConditionsOmitted: true,
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CorePolicyServiceRecord
): CoreBehaviorResult<CorePolicyServiceRecord> {
  if (!included(CORE_POLICY_TYPES, record.policyType))
    return safe('InvalidPolicyType', 'Validation', 'Policy type is invalid.');
  if (!included(CORE_POLICY_STATUSES, record.policyStatus))
    return safe('InvalidPolicyStatus', 'State', 'Policy status is invalid.');
  if (!included(CORE_POLICY_SCOPES, record.policyScope))
    return safe('InvalidPolicyScope', 'Validation', 'Policy scope is invalid.');
  if (!included(CORE_POLICY_DECISIONS, record.decision))
    return safe(
      'InvalidPolicyDecision',
      'Validation',
      'Policy decision is invalid.'
    );
  if (record.decision === 'NotApplicable' || record.decision === 'Unknown')
    return safe(
      'InvalidPolicyDecision',
      'Validation',
      'Policy rule decision is invalid.'
    );
  if (!actionPattern.test(record.action))
    return safe('ActionRequired', 'Validation', 'Policy action is required.');
  if (!resourceTypePattern.test(record.resourceType))
    return safe(
      'ResourceTypeRequired',
      'Validation',
      'Policy resource type is required.'
    );
  if (!opaque.test(record.conditionReference))
    return safe(
      'ConditionReferenceRequired',
      'Validation',
      'Policy condition reference is required.'
    );
  if (!isJsonObject(record.requiredContextAttributes))
    return safe(
      'InvalidContext',
      'Validation',
      'Policy context rule is invalid.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'PolicySourceReferenceRequired',
      'Validation',
      'Policy source reference is required.'
    );
  if (!opaque.test(record.reasonCode))
    return safe(
      'PolicyReasonReferenceRequired',
      'Validation',
      'Policy reason code is required.'
    );
  if (
    (record.actorReferenceId === null) !== (record.actorType === null) ||
    (record.actorType !== null &&
      !included(CORE_PERMISSION_ACTOR_TYPES, record.actorType))
  )
    return safe(
      'InvalidActorReference',
      'Reference',
      'Policy actor reference is invalid.'
    );
  for (const reference of [
    record.actorReferenceId,
    record.resourceReferenceId,
    record.organizationReferenceId,
    record.jurisdictionReferenceId,
    record.workflowStateReference
  ])
    if (reference !== null && !opaque.test(reference))
      return safe(
        'InvalidPolicyReference',
        'Reference',
        'Policy reference is invalid.'
      );
  if (
    record.confidentialityLevel !== null &&
    !included(CORE_POLICY_CONFIDENTIALITY_LEVELS, record.confidentialityLevel)
  )
    return safe(
      'InvalidPolicyRecord',
      'Validation',
      'Policy confidentiality level is invalid.'
    );
  if (
    record.objectRecord.objectType !== POLICY_OBJECT_TYPE ||
    record.objectRecord.domainId !== POLICY_DOMAIN ||
    record.objectRecord.objectContractId !== POLICY_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.policyStatus]
  )
    return safe(
      'PolicyObjectMismatch',
      'Validation',
      'Policy Object contract is inconsistent.'
    );
  if (record.aiInitiated && !opaque.test(record.agentContractReferenceId ?? ''))
    return safe(
      'InvalidPolicyRecord',
      'Agent',
      'AI-initiated Policy requires an Agent Contract reference.'
    );
  return { ok: true, value: immutable(record) };
}

function traceRecord(input: {
  readonly id: CoreEventId;
  readonly action: CoreEventAction;
  readonly eventType: string;
  readonly policyReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CorePolicyServiceGovernanceContext;
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
      domainId: POLICY_DOMAIN,
      object: {
        id: createCoreObjectId(input.policyReferenceId),
        type: createCoreObjectType(POLICY_OBJECT_TYPE),
        domainId: POLICY_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function jsonValueEqual(left: CoreJsonValue, right: CoreJsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function contextMatches(
  required: Readonly<CoreJsonObject>,
  actual: Readonly<CoreJsonObject>
): boolean {
  return Object.entries(required).every(([key, expected]) => {
    const actualValue = actual[key];
    return actualValue !== undefined && jsonValueEqual(expected, actualValue);
  });
}

function policySpecificity(record: CorePolicyServiceRecord): number {
  return (
    [
      record.actorReferenceId,
      record.resourceReferenceId,
      record.organizationReferenceId,
      record.jurisdictionReferenceId,
      record.confidentialityLevel,
      record.workflowStateReference
    ].filter(Boolean).length +
    Object.keys(record.requiredContextAttributes).length
  );
}

export class CoreInMemoryPolicyServiceStore implements CorePolicyServiceStore {
  readonly #records = new Map<string, CorePolicyServiceRecord>();

  get(id: string): CorePolicyServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  list(): readonly CorePolicyServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CorePolicyServiceRecord
  ): CoreBehaviorResult<CorePolicyServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe('PolicyAlreadyExists', 'Conflict', 'Policy already exists.');
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CorePolicyServiceRecord
  ): CoreBehaviorResult<CorePolicyServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe('PolicyNotFound', 'Reference', 'Policy was not found.');
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CorePolicyService {
  constructor(readonly deps: CorePolicyServiceDependencies) {}

  createPolicy(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly policyType: unknown;
    readonly policyScope: unknown;
    readonly decision: unknown;
    readonly actorReferenceId?: string | null;
    readonly actorType?: unknown;
    readonly action: string;
    readonly resourceType: string;
    readonly resourceReferenceId?: string | null;
    readonly organizationReferenceId?: string | null;
    readonly jurisdictionReferenceId?: string | null;
    readonly confidentialityLevel?: unknown;
    readonly workflowStateReference?: string | null;
    readonly conditionReference: string;
    readonly requiredContextAttributes: unknown;
    readonly sourceReference: string;
    readonly reasonCode: string;
    readonly status?: unknown;
    readonly reviewRequired?: boolean;
    readonly approvalRequired?: boolean;
    readonly redactionRequired?: boolean;
    readonly nonDisclosureRequired?: boolean;
    readonly auditRequired?: boolean;
    readonly aiSensitive?: boolean;
    readonly aiInitiated?: boolean;
    readonly agentContractReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<CorePolicyServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.create',
      permission: 'policy:create',
      target
    });
    if (!governed.ok) return governed;
    const organizationReferenceId =
      input.organizationReferenceId ?? organizationScopeOf(input.objectRecord);
    const scoped = enforcePolicyScope(
      input.governance,
      organizationReferenceId
    );
    if (!scoped.ok) return scoped;
    if (
      input.publicReferenceRecord.referenceId !== target ||
      input.publicReferenceRecord.objectType !== POLICY_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== POLICY_DOMAIN
    )
      return safe(
        'InvalidPolicyReference',
        'Reference',
        'Policy reference is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_POLICY_TYPES, input.policyType))
      return safe(
        'InvalidPolicyType',
        'Validation',
        'Policy type is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_POLICY_SCOPES, input.policyScope))
      return safe(
        'InvalidPolicyScope',
        'Validation',
        'Policy scope is invalid.',
        input.governance.correlationId
      );
    if (
      !included(CORE_POLICY_DECISIONS, input.decision) ||
      ['NotApplicable', 'Unknown'].includes(input.decision)
    )
      return safe(
        'InvalidPolicyDecision',
        'Validation',
        'Policy rule decision is invalid.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_POLICY_STATUSES, status) ||
      !['Draft', 'Active', 'ReviewRequired'].includes(status)
    )
      return safe(
        'InvalidPolicyStatus',
        'State',
        'Policy creation status is invalid.',
        input.governance.correlationId
      );
    if (!actionPattern.test(input.action))
      return safe(
        'ActionRequired',
        'Validation',
        'Policy action is required.',
        input.governance.correlationId
      );
    if (!resourceTypePattern.test(input.resourceType))
      return safe(
        'ResourceTypeRequired',
        'Validation',
        'Policy resource type is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.conditionReference))
      return safe(
        'ConditionReferenceRequired',
        'Validation',
        'Policy condition reference is required.',
        input.governance.correlationId
      );
    if (!isJsonObject(input.requiredContextAttributes))
      return safe(
        'InvalidContext',
        'Validation',
        'Policy context rule is invalid.',
        input.governance.correlationId
      );
    const requiredContextAttributes = input.requiredContextAttributes;
    if (!opaque.test(input.sourceReference))
      return safe(
        'PolicySourceReferenceRequired',
        'Validation',
        'Policy source reference is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonCode))
      return safe(
        'PolicyReasonReferenceRequired',
        'Validation',
        'Policy reason code is required.',
        input.governance.correlationId
      );
    const actorReferenceId = input.actorReferenceId ?? null;
    const actorType = input.actorType ?? null;
    if (
      (actorReferenceId === null) !== (actorType === null) ||
      (actorType !== null && !included(CORE_PERMISSION_ACTOR_TYPES, actorType))
    )
      return safe(
        'InvalidActorReference',
        'Reference',
        'Policy actor reference is invalid.',
        input.governance.correlationId
      );
    const confidentialityLevel = input.confidentialityLevel ?? null;
    if (
      confidentialityLevel !== null &&
      !included(CORE_POLICY_CONFIDENTIALITY_LEVELS, confidentialityLevel)
    )
      return safe(
        'InvalidPolicyRecord',
        'Validation',
        'Policy confidentiality level is invalid.',
        input.governance.correlationId
      );
    const references = this.validateRelatedReferences({
      actorReferenceId,
      actorType: actorType as CorePermissionActorType | null,
      resourceType: input.resourceType,
      resourceReferenceId: input.resourceReferenceId ?? null,
      organizationReferenceId,
      jurisdictionReferenceId: input.jurisdictionReferenceId ?? null,
      correlationId: input.governance.correlationId
    });
    if (!references.ok) return references;
    const aiInitiated = input.aiInitiated ?? false;
    if (aiInitiated && !opaque.test(input.agentContractReferenceId ?? ''))
      return safe(
        'InvalidPolicyRecord',
        'Agent',
        'AI-initiated Policy requires an Agent Contract reference.',
        input.governance.correlationId
      );
    const highRisk =
      aiInitiated ||
      ['AIAgentPolicy', 'SystemPolicy', 'ConfidentialityPolicy'].includes(
        input.policyType
      ) ||
      input.decision !== 'Allowed';
    if (highRisk && input.governance.review.reviewDecision !== 'Approved')
      return safe(
        'PolicyCreationReviewRequired',
        'HumanReview',
        'High-risk Policy creation requires approved human review.',
        input.governance.correlationId
      );

    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createPolicy'),
        operationName: 'createPolicy',
        request: {
          target,
          policyType: input.policyType,
          policyScope: input.policyScope,
          decision: input.decision,
          actorReferenceId,
          actorType,
          action: input.action,
          resourceType: input.resourceType,
          resourceReferenceId: input.resourceReferenceId ?? null,
          organizationReferenceId,
          jurisdictionReferenceId: input.jurisdictionReferenceId ?? null,
          confidentialityLevel,
          workflowStateReference: input.workflowStateReference ?? null,
          conditionReference: input.conditionReference,
          requiredContextAttributes: input.requiredContextAttributes,
          sourceReference: input.sourceReference,
          reasonCode: input.reasonCode,
          status,
          reviewRequired: input.reviewRequired ?? false,
          approvalRequired: input.approvalRequired ?? false,
          redactionRequired: input.redactionRequired ?? false,
          nonDisclosureRequired: input.nonDisclosureRequired ?? false,
          auditRequired: input.auditRequired ?? true,
          aiSensitive: input.aiSensitive ?? false,
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
            'PolicyAlreadyExists',
            'Conflict',
            'Policy already exists.'
          );
        const duplicate = this.deps.store
          .list()
          .some(
            (record) =>
              record.policyType === input.policyType &&
              record.policyScope === input.policyScope &&
              record.actorReferenceId === actorReferenceId &&
              record.action === input.action &&
              record.resourceType === input.resourceType &&
              record.resourceReferenceId ===
                (input.resourceReferenceId ?? null) &&
              record.organizationReferenceId === organizationReferenceId &&
              record.jurisdictionReferenceId ===
                (input.jurisdictionReferenceId ?? null) &&
              record.conditionReference === input.conditionReference &&
              !['Archived', 'DeletedReferenceOnly'].includes(
                record.policyStatus
              )
          );
        if (duplicate)
          return safe(
            'PolicyAlreadyExists',
            'Conflict',
            'Equivalent Policy already exists.'
          );
        const record: CorePolicyServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: statusToObjectStatus[status as CorePolicyStatus]
          },
          policyType: input.policyType as CorePolicyType,
          policyStatus: status as CorePolicyStatus,
          policyScope: input.policyScope as CorePolicyScope,
          decision: input.decision as CorePolicyDecision,
          actorReferenceId,
          actorType: actorType as CorePermissionActorType | null,
          action: input.action,
          resourceType: input.resourceType,
          resourceReferenceId: input.resourceReferenceId ?? null,
          organizationReferenceId,
          jurisdictionReferenceId: input.jurisdictionReferenceId ?? null,
          confidentialityLevel:
            confidentialityLevel as CorePolicyConfidentialityLevel | null,
          workflowStateReference: input.workflowStateReference ?? null,
          conditionReference: input.conditionReference,
          requiredContextAttributes: immutable(requiredContextAttributes),
          sourceReference: input.sourceReference,
          reasonCode: input.reasonCode,
          reviewRequired:
            input.reviewRequired ?? input.decision === 'ReviewRequired',
          approvalRequired:
            input.approvalRequired ?? input.decision === 'ApprovalRequired',
          redactionRequired:
            input.redactionRequired ?? input.decision === 'RedactionRequired',
          nonDisclosureRequired: input.nonDisclosureRequired ?? false,
          auditRequired: input.auditRequired ?? true,
          aiSensitive:
            input.aiSensitive ?? input.policyType === 'AIAgentPolicy',
          aiInitiated,
          agentContractReferenceId: input.agentContractReferenceId ?? null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const traced = this.appendTrace({
          operation: 'createPolicy',
          target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: CORE_EVENT_ACTIONS.created,
          eventType: 'policy.created',
          governance: input.governance,
          payload: {
            policyReferenceId: target,
            policyType: input.policyType as string,
            policyScope: input.policyScope as string,
            decision: input.decision as string,
            conditionDetailsOmitted: true,
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

  getPolicy(input: {
    readonly policyReferenceId: string;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<CorePolicySafeView> {
    const target = input.policyReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.get',
      permission: 'policy:read',
      target
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(target);
    if (!record)
      return safe(
        'PolicyNotFound',
        'Reference',
        'Policy was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePolicyScope(
      input.governance,
      effectiveOrganizationScope(record)
    );
    return scoped.ok
      ? { ok: true, value: immutable(safeView(record)) }
      : scoped;
  }

  updatePolicy(input: {
    readonly policyReferenceId: string;
    readonly decision?: unknown;
    readonly requiredContextAttributes?: unknown;
    readonly conditionReference?: string;
    readonly sourceReference?: string;
    readonly reasonCode?: string;
    readonly reviewRequired?: boolean;
    readonly approvalRequired?: boolean;
    readonly redactionRequired?: boolean;
    readonly nonDisclosureRequired?: boolean;
    readonly auditRequired?: boolean;
    readonly aiSensitive?: boolean;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<CorePolicyServiceRecord> {
    const target = input.policyReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.update',
      permission: 'policy:update',
      target
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reasonReference))
      return safe(
        'PolicyReasonReferenceRequired',
        'Validation',
        'Policy update reason reference is required.',
        input.governance.correlationId
      );
    const current = this.deps.store.get(target);
    if (!current)
      return safe(
        'PolicyNotFound',
        'Reference',
        'Policy was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePolicyScope(
      input.governance,
      effectiveOrganizationScope(current)
    );
    if (!scoped.ok) return scoped;
    if (
      input.decision !== undefined &&
      (!included(CORE_POLICY_DECISIONS, input.decision) ||
        ['NotApplicable', 'Unknown'].includes(input.decision))
    )
      return safe(
        'InvalidPolicyDecision',
        'Validation',
        'Policy decision is invalid.',
        input.governance.correlationId
      );
    if (
      input.requiredContextAttributes !== undefined &&
      !isJsonObject(input.requiredContextAttributes)
    )
      return safe(
        'InvalidContext',
        'Validation',
        'Policy context rule is invalid.',
        input.governance.correlationId
      );
    for (const reference of [
      input.conditionReference,
      input.sourceReference,
      input.reasonCode
    ])
      if (reference !== undefined && !opaque.test(reference))
        return safe(
          'InvalidPolicyRecord',
          'Validation',
          'Policy update reference is invalid.',
          input.governance.correlationId
        );
    const escalation =
      input.decision !== undefined && input.decision !== current.decision;
    if (escalation && input.governance.review.reviewDecision !== 'Approved')
      return safe(
        'PolicyEscalationReviewRequired',
        'HumanReview',
        'Policy decision change requires approved human review.',
        input.governance.correlationId
      );
    return this.mutate({
      operation: 'updatePolicy',
      target,
      idempotencyKey: input.idempotencyKey,
      request: {
        decision: input.decision ?? current.decision,
        requiredContextAttributes:
          input.requiredContextAttributes ?? current.requiredContextAttributes,
        conditionReference:
          input.conditionReference ?? current.conditionReference,
        sourceReference: input.sourceReference ?? current.sourceReference,
        reasonCode: input.reasonCode ?? current.reasonCode,
        reviewRequired: input.reviewRequired ?? current.reviewRequired,
        approvalRequired: input.approvalRequired ?? current.approvalRequired,
        redactionRequired: input.redactionRequired ?? current.redactionRequired,
        nonDisclosureRequired:
          input.nonDisclosureRequired ?? current.nonDisclosureRequired,
        auditRequired: input.auditRequired ?? current.auditRequired,
        aiSensitive: input.aiSensitive ?? current.aiSensitive,
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
        decision: (input.decision ?? current.decision) as CorePolicyDecision,
        requiredContextAttributes:
          input.requiredContextAttributes === undefined
            ? current.requiredContextAttributes
            : immutable(input.requiredContextAttributes),
        conditionReference:
          input.conditionReference ?? current.conditionReference,
        sourceReference: input.sourceReference ?? current.sourceReference,
        reasonCode: input.reasonCode ?? current.reasonCode,
        reviewRequired: input.reviewRequired ?? current.reviewRequired,
        approvalRequired: input.approvalRequired ?? current.approvalRequired,
        redactionRequired: input.redactionRequired ?? current.redactionRequired,
        nonDisclosureRequired:
          input.nonDisclosureRequired ?? current.nonDisclosureRequired,
        auditRequired: input.auditRequired ?? current.auditRequired,
        aiSensitive: input.aiSensitive ?? current.aiSensitive
      },
      eventType: 'policy.updated',
      eventAction: CORE_EVENT_ACTIONS.updated,
      payload: {
        policyReferenceId: target,
        reasonReference: input.reasonReference,
        decisionChanged: escalation,
        conditionDetailsOmitted: true,
        protectedResourceDetailsOmitted: true
      }
    });
  }

  changePolicyStatus(input: {
    readonly policyReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<CorePolicyServiceRecord> {
    const target = input.policyReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.status.change',
      permission: 'policy:status',
      target
    });
    if (!governed.ok) return governed;
    if (!included(CORE_POLICY_STATUSES, input.nextStatus))
      return safe(
        'InvalidPolicyStatus',
        'State',
        'Policy status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReference))
      return safe(
        'PolicyReasonReferenceRequired',
        'Validation',
        'Policy status reason reference is required.',
        input.governance.correlationId
      );
    const current = this.deps.store.get(target);
    if (!current)
      return safe(
        'PolicyNotFound',
        'Reference',
        'Policy was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePolicyScope(
      input.governance,
      effectiveOrganizationScope(current)
    );
    if (!scoped.ok) return scoped;
    if (current.policyStatus === input.nextStatus)
      return { ok: true, value: current };
    if (
      !lifecycleTransitions.has(`${current.policyStatus}->${input.nextStatus}`)
    )
      return safe(
        'InvalidPolicyTransition',
        'State',
        'Policy status transition is not allowed.',
        input.governance.correlationId
      );
    if (
      input.nextStatus === 'Active' &&
      input.governance.review.reviewDecision !== 'Approved'
    )
      return safe(
        'PolicyEscalationReviewRequired',
        'HumanReview',
        'Policy activation requires approved human review.',
        input.governance.correlationId
      );
    return this.mutate({
      operation: 'changePolicyStatus',
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
        policyStatus: input.nextStatus,
        objectRecord: updatedObject(
          current,
          this.deps.now(),
          input.governance.permission.actorReferenceId,
          input.nextStatus
        )
      },
      eventType: 'policy.status.changed',
      eventAction: CORE_EVENT_ACTIONS.statusChanged,
      payload: {
        policyReferenceId: target,
        previousStatus: current.policyStatus,
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference,
        protectedResourceDetailsOmitted: true
      }
    });
  }

  evaluatePolicy(input: {
    readonly requestingActorReferenceId: string;
    readonly actorType: unknown;
    readonly permissionDecision: CorePermissionDecision;
    readonly permissionDecisionReferenceId: string | null;
    readonly action: string;
    readonly resourceType: string;
    readonly resourceReferenceId: string;
    readonly organizationReferenceId?: string | null;
    readonly jurisdictionReferenceId?: string | null;
    readonly confidentialityLevel?: unknown;
    readonly workflowStateReference?: string | null;
    readonly contextAttributes: unknown;
    readonly policyControlled?: boolean;
    readonly aiAction?: boolean;
    readonly protectedDataAction?: boolean;
    readonly professionalConclusionAction?: boolean;
    readonly externalCommunicationAction?: boolean;
    readonly automatedExecutionAction?: boolean;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<CorePolicyEvaluationResult> {
    const target = input.resourceReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.evaluate',
      permission: 'policy:evaluate',
      target
    });
    if (!governed.ok) return governed;
    if (!included(CORE_PERMISSION_ACTOR_TYPES, input.actorType))
      return safe(
        'InvalidActorReference',
        'Reference',
        'Policy evaluation actor type is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.requestingActorReferenceId))
      return safe(
        'ActorReferenceRequired',
        'Reference',
        'Policy evaluation actor reference is required.',
        input.governance.correlationId
      );
    if (!actionPattern.test(input.action) || input.action === '*')
      return safe(
        'ActionRequired',
        'Validation',
        'Policy evaluation action is required.',
        input.governance.correlationId
      );
    if (
      !resourceTypePattern.test(input.resourceType) ||
      input.resourceType === '*'
    )
      return safe(
        'ResourceTypeRequired',
        'Validation',
        'Policy evaluation resource type is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.resourceReferenceId))
      return safe(
        'ResourceReferenceRequired',
        'Reference',
        'Policy evaluation resource reference is required.',
        input.governance.correlationId
      );
    if (!isJsonObject(input.contextAttributes))
      return safe(
        'ContextRequired',
        'Validation',
        'Policy evaluation context is required.',
        input.governance.correlationId
      );
    const contextAttributes = input.contextAttributes;
    const confidentialityLevel = input.confidentialityLevel ?? null;
    if (
      confidentialityLevel !== null &&
      !included(CORE_POLICY_CONFIDENTIALITY_LEVELS, confidentialityLevel)
    )
      return safe(
        'InvalidContext',
        'Validation',
        'Policy evaluation confidentiality level is invalid.',
        input.governance.correlationId
      );
    const references = this.validateRelatedReferences({
      actorReferenceId: input.requestingActorReferenceId,
      actorType: input.actorType,
      resourceType: input.resourceType,
      resourceReferenceId: input.resourceReferenceId,
      organizationReferenceId: input.organizationReferenceId ?? null,
      jurisdictionReferenceId: input.jurisdictionReferenceId ?? null,
      correlationId: input.governance.correlationId
    });
    if (!references.ok) return references;
    const scoped = enforcePolicyScope(
      input.governance,
      input.organizationReferenceId ?? null
    );
    if (!scoped.ok) return scoped;

    const permissionAllowsEvaluation =
      input.permissionDecision === 'Allowed' ||
      input.permissionDecision === 'PolicyRequired';
    if (
      !permissionAllowsEvaluation ||
      !opaque.test(input.permissionDecisionReferenceId ?? '')
    ) {
      const result = this.evaluationResult({
        decision: 'Denied',
        actorReferenceId: input.requestingActorReferenceId,
        action: input.action,
        resourceType: input.resourceType,
        resourceReferenceId: input.resourceReferenceId,
        matched: null,
        reasonCode: 'PermissionNotAllowed'
      });
      this.appendEvaluationTrace(input.governance, result);
      return { ok: true, value: result };
    }

    const policyControlled = input.policyControlled ?? true;
    const aiRequiresPolicy =
      input.aiAction === true &&
      (input.protectedDataAction === true ||
        input.professionalConclusionAction === true ||
        input.externalCommunicationAction === true ||
        input.automatedExecutionAction === true);
    if (aiRequiresPolicy && !policyControlled)
      return safe(
        'PolicyContextRequired',
        'Policy',
        'Protected AI action requires Policy evaluation.',
        input.governance.correlationId
      );

    const candidates = this.deps.store
      .list()
      .filter((record) => {
        const organizationMatches =
          effectiveOrganizationScope(record) === null ||
          effectiveOrganizationScope(record) ===
            (input.organizationReferenceId ?? null);
        const actorMatches =
          record.actorReferenceId === null ||
          (record.actorReferenceId === input.requestingActorReferenceId &&
            record.actorType === input.actorType);
        const actionMatches =
          record.action === '*' || record.action === input.action;
        const resourceTypeMatches =
          record.resourceType === '*' ||
          record.resourceType === input.resourceType;
        const resourceMatches =
          record.resourceReferenceId === null ||
          record.resourceReferenceId === input.resourceReferenceId;
        const jurisdictionMatches =
          record.jurisdictionReferenceId === null ||
          record.jurisdictionReferenceId ===
            (input.jurisdictionReferenceId ?? null);
        const confidentialityMatches =
          record.confidentialityLevel === null ||
          record.confidentialityLevel === confidentialityLevel;
        const workflowMatches =
          record.workflowStateReference === null ||
          record.workflowStateReference ===
            (input.workflowStateReference ?? null);
        return (
          organizationMatches &&
          actorMatches &&
          actionMatches &&
          resourceTypeMatches &&
          resourceMatches &&
          jurisdictionMatches &&
          confidentialityMatches &&
          workflowMatches &&
          contextMatches(record.requiredContextAttributes, contextAttributes) &&
          !['Archived', 'DeletedReferenceOnly', 'Deprecated'].includes(
            record.policyStatus
          )
        );
      })
      .sort(
        (left, right) => policySpecificity(right) - policySpecificity(left)
      );

    const active = candidates.filter(
      (record) => record.policyStatus === 'Active'
    );
    const lifecycleReview = candidates.find(
      (record) => record.policyStatus === 'ReviewRequired'
    );
    const lifecycleSuspended = candidates.find(
      (record) => record.policyStatus === 'Suspended'
    );
    const choose = (
      predicate: (record: CorePolicyServiceRecord) => boolean
    ): CorePolicyServiceRecord | null => active.find(predicate) ?? null;

    let matched: CorePolicyServiceRecord | null = null;
    let decision: CorePolicyDecision;
    let reasonCode: CorePolicyEvaluationResult['reasonCode'];
    if ((matched = choose((record) => record.decision === 'Denied'))) {
      decision = 'Denied';
      reasonCode = 'ExplicitPolicyDeny';
    } else if (
      (matched = choose(
        (record) =>
          record.nonDisclosureRequired && record.decision === 'Restricted'
      ))
    ) {
      decision = 'Restricted';
      reasonCode = 'PolicyNonDisclosure';
    } else if (
      (matched = choose((record) => record.decision === 'Restricted'))
    ) {
      decision = 'Restricted';
      reasonCode = 'PolicyRestrictedBlock';
    } else if (
      (matched = choose(
        (record) =>
          record.decision === 'ReviewRequired' || record.reviewRequired
      )) ??
      lifecycleReview
    ) {
      decision = 'ReviewRequired';
      reasonCode = 'PolicyReviewRequired';
    } else if (
      (matched = choose(
        (record) =>
          record.decision === 'ApprovalRequired' || record.approvalRequired
      ))
    ) {
      decision = 'ApprovalRequired';
      reasonCode = 'PolicyApprovalRequired';
    } else if (
      (matched = choose(
        (record) =>
          record.decision === 'RedactionRequired' || record.redactionRequired
      ))
    ) {
      decision = 'RedactionRequired';
      reasonCode = 'PolicyRedactionRequired';
    } else if ((matched = choose((record) => record.decision === 'Allowed'))) {
      decision = 'Allowed';
      reasonCode = 'ExplicitPolicyAllow';
    } else if (lifecycleSuspended) {
      matched = lifecycleSuspended;
      decision = 'Restricted';
      reasonCode = 'PolicyRestrictedBlock';
    } else if (policyControlled || aiRequiresPolicy) {
      decision = 'Denied';
      reasonCode = 'NoApplicablePolicy';
    } else {
      decision = 'NotApplicable';
      reasonCode = 'PolicyNotRequired';
    }

    const result = this.evaluationResult({
      decision,
      actorReferenceId: input.requestingActorReferenceId,
      action: input.action,
      resourceType: input.resourceType,
      resourceReferenceId: input.resourceReferenceId,
      matched,
      reasonCode
    });
    this.appendEvaluationTrace(input.governance, result);
    return { ok: true, value: result };
  }

  validatePolicyReference(input: {
    readonly policyReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<CorePolicyReferenceValidationResult> {
    const target = input.policyReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.reference.validate',
      permission: 'policy:reference:validate',
      target
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.requestingService))
      return safe(
        'InvalidPolicyRequestingService',
        'Validation',
        'Policy requesting service is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(target);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          policyReferenceId: target,
          status: null,
          reasonCode: 'NotFound',
          policyHint: null,
          protectedConditionsOmitted: true,
          restrictedFieldsOmitted: true
        }
      };
    const scoped = enforcePolicyScope(
      input.governance,
      effectiveOrganizationScope(record)
    );
    if (!scoped.ok)
      return {
        ok: true,
        value: {
          isValid: false,
          policyReferenceId: target,
          status: null,
          reasonCode: 'NotFound',
          policyHint: null,
          protectedConditionsOmitted: true,
          restrictedFieldsOmitted: true
        }
      };
    const reasonMap: Record<
      Exclude<CorePolicyStatus, 'Active' | 'Draft'>,
      Exclude<
        CorePolicyReferenceValidationResult['reasonCode'],
        'Valid' | 'NotFound' | 'PermissionRestricted'
      >
    > = {
      Suspended: 'Suspended',
      ReviewRequired: 'ReviewRequired',
      Deprecated: 'Deprecated',
      Archived: 'Archived',
      DeletedReferenceOnly: 'DeletedReferenceOnly'
    };
    const isValid = record.policyStatus === 'Active';
    const result: CorePolicyReferenceValidationResult = {
      isValid,
      policyReferenceId: target,
      status: record.policyStatus,
      reasonCode:
        record.policyStatus === 'Active' || record.policyStatus === 'Draft'
          ? record.policyStatus === 'Active'
            ? 'Valid'
            : 'ReviewRequired'
          : reasonMap[record.policyStatus],
      policyHint: isValid ? 'Allowed' : 'Restricted',
      protectedConditionsOmitted: true,
      restrictedFieldsOmitted: true
    };
    this.appendTrace({
      operation: 'validatePolicyReference',
      target,
      idempotencyKey: `${input.requestingDomain}:${input.requestingService}`,
      action: CORE_EVENT_ACTIONS.reviewed,
      eventType: 'policy.reference.validated',
      governance: input.governance,
      payload: {
        policyReferenceId: target,
        requestingDomain: input.requestingDomain,
        requestingService: input.requestingService,
        isValid,
        conditionDetailsOmitted: true
      }
    });
    return { ok: true, value: result };
  }

  listApplicablePolicies(input: {
    readonly requestingActorReferenceId: string;
    readonly actorType: unknown;
    readonly action: string;
    readonly resourceType: string;
    readonly resourceReferenceId?: string | null;
    readonly organizationReferenceId?: string | null;
    readonly jurisdictionReferenceId?: string | null;
    readonly confidentialityLevel?: unknown;
    readonly workflowStateReference?: string | null;
    readonly contextAttributes: unknown;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<readonly CorePolicySafeView[]> {
    const target =
      input.resourceReferenceId ?? input.requestingActorReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.list.applicable',
      permission: 'policy:list',
      target
    });
    if (!governed.ok) return governed;
    if (!included(CORE_PERMISSION_ACTOR_TYPES, input.actorType))
      return safe(
        'InvalidActorReference',
        'Reference',
        'Policy actor type is invalid.',
        input.governance.correlationId
      );
    if (!isJsonObject(input.contextAttributes))
      return safe(
        'ContextRequired',
        'Validation',
        'Policy listing context is required.',
        input.governance.correlationId
      );
    const contextAttributes = input.contextAttributes;
    const scoped = enforcePolicyScope(
      input.governance,
      input.organizationReferenceId ?? null
    );
    if (!scoped.ok) return scoped;
    const confidentialityLevel = input.confidentialityLevel ?? null;
    if (
      confidentialityLevel !== null &&
      !included(CORE_POLICY_CONFIDENTIALITY_LEVELS, confidentialityLevel)
    )
      return safe(
        'InvalidContext',
        'Validation',
        'Policy listing confidentiality level is invalid.',
        input.governance.correlationId
      );
    const records = this.deps.store
      .list()
      .filter(
        (record) =>
          record.policyStatus === 'Active' &&
          (record.actorReferenceId === null ||
            (record.actorReferenceId === input.requestingActorReferenceId &&
              record.actorType === input.actorType)) &&
          (record.action === '*' || record.action === input.action) &&
          (record.resourceType === '*' ||
            record.resourceType === input.resourceType) &&
          (record.resourceReferenceId === null ||
            record.resourceReferenceId ===
              (input.resourceReferenceId ?? null)) &&
          (effectiveOrganizationScope(record) === null ||
            effectiveOrganizationScope(record) ===
              (input.organizationReferenceId ?? null)) &&
          (record.jurisdictionReferenceId === null ||
            record.jurisdictionReferenceId ===
              (input.jurisdictionReferenceId ?? null)) &&
          (record.confidentialityLevel === null ||
            record.confidentialityLevel === confidentialityLevel) &&
          (record.workflowStateReference === null ||
            record.workflowStateReference ===
              (input.workflowStateReference ?? null)) &&
          contextMatches(record.requiredContextAttributes, contextAttributes)
      )
      .sort((left, right) => policySpecificity(right) - policySpecificity(left))
      .map((record) => immutable(safeView(record)));
    return { ok: true, value: records };
  }

  archivePolicy(input: {
    readonly policyReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CorePolicyServiceGovernanceContext;
  }): CoreBehaviorResult<CorePolicyServiceRecord> {
    const target = input.policyReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'policy.archive',
      permission: 'policy:archive',
      target
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reasonReference))
      return safe(
        'PolicyReasonReferenceRequired',
        'Validation',
        'Policy archive reason reference is required.',
        input.governance.correlationId
      );
    const current = this.deps.store.get(target);
    if (!current)
      return safe(
        'PolicyNotFound',
        'Reference',
        'Policy was not found.',
        input.governance.correlationId
      );
    const scoped = enforcePolicyScope(
      input.governance,
      effectiveOrganizationScope(current)
    );
    if (!scoped.ok) return scoped;
    if (current.policyStatus === 'Archived')
      return { ok: true, value: current };
    if (!lifecycleTransitions.has(`${current.policyStatus}->Archived`))
      return safe(
        'InvalidPolicyTransition',
        'State',
        'Policy cannot be archived from its current status.',
        input.governance.correlationId
      );
    return this.mutate({
      operation: 'archivePolicy',
      target,
      idempotencyKey: input.idempotencyKey,
      request: { reasonReference: input.reasonReference },
      governance: input.governance,
      current,
      next: {
        ...current,
        policyStatus: 'Archived',
        objectRecord: updatedObject(
          current,
          this.deps.now(),
          input.governance.permission.actorReferenceId,
          'Archived'
        )
      },
      eventType: 'policy.archived',
      eventAction: CORE_EVENT_ACTIONS.archived,
      payload: {
        policyReferenceId: target,
        reasonReference: input.reasonReference,
        conditionDetailsOmitted: true,
        protectedResourceDetailsOmitted: true
      }
    });
  }

  private evaluationResult(input: {
    readonly decision: CorePolicyDecision;
    readonly actorReferenceId: string;
    readonly action: string;
    readonly resourceType: string;
    readonly resourceReferenceId: string;
    readonly matched: CorePolicyServiceRecord | null;
    readonly reasonCode: CorePolicyEvaluationResult['reasonCode'];
  }): CorePolicyEvaluationResult {
    const reviewRequired =
      input.decision === 'ReviewRequired' ||
      input.matched?.reviewRequired === true;
    const approvalRequired =
      input.decision === 'ApprovalRequired' ||
      input.matched?.approvalRequired === true;
    const redactionRequired =
      input.decision === 'RedactionRequired' ||
      input.matched?.redactionRequired === true;
    const nonDisclosureRequired = input.matched?.nonDisclosureRequired === true;
    return immutable({
      decision: input.decision,
      actorReferenceId: input.actorReferenceId,
      action: input.action,
      resourceType: input.resourceType,
      resourceReferenceId: input.resourceReferenceId,
      matchedPolicyReferenceId:
        input.matched?.objectRecord.publicReferenceId ?? null,
      reasonCode: input.reasonCode,
      reviewRequired,
      approvalRequired,
      redactionRequired,
      nonDisclosureRequired,
      auditRequired: input.matched?.auditRequired ?? true,
      mayProceed:
        input.decision === 'Allowed' ||
        input.decision === 'RedactionRequired' ||
        input.decision === 'NotApplicable',
      permissionGrantedByPolicy: false,
      approvalExecutedByPolicy: false,
      protectedConditionsOmitted: true,
      restrictedFieldsOmitted: true
    });
  }

  private validateRelatedReferences(input: {
    readonly actorReferenceId: string | null;
    readonly actorType: CorePermissionActorType | null;
    readonly resourceType: string;
    readonly resourceReferenceId: string | null;
    readonly organizationReferenceId: string | null;
    readonly jurisdictionReferenceId: string | null;
    readonly correlationId: string;
  }): CoreBehaviorResult<null> {
    if (input.actorReferenceId !== null && input.actorType !== null) {
      const target = actorTargets[input.actorType];
      const actor = this.deps.relatedReferenceRegistry.resolve({
        referenceId: input.actorReferenceId,
        expectedObjectType: target.objectType,
        expectedDomain: target.domainId
      });
      if (!actor.ok)
        return safe(
          'InvalidActorReference',
          'Reference',
          'Policy actor reference is invalid.',
          input.correlationId
        );
    }
    if (input.organizationReferenceId !== null) {
      const organization = this.deps.relatedReferenceRegistry.resolve({
        referenceId: input.organizationReferenceId,
        expectedObjectType: 'organization-record',
        expectedDomain: 'organization'
      });
      if (!organization.ok)
        return safe(
          'InvalidOrganizationReference',
          'Reference',
          'Policy Organization reference is invalid.',
          input.correlationId
        );
    }
    if (input.jurisdictionReferenceId !== null) {
      const jurisdiction = this.deps.relatedReferenceRegistry.resolve({
        referenceId: input.jurisdictionReferenceId,
        expectedObjectType: 'jurisdiction-record',
        expectedDomain: 'jurisdiction'
      });
      if (!jurisdiction.ok)
        return safe(
          'InvalidJurisdictionReference',
          'Reference',
          'Policy Jurisdiction reference is invalid.',
          input.correlationId
        );
    }
    if (input.resourceReferenceId !== null && input.resourceType !== '*') {
      const resource = this.deps.relatedReferenceRegistry.resolve({
        referenceId: input.resourceReferenceId,
        expectedObjectType: `${input.resourceType}-record`,
        expectedDomain: input.resourceType
      });
      if (!resource.ok)
        return safe(
          'InvalidResourceReference',
          'Reference',
          'Policy resource reference is invalid.',
          input.correlationId
        );
    }
    return { ok: true, value: null };
  }

  private appendEvaluationTrace(
    governance: CorePolicyServiceGovernanceContext,
    result: CorePolicyEvaluationResult
  ): void {
    const action = result.mayProceed
      ? CORE_EVENT_ACTIONS.reviewed
      : CORE_EVENT_ACTIONS.blocked;
    this.appendTrace({
      operation: 'evaluatePolicy',
      target: result.resourceReferenceId,
      idempotencyKey: governance.correlationId,
      action,
      eventType: 'policy.evaluated',
      governance,
      payload: {
        actorReferenceId: result.actorReferenceId,
        action: result.action,
        resourceType: result.resourceType,
        matchedPolicyReferenceId: result.matchedPolicyReferenceId,
        decision: result.decision,
        reasonCode: result.reasonCode,
        reviewRequired: result.reviewRequired,
        approvalRequired: result.approvalRequired,
        redactionRequired: result.redactionRequired,
        nonDisclosureRequired: result.nonDisclosureRequired,
        conditionDetailsOmitted: true,
        protectedResourceDetailsOmitted: true
      }
    });
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CorePolicyServiceGovernanceContext;
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
      policyReferenceId: input.target,
      occurredAt: this.deps.now(),
      governance: input.governance,
      payload: input.payload
    });
    const appended = this.deps.tracePort.append(record);
    return appended.ok
      ? appended
      : safe(
          'PolicyTraceFailed',
          'Event',
          'Policy Event trace handoff failed.',
          input.governance.correlationId
        );
  }

  private mutate<TRequest>(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey?: string | null;
    readonly request: TRequest;
    readonly governance: CorePolicyServiceGovernanceContext;
    readonly current: CorePolicyServiceRecord;
    readonly next: CorePolicyServiceRecord;
    readonly eventType: string;
    readonly eventAction: CoreEventAction;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CorePolicyServiceRecord> {
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
