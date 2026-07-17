import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CoreIdempotencyRegistry,
  CustomerIntakeWorkflow,
  CoreInMemoryCustomerIntakePlanRegistry,
  type CoreBehaviorResult,
  type CoreGovernedApiServiceInvocation,
  type CoreGovernedApiServicePort,
  type CustomerIntakeGovernanceContext,
  type CustomerIntakePreview
} from '../../src/index.ts';

const correlationId = 'corr:core-task-058a';
const org = 'organization:ref:scope-0001';
const actor = 'user:ref:actor-0001';
const now = '2026-07-17T00:00:00.000Z';
const validUntil = '2026-07-18T00:00:00.000Z';
const customerReferenceFromService = 'customer:ref:created-058a';

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
  objectRecord: {
    publicReferenceId: 'customer:ref:preview-058a',
    visibility: { organizationScopeReferenceId: org }
  },
  publicReferenceRecord: { referenceId: 'customer:ref:preview-058a' },
  sourceReference: 'source:ref:customer-058a'
};
const brand = {
  objectRecord: {
    publicReferenceId: 'brand:ref:058a',
    visibility: { organizationScopeReferenceId: org }
  },
  publicReferenceRecord: { referenceId: 'brand:ref:058a' },
  sourceReference: 'source:ref:brand-058a'
};
const taskPlan = {
  objectRecord: {
    publicReferenceId: 'task:ref:058a',
    visibility: { organizationScopeReferenceId: org }
  },
  publicReferenceRecord: { referenceId: 'task:ref:058a' },
  sourceReference: 'source:ref:task-058a'
};

type PortOptions = {
  readonly omitEventReferences?: boolean;
  readonly omitCustomerReference?: boolean;
  readonly failBrand?: boolean;
};

type Harness = {
  readonly wf: CustomerIntakeWorkflow;
  readonly registry: CoreInMemoryCustomerIntakePlanRegistry;
  readonly calls: CoreGovernedApiServiceInvocation[];
};

function servicePort(
  serviceContractId: string,
  calls: CoreGovernedApiServiceInvocation[],
  options: PortOptions = {}
): CoreGovernedApiServicePort {
  return {
    serviceContractId,
    invoke(invocation: CoreGovernedApiServiceInvocation) {
      calls.push(structuredClone(invocation));
      if (options.failBrand && invocation.serviceOperation === 'createBrand')
        return {
          ok: false,
          error: {
            code: 'InvalidBrandReference',
            category: 'Reference',
            message: 'Brand reference is invalid.',
            safeDetail: null,
            correlationId: invocation.correlationId,
            retryable: false
          }
        } satisfies CoreBehaviorResult<unknown>;
      const eventReference = options.omitEventReferences
        ? {}
        : { eventReferenceId: `event:ref:${invocation.serviceOperation}` };
      if (invocation.serviceOperation === 'createCustomer')
        return {
          ok: true,
          value: {
            objectRecord: options.omitCustomerReference
              ? {}
              : { publicReferenceId: customerReferenceFromService },
            ...eventReference
          }
        };
      return {
        ok: true,
        value: {
          acceptedPayload: invocation.payload,
          eventReferences: options.omitEventReferences
            ? undefined
            : [`event:ref:${invocation.serviceOperation}`]
        }
      };
    }
  };
}

function workflow(
  options: PortOptions & {
    readonly taskApi?: boolean;
    readonly now?: string;
  } = {}
): Harness {
  const calls: CoreGovernedApiServiceInvocation[] = [];
  const registry = new CoreInMemoryCustomerIntakePlanRegistry();
  return {
    calls,
    registry,
    wf: new CustomerIntakeWorkflow({
      customerApiService: servicePort(
        'core-service-customer-service-contract',
        calls,
        options
      ),
      brandApiService: servicePort(
        'core-service-brand-service-contract',
        calls,
        options
      ),
      taskApiService: options.taskApi
        ? servicePort('core-service-task-service-contract', calls, options)
        : undefined,
      planRegistry: registry,
      idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
      now: () => options.now ?? now
    })
  };
}

function previewRequest(
  overrides: {
    readonly input?: Record<string, unknown>;
    readonly gov?: CustomerIntakeGovernanceContext;
    readonly until?: string;
  } = {}
) {
  return {
    workflowContractVersion: 'v0.1.0',
    input: {
      customer,
      brand,
      organizationReferenceId: org,
      actorReferenceId: actor,
      ...overrides.input
    },
    governance: overrides.gov ?? governance(),
    validUntil: overrides.until ?? validUntil
  };
}

function previewAndApprove(harness: Harness): CustomerIntakePreview {
  const preview = harness.wf.previewCustomerIntake(previewRequest());
  assert.equal(preview.ok, true);
  assert.ok(preview.ok);
  assert.equal(harness.registry.approve(preview.value.previewId).ok, true);
  return preview.value;
}

function apply(
  harness: Harness,
  preview: CustomerIntakePreview,
  key = 'idem:core-task-058a'
) {
  return harness.wf.applyCustomerIntake({
    previewId: preview.previewId,
    previewVersion: preview.planVersion,
    previewDigest: preview.previewDigest,
    governance: governance(),
    idempotencyKey: key
  });
}

describe('CORE-TASK-058A Customer Intake Workflow preview/apply', () => {
  it('deterministic-preview and changed-canonical-input-changes-digest', () => {
    const { wf } = workflow();
    const req = previewRequest();
    const first = wf.previewCustomerIntake(req);
    const second = wf.previewCustomerIntake(req);
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    assert.equal(first.value.previewId, second.value.previewId);
    assert.equal(first.value.previewDigest, second.value.previewDigest);
    assert.equal(first.value.planVersion, second.value.planVersion);
    assert.deepEqual(
      first.value.orderedExecutionPlan,
      second.value.orderedExecutionPlan
    );
    assert.deepEqual(
      first.value.owningApiOperations,
      second.value.owningApiOperations
    );
    assert.deepEqual(
      first.value.requiredHumanReviewCheckpoints,
      second.value.requiredHumanReviewCheckpoints
    );

    const changedBrand = wf.previewCustomerIntake(
      previewRequest({
        input: {
          brand: { ...brand, sourceReference: 'source:ref:brand-changed' }
        }
      })
    );
    const changedExpiry = wf.previewCustomerIntake(
      previewRequest({ until: '2026-07-19T00:00:00.000Z' })
    );
    const changedGovernance = wf.previewCustomerIntake(
      previewRequest({
        gov: governance({
          policy: {
            ...governance().policy,
            policyDecisionReferenceId: 'policy:decision:changed-058a'
          }
        })
      })
    );
    assert.equal(changedBrand.ok, true);
    assert.equal(changedExpiry.ok, true);
    assert.equal(changedGovernance.ok, true);
    if (changedBrand.ok)
      assert.notEqual(
        changedBrand.value.previewDigest,
        first.value.previewDigest
      );
    if (changedExpiry.ok)
      assert.notEqual(
        changedExpiry.value.previewDigest,
        first.value.previewDigest
      );
    if (changedGovernance.ok)
      assert.notEqual(
        changedGovernance.value.previewDigest,
        first.value.previewDigest
      );
  });

  it('preview-without-brand, preview-with-brand, and Task plan configured/missing-port behavior', () => {
    const withoutBrand = workflow();
    const customerOnly = withoutBrand.wf.previewCustomerIntake(
      previewRequest({ input: { brand: null } })
    );
    assert.equal(customerOnly.ok, true);
    if (customerOnly.ok)
      assert.deepEqual(customerOnly.value.owningApiOperations, [
        'customer.create'
      ]);

    const withBrand = withoutBrand.wf.previewCustomerIntake(previewRequest());
    assert.equal(withBrand.ok, true);
    if (withBrand.ok)
      assert.deepEqual(withBrand.value.owningApiOperations, [
        'customer.create',
        'brand.create'
      ]);

    const noTaskPort = withoutBrand.wf.previewCustomerIntake(
      previewRequest({ input: { taskPlan } })
    );
    assert.equal(noTaskPort.ok, false);
    if (!noTaskPort.ok)
      assert.equal(noTaskPort.error.code, 'DownstreamServiceRequired');

    const withTask = workflow({ taskApi: true });
    const taskPreview = withTask.wf.previewCustomerIntake(
      previewRequest({ input: { taskPlan } })
    );
    assert.equal(taskPreview.ok, true);
    if (taskPreview.ok)
      assert.deepEqual(taskPreview.value.owningApiOperations, [
        'customer.create',
        'brand.create',
        'task.create'
      ]);
  });

  it('Customer-only apply, Customer-and-Brand apply, ordered delegation, reference propagation, task execution, and idempotent replay', () => {
    const customerOnlyHarness = workflow();
    const customerOnlyPreview = customerOnlyHarness.wf.previewCustomerIntake(
      previewRequest({ input: { brand: null } })
    );
    assert.equal(customerOnlyPreview.ok, true);
    if (!customerOnlyPreview.ok) return;
    assert.equal(
      customerOnlyHarness.registry.approve(customerOnlyPreview.value.previewId)
        .ok,
      true
    );
    const customerOnlyApply = apply(
      customerOnlyHarness,
      customerOnlyPreview.value,
      'idem:customer-only'
    );
    assert.equal(customerOnlyApply.ok, true);
    if (customerOnlyApply.ok) {
      assert.deepEqual(customerOnlyApply.value.delegationOrder, [
        'customer.create'
      ]);
      assert.equal(customerOnlyApply.value.brandResult, undefined);
    }

    const harness = workflow({ taskApi: true });
    const preview = harness.wf.previewCustomerIntake(
      previewRequest({ input: { taskPlan } })
    );
    assert.equal(preview.ok, true);
    if (!preview.ok) return;
    assert.equal(harness.registry.approve(preview.value.previewId).ok, true);
    const first = apply(harness, preview.value, 'idem:with-task');
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.deepEqual(first.value.delegationOrder, [
      'customer.create',
      'brand.create',
      'task.create'
    ]);
    assert.deepEqual(
      harness.calls.map((call) => call.serviceOperation),
      ['createCustomer', 'createBrand', 'createTask']
    );
    const brandCall = harness.calls.find(
      (call) => call.serviceOperation === 'createBrand'
    );
    assert.equal(
      brandCall?.payload.customerReferenceId,
      customerReferenceFromService
    );
    assert.deepEqual(first.value.eventTraceReferences, [
      'event:ref:createCustomer',
      'event:ref:createBrand',
      'event:ref:createTask'
    ]);
    const callCount = harness.calls.length;
    const replay = apply(harness, preview.value, 'idem:with-task');
    assert.equal(replay.ok, true);
    if (replay.ok) assert.equal(replay.value.replayed, true);
    assert.equal(harness.calls.length, callCount);
  });

  it('rejects altered digest, stale version, expired plan, missing/rejected approval, consumed preview, governance mismatch, and conflicting idempotency', () => {
    const harness = workflow();
    const preview = previewAndApprove(harness);
    const altered = harness.wf.applyCustomerIntake({
      previewId: preview.previewId,
      previewVersion: preview.planVersion,
      previewDigest: 'sha256:altered',
      governance: governance(),
      idempotencyKey: 'idem:altered'
    });
    assert.equal(altered.ok, false);
    if (!altered.ok) assert.equal(altered.error.code, 'ValidationFailed');

    const stale = harness.wf.applyCustomerIntake({
      previewId: preview.previewId,
      previewVersion: 'stale',
      previewDigest: preview.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:stale'
    });
    assert.equal(stale.ok, false);
    if (!stale.ok) assert.equal(stale.error.code, 'VersionUnsupported');

    const expiredHarness = workflow();
    const expiredPreview = expiredHarness.wf.previewCustomerIntake(
      previewRequest({ until: '2026-07-18T00:00:00.000Z' })
    );
    assert.equal(expiredPreview.ok, true);
    if (expiredPreview.ok) {
      assert.equal(
        expiredHarness.registry.approve(expiredPreview.value.previewId).ok,
        true
      );
      const expiredRecord = expiredHarness.registry.get(
        expiredPreview.value.previewId
      ) as any;
      expiredRecord.validUntil = '2026-07-16T00:00:00.000Z';
      const expired = expiredHarness.wf.applyCustomerIntake({
        previewId: expiredPreview.value.previewId,
        previewVersion: expiredPreview.value.planVersion,
        previewDigest: expiredPreview.value.previewDigest,
        governance: governance(),
        idempotencyKey: 'idem:expired'
      });
      assert.equal(expired.ok, false);
      if (!expired.ok) assert.equal(expired.error.code, 'ValidationFailed');
    }

    const pendingHarness = workflow();
    const pending = pendingHarness.wf.previewCustomerIntake(previewRequest());
    assert.equal(pending.ok, true);
    if (pending.ok) {
      const missingApproval = apply(
        pendingHarness,
        pending.value,
        'idem:missing-approval'
      );
      assert.equal(missingApproval.ok, false);
      if (!missingApproval.ok) {
        assert.equal(missingApproval.error.code, 'HumanReviewRequired');
        assert.match(missingApproval.error.message, /approval is required/);
      }
      assert.equal(
        pendingHarness.registry.reject(pending.value.previewId).ok,
        true
      );
      const rejected = apply(
        pendingHarness,
        pending.value,
        'idem:rejected-approval'
      );
      assert.equal(rejected.ok, false);
      if (!rejected.ok) assert.match(rejected.error.message, /rejected/);
    }

    const success = apply(harness, preview, 'idem:success');
    assert.equal(success.ok, true);
    const consumed = apply(harness, preview, 'idem:consumed-new-key');
    assert.equal(consumed.ok, false);
    if (!consumed.ok) assert.equal(consumed.error.code, 'IdempotencyConflict');

    const mismatch = workflow();
    const mismatchPreview = previewAndApprove(mismatch);
    const orgMismatch = mismatch.wf.applyCustomerIntake({
      previewId: mismatchPreview.previewId,
      previewVersion: mismatchPreview.planVersion,
      previewDigest: mismatchPreview.previewDigest,
      governance: governance({
        authorizedOrganizationReferenceId: 'organization:ref:other'
      }),
      idempotencyKey: 'idem:org-mismatch'
    });
    assert.equal(orgMismatch.ok, false);
    if (!orgMismatch.ok)
      assert.equal(orgMismatch.error.code, 'PolicyRestricted');
    const actorMismatch = mismatch.wf.applyCustomerIntake({
      previewId: mismatchPreview.previewId,
      previewVersion: mismatchPreview.planVersion,
      previewDigest: mismatchPreview.previewDigest,
      governance: governance({
        permission: {
          ...governance().permission,
          actorReferenceId: 'user:ref:other'
        }
      }),
      idempotencyKey: 'idem:actor-mismatch'
    });
    assert.equal(actorMismatch.ok, false);
    if (!actorMismatch.ok)
      assert.equal(actorMismatch.error.code, 'PermissionDenied');
    const policyRejected = mismatch.wf.previewCustomerIntake(
      previewRequest({
        gov: governance({
          policy: { ...governance().policy, policyDecision: 'Restricted' }
        })
      })
    );
    assert.equal(policyRejected.ok, false);
    if (!policyRejected.ok)
      assert.equal(policyRejected.error.code, 'PolicyRestricted');

    const conflictHarness = workflow();
    const conflictPreview = previewAndApprove(conflictHarness);
    const conflictFirst = conflictHarness.wf.applyCustomerIntake({
      previewId: conflictPreview.previewId,
      previewVersion: conflictPreview.planVersion,
      previewDigest: conflictPreview.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:conflict'
    });
    assert.equal(conflictFirst.ok, true);
    const changedPreview = conflictHarness.wf.previewCustomerIntake(
      previewRequest({ input: { brand: null } })
    );
    assert.equal(changedPreview.ok, true);
    if (!changedPreview.ok) return;
    assert.equal(
      conflictHarness.registry.approve(changedPreview.value.previewId).ok,
      true
    );
    const conflictSecond = conflictHarness.wf.applyCustomerIntake({
      previewId: changedPreview.value.previewId,
      previewVersion: changedPreview.value.planVersion,
      previewDigest: changedPreview.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:conflict'
    });
    assert.equal(conflictSecond.ok, false);
    if (!conflictSecond.ok)
      assert.equal(conflictSecond.error.code, 'IdempotencyConflict');
  });

  it('fails closed for Customer/Brand references and conflicting Brand Customer reference', () => {
    const customerRefHarness = workflow({ omitCustomerReference: true });
    const preview = previewAndApprove(customerRefHarness);
    const badCustomerReference = apply(
      customerRefHarness,
      preview,
      'idem:missing-customer-ref'
    );
    assert.equal(badCustomerReference.ok, false);
    if (!badCustomerReference.ok)
      assert.equal(badCustomerReference.error.code, 'InvalidCustomerReference');

    const brandRefHarness = workflow({ failBrand: true });
    const brandPreview = previewAndApprove(brandRefHarness);
    const badBrandReference = apply(
      brandRefHarness,
      brandPreview,
      'idem:brand-ref'
    );
    assert.equal(badBrandReference.ok, false);
    if (!badBrandReference.ok)
      assert.equal(badBrandReference.error.code, 'InvalidBrandReference');

    const conflictHarness = workflow();
    const conflictPreview = conflictHarness.wf.previewCustomerIntake(
      previewRequest({
        input: {
          brand: { ...brand, customerReferenceId: 'customer:ref:conflicting' }
        }
      })
    );
    assert.equal(conflictPreview.ok, true);
    if (!conflictPreview.ok) return;
    assert.equal(
      conflictHarness.registry.approve(conflictPreview.value.previewId).ok,
      true
    );
    const conflict = apply(
      conflictHarness,
      conflictPreview.value,
      'idem:brand-customer-conflict'
    );
    assert.equal(conflict.ok, false);
    if (!conflict.ok)
      assert.equal(conflict.error.code, 'InvalidBrandCustomerReference');
    assert.deepEqual(
      conflictHarness.calls.map((call) => call.serviceOperation),
      ['createCustomer']
    );
  });

  it('surfaces real Event references only, excludes audit context, and remains trace-only with no direct emission', () => {
    const harness = workflow();
    const preview = previewAndApprove(harness);
    const result = apply(harness, preview, 'idem:event-refs');
    assert.equal(result.ok, true);
    if (result.ok)
      assert.deepEqual(result.value.eventTraceReferences, [
        'event:ref:createCustomer',
        'event:ref:createBrand'
      ]);

    const noEventHarness = workflow({ omitEventReferences: true });
    const noEventPreview = previewAndApprove(noEventHarness);
    const noEventResult = apply(
      noEventHarness,
      noEventPreview,
      'idem:no-event-refs'
    );
    assert.equal(noEventResult.ok, true);
    if (noEventResult.ok)
      assert.deepEqual(noEventResult.value.eventTraceReferences, []);

    const source = readFileSync(
      'src/workflows/core-customer-intake-workflow.ts',
      'utf8'
    );
    assert.equal(source.includes('customer.value.auditContext)'), false);
    assert.equal(source.includes('brand.value.auditContext)'), false);
    assert.equal(source.includes('task.value.auditContext)'), false);
    assert.equal(source.includes('createCoreEvent'), false);
    assert.equal(source.includes('emitEvent'), false);
    assert.equal(source.includes('eventEmitter'), false);
    assert.equal(source.includes('new CoreCustomer'), false);
    assert.equal(source.includes('new CoreBrand'), false);
    assert.equal(source.includes('repository'), false);
  });

  it('enforces stored plan/execution invariants and never silently omits planned steps', () => {
    const missingTaskHarness = workflow({ taskApi: true });
    const taskPreview = missingTaskHarness.wf.previewCustomerIntake(
      previewRequest({ input: { taskPlan } })
    );
    assert.equal(taskPreview.ok, true);
    if (!taskPreview.ok) return;
    const stored = missingTaskHarness.registry.get(
      taskPreview.value.previewId
    ) as any;
    stored.orderedExecutionPlan = stored.orderedExecutionPlan.map(
      (step: any) => ({ ...step })
    );
    assert.equal(
      missingTaskHarness.registry.approve(taskPreview.value.previewId).ok,
      true
    );
    const withoutTaskApi = new CustomerIntakeWorkflow({
      customerApiService: servicePort(
        'core-service-customer-service-contract',
        missingTaskHarness.calls
      ),
      brandApiService: servicePort(
        'core-service-brand-service-contract',
        missingTaskHarness.calls
      ),
      planRegistry: missingTaskHarness.registry,
      idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
      now: () => now
    });
    const missingBoundary = withoutTaskApi.applyCustomerIntake({
      previewId: taskPreview.value.previewId,
      previewVersion: taskPreview.value.planVersion,
      previewDigest: taskPreview.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:missing-task-boundary'
    });
    assert.equal(missingBoundary.ok, false);
    if (!missingBoundary.ok)
      assert.equal(missingBoundary.error.code, 'DownstreamServiceRequired');
    assert.equal(missingTaskHarness.calls.length, 0);

    for (const [caseId, mutate] of [
      [
        'unsupported operation',
        (record: any) =>
          (record.orderedExecutionPlan[1].owningApiOperation =
            'trademark.create')
      ],
      [
        'malformed order',
        (record: any) => (record.orderedExecutionPlan[1].order = 3)
      ],
      [
        'duplicate step',
        (record: any) =>
          (record.orderedExecutionPlan[1].owningApiOperation =
            'customer.create')
      ],
      [
        'plan input disagreement',
        (record: any) => record.orderedExecutionPlan.pop()
      ]
    ] as const) {
      const harness = workflow({ taskApi: true });
      const preview = harness.wf.previewCustomerIntake(
        previewRequest({ input: { taskPlan } })
      );
      assert.equal(preview.ok, true, caseId);
      if (!preview.ok) continue;
      const record = harness.registry.get(preview.value.previewId) as any;
      record.orderedExecutionPlan = structuredClone(
        record.orderedExecutionPlan
      );
      mutate(record);
      assert.equal(harness.registry.approve(preview.value.previewId).ok, true);
      const invalid = apply(
        harness,
        preview.value,
        `idem:invalid-plan:${caseId.replaceAll(' ', '-')}`
      );
      assert.equal(invalid.ok, false, caseId);
      if (!invalid.ok)
        assert.equal(invalid.error.code, 'ValidationFailed', caseId);
      assert.equal(harness.calls.length, 0, caseId);
    }
  });
});
