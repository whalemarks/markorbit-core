import {
  paginateCoreItems,
  type CoreEventTraceRecord,
  type CorePaginatedResult
} from '../../behaviors/core-event-pagination-behavior.ts';
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

export const CORE_TASK_SERVICE_TYPES = [
  'IntakeTask',
  'ReviewTask',
  'DraftingTask',
  'FilingTask',
  'OfficialResponseTask',
  'CustomerFollowUpTask',
  'AgentFollowUpTask',
  'DocumentTask',
  'EvidenceTask',
  'ApprovalTask',
  'QualityCheckTask',
  'SystemTask',
  'AITask',
  'GeneralTask',
  'Unknown'
] as const;
export type CoreTaskServiceType = (typeof CORE_TASK_SERVICE_TYPES)[number];

export const CORE_TASK_SERVICE_STATUSES = [
  'Draft',
  'Open',
  'Assigned',
  'InProgress',
  'Blocked',
  'Waiting',
  'ReviewRequired',
  'Completed',
  'Cancelled',
  'Reopened',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreTaskServiceStatus = (typeof CORE_TASK_SERVICE_STATUSES)[number];

export const CORE_TASK_SERVICE_PRIORITIES = [
  'Low',
  'Normal',
  'High',
  'Urgent',
  'Critical',
  'Unknown'
] as const;
export type CoreTaskServicePriority =
  (typeof CORE_TASK_SERVICE_PRIORITIES)[number];

export const CORE_TASK_ASSIGNEE_TYPES = [
  'User',
  'Identity',
  'AIAgent',
  'System',
  'ExternalActor',
  'Unassigned',
  'Unknown'
] as const;
export type CoreTaskAssigneeType = (typeof CORE_TASK_ASSIGNEE_TYPES)[number];

export const CORE_TASK_IMPLEMENTED_OPERATIONS = [
  'createTask',
  'getTask',
  'listTasks',
  'updateTask',
  'changeTaskStatus',
  'assignTask',
  'reassignTask',
  'unassignTask',
  'linkTaskMatter',
  'linkTaskWorkflowContract',
  'linkTaskDependency',
  'completeTask',
  'cancelTask',
  'reopenTask',
  'validateTaskReference',
  'archiveTask'
] as const;

export const CORE_TASK_MINIMUM_CAPABILITIES = [
  'create actionable work units',
  'read and list safe task summaries',
  'governed metadata update',
  'controlled task lifecycle',
  'assignment and reassignment without permission grant',
  'matter and workflow-contract reference linkage',
  'reference-only dependency linkage',
  'completion validation',
  'task reference validation',
  'permission check hook',
  'policy check hook',
  'human review preservation',
  'safe error return',
  'event trace handoff',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive',
  'cross-organization non-enumeration',
  'AI-suggested task activation prevention'
] as const;

export const CORE_TASK_COLLECTION_TARGET = 'task:collection';
const CONTRACT_ID = 'core-service-task-service-contract';
const TASK_OBJECT_TYPE = 'task-record';
const TASK_DOMAIN = 'task';
const TASK_OBJECT_CONTRACT_ID = 'core-object-task-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreTaskServiceStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Open: 'active',
  Assigned: 'active',
  InProgress: 'active',
  Blocked: 'inactive',
  Waiting: 'active',
  ReviewRequired: 'active',
  Completed: 'active',
  Cancelled: 'inactive',
  Reopened: 'active',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Open',
  'Open->Assigned',
  'Open->InProgress',
  'Assigned->InProgress',
  'Assigned->Open',
  'InProgress->Blocked',
  'Blocked->InProgress',
  'InProgress->Waiting',
  'Waiting->InProgress',
  'InProgress->ReviewRequired',
  'ReviewRequired->InProgress',
  'InProgress->Completed',
  'Open->Cancelled',
  'Assigned->Cancelled',
  'InProgress->Cancelled',
  'Blocked->Cancelled',
  'Waiting->Cancelled',
  'ReviewRequired->Cancelled',
  'Completed->Reopened',
  'Cancelled->Reopened',
  'Reopened->Open',
  'Completed->Archived',
  'Cancelled->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreTaskGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreTaskAssignment {
  readonly actorReferenceId: string;
  readonly actorType: CoreTaskAssigneeType;
  readonly assignmentType: string;
  readonly assignedAt: string;
}

export interface CoreTaskServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly taskType: CoreTaskServiceType;
  readonly titleReference: string;
  readonly descriptionReference: string | null;
  readonly taskStatus: CoreTaskServiceStatus;
  readonly priority: CoreTaskServicePriority;
  readonly sourceReference: string;
  readonly assignment: CoreTaskAssignment | null;
  readonly matterReferenceId: string | null;
  readonly orderReferenceId: string | null;
  readonly workflowContractReferenceId: string | null;
  readonly dependencyTaskReferenceIds: readonly string[];
  readonly dueReference: string | null;
  readonly completionContextReference: string | null;
  readonly completionReviewRequired: boolean;
}

export interface CoreTaskSafeView {
  readonly [key: string]: unknown;
  readonly taskReferenceId: string;
  readonly taskType: CoreTaskServiceType;
  readonly taskStatus: CoreTaskServiceStatus;
  readonly priority: CoreTaskServicePriority;
  readonly assigned: boolean;
  readonly assignedActorType: CoreTaskAssigneeType | null;
  readonly matterLinked: boolean;
  readonly orderLinked: boolean;
  readonly workflowContractLinked: boolean;
  readonly dependencyCount: number;
  readonly dueContextPresent: boolean;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreTaskReferenceValidationResult {
  readonly isValid: boolean;
  readonly taskReferenceId: string;
  readonly taskType: CoreTaskServiceType | null;
  readonly status: CoreTaskServiceStatus | null;
  readonly assignedActorHint: CoreTaskAssigneeType | null;
  readonly matterReferenceHint: boolean;
  readonly workflowContractReferenceHint: boolean;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Blocked'
    | 'Cancelled'
    | 'Completed'
    | 'Archived'
    | 'ReviewRequired'
    | 'DeletedReferenceOnly';
}

export interface CoreTaskCompletionResult {
  readonly completed: boolean;
  readonly taskReferenceId: string;
  readonly nextStatus: CoreTaskServiceStatus;
  readonly reviewRequired: boolean;
  readonly reasonCode: 'Completed' | 'ReviewRequired';
}

export interface CoreTaskServiceStore {
  get(id: string): CoreTaskServiceRecord | undefined;
  list(): readonly CoreTaskServiceRecord[];
  insert(
    record: CoreTaskServiceRecord
  ): CoreBehaviorResult<CoreTaskServiceRecord>;
  replace(
    record: CoreTaskServiceRecord
  ): CoreBehaviorResult<CoreTaskServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreTaskTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreTaskServiceDependencies {
  readonly store: CoreTaskServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CoreTaskTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    taskReferenceId: string,
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
  record: CoreTaskServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function ensureGovernance(
  context: CoreTaskGovernanceContext,
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
    context.audit.targetObjectType !== TASK_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Task governance context is invalid.',
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
  governance: CoreTaskGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  ) {
    return safe(
      'TaskNotFound',
      'Reference',
      'Task was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreTaskGovernanceContext,
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
  current: CoreTaskServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.taskStatus
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
  readonly taskReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreTaskGovernanceContext;
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
      domainId: TASK_DOMAIN,
      object: {
        id: createCoreObjectId(input.taskReferenceId),
        type: createCoreObjectType(TASK_OBJECT_TYPE),
        domainId: TASK_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function safeView(record: CoreTaskServiceRecord): CoreTaskSafeView {
  return {
    taskReferenceId: record.objectRecord.publicReferenceId,
    taskType: record.taskType,
    taskStatus: record.taskStatus,
    priority: record.priority,
    assigned: Boolean(record.assignment),
    assignedActorType: record.assignment?.actorType ?? null,
    matterLinked: Boolean(record.matterReferenceId),
    orderLinked: Boolean(record.orderReferenceId),
    workflowContractLinked: Boolean(record.workflowContractReferenceId),
    dependencyCount: record.dependencyTaskReferenceIds.length,
    dueContextPresent: Boolean(record.dueReference),
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CoreTaskServiceRecord
): CoreBehaviorResult<CoreTaskServiceRecord> {
  if (!included(CORE_TASK_SERVICE_TYPES, record.taskType))
    return safe('InvalidTaskType', 'Validation', 'Task type is invalid.');
  if (!included(CORE_TASK_SERVICE_STATUSES, record.taskStatus))
    return safe('InvalidTaskStatus', 'State', 'Task status is invalid.');
  if (!included(CORE_TASK_SERVICE_PRIORITIES, record.priority))
    return safe(
      'InvalidTaskPriority',
      'Validation',
      'Task priority is invalid.'
    );
  if (!opaque.test(record.titleReference))
    return safe(
      'TaskTitleRequired',
      'Validation',
      'Task title reference is required.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'TaskSourceReferenceRequired',
      'Validation',
      'Task source reference is required.'
    );
  if (
    record.objectRecord.objectType !== TASK_OBJECT_TYPE ||
    record.objectRecord.domainId !== TASK_DOMAIN ||
    record.objectRecord.objectContractId !== TASK_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.taskStatus]
  ) {
    return safe(
      'TaskObjectMismatch',
      'Validation',
      'Task Object contract is inconsistent.'
    );
  }
  return { ok: true, value: immutable(record) };
}

export class CoreInMemoryTaskServiceStore implements CoreTaskServiceStore {
  readonly #records = new Map<string, CoreTaskServiceRecord>();

  get(id: string): CoreTaskServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  list(): readonly CoreTaskServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CoreTaskServiceRecord
  ): CoreBehaviorResult<CoreTaskServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe('TaskAlreadyExists', 'Conflict', 'Task already exists.');
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CoreTaskServiceRecord
  ): CoreBehaviorResult<CoreTaskServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe('TaskNotFound', 'Reference', 'Task was not found.');
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreTaskService {
  constructor(readonly deps: CoreTaskServiceDependencies) {}

  createTask(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly taskType: unknown;
    readonly titleReference: string;
    readonly descriptionReference?: string | null;
    readonly status?: unknown;
    readonly priority?: unknown;
    readonly sourceReference: string;
    readonly orderReferenceId?: string | null;
    readonly dueReference?: string | null;
    readonly aiSuggested?: boolean;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'task.create',
      permission: 'task:create',
      policyScope: 'task.write',
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
      input.publicReferenceRecord.objectType !== TASK_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== TASK_DOMAIN
    ) {
      return safe(
        'InvalidTaskReference',
        'Reference',
        'Task reference is invalid.',
        input.governance.correlationId
      );
    }
    if (!included(CORE_TASK_SERVICE_TYPES, input.taskType))
      return safe(
        'InvalidTaskType',
        'Validation',
        'Task type is invalid.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_TASK_SERVICE_STATUSES, status) ||
      !['Draft', 'Open'].includes(status)
    ) {
      return safe(
        'InvalidTaskStatus',
        'State',
        'Task creation status is invalid.',
        input.governance.correlationId
      );
    }
    const priority = input.priority ?? 'Normal';
    if (!included(CORE_TASK_SERVICE_PRIORITIES, priority))
      return safe(
        'InvalidTaskPriority',
        'Validation',
        'Task priority is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.titleReference))
      return safe(
        'TaskTitleRequired',
        'Validation',
        'Task title reference is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.sourceReference))
      return safe(
        'TaskSourceReferenceRequired',
        'Validation',
        'Task source reference is required.',
        input.governance.correlationId
      );
    if (input.aiSuggested && status !== 'Draft')
      return safe(
        'TaskHumanReviewRequired',
        'HumanReview',
        'AI-suggested Task must remain Draft until authorized review.',
        input.governance.correlationId
      );
    if (!input.governance.authorizedOrganizationReferenceId)
      return safe(
        'InvalidTaskRecord',
        'Validation',
        'Task organization scope is required.',
        input.governance.correlationId
      );
    if (input.orderReferenceId) {
      const linked = this.resolveRelated(
        input.orderReferenceId,
        'order-record',
        'order',
        input.governance
      );
      if (!linked.ok) return linked;
    }
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createTask'),
        operationName: 'createTask',
        request: {
          target,
          taskType: input.taskType,
          titleReference: input.titleReference,
          descriptionReference: input.descriptionReference ?? null,
          status,
          priority,
          sourceReference: input.sourceReference,
          orderReferenceId: input.orderReferenceId ?? null,
          dueReference: input.dueReference ?? null,
          aiSuggested: input.aiSuggested ?? false
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe('TaskAlreadyExists', 'Conflict', 'Task already exists.');
        const record: CoreTaskServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: statusToObjectStatus[status]
          },
          taskType: input.taskType as CoreTaskServiceType,
          titleReference: input.titleReference,
          descriptionReference: input.descriptionReference ?? null,
          taskStatus: status as CoreTaskServiceStatus,
          priority: priority as CoreTaskServicePriority,
          sourceReference: input.sourceReference,
          assignment: null,
          matterReferenceId: null,
          orderReferenceId: input.orderReferenceId ?? null,
          workflowContractReferenceId: null,
          dependencyTaskReferenceIds: [],
          dueReference: input.dueReference ?? null,
          completionContextReference: null,
          completionReviewRequired: false
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const traced = this.appendTrace({
          operation: 'createTask',
          target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: CORE_EVENT_ACTIONS.created,
          eventType: 'task.created',
          governance: input.governance,
          payload: {
            taskReferenceId: target,
            taskType: record.taskType,
            status: record.taskStatus,
            aiSuggested: input.aiSuggested ?? false
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

  getTask(input: {
    readonly taskReferenceId: string;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'task.get',
      permission: 'task:read',
      policyScope: 'task.read',
      target: input.taskReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.taskReferenceId);
    if (!record)
      return safe(
        'TaskNotFound',
        'Reference',
        'Task was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scoped.ok ? { ok: true, value: safeView(record) } : scoped;
  }

  listTasks(input: {
    readonly governance: CoreTaskGovernanceContext;
    readonly status?: CoreTaskServiceStatus;
    readonly priority?: CoreTaskServicePriority;
    readonly cursor?: string | null;
    readonly limit?: number;
  }): CoreBehaviorResult<CorePaginatedResult<CoreTaskSafeView>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'task.list',
      permission: 'task:read',
      policyScope: 'task.read',
      target: CORE_TASK_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    const items = this.deps.store
      .list()
      .filter(
        (record) =>
          (!input.governance.authorizedOrganizationReferenceId ||
            organizationScopeOf(record) ===
              input.governance.authorizedOrganizationReferenceId) &&
          (!input.status || record.taskStatus === input.status) &&
          (!input.priority || record.priority === input.priority)
      )
      .map(safeView);
    return paginateCoreItems(
      items,
      { cursor: input.cursor ?? undefined, limit: input.limit ?? 20 },
      {
        permissionAllowed: true,
        policyAllowed: true,
        actorReferenceId: input.governance.permission.actorReferenceId,
        allowedSortFields: ['taskReferenceId', 'taskStatus', 'priority'],
        totalCountAllowed: true,
        correlationId: input.governance.correlationId
      },
      {
        queryKey: JSON.stringify({
          status: input.status ?? null,
          priority: input.priority ?? null
        }),
        cursorSecret: 'core-task-service-cursor-v1',
        visible: () => true
      }
    );
  }

  updateTask(input: {
    readonly taskReferenceId: string;
    readonly titleReference?: string;
    readonly descriptionReference?: string | null;
    readonly priority?: unknown;
    readonly dueReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    if (
      input.titleReference !== undefined &&
      !opaque.test(input.titleReference)
    )
      return safe(
        'TaskTitleRequired',
        'Validation',
        'Task title reference is invalid.',
        input.governance.correlationId
      );
    if (
      input.priority !== undefined &&
      !included(CORE_TASK_SERVICE_PRIORITIES, input.priority)
    )
      return safe(
        'InvalidTaskPriority',
        'Validation',
        'Task priority is invalid.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'updateTask',
      governanceOperation: 'task.update',
      permission: 'task:update',
      policyScope: 'task.write',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        titleReference: input.titleReference ?? null,
        descriptionReference: input.descriptionReference ?? null,
        priority: input.priority ?? null,
        dueReference: input.dueReference ?? null
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'task.updated',
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId
        ),
        titleReference: input.titleReference ?? current.titleReference,
        descriptionReference:
          input.descriptionReference === undefined
            ? current.descriptionReference
            : input.descriptionReference,
        priority:
          input.priority === undefined
            ? current.priority
            : (input.priority as CoreTaskServicePriority),
        dueReference:
          input.dueReference === undefined
            ? current.dueReference
            : input.dueReference
      }),
      payload: (next) => ({
        taskReferenceId: input.taskReferenceId,
        status: next.taskStatus,
        priority: next.priority,
        dueContextPresent: Boolean(next.dueReference)
      })
    });
  }

  changeTaskStatus(input: {
    readonly taskReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    if (!included(CORE_TASK_SERVICE_STATUSES, input.nextStatus))
      return safe(
        'InvalidTaskStatus',
        'State',
        'Task status is invalid.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'changeTaskStatus',
      governanceOperation: 'task.status.change',
      permission: 'task:status',
      policyScope: 'task.status',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference ?? null
      },
      action: CORE_EVENT_ACTIONS.statusChanged,
      eventType: 'task.status.changed',
      before: (current) => {
        if (
          !lifecycleTransitions.has(
            `${current.taskStatus}->${input.nextStatus}`
          )
        )
          return safe(
            'InvalidTaskTransition',
            'State',
            'Task status transition is not allowed.',
            input.governance.correlationId
          );
        if (input.nextStatus === 'Assigned' && current.assignment === null)
          return safe(
            'TaskAssignmentRequired',
            'Validation',
            'Assigned status requires an assignee.',
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
          input.nextStatus as CoreTaskServiceStatus
        ),
        taskStatus: input.nextStatus as CoreTaskServiceStatus
      }),
      payload: (next, previous) => ({
        taskReferenceId: input.taskReferenceId,
        previousStatus: previous.taskStatus,
        nextStatus: next.taskStatus,
        reasonReferencePresent: Boolean(input.reasonReference)
      })
    });
  }

  assignTask(input: {
    readonly taskReferenceId: string;
    readonly assignedActorReferenceId: string;
    readonly assignedActorType: unknown;
    readonly assignmentType: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    return this.assign(input, false);
  }

  reassignTask(input: {
    readonly taskReferenceId: string;
    readonly assignedActorReferenceId: string;
    readonly assignedActorType: unknown;
    readonly assignmentType: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    return this.assign(input, true);
  }

  unassignTask(input: {
    readonly taskReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    return this.mutate({
      operationName: 'unassignTask',
      governanceOperation: 'task.unassign',
      permission: 'task:assign',
      policyScope: 'task.assignment',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {},
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'task.unassigned',
      before: (current) =>
        current.assignment
          ? { ok: true, value: null }
          : safe(
              'TaskNotAssigned',
              'State',
              'Task is not assigned.',
              input.governance.correlationId
            ),
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          current.taskStatus === 'Assigned' ? 'Open' : current.taskStatus
        ),
        assignment: null,
        taskStatus:
          current.taskStatus === 'Assigned' ? 'Open' : current.taskStatus
      }),
      payload: (next) => ({
        taskReferenceId: input.taskReferenceId,
        status: next.taskStatus,
        assigned: false
      })
    });
  }

  linkTaskMatter(input: {
    readonly taskReferenceId: string;
    readonly matterReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    return this.linkSingle(
      'linkTaskMatter',
      'task.matter.link',
      'task:link',
      'task.relationship',
      input.taskReferenceId,
      input.matterReferenceId,
      'matter-record',
      'matter',
      input.idempotencyKey,
      input.governance,
      'matterReferenceId',
      'task.matter.linked'
    );
  }

  linkTaskWorkflowContract(input: {
    readonly taskReferenceId: string;
    readonly workflowContractReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    return this.linkSingle(
      'linkTaskWorkflowContract',
      'task.workflow.link',
      'task:link',
      'task.relationship',
      input.taskReferenceId,
      input.workflowContractReferenceId,
      'workflow-contract-record',
      'workflow-contract',
      input.idempotencyKey,
      input.governance,
      'workflowContractReferenceId',
      'task.workflow.contract.linked'
    );
  }

  linkTaskDependency(input: {
    readonly taskReferenceId: string;
    readonly dependencyTaskReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    if (input.taskReferenceId === input.dependencyTaskReferenceId)
      return safe(
        'InvalidTaskDependencyReference',
        'Reference',
        'Task cannot depend on itself.',
        input.governance.correlationId
      );
    const related = this.resolveRelated(
      input.dependencyTaskReferenceId,
      'task-record',
      'task',
      input.governance
    );
    if (!related.ok) return related;
    return this.mutate({
      operationName: 'linkTaskDependency',
      governanceOperation: 'task.dependency.link',
      permission: 'task:link',
      policyScope: 'task.relationship',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        dependencyTaskReferenceId: input.dependencyTaskReferenceId
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'task.dependency.linked',
      before: (current) =>
        current.dependencyTaskReferenceIds.includes(
          input.dependencyTaskReferenceId
        )
          ? safe(
              'TaskRelationshipAlreadyLinked',
              'Conflict',
              'Task dependency is already linked.',
              input.governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId
        ),
        dependencyTaskReferenceIds: [
          ...current.dependencyTaskReferenceIds,
          input.dependencyTaskReferenceId
        ]
      }),
      payload: (next) => ({
        taskReferenceId: input.taskReferenceId,
        dependencyCount: next.dependencyTaskReferenceIds.length
      })
    });
  }

  completeTask(input: {
    readonly taskReferenceId: string;
    readonly completionContextReference: string;
    readonly workflowValidated?: boolean;
    readonly evidenceSatisfied?: boolean;
    readonly reviewRequired?: boolean;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskCompletionResult> {
    if (!opaque.test(input.completionContextReference))
      return safe(
        'TaskCompletionContextRequired',
        'Validation',
        'Task completion context is required.',
        input.governance.correlationId
      );
    if (input.reviewRequired) {
      const moved = this.changeTaskStatus({
        taskReferenceId: input.taskReferenceId,
        nextStatus: 'ReviewRequired',
        reasonReference: input.completionContextReference,
        idempotencyKey: input.idempotencyKey,
        governance: input.governance
      });
      return moved.ok
        ? {
            ok: true,
            value: {
              completed: false,
              taskReferenceId: input.taskReferenceId,
              nextStatus: 'ReviewRequired',
              reviewRequired: true,
              reasonCode: 'ReviewRequired'
            }
          }
        : moved;
    }
    const current = this.deps.store.get(input.taskReferenceId);
    if (!current)
      return safe(
        'TaskNotFound',
        'Reference',
        'Task was not found.',
        input.governance.correlationId
      );
    if (current.workflowContractReferenceId && input.workflowValidated !== true)
      return safe(
        'TaskWorkflowValidationRequired',
        'Workflow',
        'Workflow Contract validation is required.',
        input.governance.correlationId
      );
    if (
      ['DocumentTask', 'EvidenceTask', 'QualityCheckTask'].includes(
        current.taskType
      ) &&
      input.evidenceSatisfied !== true
    )
      return safe(
        'TaskCompletionRequirementsNotMet',
        'Validation',
        'Task completion requirements are not met.',
        input.governance.correlationId
      );
    const changed = this.mutate({
      operationName: 'completeTask',
      governanceOperation: 'task.complete',
      permission: 'task:complete',
      policyScope: 'task.completion',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        completionContextReference: input.completionContextReference,
        workflowValidated: input.workflowValidated ?? false,
        evidenceSatisfied: input.evidenceSatisfied ?? false
      },
      action: CORE_EVENT_ACTIONS.completed,
      eventType: 'task.completed',
      before: (record) =>
        ['InProgress', 'ReviewRequired'].includes(record.taskStatus)
          ? { ok: true, value: null }
          : safe(
              'InvalidTaskTransition',
              'State',
              'Task cannot be completed from its current status.',
              input.governance.correlationId
            ),
      apply: (record, now) => ({
        ...record,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Completed'
        ),
        taskStatus: 'Completed',
        completionContextReference: input.completionContextReference,
        completionReviewRequired: false
      }),
      payload: () => ({
        taskReferenceId: input.taskReferenceId,
        nextStatus: 'Completed',
        completionContextPresent: true
      })
    });
    return changed.ok
      ? {
          ok: true,
          value: {
            completed: true,
            taskReferenceId: input.taskReferenceId,
            nextStatus: 'Completed',
            reviewRequired: false,
            reasonCode: 'Completed'
          }
        }
      : changed;
  }

  cancelTask(input: {
    readonly taskReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'TaskReasonReferenceRequired',
        'Validation',
        'Task cancellation reason is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'cancelTask',
      governanceOperation: 'task.cancel',
      permission: 'task:cancel',
      policyScope: 'task.status',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: { reasonReference: input.reasonReference },
      action: CORE_EVENT_ACTIONS.statusChanged,
      eventType: 'task.cancelled',
      before: (record) =>
        lifecycleTransitions.has(`${record.taskStatus}->Cancelled`)
          ? { ok: true, value: null }
          : safe(
              'InvalidTaskTransition',
              'State',
              'Task cannot be cancelled from its current status.',
              input.governance.correlationId
            ),
      apply: (record, now) => ({
        ...record,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Cancelled'
        ),
        taskStatus: 'Cancelled'
      }),
      payload: (next, previous) => ({
        taskReferenceId: input.taskReferenceId,
        previousStatus: previous.taskStatus,
        nextStatus: next.taskStatus,
        reasonReferencePresent: true
      })
    });
  }

  reopenTask(input: {
    readonly taskReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'TaskReasonReferenceRequired',
        'Validation',
        'Task reopen reason is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'reopenTask',
      governanceOperation: 'task.reopen',
      permission: 'task:status',
      policyScope: 'task.status',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: { reasonReference: input.reasonReference },
      action: CORE_EVENT_ACTIONS.restored,
      eventType: 'task.reopened',
      before: (record) =>
        lifecycleTransitions.has(`${record.taskStatus}->Reopened`)
          ? { ok: true, value: null }
          : safe(
              'InvalidTaskTransition',
              'State',
              'Task cannot be reopened from its current status.',
              input.governance.correlationId
            ),
      apply: (record, now) => ({
        ...record,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Reopened'
        ),
        taskStatus: 'Reopened',
        completionContextReference: null
      }),
      payload: (next, previous) => ({
        taskReferenceId: input.taskReferenceId,
        previousStatus: previous.taskStatus,
        nextStatus: next.taskStatus,
        reasonReferencePresent: true
      })
    });
  }

  validateTaskReference(input: {
    readonly taskReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'task.reference.validate',
      permission: 'task:read',
      policyScope: 'task.reference',
      target: input.taskReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.taskReferenceId);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          taskReferenceId: input.taskReferenceId,
          taskType: null,
          status: null,
          assignedActorHint: null,
          matterReferenceHint: false,
          workflowContractReferenceHint: false,
          reasonCode: 'NotFound'
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
          taskReferenceId: input.taskReferenceId,
          taskType: null,
          status: null,
          assignedActorHint: null,
          matterReferenceHint: false,
          workflowContractReferenceHint: false,
          reasonCode: 'NotFound'
        }
      };
    const reasonCode: CoreTaskReferenceValidationResult['reasonCode'] =
      record.taskStatus === 'Blocked'
        ? 'Blocked'
        : record.taskStatus === 'Cancelled'
          ? 'Cancelled'
          : record.taskStatus === 'Completed'
            ? 'Completed'
            : record.taskStatus === 'Archived'
              ? 'Archived'
              : record.taskStatus === 'ReviewRequired'
                ? 'ReviewRequired'
                : record.taskStatus === 'DeletedReferenceOnly'
                  ? 'DeletedReferenceOnly'
                  : 'Valid';
    return {
      ok: true,
      value: {
        isValid: reasonCode === 'Valid',
        taskReferenceId: input.taskReferenceId,
        taskType: record.taskType,
        status: record.taskStatus,
        assignedActorHint: record.assignment?.actorType ?? null,
        matterReferenceHint: Boolean(record.matterReferenceId),
        workflowContractReferenceHint: Boolean(
          record.workflowContractReferenceId
        ),
        reasonCode
      }
    };
  }

  archiveTask(input: {
    readonly taskReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    return this.mutate({
      operationName: 'archiveTask',
      governanceOperation: 'task.archive',
      permission: 'task:archive',
      policyScope: 'task.status',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {},
      action: CORE_EVENT_ACTIONS.archived,
      eventType: 'task.archived',
      before: (record) =>
        lifecycleTransitions.has(`${record.taskStatus}->Archived`)
          ? { ok: true, value: null }
          : safe(
              'InvalidTaskTransition',
              'State',
              'Task cannot be archived from its current status.',
              input.governance.correlationId
            ),
      apply: (record, now) => ({
        ...record,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Archived'
        ),
        taskStatus: 'Archived'
      }),
      payload: () => ({
        taskReferenceId: input.taskReferenceId,
        nextStatus: 'Archived'
      })
    });
  }

  private assign(
    input: {
      readonly taskReferenceId: string;
      readonly assignedActorReferenceId: string;
      readonly assignedActorType: unknown;
      readonly assignmentType: string;
      readonly idempotencyKey?: string | null;
      readonly governance: CoreTaskGovernanceContext;
    },
    reassign: boolean
  ): CoreBehaviorResult<CoreTaskServiceRecord> {
    if (!included(CORE_TASK_ASSIGNEE_TYPES, input.assignedActorType))
      return safe(
        'InvalidTaskAssigneeType',
        'Validation',
        'Task assignee type is invalid.',
        input.governance.correlationId
      );
    if (
      ['Unassigned', 'Unknown'].includes(input.assignedActorType) ||
      !opaque.test(input.assignedActorReferenceId) ||
      !opaque.test(input.assignmentType)
    )
      return safe(
        'InvalidTaskAssignment',
        'Validation',
        'Task assignment is invalid.',
        input.governance.correlationId
      );
    const expectedDomain: CoreDomainId =
      input.assignedActorType === 'User'
        ? 'user'
        : input.assignedActorType === 'Identity'
          ? 'identity'
          : input.assignedActorType === 'AIAgent'
            ? 'agent'
            : input.assignedActorType === 'System'
              ? 'system'
              : 'identity';
    const expectedType =
      input.assignedActorType === 'User'
        ? 'user-record'
        : input.assignedActorType === 'Identity'
          ? 'identity-record'
          : input.assignedActorType === 'AIAgent'
            ? 'agent-record'
            : input.assignedActorType === 'System'
              ? 'system-record'
              : 'identity-record';
    const related = this.resolveRelated(
      input.assignedActorReferenceId,
      expectedType,
      expectedDomain,
      input.governance
    );
    if (!related.ok) return related;
    return this.mutate({
      operationName: reassign ? 'reassignTask' : 'assignTask',
      governanceOperation: reassign ? 'task.reassign' : 'task.assign',
      permission: 'task:assign',
      policyScope: 'task.assignment',
      taskReferenceId: input.taskReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        assignedActorReferenceId: input.assignedActorReferenceId,
        assignedActorType: input.assignedActorType,
        assignmentType: input.assignmentType
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: reassign ? 'task.reassigned' : 'task.assigned',
      before: (current) => {
        if (reassign && !current.assignment)
          return safe(
            'TaskNotAssigned',
            'State',
            'Task must already be assigned before reassignment.',
            input.governance.correlationId
          );
        if (!reassign && current.assignment)
          return safe(
            'TaskAlreadyAssigned',
            'Conflict',
            'Task is already assigned.',
            input.governance.correlationId
          );
        return ['Open', 'Assigned', 'InProgress'].includes(current.taskStatus)
          ? { ok: true, value: null }
          : safe(
              'InvalidTaskTransition',
              'State',
              'Task cannot be assigned from its current status.',
              input.governance.correlationId
            );
      },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          current.taskStatus === 'Open' ? 'Assigned' : current.taskStatus
        ),
        taskStatus:
          current.taskStatus === 'Open' ? 'Assigned' : current.taskStatus,
        assignment: {
          actorReferenceId: input.assignedActorReferenceId,
          actorType: input.assignedActorType as CoreTaskAssigneeType,
          assignmentType: input.assignmentType,
          assignedAt: now
        }
      }),
      payload: (next) => ({
        taskReferenceId: input.taskReferenceId,
        status: next.taskStatus,
        assignedActorType: next.assignment?.actorType ?? 'Unknown',
        permissionGrantedByAssignment: false
      })
    });
  }

  private linkSingle(
    operationName: string,
    governanceOperation: string,
    permission: string,
    policyScope: string,
    taskReferenceId: string,
    relatedReferenceId: string,
    expectedType: string,
    expectedDomain: CoreDomainId,
    idempotencyKey: string | null | undefined,
    governance: CoreTaskGovernanceContext,
    field: 'matterReferenceId' | 'workflowContractReferenceId',
    eventType: string
  ): CoreBehaviorResult<CoreTaskServiceRecord> {
    const related = this.resolveRelated(
      relatedReferenceId,
      expectedType,
      expectedDomain,
      governance
    );
    if (!related.ok) return related;
    return this.mutate({
      operationName,
      governanceOperation,
      permission,
      policyScope,
      taskReferenceId,
      idempotencyKey,
      governance,
      request: { relatedReferenceId },
      action: CORE_EVENT_ACTIONS.updated,
      eventType,
      before: (current) =>
        current[field]
          ? safe(
              'TaskRelationshipAlreadyLinked',
              'Conflict',
              'Task relationship is already linked.',
              governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          governance.permission.actorReferenceId
        ),
        [field]: relatedReferenceId
      }),
      payload: () => ({
        taskReferenceId,
        relationshipType: field,
        relationshipPresent: true
      })
    });
  }

  private resolveRelated(
    referenceId: string,
    expectedObjectType: string,
    expectedDomain: CoreDomainId,
    governance: CoreTaskGovernanceContext
  ): CoreBehaviorResult<null> {
    const result = this.deps.relatedReferenceRegistry.resolve({
      referenceId,
      expectedObjectType,
      expectedDomain
    });
    return result.ok
      ? { ok: true, value: null }
      : safe(
          'InvalidTaskRelationshipReference',
          'Reference',
          'Related Task reference is invalid.',
          governance.correlationId
        );
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CoreTaskGovernanceContext;
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
        taskReferenceId: input.target,
        occurredAt: this.deps.now(),
        governance: input.governance,
        payload: input.payload
      })
    );
    return trace.ok
      ? trace
      : safe(
          'TaskTraceFailed',
          'Event',
          'Task Event trace handoff failed.',
          input.governance.correlationId
        );
  }

  private mutate(input: {
    readonly operationName: string;
    readonly governanceOperation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly taskReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTaskGovernanceContext;
    readonly request: CoreJsonObject;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly before?: (
      current: CoreTaskServiceRecord
    ) => CoreBehaviorResult<null>;
    readonly apply: (
      current: CoreTaskServiceRecord,
      now: string
    ) => CoreTaskServiceRecord;
    readonly payload: (
      next: CoreTaskServiceRecord,
      previous: CoreTaskServiceRecord
    ) => CoreJsonObject;
  }): CoreBehaviorResult<CoreTaskServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: input.governanceOperation,
      permission: input.permission,
      policyScope: input.policyScope,
      target: input.taskReferenceId
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.taskReferenceId);
    if (!current)
      return safe(
        'TaskNotFound',
        'Reference',
        'Task was not found.',
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
          taskReferenceId: input.taskReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const latest = this.deps.store.get(input.taskReferenceId);
        if (!latest)
          return safe('TaskNotFound', 'Reference', 'Task was not found.');
        const before = immutable(latest);
        const next = input.apply(latest, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const traced = this.appendTrace({
          operation: input.operationName,
          target: input.taskReferenceId,
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
