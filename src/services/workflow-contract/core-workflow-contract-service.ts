import {
  enforceCoreGovernedAction,
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext,
  type CorePolicyContext
} from '../../behaviors/core-governance-behavior.ts';
import { CoreIdempotencyRegistry } from '../../behaviors/core-idempotency-behavior.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreErrorCategory,
  type CoreErrorCode
} from '../../behaviors/core-safe-error.ts';
import type { CoreEventTraceRecord } from '../../behaviors/core-event-pagination-behavior.ts';
import type { CoreReferenceRecord } from '../../behaviors/core-reference-behavior.ts';
import type { CoreDomainId } from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  createCoreEventType,
  type CoreEventAction,
  type CoreEventId
} from '../../events/index.ts';
import {
  createCoreObjectId,
  createCoreObjectType
} from '../../objects/index.ts';
import type {
  CoreJsonObject,
  CoreMvpObjectBaseRecord
} from '../../objects/core-mvp-object-base-record.ts';
import type { CoreObjectStatus } from '../../objects/core-object-status.ts';

export const CORE_WORKFLOW_CONTRACT_SERVICE_TYPES = [
  'MatterWorkflow',
  'OrderWorkflow',
  'TaskWorkflow',
  'DocumentWorkflow',
  'EvidenceWorkflow',
  'CommunicationWorkflow',
  'ReviewWorkflow',
  'ApprovalWorkflow',
  'GeneralWorkflow',
  'Unknown'
] as const;
export type CoreWorkflowContractServiceType =
  (typeof CORE_WORKFLOW_CONTRACT_SERVICE_TYPES)[number];

export const CORE_WORKFLOW_CONTRACT_SERVICE_STATUSES = [
  'Draft',
  'Active',
  'ReviewRequired',
  'Deprecated',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreWorkflowContractServiceStatus =
  (typeof CORE_WORKFLOW_CONTRACT_SERVICE_STATUSES)[number];

export const CORE_WORKFLOW_GUARD_TYPES = [
  'PermissionGuard',
  'PolicyGuard',
  'StateGuard',
  'ReviewGuard',
  'ApprovalGuard',
  'DocumentGuard',
  'EvidenceGuard',
  'EventGuard',
  'TimeGuard',
  'ExternalGuard',
  'Unknown'
] as const;
export type CoreWorkflowGuardType = (typeof CORE_WORKFLOW_GUARD_TYPES)[number];

export const CORE_WORKFLOW_TRANSITION_DECISIONS = [
  'Allowed',
  'Denied',
  'Blocked',
  'ReviewRequired',
  'ApprovalRequired',
  'PermissionRequired',
  'PolicyRequired',
  'InvalidTransition',
  'Unknown'
] as const;
export type CoreWorkflowTransitionDecision =
  (typeof CORE_WORKFLOW_TRANSITION_DECISIONS)[number];

export const CORE_WORKFLOW_APPLICABILITY_RESULTS = [
  'Applicable',
  'NotApplicable',
  'ReviewRequired',
  'Deprecated',
  'Archived',
  'PolicyRestricted',
  'Unknown'
] as const;
export type CoreWorkflowApplicabilityResult =
  (typeof CORE_WORKFLOW_APPLICABILITY_RESULTS)[number];

export const CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS = [
  'createWorkflowContract',
  'getWorkflowContract',
  'updateWorkflowContract',
  'changeWorkflowContractStatus',
  'defineWorkflowState',
  'defineWorkflowTransition',
  'defineWorkflowGuard',
  'validateWorkflowTransition',
  'validateWorkflowApplicability',
  'validateWorkflowContractReference',
  'archiveWorkflowContract'
] as const;

export const CORE_WORKFLOW_CONTRACT_MINIMUM_CAPABILITIES = [
  'create governed execution-structure contracts',
  'read safe workflow contract summaries',
  'governed metadata update',
  'controlled workflow contract lifecycle',
  'state definition management',
  'transition definition management',
  'guard definition management',
  'transition validation without execution',
  'permission, policy, review and approval requirement outputs',
  'workflow applicability validation',
  'workflow contract reference validation',
  'safe error return',
  'event trace handoff',
  'event failure rollback',
  'idempotency handling for mutation',
  'cross-organization non-enumeration',
  'no task or matter execution',
  'no workflow runtime engine'
] as const;

const CONTRACT_ID = 'core-service-workflow-contract-service-contract';
const WORKFLOW_OBJECT_TYPE = 'workflow-contract-record';
const WORKFLOW_DOMAIN = 'workflow-contract';
const WORKFLOW_OBJECT_CONTRACT_ID =
  'core-object-workflow-contract-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const stateName = /^[A-Za-z][A-Za-z0-9_-]{1,63}$/;

const statusToObjectStatus: Record<
  CoreWorkflowContractServiceStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  Active: 'active',
  ReviewRequired: 'active',
  Deprecated: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Active',
  'Draft->ReviewRequired',
  'ReviewRequired->Draft',
  'ReviewRequired->Active',
  'Active->ReviewRequired',
  'Active->Deprecated',
  'ReviewRequired->Deprecated',
  'Deprecated->Active',
  'Deprecated->Archived',
  'Active->Archived',
  'ReviewRequired->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreWorkflowContractGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreWorkflowStateDefinition {
  readonly state: string;
  readonly labelReference: string;
  readonly initial: boolean;
  readonly terminal: boolean;
  readonly metadata?: CoreJsonObject;
}

export interface CoreWorkflowTransitionDefinition {
  readonly fromState: string;
  readonly toState: string;
  readonly guardReferenceIds: readonly string[];
  readonly eventRequirementReference: string | null;
  readonly metadata?: CoreJsonObject;
}

export interface CoreWorkflowGuardDefinition {
  readonly guardReferenceId: string;
  readonly guardType: CoreWorkflowGuardType;
  readonly requirementReferenceIds: readonly string[];
  readonly metadata?: CoreJsonObject;
}

export interface CoreWorkflowContractServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly workflowContractType: CoreWorkflowContractServiceType;
  readonly nameReference: string;
  readonly descriptionReference: string | null;
  readonly workflowStatus: CoreWorkflowContractServiceStatus;
  readonly applicableDomain: CoreDomainId;
  readonly applicableObjectType: string;
  readonly stateDefinitions: readonly CoreWorkflowStateDefinition[];
  readonly transitionDefinitions: readonly CoreWorkflowTransitionDefinition[];
  readonly guardDefinitions: readonly CoreWorkflowGuardDefinition[];
  readonly sourceReference: string;
}

export interface CoreWorkflowContractSafeView {
  readonly [key: string]: unknown;
  readonly workflowContractReferenceId: string;
  readonly workflowContractType: CoreWorkflowContractServiceType;
  readonly workflowStatus: CoreWorkflowContractServiceStatus;
  readonly applicableDomain: CoreDomainId;
  readonly applicableObjectType: string;
  readonly stateCount: number;
  readonly transitionCount: number;
  readonly guardCount: number;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreWorkflowTransitionValidationResult {
  readonly isAllowed: boolean;
  readonly workflowContractReferenceId: string;
  readonly currentState: string;
  readonly requestedState: string;
  readonly decision: CoreWorkflowTransitionDecision;
  readonly reasonCode:
    | 'Allowed'
    | 'UndefinedState'
    | 'UndefinedTransition'
    | 'ContractNotActive'
    | 'GuardBlocked'
    | 'PermissionRequired'
    | 'PolicyRequired'
    | 'ReviewRequired'
    | 'ApprovalRequired';
  readonly permissionRequired: boolean;
  readonly policyRequired: boolean;
  readonly reviewRequired: boolean;
  readonly approvalRequired: boolean;
  readonly eventRequired: boolean;
  readonly blockedByGuardReference: string | null;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreWorkflowApplicabilityValidationResult {
  readonly applicable: boolean;
  readonly workflowContractReferenceId: string;
  readonly result: CoreWorkflowApplicabilityResult;
  readonly targetDomain: CoreDomainId;
  readonly targetObjectType: string;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreWorkflowContractReferenceValidationResult {
  readonly isValid: boolean;
  readonly workflowContractReferenceId: string;
  readonly status: CoreWorkflowContractServiceStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Draft'
    | 'ReviewRequired'
    | 'Deprecated'
    | 'Archived'
    | 'DeletedReferenceOnly';
  readonly applicableDomainHint: CoreDomainId | null;
  readonly applicableObjectTypeHint: string | null;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreWorkflowContractServiceStore {
  get(id: string): CoreWorkflowContractServiceRecord | undefined;
  insert(
    record: CoreWorkflowContractServiceRecord
  ): CoreBehaviorResult<CoreWorkflowContractServiceRecord>;
  replace(
    record: CoreWorkflowContractServiceRecord
  ): CoreBehaviorResult<CoreWorkflowContractServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreWorkflowContractTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreWorkflowContractServiceDependencies {
  readonly store: CoreWorkflowContractServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CoreWorkflowContractTracePort;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    workflowContractReferenceId: string,
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
  record: CoreWorkflowContractServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function ensureGovernance(
  context: CoreWorkflowContractGovernanceContext,
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
    context.audit.targetObjectType !== WORKFLOW_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Workflow Contract governance context is invalid.',
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

function enforceOrganizationScope(
  governance: CoreWorkflowContractGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  ) {
    return safe(
      'WorkflowContractNotFound',
      'Reference',
      'Workflow Contract was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreWorkflowContractGovernanceContext,
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
  current: CoreWorkflowContractServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.workflowStatus
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

function traceRecord(input: {
  readonly id: CoreEventId;
  readonly action: CoreEventAction;
  readonly eventType: string;
  readonly workflowContractReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreWorkflowContractGovernanceContext;
  readonly payload: CoreJsonObject;
}): CoreEventTraceRecord {
  return {
    auditContextReferenceId: input.governance.auditContextReferenceId,
    visibility: 'Internal',
    event: {
      id: input.id,
      type: createCoreEventType(
        input.eventType.replaceAll('.', '-').replaceAll('_', '-')
      ),
      action: input.action,
      domainId: WORKFLOW_DOMAIN,
      object: {
        id: createCoreObjectId(input.workflowContractReferenceId),
        type: createCoreObjectType(WORKFLOW_OBJECT_TYPE),
        domainId: WORKFLOW_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function safeView(
  record: CoreWorkflowContractServiceRecord
): CoreWorkflowContractSafeView {
  return {
    workflowContractReferenceId: record.objectRecord.publicReferenceId,
    workflowContractType: record.workflowContractType,
    workflowStatus: record.workflowStatus,
    applicableDomain: record.applicableDomain,
    applicableObjectType: record.applicableObjectType,
    stateCount: record.stateDefinitions.length,
    transitionCount: record.transitionDefinitions.length,
    guardCount: record.guardDefinitions.length,
    restrictedFieldsOmitted: true
  };
}

function validStateDefinition(value: CoreWorkflowStateDefinition): boolean {
  return (
    stateName.test(value.state) &&
    opaque.test(value.labelReference) &&
    typeof value.initial === 'boolean' &&
    typeof value.terminal === 'boolean'
  );
}

function validateDefinitions(input: {
  readonly states: readonly CoreWorkflowStateDefinition[];
  readonly transitions: readonly CoreWorkflowTransitionDefinition[];
  readonly guards: readonly CoreWorkflowGuardDefinition[];
}): CoreBehaviorResult<null> {
  if (input.states.length === 0)
    return safe(
      'StateDefinitionsRequired',
      'Validation',
      'Workflow state definitions are required.'
    );
  if (input.transitions.length === 0)
    return safe(
      'TransitionDefinitionsRequired',
      'Validation',
      'Workflow transition definitions are required.'
    );
  if (!input.states.every(validStateDefinition))
    return safe(
      'InvalidStateDefinition',
      'Validation',
      'Workflow state definition is invalid.'
    );
  const names = input.states.map((entry) => entry.state);
  if (new Set(names).size !== names.length)
    return safe(
      'InvalidStateDefinition',
      'Conflict',
      'Workflow state definitions must be unique.'
    );
  if (input.states.filter((entry) => entry.initial).length !== 1)
    return safe(
      'InvalidStateDefinition',
      'Validation',
      'Workflow Contract requires exactly one initial state.'
    );
  const stateSet = new Set(names);
  const guardSet = new Set(input.guards.map((entry) => entry.guardReferenceId));
  if (
    input.guards.some(
      (entry) =>
        !opaque.test(entry.guardReferenceId) ||
        !included(CORE_WORKFLOW_GUARD_TYPES, entry.guardType) ||
        !entry.requirementReferenceIds.every((reference) =>
          opaque.test(reference)
        )
    ) ||
    guardSet.size !== input.guards.length
  )
    return safe(
      'InvalidGuardDefinition',
      'Validation',
      'Workflow guard definition is invalid.'
    );
  const transitionKeys = new Set<string>();
  for (const transition of input.transitions) {
    const key = `${transition.fromState}->${transition.toState}`;
    if (
      !stateSet.has(transition.fromState) ||
      !stateSet.has(transition.toState) ||
      transition.fromState === transition.toState ||
      transition.guardReferenceIds.some(
        (reference) => !guardSet.has(reference)
      ) ||
      (transition.eventRequirementReference !== null &&
        !opaque.test(transition.eventRequirementReference)) ||
      transitionKeys.has(key)
    )
      return safe(
        'InvalidTransitionDefinition',
        'Validation',
        'Workflow transition definition is invalid.'
      );
    transitionKeys.add(key);
  }
  return { ok: true, value: null };
}

function validateRecord(
  record: CoreWorkflowContractServiceRecord
): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
  if (
    !included(CORE_WORKFLOW_CONTRACT_SERVICE_TYPES, record.workflowContractType)
  )
    return safe(
      'InvalidWorkflowContractType',
      'Validation',
      'Workflow Contract type is invalid.'
    );
  if (!included(CORE_WORKFLOW_CONTRACT_SERVICE_STATUSES, record.workflowStatus))
    return safe(
      'InvalidWorkflowContractStatus',
      'State',
      'Workflow Contract status is invalid.'
    );
  if (!opaque.test(record.nameReference))
    return safe(
      'WorkflowContractNameRequired',
      'Validation',
      'Workflow Contract name reference is required.'
    );
  if (!record.applicableDomain.trim())
    return safe(
      'ApplicableDomainRequired',
      'Validation',
      'Applicable domain is required.'
    );
  if (!record.applicableObjectType.trim())
    return safe(
      'ApplicableObjectTypeRequired',
      'Validation',
      'Applicable object type is required.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'WorkflowContractSourceReferenceRequired',
      'Validation',
      'Workflow Contract source reference is required.'
    );
  if (
    record.objectRecord.objectType !== WORKFLOW_OBJECT_TYPE ||
    record.objectRecord.domainId !== WORKFLOW_DOMAIN ||
    record.objectRecord.objectContractId !== WORKFLOW_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.workflowStatus]
  )
    return safe(
      'WorkflowContractObjectMismatch',
      'Validation',
      'Workflow Contract Object contract is inconsistent.'
    );
  const definitions = validateDefinitions({
    states: record.stateDefinitions,
    transitions: record.transitionDefinitions,
    guards: record.guardDefinitions
  });
  return definitions.ok ? { ok: true, value: immutable(record) } : definitions;
}

export class CoreInMemoryWorkflowContractServiceStore implements CoreWorkflowContractServiceStore {
  readonly #records = new Map<string, CoreWorkflowContractServiceRecord>();

  get(id: string): CoreWorkflowContractServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  insert(
    record: CoreWorkflowContractServiceRecord
  ): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe(
        'WorkflowContractAlreadyExists',
        'Conflict',
        'Workflow Contract already exists.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CoreWorkflowContractServiceRecord
  ): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe(
        'WorkflowContractNotFound',
        'Reference',
        'Workflow Contract was not found.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreWorkflowContractService {
  constructor(readonly deps: CoreWorkflowContractServiceDependencies) {}

  createWorkflowContract(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly workflowContractType: unknown;
    readonly nameReference: string;
    readonly descriptionReference?: string | null;
    readonly status?: unknown;
    readonly applicableDomain: CoreDomainId;
    readonly applicableObjectType: string;
    readonly stateDefinitions: readonly CoreWorkflowStateDefinition[];
    readonly transitionDefinitions: readonly CoreWorkflowTransitionDefinition[];
    readonly guardDefinitions?: readonly CoreWorkflowGuardDefinition[];
    readonly sourceReference: string;
    readonly aiSuggested?: boolean;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'workflow-contract.create',
      permission: 'workflow-contract:create',
      policyScope: 'workflow-contract.write',
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
      input.publicReferenceRecord.objectType !== WORKFLOW_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== WORKFLOW_DOMAIN
    )
      return safe(
        'InvalidWorkflowContractReference',
        'Reference',
        'Workflow Contract reference is invalid.',
        input.governance.correlationId
      );
    if (
      !included(
        CORE_WORKFLOW_CONTRACT_SERVICE_TYPES,
        input.workflowContractType
      )
    )
      return safe(
        'InvalidWorkflowContractType',
        'Validation',
        'Workflow Contract type is invalid.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_WORKFLOW_CONTRACT_SERVICE_STATUSES, status) ||
      !['Draft', 'Active', 'ReviewRequired'].includes(status)
    )
      return safe(
        'InvalidWorkflowContractStatus',
        'State',
        'Workflow Contract creation status is invalid.',
        input.governance.correlationId
      );
    if (input.aiSuggested && status !== 'Draft')
      return safe(
        'WorkflowContractHumanReviewRequired',
        'HumanReview',
        'AI-suggested Workflow Contract must remain Draft until authorized review.',
        input.governance.correlationId
      );
    const record: CoreWorkflowContractServiceRecord = {
      objectRecord: {
        ...input.objectRecord,
        status:
          statusToObjectStatus[status as CoreWorkflowContractServiceStatus]
      },
      workflowContractType: input.workflowContractType,
      nameReference: input.nameReference,
      descriptionReference: input.descriptionReference ?? null,
      workflowStatus: status as CoreWorkflowContractServiceStatus,
      applicableDomain: input.applicableDomain,
      applicableObjectType: input.applicableObjectType,
      stateDefinitions: input.stateDefinitions,
      transitionDefinitions: input.transitionDefinitions,
      guardDefinitions: input.guardDefinitions ?? [],
      sourceReference: input.sourceReference
    };
    const valid = validateRecord(record);
    if (!valid.ok) return valid;
    return this.mutate({
      operation: 'createWorkflowContract',
      target,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        workflowContractType: input.workflowContractType,
        nameReference: input.nameReference,
        status,
        applicableDomain: input.applicableDomain,
        applicableObjectType: input.applicableObjectType,
        stateDefinitions: input.stateDefinitions,
        transitionDefinitions: input.transitionDefinitions,
        guardDefinitions: input.guardDefinitions ?? [],
        sourceReference: input.sourceReference,
        aiSuggested: input.aiSuggested ?? false
      },
      effect: () => {
        if (this.deps.store.get(target))
          return safe(
            'WorkflowContractAlreadyExists',
            'Conflict',
            'Workflow Contract already exists.'
          );
        return this.deps.store.insert(valid.value);
      },
      rollback: () => this.deps.store.remove(target),
      action: CORE_EVENT_ACTIONS.created,
      eventType: 'workflow-contract.created',
      payload: {
        workflowContractReferenceId: target,
        workflowContractType: valid.value.workflowContractType,
        status: valid.value.workflowStatus
      }
    });
  }

  getWorkflowContract(input: {
    readonly workflowContractReferenceId: string;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'workflow-contract.get',
      permission: 'workflow-contract:read',
      policyScope: 'workflow-contract.read',
      target: input.workflowContractReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.workflowContractReferenceId);
    if (!record)
      return safe(
        'WorkflowContractNotFound',
        'Reference',
        'Workflow Contract was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scoped.ok ? { ok: true, value: safeView(record) } : scoped;
  }

  updateWorkflowContract(input: {
    readonly workflowContractReferenceId: string;
    readonly nameReference?: string;
    readonly descriptionReference?: string | null;
    readonly applicableDomain?: CoreDomainId;
    readonly applicableObjectType?: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    return this.updateRecord({
      target: input.workflowContractReferenceId,
      operation: 'workflow-contract.update',
      permission: 'workflow-contract:update',
      policyScope: 'workflow-contract.write',
      idempotencyOperation: 'updateWorkflowContract',
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nameReference: input.nameReference ?? null,
        descriptionReference: input.descriptionReference ?? null,
        applicableDomain: input.applicableDomain ?? null,
        applicableObjectType: input.applicableObjectType ?? null
      },
      update: (current) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          this.deps.now(),
          input.governance.permission.actorReferenceId
        ),
        nameReference: input.nameReference ?? current.nameReference,
        descriptionReference:
          input.descriptionReference === undefined
            ? current.descriptionReference
            : input.descriptionReference,
        applicableDomain: input.applicableDomain ?? current.applicableDomain,
        applicableObjectType:
          input.applicableObjectType ?? current.applicableObjectType
      }),
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'workflow-contract.updated',
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId
      }
    });
  }

  changeWorkflowContractStatus(input: {
    readonly workflowContractReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    if (!included(CORE_WORKFLOW_CONTRACT_SERVICE_STATUSES, input.nextStatus))
      return safe(
        'InvalidWorkflowContractStatus',
        'State',
        'Workflow Contract status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReference))
      return safe(
        'WorkflowContractReasonReferenceRequired',
        'Validation',
        'Workflow Contract status reason is required.',
        input.governance.correlationId
      );
    return this.updateRecord({
      target: input.workflowContractReferenceId,
      operation: 'workflow-contract.status.change',
      permission: 'workflow-contract:status',
      policyScope: 'workflow-contract.status',
      idempotencyOperation: 'changeWorkflowContractStatus',
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference
      },
      update: (current) => {
        if (
          !lifecycleTransitions.has(
            `${current.workflowStatus}->${input.nextStatus}`
          )
        )
          return safe(
            'InvalidWorkflowContractTransition',
            'State',
            'Workflow Contract lifecycle transition is not allowed.',
            input.governance.correlationId
          );
        return {
          ...current,
          workflowStatus: input.nextStatus as CoreWorkflowContractServiceStatus,
          objectRecord: updatedObject(
            current,
            this.deps.now(),
            input.governance.permission.actorReferenceId,
            input.nextStatus as CoreWorkflowContractServiceStatus
          )
        };
      },
      action: CORE_EVENT_ACTIONS.statusChanged,
      eventType: 'workflow-contract.status-changed',
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId,
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference
      }
    });
  }

  defineWorkflowState(input: {
    readonly workflowContractReferenceId: string;
    readonly stateDefinition: CoreWorkflowStateDefinition;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    return this.defineStructure({
      target: input.workflowContractReferenceId,
      operation: 'workflow-contract.state.define',
      permission: 'workflow-contract:define',
      policyScope: 'workflow-contract.structure',
      idempotencyOperation: 'defineWorkflowState',
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: input.stateDefinition,
      update: (current) => ({
        ...current,
        stateDefinitions: [
          ...current.stateDefinitions.filter(
            (entry) => entry.state !== input.stateDefinition.state
          ),
          input.stateDefinition
        ]
      }),
      eventType: 'workflow-contract.state-defined',
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId,
        state: input.stateDefinition.state
      }
    });
  }

  defineWorkflowTransition(input: {
    readonly workflowContractReferenceId: string;
    readonly transitionDefinition: CoreWorkflowTransitionDefinition;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    return this.defineStructure({
      target: input.workflowContractReferenceId,
      operation: 'workflow-contract.transition.define',
      permission: 'workflow-contract:define',
      policyScope: 'workflow-contract.structure',
      idempotencyOperation: 'defineWorkflowTransition',
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: input.transitionDefinition,
      update: (current) => ({
        ...current,
        transitionDefinitions: [
          ...current.transitionDefinitions.filter(
            (entry) =>
              entry.fromState !== input.transitionDefinition.fromState ||
              entry.toState !== input.transitionDefinition.toState
          ),
          input.transitionDefinition
        ]
      }),
      eventType: 'workflow-contract.transition-defined',
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId,
        fromState: input.transitionDefinition.fromState,
        toState: input.transitionDefinition.toState
      }
    });
  }

  defineWorkflowGuard(input: {
    readonly workflowContractReferenceId: string;
    readonly guardDefinition: CoreWorkflowGuardDefinition;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    return this.defineStructure({
      target: input.workflowContractReferenceId,
      operation: 'workflow-contract.guard.define',
      permission: 'workflow-contract:define',
      policyScope: 'workflow-contract.structure',
      idempotencyOperation: 'defineWorkflowGuard',
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: input.guardDefinition,
      update: (current) => ({
        ...current,
        guardDefinitions: [
          ...current.guardDefinitions.filter(
            (entry) =>
              entry.guardReferenceId !== input.guardDefinition.guardReferenceId
          ),
          input.guardDefinition
        ]
      }),
      eventType: 'workflow-contract.guard-defined',
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId,
        guardReferenceId: input.guardDefinition.guardReferenceId,
        guardType: input.guardDefinition.guardType
      }
    });
  }

  validateWorkflowTransition(input: {
    readonly workflowContractReferenceId: string;
    readonly currentState: string;
    readonly requestedState: string;
    readonly satisfiedGuardReferenceIds?: readonly string[];
    readonly permissionSatisfied?: boolean;
    readonly policySatisfied?: boolean;
    readonly reviewSatisfied?: boolean;
    readonly approvalSatisfied?: boolean;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowTransitionValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'workflow-contract.transition.validate',
      permission: 'workflow-contract:validate',
      policyScope: 'workflow-contract.validate',
      target: input.workflowContractReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.workflowContractReferenceId);
    if (!record)
      return safe(
        'WorkflowContractNotFound',
        'Reference',
        'Workflow Contract was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scoped.ok) return scoped;
    const result = this.transitionDecision(record, input);
    const traced = this.appendTrace({
      operation: 'validateWorkflowTransition',
      target: input.workflowContractReferenceId,
      idempotencyKey: `${input.currentState}-${input.requestedState}-${result.decision}`,
      action: result.isAllowed
        ? CORE_EVENT_ACTIONS.reviewed
        : CORE_EVENT_ACTIONS.blocked,
      eventType: result.isAllowed
        ? 'workflow-contract.transition-validated'
        : 'workflow-contract.transition-blocked',
      governance: input.governance,
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId,
        currentState: input.currentState,
        requestedState: input.requestedState,
        decision: result.decision,
        reasonCode: result.reasonCode
      }
    });
    return traced.ok ? { ok: true, value: result } : traced;
  }

  validateWorkflowApplicability(input: {
    readonly workflowContractReferenceId: string;
    readonly targetDomain: CoreDomainId;
    readonly targetObjectType: string;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowApplicabilityValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'workflow-contract.applicability.validate',
      permission: 'workflow-contract:validate',
      policyScope: 'workflow-contract.validate',
      target: input.workflowContractReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.workflowContractReferenceId);
    if (!record)
      return safe(
        'WorkflowContractNotFound',
        'Reference',
        'Workflow Contract was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scoped.ok) return scoped;
    let result: CoreWorkflowApplicabilityResult;
    if (record.workflowStatus === 'Archived') result = 'Archived';
    else if (record.workflowStatus === 'Deprecated') result = 'Deprecated';
    else if (record.workflowStatus === 'ReviewRequired')
      result = 'ReviewRequired';
    else if (
      record.applicableDomain !== input.targetDomain ||
      record.applicableObjectType !== input.targetObjectType
    )
      result = 'NotApplicable';
    else result = 'Applicable';
    const value: CoreWorkflowApplicabilityValidationResult = {
      applicable: result === 'Applicable',
      workflowContractReferenceId: input.workflowContractReferenceId,
      result,
      targetDomain: input.targetDomain,
      targetObjectType: input.targetObjectType,
      restrictedFieldsOmitted: true
    };
    const traced = this.appendTrace({
      operation: 'validateWorkflowApplicability',
      target: input.workflowContractReferenceId,
      idempotencyKey: `${input.targetDomain}-${input.targetObjectType}`,
      action: CORE_EVENT_ACTIONS.reviewed,
      eventType: 'workflow-contract.applicability-validated',
      governance: input.governance,
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId,
        result
      }
    });
    return traced.ok ? { ok: true, value } : traced;
  }

  validateWorkflowContractReference(input: {
    readonly workflowContractReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'workflow-contract.reference.validate',
      permission: 'workflow-contract:read',
      policyScope: 'workflow-contract.reference',
      target: input.workflowContractReferenceId
    });
    if (!governed.ok) return governed;
    if (!input.requestingDomain.trim() || !opaque.test(input.requestingService))
      return safe(
        'InvalidWorkflowContractRequestingService',
        'Validation',
        'Workflow Contract requesting service is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.workflowContractReferenceId);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          workflowContractReferenceId: input.workflowContractReferenceId,
          status: null,
          reasonCode: 'NotFound',
          applicableDomainHint: null,
          applicableObjectTypeHint: null,
          restrictedFieldsOmitted: true
        }
      };
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scoped.ok) return scoped;
    const reasonCode =
      record.workflowStatus === 'Active' ? 'Valid' : record.workflowStatus;
    const value: CoreWorkflowContractReferenceValidationResult = {
      isValid: reasonCode === 'Valid',
      workflowContractReferenceId: input.workflowContractReferenceId,
      status: record.workflowStatus,
      reasonCode,
      applicableDomainHint: record.applicableDomain,
      applicableObjectTypeHint: record.applicableObjectType,
      restrictedFieldsOmitted: true
    };
    const traced = this.appendTrace({
      operation: 'validateWorkflowContractReference',
      target: input.workflowContractReferenceId,
      idempotencyKey: `${input.requestingDomain}-${input.requestingService}`,
      action: CORE_EVENT_ACTIONS.reviewed,
      eventType: 'workflow-contract.reference-validated',
      governance: input.governance,
      payload: {
        workflowContractReferenceId: input.workflowContractReferenceId,
        isValid: value.isValid,
        reasonCode: value.reasonCode
      }
    });
    return traced.ok ? { ok: true, value } : traced;
  }

  archiveWorkflowContract(input: {
    readonly workflowContractReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    return this.changeWorkflowContractStatus({
      ...input,
      nextStatus: 'Archived'
    });
  }

  private transitionDecision(
    record: CoreWorkflowContractServiceRecord,
    input: {
      readonly currentState: string;
      readonly requestedState: string;
      readonly satisfiedGuardReferenceIds?: readonly string[];
      readonly permissionSatisfied?: boolean;
      readonly policySatisfied?: boolean;
      readonly reviewSatisfied?: boolean;
      readonly approvalSatisfied?: boolean;
    }
  ): CoreWorkflowTransitionValidationResult {
    const base = {
      workflowContractReferenceId: record.objectRecord.publicReferenceId,
      currentState: input.currentState,
      requestedState: input.requestedState,
      eventRequired: false,
      blockedByGuardReference: null,
      restrictedFieldsOmitted: true as const
    };
    if (record.workflowStatus !== 'Active')
      return {
        ...base,
        isAllowed: false,
        decision: 'Blocked',
        reasonCode: 'ContractNotActive',
        permissionRequired: false,
        policyRequired: false,
        reviewRequired: record.workflowStatus === 'ReviewRequired',
        approvalRequired: false
      };
    const states = new Set(record.stateDefinitions.map((entry) => entry.state));
    if (!states.has(input.currentState) || !states.has(input.requestedState))
      return {
        ...base,
        isAllowed: false,
        decision: 'InvalidTransition',
        reasonCode: 'UndefinedState',
        permissionRequired: false,
        policyRequired: false,
        reviewRequired: false,
        approvalRequired: false
      };
    const transition = record.transitionDefinitions.find(
      (entry) =>
        entry.fromState === input.currentState &&
        entry.toState === input.requestedState
    );
    if (!transition)
      return {
        ...base,
        isAllowed: false,
        decision: 'InvalidTransition',
        reasonCode: 'UndefinedTransition',
        permissionRequired: false,
        policyRequired: false,
        reviewRequired: false,
        approvalRequired: false
      };
    const guards = transition.guardReferenceIds
      .map((reference) =>
        record.guardDefinitions.find(
          (entry) => entry.guardReferenceId === reference
        )
      )
      .filter((entry): entry is CoreWorkflowGuardDefinition => Boolean(entry));
    const eventRequired =
      transition.eventRequirementReference !== null ||
      guards.some((guard) => guard.guardType === 'EventGuard');
    const first = (type: CoreWorkflowGuardType) =>
      guards.find((guard) => guard.guardType === type) ?? null;
    const decision = (
      guard: CoreWorkflowGuardDefinition | null,
      satisfied: boolean | undefined,
      outcome: CoreWorkflowTransitionDecision,
      reasonCode: CoreWorkflowTransitionValidationResult['reasonCode']
    ): CoreWorkflowTransitionValidationResult | null =>
      guard && satisfied !== true
        ? {
            ...base,
            eventRequired,
            blockedByGuardReference: guard.guardReferenceId,
            isAllowed: false,
            decision: outcome,
            reasonCode,
            permissionRequired: outcome === 'PermissionRequired',
            policyRequired: outcome === 'PolicyRequired',
            reviewRequired: outcome === 'ReviewRequired',
            approvalRequired: outcome === 'ApprovalRequired'
          }
        : null;
    return (
      decision(
        first('PermissionGuard'),
        input.permissionSatisfied,
        'PermissionRequired',
        'PermissionRequired'
      ) ??
      decision(
        first('PolicyGuard'),
        input.policySatisfied,
        'PolicyRequired',
        'PolicyRequired'
      ) ??
      decision(
        first('ReviewGuard'),
        input.reviewSatisfied,
        'ReviewRequired',
        'ReviewRequired'
      ) ??
      decision(
        first('ApprovalGuard'),
        input.approvalSatisfied,
        'ApprovalRequired',
        'ApprovalRequired'
      ) ??
      (() => {
        const satisfied = new Set(input.satisfiedGuardReferenceIds ?? []);
        const blocked = guards.find(
          (guard) =>
            ![
              'PermissionGuard',
              'PolicyGuard',
              'ReviewGuard',
              'ApprovalGuard',
              'EventGuard'
            ].includes(guard.guardType) &&
            !satisfied.has(guard.guardReferenceId)
        );
        return blocked
          ? {
              ...base,
              eventRequired,
              blockedByGuardReference: blocked.guardReferenceId,
              isAllowed: false,
              decision: 'Blocked' as const,
              reasonCode: 'GuardBlocked' as const,
              permissionRequired: false,
              policyRequired: false,
              reviewRequired: false,
              approvalRequired: false
            }
          : {
              ...base,
              eventRequired,
              isAllowed: true,
              decision: 'Allowed' as const,
              reasonCode: 'Allowed' as const,
              permissionRequired: false,
              policyRequired: false,
              reviewRequired: false,
              approvalRequired: false
            };
      })()
    );
  }

  private defineStructure(input: {
    readonly target: string;
    readonly operation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly idempotencyOperation: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
    readonly request: unknown;
    readonly update: (
      current: CoreWorkflowContractServiceRecord
    ) => CoreWorkflowContractServiceRecord;
    readonly eventType: string;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    return this.updateRecord({
      ...input,
      update: (current) => ({
        ...input.update(current),
        objectRecord: updatedObject(
          current,
          this.deps.now(),
          input.governance.permission.actorReferenceId
        )
      }),
      action: CORE_EVENT_ACTIONS.updated
    });
  }

  private updateRecord(input: {
    readonly target: string;
    readonly operation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly idempotencyOperation: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
    readonly request: unknown;
    readonly update: (
      current: CoreWorkflowContractServiceRecord
    ) =>
      | CoreWorkflowContractServiceRecord
      | CoreBehaviorResult<CoreWorkflowContractServiceRecord>;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CoreWorkflowContractServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: input.operation,
      permission: input.permission,
      policyScope: input.policyScope,
      target: input.target
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.target);
    if (!current)
      return safe(
        'WorkflowContractNotFound',
        'Reference',
        'Workflow Contract was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(current)
    );
    if (!scoped.ok) return scoped;
    return this.mutate({
      operation: input.idempotencyOperation,
      target: input.target,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: input.request,
      effect: () => {
        const updated = input.update(current);
        if ('ok' in updated) {
          if (!updated.ok) return updated;
          const valid = validateRecord(updated.value);
          return valid.ok ? this.deps.store.replace(valid.value) : valid;
        }
        const valid = validateRecord(updated);
        return valid.ok ? this.deps.store.replace(valid.value) : valid;
      },
      rollback: () => this.deps.store.replace(current),
      action: input.action,
      eventType: input.eventType,
      payload: input.payload
    });
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CoreWorkflowContractGovernanceContext;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CoreEventTraceRecord> {
    const now = this.deps.now();
    const id = this.deps.traceEventIdFactory(
      input.operation,
      input.target,
      input.idempotencyKey
    );
    const result = this.deps.tracePort.append(
      traceRecord({
        id,
        action: input.action,
        eventType: input.eventType,
        workflowContractReferenceId: input.target,
        occurredAt: now,
        governance: input.governance,
        payload: input.payload
      })
    );
    return result.ok
      ? result
      : safe(
          'WorkflowContractTraceFailed',
          'Event',
          'Workflow Contract event trace could not be recorded.',
          input.governance.correlationId
        );
  }

  private mutate<T>(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreWorkflowContractGovernanceContext;
    readonly request: unknown;
    readonly effect: () => CoreBehaviorResult<T>;
    readonly rollback: () => CoreBehaviorResult<unknown>;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<T> {
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
        const changed = input.effect();
        if (!changed.ok) return changed;
        const traced = this.appendTrace({
          operation: input.operation,
          target: input.target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: input.action,
          eventType: input.eventType,
          governance: input.governance,
          payload: input.payload
        });
        if (!traced.ok) {
          input.rollback();
          return traced;
        }
        return changed;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }
}
