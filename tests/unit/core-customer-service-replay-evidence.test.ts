import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreCustomerService,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryCustomerServiceStore,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  validateCoreServiceBehaviorEvidence,
  type CoreCustomerGovernanceContext,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CoreReferenceRecord
} from '../../src/index.ts';

const createdAt = '2026-07-13T00:00:00.000Z';
const updatedAt = '2026-07-13T00:05:00.000Z';
const customerReference: CoreReferenceRecord = {
  referenceId: 'customer:ref:core-task-036-replay',
  objectType: createCoreObjectType('customer-record'),
  referenceDomain: 'customer',
  status: 'Active'
};
const objectRecord: CoreMvpObjectBaseRecord = Object.freeze({
  publicReferenceId: customerReference.referenceId,
  objectType: createCoreObjectType('customer-record'),
  domainId: 'customer',
  objectContractId: createCoreContractId(
    'core-object-customer-record-contract'
  ),
  status: 'active',
  version: { version: 1, createdAt },
  metadata: {},
  auditMetadata: {
    createdAt,
    createdByReferenceId: 'user:ref:actor-0001',
    correlationId: 'corr:core-task-036-replay'
  },
  visibility: {
    permissionScopeReferenceId: 'permission:ref:scope-0001',
    policyScopeReferenceId: 'policy:ref:scope-0001',
    organizationScopeReferenceId: 'organization:ref:scope-0001'
  }
});

function governance(
  operation: string,
  permission: string,
  policyScope: string
): CoreCustomerGovernanceContext {
  return {
    correlationId: 'corr:core-task-036-replay',
    auditContextReferenceId: 'audit:ctx:core-task-036-replay',
    authorizedOrganizationReferenceId: 'organization:ref:scope-0001',
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-036-replay'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-036-replay'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'customer-record',
      targetObjectReferenceId: customerReference.referenceId
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'customer-record',
      targetObjectReferenceId: customerReference.referenceId,
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-036-replay'
    }
  };
}

function service(includeCustomerReference = true) {
  const traces = new CoreEventTraceRegistry();
  const clocks = [createdAt, updatedAt];
  const registry = new CoreReferenceRegistry([
    ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
    ...(includeCustomerReference ? [customerReference] : [])
  ]);
  const customerService = new CoreCustomerService({
    store: new CoreInMemoryCustomerServiceStore(),
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    relatedReferenceRegistry: registry,
    now: () => clocks.shift() ?? updatedAt,
    cursorSecret: 'customer-service-replay-secret',
    eventIdFactory: (operation, customerReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-replay-${operation}-${customerReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId
  });
  return { customerService, traces };
}

function createCustomer(customerService: CoreCustomerService) {
  return customerService.createCustomer({
    objectRecord,
    publicReferenceRecord: customerReference,
    customerType: 'Company',
    customerStatus: 'Active',
    nameReference: 'name:synthetic:customer-replay-036',
    sourceReference: 'source:synthetic:customer-replay-036',
    idempotencyKey: 'idem:create:customer-replay-036',
    governance: governance(
      'customer.create',
      'customer:create',
      'customer.write'
    )
  });
}

describe('Customer Service replay and executable evidence closure', () => {
  it('replays status changes before transition validation and rejects changed requests', () => {
    const { customerService, traces } = service();
    assert.equal(createCustomer(customerService).ok, true);
    const request = {
      customerReferenceId: customerReference.referenceId,
      targetStatus: 'Suspended' as const,
      reasonReference: 'reason:synthetic:suspension',
      idempotencyKey: 'idem:status:customer-replay-036',
      governance: governance(
        'customer.change_status',
        'customer:change_status',
        'customer.lifecycle'
      )
    };
    const changed = customerService.changeCustomerStatus(request);
    assert.equal(changed.ok, true);
    assert.equal(traces.visibleTo(['Internal']).length, 2);

    const replayed = customerService.changeCustomerStatus(request);
    assert.equal(replayed.ok, true);
    assert.deepEqual(replayed, changed);
    assert.equal(traces.visibleTo(['Internal']).length, 2);

    const conflict = customerService.changeCustomerStatus({
      ...request,
      targetStatus: 'Active'
    });
    assert.equal(conflict.ok, false);
    if (!conflict.ok) {
      assert.deepEqual(
        [conflict.error.code, conflict.error.category],
        ['IdempotencyConflict', 'Idempotency']
      );
    }
    assert.equal(traces.visibleTo(['Internal']).length, 2);
  });

  it('rejects create when the supplied Customer Reference is not registered', () => {
    const { customerService, traces } = service(false);
    const result = createCustomer(customerService);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(
        [result.error.code, result.error.category],
        ['InvalidCustomerReference', 'Reference']
      );
    }
    assert.equal(traces.visibleTo(['Internal']).length, 0);
  });

  it('invalidates Service evidence when executable fixture expectations drift', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-customer-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as { expected: Record<string, unknown> };
    fixture.expected.eventTraceCountAfterStatusReplay = 999;
    const issues = validateCoreServiceBehaviorEvidence({
      customerFixture: fixture
    });
    assert.equal(
      issues.some((entry) => entry.code === 'core.service.fixture_invalid'),
      true
    );
  });
});
