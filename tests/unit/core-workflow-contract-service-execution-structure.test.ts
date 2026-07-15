import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryWorkflowContractServiceStore,
  CoreWorkflowContractService,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CoreWorkflowContractGovernanceContext
} from '../../src/index.ts';

const workflowReferenceId = 'workflow-contract:ref:00015';
const organizationReferenceId = 'organization:ref:scope-0001';
const workflowReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (entry) => entry.referenceId === workflowReferenceId
);
if (!workflowReference)
  throw new Error('Workflow Contract fixture reference is missing.');
const governedWorkflowReference = workflowReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = workflowReferenceId,
  organization = organizationReferenceId
): CoreWorkflowContractGovernanceContext {
  return {
    correlationId: 'corr:core-task-048',
    auditContextReferenceId: 'audit:ctx:core-task-048',
    authorizedOrganizationReferenceId: organization,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-048',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-048'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-048',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-048'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'workflow-contract-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'workflow-contract-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-048',
      policyDecisionReferenceId: 'policy:decision:allow-048',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-048'
    }
  };
}

function objectRecord(
  referenceId = workflowReferenceId,
  organization = organizationReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('workflow-contract-record'),
    domainId: 'workflow-contract',
    objectContractId: createCoreContractId(
      'core-object-workflow-contract-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-16T01:00:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-16T01:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-048'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organization
    }
  };
}

const states = [
  {
    state: 'Draft',
    labelReference: 'workflow:state:draft',
    initial: true,
    terminal: false
  },
  {
    state: 'Ready',
    labelReference: 'workflow:state:ready',
    initial: false,
    terminal: false
  },
  {
    state: 'Completed',
    labelReference: 'workflow:state:completed',
    initial: false,
    terminal: true
  }
] as const;

const guards = [
  {
    guardReferenceId: 'workflow:guard:permission',
    guardType: 'PermissionGuard' as const,
    requirementReferenceIds: ['permission:workflow:advance']
  },
  {
    guardReferenceId: 'workflow:guard:policy',
    guardType: 'PolicyGuard' as const,
    requirementReferenceIds: ['policy:workflow:advance']
  },
  {
    guardReferenceId: 'workflow:guard:review',
    guardType: 'ReviewGuard' as const,
    requirementReferenceIds: ['review:workflow:advance']
  },
  {
    guardReferenceId: 'workflow:guard:approval',
    guardType: 'ApprovalGuard' as const,
    requirementReferenceIds: ['approval:workflow:advance']
  }
] as const;

const transitions = [
  {
    fromState: 'Draft',
    toState: 'Ready',
    guardReferenceIds: [
      'workflow:guard:permission',
      'workflow:guard:policy',
      'workflow:guard:review',
      'workflow:guard:approval'
    ],
    eventRequirementReference: 'event:workflow:ready'
  },
  {
    fromState: 'Ready',
    toState: 'Completed',
    guardReferenceIds: [],
    eventRequirementReference: 'event:workflow:completed'
  }
] as const;

function harness(failAfter = Number.POSITIVE_INFINITY) {
  const store = new CoreInMemoryWorkflowContractServiceStore();
  const traces = new CoreEventTraceRegistry();
  let traceCalls = 0;
  let clock = 0;
  const service = new CoreWorkflowContractService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: {
      append(record) {
        traceCalls += 1;
        return traceCalls > failAfter
          ? {
              ok: false as const,
              error: {
                code: 'WorkflowContractTraceFailed' as const,
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
    now: () => new Date(Date.UTC(2026, 6, 16, 1, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key.replaceAll(':', '-')}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(
  service: CoreWorkflowContractService,
  options: { aiSuggested?: boolean; status?: 'Draft' | 'Active' } = {}
) {
  return service.createWorkflowContract({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedWorkflowReference,
    workflowContractType: 'MatterWorkflow',
    nameReference: 'workflow:name:application',
    descriptionReference: 'workflow:description:application',
    status: options.status ?? 'Active',
    applicableDomain: 'matter',
    applicableObjectType: 'matter-record',
    stateDefinitions: states,
    transitionDefinitions: transitions,
    guardDefinitions: guards,
    sourceReference: 'source:workflow:048',
    aiSuggested: options.aiSuggested ?? false,
    idempotencyKey: options.aiSuggested
      ? 'idem:workflow:create:ai:048'
      : 'idem:workflow:create:048',
    governance: governance(
      'workflow-contract.create',
      'workflow-contract:create',
      'workflow-contract.write'
    )
  });
}

function code(result: { ok: boolean; error?: { code: string } }) {
  return result.ok ? null : result.error?.code;
}

describe('CORE-TASK-048 Workflow Contract Service execution-structure foundation', () => {
  it('creates idempotently, reads safely, updates metadata, and validates applicability/reference', () => {
    const { service, traces } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(create(service).ok, true);
    assert.equal(traces.visibleTo(['Internal']).length, 1);

    const read = service.getWorkflowContract({
      workflowContractReferenceId: workflowReferenceId,
      governance: governance(
        'workflow-contract.get',
        'workflow-contract:read',
        'workflow-contract.read'
      )
    });
    assert.equal(read.ok && read.value.transitionCount, 2);
    assert.equal(read.ok && read.value.restrictedFieldsOmitted, true);

    const updated = service.updateWorkflowContract({
      workflowContractReferenceId: workflowReferenceId,
      nameReference: 'workflow:name:updated',
      idempotencyKey: 'idem:workflow:update:048',
      governance: governance(
        'workflow-contract.update',
        'workflow-contract:update',
        'workflow-contract.write'
      )
    });
    assert.equal(
      updated.ok && updated.value.nameReference,
      'workflow:name:updated'
    );

    const applicability = service.validateWorkflowApplicability({
      workflowContractReferenceId: workflowReferenceId,
      targetDomain: 'matter',
      targetObjectType: 'matter-record',
      governance: governance(
        'workflow-contract.applicability.validate',
        'workflow-contract:validate',
        'workflow-contract.validate'
      )
    });
    assert.equal(applicability.ok && applicability.value.result, 'Applicable');

    const reference = service.validateWorkflowContractReference({
      workflowContractReferenceId: workflowReferenceId,
      requestingDomain: 'task',
      requestingService: 'task-service',
      governance: governance(
        'workflow-contract.reference.validate',
        'workflow-contract:read',
        'workflow-contract.reference'
      )
    });
    assert.equal(reference.ok && reference.value.reasonCode, 'Valid');
  });

  it('returns permission, policy, review and approval requirements before allowing a transition without executing it', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const request = (overrides: {
      permissionSatisfied?: boolean;
      policySatisfied?: boolean;
      reviewSatisfied?: boolean;
      approvalSatisfied?: boolean;
    }) =>
      service.validateWorkflowTransition({
        workflowContractReferenceId: workflowReferenceId,
        currentState: 'Draft',
        requestedState: 'Ready',
        ...overrides,
        governance: governance(
          'workflow-contract.transition.validate',
          'workflow-contract:validate',
          'workflow-contract.validate'
        )
      });

    const permissionRequired = request({});
    assert.equal(
      permissionRequired.ok && permissionRequired.value.decision,
      'PermissionRequired'
    );
    const policyRequired = request({ permissionSatisfied: true });
    assert.equal(
      policyRequired.ok && policyRequired.value.decision,
      'PolicyRequired'
    );
    const reviewRequired = request({
      permissionSatisfied: true,
      policySatisfied: true
    });
    assert.equal(
      reviewRequired.ok && reviewRequired.value.decision,
      'ReviewRequired'
    );
    const approvalRequired = request({
      permissionSatisfied: true,
      policySatisfied: true,
      reviewSatisfied: true
    });
    assert.equal(
      approvalRequired.ok && approvalRequired.value.decision,
      'ApprovalRequired'
    );
    const allowed = request({
      permissionSatisfied: true,
      policySatisfied: true,
      reviewSatisfied: true,
      approvalSatisfied: true
    });
    assert.equal(allowed.ok && allowed.value.decision, 'Allowed');
    assert.equal(allowed.ok && allowed.value.eventRequired, true);

    const read = service.getWorkflowContract({
      workflowContractReferenceId: workflowReferenceId,
      governance: governance(
        'workflow-contract.get',
        'workflow-contract:read',
        'workflow-contract.read'
      )
    });
    assert.equal(read.ok && read.value.workflowStatus, 'Active');
  });

  it('defines governed structure, rejects undefined transitions, and controls lifecycle without runtime orchestration', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);

    const state = service.defineWorkflowState({
      workflowContractReferenceId: workflowReferenceId,
      stateDefinition: {
        state: 'Cancelled',
        labelReference: 'workflow:state:cancelled',
        initial: false,
        terminal: true
      },
      idempotencyKey: 'idem:workflow:state:048',
      governance: governance(
        'workflow-contract.state.define',
        'workflow-contract:define',
        'workflow-contract.structure'
      )
    });
    assert.equal(state.ok && state.value.stateDefinitions.length, 4);

    const transition = service.defineWorkflowTransition({
      workflowContractReferenceId: workflowReferenceId,
      transitionDefinition: {
        fromState: 'Ready',
        toState: 'Cancelled',
        guardReferenceIds: [],
        eventRequirementReference: 'event:workflow:cancelled'
      },
      idempotencyKey: 'idem:workflow:transition:048',
      governance: governance(
        'workflow-contract.transition.define',
        'workflow-contract:define',
        'workflow-contract.structure'
      )
    });
    assert.equal(
      transition.ok && transition.value.transitionDefinitions.length,
      3
    );

    const invalid = service.validateWorkflowTransition({
      workflowContractReferenceId: workflowReferenceId,
      currentState: 'Draft',
      requestedState: 'Missing',
      governance: governance(
        'workflow-contract.transition.validate',
        'workflow-contract:validate',
        'workflow-contract.validate'
      )
    });
    assert.equal(invalid.ok && invalid.value.decision, 'InvalidTransition');

    const deprecated = service.changeWorkflowContractStatus({
      workflowContractReferenceId: workflowReferenceId,
      nextStatus: 'Deprecated',
      reasonReference: 'reason:workflow:deprecated',
      idempotencyKey: 'idem:workflow:deprecated:048',
      governance: governance(
        'workflow-contract.status.change',
        'workflow-contract:status',
        'workflow-contract.status'
      )
    });
    assert.equal(
      deprecated.ok && deprecated.value.workflowStatus,
      'Deprecated'
    );

    const archived = service.archiveWorkflowContract({
      workflowContractReferenceId: workflowReferenceId,
      reasonReference: 'reason:workflow:archived',
      idempotencyKey: 'idem:workflow:archived:048',
      governance: governance(
        'workflow-contract.status.change',
        'workflow-contract:status',
        'workflow-contract.status'
      )
    });
    assert.equal(archived.ok && archived.value.workflowStatus, 'Archived');
  });

  it('keeps AI proposals Draft, hides cross-organization records, requires definitions, and rolls back failed trace', () => {
    const ai = harness();
    const invalidAi = create(ai.service, {
      aiSuggested: true,
      status: 'Active'
    });
    assert.equal(code(invalidAi), 'WorkflowContractHumanReviewRequired');

    const missingStates = harness().service.createWorkflowContract({
      objectRecord: objectRecord(),
      publicReferenceRecord: governedWorkflowReference,
      workflowContractType: 'MatterWorkflow',
      nameReference: 'workflow:name:missing-states',
      status: 'Draft',
      applicableDomain: 'matter',
      applicableObjectType: 'matter-record',
      stateDefinitions: [],
      transitionDefinitions: transitions,
      sourceReference: 'source:workflow:missing-states',
      idempotencyKey: 'idem:workflow:missing-states:048',
      governance: governance(
        'workflow-contract.create',
        'workflow-contract:create',
        'workflow-contract.write'
      )
    });
    assert.equal(code(missingStates), 'StateDefinitionsRequired');

    const scoped = harness();
    assert.equal(create(scoped.service).ok, true);
    const hidden = scoped.service.getWorkflowContract({
      workflowContractReferenceId: workflowReferenceId,
      governance: governance(
        'workflow-contract.get',
        'workflow-contract:read',
        'workflow-contract.read',
        workflowReferenceId,
        'organization:ref:other-048'
      )
    });
    assert.equal(code(hidden), 'WorkflowContractNotFound');

    const failure = harness(0);
    assert.equal(code(create(failure.service)), 'WorkflowContractTraceFailed');
    const readAfterFailure = failure.service.getWorkflowContract({
      workflowContractReferenceId: workflowReferenceId,
      governance: governance(
        'workflow-contract.get',
        'workflow-contract:read',
        'workflow-contract.read'
      )
    });
    assert.equal(code(readAfterFailure), 'WorkflowContractNotFound');
  });
});
