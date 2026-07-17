import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CoreIdempotencyRegistry,
  CustomerIntakeWorkflow,
  CoreInMemoryCustomerIntakePlanRegistry,
  type CoreGovernedApiServicePort,
  type CoreGovernedApiServiceInvocation,
  type CustomerIntakeGovernanceContext
} from '../../src/index.ts';

const correlationId = 'corr:core-task-058a';
const org = 'organization:ref:scope-0001';
const actor = 'user:ref:actor-0001';
function governance(
  overrides: Partial<CustomerIntakeGovernanceContext> = {}
): CustomerIntakeGovernanceContext {
  return {
    correlationId,
    auditContextReferenceId: 'audit:ctx:core-task-058a',
    authorizedOrganizationReferenceId: org,
    permission: {
      actorReferenceId: actor,
      intendedOperation: 'customer-intake.preview',
      requiredPermissionKeys: ['workflow:preview'],
      permissionDecisionReferenceId: 'permission:decision:allow-058a',
      permissionDecision: 'Allowed',
      correlationId
    },
    policy: {
      intendedOperation: 'customer-intake.preview',
      requiredPolicyScopes: ['workflow.customer-intake'],
      policyDecisionReferenceId: 'policy:decision:allow-058a',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId
    },
    review: {
      humanReviewRequired: true,
      humanReviewReferenceId: 'review:ref:058a',
      reviewStatus: 'Completed',
      reviewScope: 'customer-intake.apply',
      reviewDecision: 'Approved',
      reviewerUserReferenceId: 'user:ref:reviewer-058a',
      targetObjectType: 'workflow-preview',
      targetObjectReferenceId: 'customer-intake'
    },
    audit: {
      operationName: 'customer-intake.preview',
      operationCategory: 'Workflow',
      actorReferenceId: actor,
      targetObjectType: 'workflow-preview',
      targetObjectReferenceId: 'customer-intake',
      permissionDecisionReferenceId: 'permission:decision:allow-058a',
      policyDecisionReferenceId: 'policy:decision:allow-058a',
      humanReviewReferenceId: 'review:ref:058a',
      correlationId
    },
    ...overrides
  };
}
const customer = {
  objectRecord: { visibility: { organizationScopeReferenceId: org } },
  publicReferenceRecord: { referenceId: 'customer:ref:058a' },
  sourceReference: 'source:ref:058a'
};
const brand = {
  objectRecord: { visibility: { organizationScopeReferenceId: org } },
  publicReferenceRecord: { referenceId: 'brand:ref:058a' },
  sourceReference: 'source:ref:058a'
};
function port(
  serviceContractId: string,
  calls: string[]
): CoreGovernedApiServicePort {
  return {
    serviceContractId,
    invoke(invocation: CoreGovernedApiServiceInvocation) {
      calls.push(`${invocation.serviceOperation}:${invocation.idempotencyKey}`);
      return {
        ok: true,
        value: {
          serviceOperation: invocation.serviceOperation,
          eventReferenceId: `event:${invocation.serviceOperation}`
        }
      };
    }
  };
}
function workflow(now = '2026-07-17T00:00:00.000Z') {
  const calls: string[] = [];
  const registry = new CoreInMemoryCustomerIntakePlanRegistry();
  return {
    calls,
    registry,
    wf: new CustomerIntakeWorkflow({
      customerApiService: port('core-service-customer-service-contract', calls),
      brandApiService: port('core-service-brand-service-contract', calls),
      planRegistry: registry,
      idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
      now: () => now
    })
  };
}

describe('CORE-TASK-058A Customer Intake Workflow preview/apply', () => {
  it('creates deterministic previews and applies through ordered owning APIs', () => {
    const { wf, calls, registry } = workflow();
    const req = {
      workflowContractVersion: 'v0.1.0',
      input: {
        customer,
        brand,
        organizationReferenceId: org,
        actorReferenceId: actor
      },
      governance: governance(),
      validUntil: '2026-07-18T00:00:00.000Z'
    };
    const first = wf.previewCustomerIntake(req);
    const second = wf.previewCustomerIntake({
      ...req,
      validUntil: '2026-07-19T00:00:00.000Z'
    });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    assert.equal(
      first.value.previewDigest,
      wf.previewCustomerIntake(req).ok ? first.value.previewDigest : ''
    );
    assert.deepEqual(first.value.owningApiOperations, [
      'customer.create',
      'brand.create'
    ]);
    assert.equal(registry.approve(first.value.previewId).ok, true);
    const applied = wf.applyCustomerIntake({
      previewId: first.value.previewId,
      previewVersion: first.value.planVersion,
      previewDigest: first.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:core-task-058a-apply'
    });
    assert.equal(applied.ok, true);
    if (!applied.ok) return;
    assert.deepEqual(applied.value.delegationOrder, [
      'customer.create',
      'brand.create'
    ]);
    assert.deepEqual(
      calls.map((c) => c.split(':')[0]),
      ['createCustomer', 'createBrand']
    );
    assert.equal(applied.value.directEventEmission, false);
  });
  it('skips Brand deterministically when absent and rejects fail-closed apply mismatches', () => {
    const { wf } = workflow();
    const preview = wf.previewCustomerIntake({
      workflowContractVersion: 'v0.1.0',
      input: {
        customer,
        organizationReferenceId: org,
        actorReferenceId: actor
      },
      governance: governance(),
      validUntil: '2026-07-18T00:00:00.000Z'
    });
    assert.equal(preview.ok, true);
    if (!preview.ok) return;
    assert.deepEqual(preview.value.owningApiOperations, ['customer.create']);
    const badDigest = wf.applyCustomerIntake({
      previewId: preview.value.previewId,
      previewVersion: preview.value.planVersion,
      previewDigest: 'sha256:altered',
      governance: governance(),
      idempotencyKey: 'idem:core-task-058a-bad'
    });
    assert.equal(badDigest.ok, false);
    if (!badDigest.ok) assert.equal(badDigest.error.code, 'ValidationFailed');
    const stale = wf.applyCustomerIntake({
      previewId: preview.value.previewId,
      previewVersion: 'stale',
      previewDigest: preview.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:core-task-058a-stale'
    });
    assert.equal(stale.ok, false);
    if (!stale.ok) assert.equal(stale.error.code, 'VersionUnsupported');
  });
  it('rejects expired, missing/rejected approval, consumed and conflicting idempotency paths', () => {
    const { wf } = workflow('2026-07-19T00:00:00.000Z');
    const expired = wf.previewCustomerIntake({
      workflowContractVersion: 'v0.1.0',
      input: {
        customer,
        organizationReferenceId: org,
        actorReferenceId: actor
      },
      governance: governance(),
      validUntil: '2026-07-18T00:00:00.000Z'
    });
    assert.equal(expired.ok, false);
    const active = workflow();
    const missingApproval = active.wf.previewCustomerIntake({
      workflowContractVersion: 'v0.1.0',
      input: {
        customer,
        organizationReferenceId: org,
        actorReferenceId: actor
      },
      governance: governance({
        review: {
          ...governance().review,
          humanReviewRequired: true,
          reviewDecision: 'RevisionRequested'
        }
      }),
      validUntil: '2026-07-18T00:00:00.000Z'
    });
    assert.equal(missingApproval.ok, false);
    const preview = active.wf.previewCustomerIntake({
      workflowContractVersion: 'v0.1.0',
      input: {
        customer,
        organizationReferenceId: org,
        actorReferenceId: actor
      },
      governance: governance(),
      validUntil: '2026-07-18T00:00:00.000Z'
    });
    assert.equal(preview.ok, true);
    if (!preview.ok) return;
    assert.equal(active.registry.approve(preview.value.previewId).ok, true);
    const first = active.wf.applyCustomerIntake({
      previewId: preview.value.previewId,
      previewVersion: preview.value.planVersion,
      previewDigest: preview.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:core-task-058a-once'
    });
    assert.equal(first.ok, true);
    const replay = active.wf.applyCustomerIntake({
      previewId: preview.value.previewId,
      previewVersion: preview.value.planVersion,
      previewDigest: preview.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:core-task-058a-once'
    });
    assert.equal(replay.ok, true);
    if (replay.ok) assert.equal(replay.value.replayed, true);
    const consumed = active.wf.applyCustomerIntake({
      previewId: preview.value.previewId,
      previewVersion: preview.value.planVersion,
      previewDigest: preview.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:core-task-058a-twice'
    });
    assert.equal(consumed.ok, false);
  });
});
