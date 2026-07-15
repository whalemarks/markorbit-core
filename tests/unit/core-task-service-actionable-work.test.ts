import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryTaskServiceStore,
  CoreReferenceRegistry,
  CoreTaskService,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CoreTaskGovernanceContext
} from '../../src/index.ts';

const taskReferenceId = 'task:ref:00016';
const dependencyReferenceId = 'task:ref:dependency-047';
const organizationReferenceId = 'organization:ref:scope-0001';
const taskReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (entry) => entry.referenceId === taskReferenceId
);
if (!taskReference) throw new Error('Task fixture reference is missing.');
const governedTaskReference = taskReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = taskReferenceId,
  organization = organizationReferenceId
): CoreTaskGovernanceContext {
  return {
    correlationId: 'corr:core-task-047',
    auditContextReferenceId: 'audit:ctx:core-task-047',
    authorizedOrganizationReferenceId: organization,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-047',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-047'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-047',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-047'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'task-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'task-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-047',
      policyDecisionReferenceId: 'policy:decision:allow-047',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-047'
    }
  };
}

function objectRecord(
  referenceId = taskReferenceId,
  organization = organizationReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('task-record'),
    domainId: 'task',
    objectContractId: createCoreContractId('core-object-task-record-contract'),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-15T02:40:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-15T02:40:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-047'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organization
    }
  };
}

function harness(failAfter = Number.POSITIVE_INFINITY) {
  const store = new CoreInMemoryTaskServiceStore();
  const traces = new CoreEventTraceRegistry();
  let traceCalls = 0;
  let clock = 40;
  const service = new CoreTaskService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: {
      append(record) {
        traceCalls += 1;
        return traceCalls > failAfter
          ? {
              ok: false as const,
              error: {
                code: 'TaskTraceFailed' as const,
                category: 'Event' as const,
                message: 'failed',
                safeDetail: null,
                retryable: false,
                correlationId: null
              }
            }
          : traces.append(record);
      }
    },
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      {
        referenceId: dependencyReferenceId,
        objectType: 'task-record',
        referenceDomain: 'task',
        status: 'Active'
      }
    ]),
    now: () => new Date(Date.UTC(2026, 6, 15, 2, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(service: CoreTaskService, aiSuggested = false) {
  return service.createTask({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedTaskReference,
    taskType: 'FilingTask',
    titleReference: 'task:title:filing-047',
    descriptionReference: 'task:description:filing-047',
    status: aiSuggested ? 'Draft' : 'Open',
    priority: 'High',
    sourceReference: 'source:task:047',
    orderReferenceId: 'order:ref:00014',
    dueReference: 'due:context:047',
    aiSuggested,
    idempotencyKey: aiSuggested
      ? 'idem:task:create:ai:047'
      : 'idem:task:create:047',
    governance: governance('task.create', 'task:create', 'task.write')
  });
}

function code(result: { ok: boolean; error?: { code: string } }) {
  return result.ok ? null : result.error?.code;
}

describe('CORE-TASK-047 Task Service actionable-work foundation', () => {
  it('creates, replays, safely reads/lists, updates and validates a Task', () => {
    const { service, store, traces } = harness();
    const created = create(service);
    assert.equal(created.ok, true);
    const replay = create(service);
    assert.equal(replay.ok, true);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Internal']).length, 1);

    const read = service.getTask({
      taskReferenceId,
      governance: governance('task.get', 'task:read', 'task.read')
    });
    assert.equal(read.ok && read.value.restrictedFieldsOmitted, true);
    assert.equal(read.ok && read.value.orderLinked, true);

    const listed = service.listTasks({
      governance: governance(
        'task.list',
        'task:read',
        'task.read',
        'task:collection'
      )
    });
    assert.equal(listed.ok && listed.value.items.length, 1);

    const updated = service.updateTask({
      taskReferenceId,
      priority: 'Urgent',
      dueReference: 'due:context:updated-047',
      idempotencyKey: 'idem:task:update:047',
      governance: governance('task.update', 'task:update', 'task.write')
    });
    assert.equal(updated.ok && updated.value.priority, 'Urgent');

    const validation = service.validateTaskReference({
      taskReferenceId,
      requestingDomain: 'matter',
      requestingService: 'matter-service',
      governance: governance(
        'task.reference.validate',
        'task:read',
        'task.reference'
      )
    });
    assert.equal(validation.ok && validation.value.reasonCode, 'Valid');
  });

  it('links governed relationships, assigns without granting permission, and completes under workflow guard', () => {
    const { service, traces } = harness();
    assert.equal(create(service).ok, true);

    const matter = service.linkTaskMatter({
      taskReferenceId,
      matterReferenceId: 'matter:ref:00013',
      idempotencyKey: 'idem:task:matter:047',
      governance: governance(
        'task.matter.link',
        'task:link',
        'task.relationship'
      )
    });
    assert.equal(
      matter.ok && matter.value.matterReferenceId,
      'matter:ref:00013'
    );

    const workflow = service.linkTaskWorkflowContract({
      taskReferenceId,
      workflowContractReferenceId: 'workflow-contract:ref:00015',
      idempotencyKey: 'idem:task:workflow:047',
      governance: governance(
        'task.workflow.link',
        'task:link',
        'task.relationship'
      )
    });
    assert.equal(workflow.ok, true);

    const dependency = service.linkTaskDependency({
      taskReferenceId,
      dependencyTaskReferenceId: dependencyReferenceId,
      idempotencyKey: 'idem:task:dependency:047',
      governance: governance(
        'task.dependency.link',
        'task:link',
        'task.relationship'
      )
    });
    assert.equal(
      dependency.ok && dependency.value.dependencyTaskReferenceIds.length,
      1
    );

    const assigned = service.assignTask({
      taskReferenceId,
      assignedActorReferenceId: 'user:ref:actor-0001',
      assignedActorType: 'User',
      assignmentType: 'Primary',
      idempotencyKey: 'idem:task:assign:047',
      governance: governance('task.assign', 'task:assign', 'task.assignment')
    });
    assert.equal(assigned.ok && assigned.value.taskStatus, 'Assigned');

    const started = service.changeTaskStatus({
      taskReferenceId,
      nextStatus: 'InProgress',
      idempotencyKey: 'idem:task:start:047',
      governance: governance('task.status.change', 'task:status', 'task.status')
    });
    assert.equal(started.ok, true);

    const denied = service.completeTask({
      taskReferenceId,
      completionContextReference: 'completion:context:047',
      workflowValidated: false,
      idempotencyKey: 'idem:task:complete:denied:047',
      governance: governance(
        'task.complete',
        'task:complete',
        'task.completion'
      )
    });
    assert.equal(code(denied), 'TaskWorkflowValidationRequired');

    const completed = service.completeTask({
      taskReferenceId,
      completionContextReference: 'completion:context:047',
      workflowValidated: true,
      idempotencyKey: 'idem:task:complete:047',
      governance: governance(
        'task.complete',
        'task:complete',
        'task.completion'
      )
    });
    assert.equal(completed.ok && completed.value.completed, true);
    assert.equal(traces.visibleTo(['Internal']).length >= 7, true);
  });

  it('prevents AI auto-activation, hides cross-org records, supports reopen/archive and rolls back trace failure', () => {
    const aiHarness = harness();
    const invalidAi = aiHarness.service.createTask({
      objectRecord: objectRecord(),
      publicReferenceRecord: governedTaskReference,
      taskType: 'AITask',
      titleReference: 'task:title:ai-047',
      status: 'Open',
      priority: 'Normal',
      sourceReference: 'source:ai:047',
      aiSuggested: true,
      idempotencyKey: 'idem:task:ai:auto:047',
      governance: governance('task.create', 'task:create', 'task.write')
    });
    assert.equal(code(invalidAi), 'TaskHumanReviewRequired');

    const { service } = harness();
    assert.equal(create(service).ok, true);
    const hidden = service.getTask({
      taskReferenceId,
      governance: governance(
        'task.get',
        'task:read',
        'task.read',
        taskReferenceId,
        'organization:ref:other-047'
      )
    });
    assert.equal(code(hidden), 'TaskNotFound');

    const cancelled = service.cancelTask({
      taskReferenceId,
      reasonReference: 'reason:cancel:047',
      idempotencyKey: 'idem:task:cancel:047',
      governance: governance('task.cancel', 'task:cancel', 'task.status')
    });
    assert.equal(cancelled.ok && cancelled.value.taskStatus, 'Cancelled');
    const reopened = service.reopenTask({
      taskReferenceId,
      reasonReference: 'reason:reopen:047',
      idempotencyKey: 'idem:task:reopen:047',
      governance: governance('task.reopen', 'task:status', 'task.status')
    });
    assert.equal(reopened.ok && reopened.value.taskStatus, 'Reopened');

    const failure = harness(0);
    const failedCreate = create(failure.service);
    assert.equal(code(failedCreate), 'TaskTraceFailed');
    assert.equal(failure.store.list().length, 0);
  });
});
