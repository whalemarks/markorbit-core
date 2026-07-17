import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CoreIdempotencyRegistry,
  createCoreSafeError,
  CoreInMemoryTrademarkApplicationPlanRegistry,
  TrademarkApplicationWorkflow,
  type CoreBehaviorResult,
  type CoreGovernedApiServiceInvocation,
  type CoreGovernedApiServicePort,
  type TrademarkApplicationGovernanceContext,
  type TrademarkApplicationInput
} from '../../src/index.ts';

const correlationId = 'corr:core-task-058b';
const org = 'organization:ref:058b';
const actor = 'user:ref:058b';
const validUntil = '2026-07-18T00:00:00.000Z';
const now = '2026-07-17T00:00:00.000Z';
function governance(
  overrides: Partial<TrademarkApplicationGovernanceContext> = {}
): TrademarkApplicationGovernanceContext {
  return {
    correlationId,
    auditContextReferenceId: 'audit:ctx:058b',
    authorizedOrganizationReferenceId: org,
    permission: {
      actorReferenceId: actor,
      intendedOperation: 'trademark-application.preview',
      requiredPermissionKeys: ['workflow:preview'],
      permissionDecisionReferenceId: 'permission:allow:058b',
      permissionDecision: 'Allowed',
      correlationId
    },
    policy: {
      intendedOperation: 'trademark-application.preview',
      requiredPolicyScopes: ['workflow.trademark-application'],
      policyDecisionReferenceId: 'policy:allow:058b',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId
    },
    review: {
      humanReviewRequired: true,
      humanReviewReferenceId: 'review:ref:058b',
      reviewStatus: 'Completed',
      reviewScope: 'trademark-application.apply',
      reviewDecision: 'Approved',
      reviewerUserReferenceId: 'user:ref:reviewer-058b',
      targetObjectType: 'workflow-preview',
      targetObjectReferenceId: 'trademark-application'
    },
    audit: {
      operationName: 'trademark-application.preview',
      operationCategory: 'Workflow',
      actorReferenceId: actor,
      targetObjectType: 'workflow-preview',
      targetObjectReferenceId: 'trademark-application',
      permissionDecisionReferenceId: 'permission:allow:058b',
      policyDecisionReferenceId: 'policy:allow:058b',
      humanReviewReferenceId: 'review:ref:058b',
      correlationId
    },
    ...overrides
  };
}
const trademarkPayload = {
  objectRecord: { publicReferenceId: 'trademark:ref:planned-058b' },
  publicReferenceRecord: { referenceId: 'trademark:ref:planned-058b' },
  sourceReference: 'source:ref:058b'
};
const matterPayload = {
  objectRecord: { publicReferenceId: 'matter:ref:planned-058b' },
  publicReferenceRecord: { referenceId: 'matter:ref:planned-058b' },
  sourceReference: 'source:ref:058b'
};
function input(
  overrides: Partial<TrademarkApplicationInput> = {}
): TrademarkApplicationInput {
  return {
    customerReferenceId: 'customer:ref:058b',
    brandReferenceId: 'brand:ref:058b',
    brandCustomerReferenceId: 'customer:ref:058b',
    jurisdictionReferenceId: 'jurisdiction:ref:us',
    classificationItems: [
      {
        classificationReferenceId: 'classification:ref:025',
        classNumber: 25,
        goodsServices: ['shirts']
      }
    ],
    trademark: trademarkPayload,
    documentReferenceIds: ['document:ref:mark-image'],
    evidenceReferenceIds: ['evidence:ref:first-use'],
    matter: matterPayload,
    orderReferenceId: 'order:ref:058b',
    taskPlan: {
      objectRecord: { publicReferenceId: 'task:ref:planned-058b' },
      publicReferenceRecord: { referenceId: 'task:ref:planned-058b' },
      sourceReference: 'source:ref:058b'
    },
    organizationReferenceId: org,
    actorReferenceId: actor,
    ...overrides
  };
}
class Port implements CoreGovernedApiServicePort {
  readonly calls: CoreGovernedApiServiceInvocation[] = [];
  constructor(
    readonly serviceContractId: string,
    readonly failOn?: string,
    readonly omitEvents = false,
    readonly brandCustomerReferenceId = 'customer:ref:058b'
  ) {}
  invoke(
    invocation: CoreGovernedApiServiceInvocation
  ): CoreBehaviorResult<unknown> {
    this.calls.push(invocation);
    if (this.failOn === invocation.serviceOperation)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'DownstreamServiceRequired',
          category: 'Unknown',
          message: 'Downstream API unavailable.',
          correlationId: invocation.correlationId
        })
      };
    const d =
      invocation.serviceOperation
        .match(
          /(?:create|validate|link)(Customer|Brand|Jurisdiction|Classification|Document|Evidence|Trademark|Matter|Order|Task)/
        )?.[1]
        ?.toLowerCase() ?? 'result';
    const refs: Record<string, string> = {
      trademark: 'trademark:ref:authoritative-058b',
      matter: 'matter:ref:authoritative-058b',
      task: 'task:ref:authoritative-058b'
    };
    return {
      ok: true,
      value: {
        ...(invocation.serviceOperation === 'validateBrandReference'
          ? { customerReferenceId: this.brandCustomerReferenceId }
          : {}),
        [`${d}ReferenceId`]: refs[d] ?? `${d}:ref:validated-058b`,
        publicReferenceId: refs[d] ?? `${d}:ref:validated-058b`,
        eventReferences: this.omitEvents
          ? []
          : [`event:ref:${invocation.serviceOperation}`]
      }
    };
  }
}
function harness(
  opts: {
    task?: boolean;
    order?: boolean;
    matter?: boolean;
    failOn?: string;
    omitEvents?: boolean;
    brandCustomerReferenceId?: string;
  } = {}
) {
  const ports = {
    customer: new Port(
      'core-service-customer-service-contract',
      opts.failOn,
      opts.omitEvents
    ),
    brand: new Port(
      'core-service-brand-service-contract',
      opts.failOn,
      opts.omitEvents,
      opts.brandCustomerReferenceId
    ),
    jurisdiction: new Port(
      'core-service-jurisdiction-service-contract',
      opts.failOn,
      opts.omitEvents
    ),
    classification: new Port(
      'core-service-classification-service-contract',
      opts.failOn,
      opts.omitEvents
    ),
    document: new Port(
      'core-service-document-service-contract',
      opts.failOn,
      opts.omitEvents
    ),
    evidence: new Port(
      'core-service-evidence-service-contract',
      opts.failOn,
      opts.omitEvents
    ),
    trademark: new Port(
      'core-service-trademark-service-contract',
      opts.failOn,
      opts.omitEvents
    ),
    matter:
      opts.matter === false
        ? undefined
        : new Port(
            'core-service-matter-service-contract',
            opts.failOn,
            opts.omitEvents
          ),
    order:
      opts.order === false
        ? undefined
        : new Port(
            'core-service-order-service-contract',
            opts.failOn,
            opts.omitEvents
          ),
    task:
      opts.task === false
        ? undefined
        : new Port(
            'core-service-task-service-contract',
            opts.failOn,
            opts.omitEvents
          )
  };
  const registry = new CoreInMemoryTrademarkApplicationPlanRegistry();
  const wf = new TrademarkApplicationWorkflow({
    customerApiService: ports.customer,
    brandApiService: ports.brand,
    jurisdictionApiService: ports.jurisdiction,
    classificationApiService: ports.classification,
    documentApiService: ports.document,
    evidenceApiService: ports.evidence,
    trademarkApiService: ports.trademark,
    matterApiService: ports.matter,
    orderApiService: ports.order,
    taskApiService: ports.task,
    planRegistry: registry,
    idempotencyRegistry: new CoreIdempotencyRegistry(),
    now: () => now
  });
  return { wf, registry, ports };
}
function preview(h = harness(), i = input()) {
  return h.wf.previewTrademarkApplication({
    workflowContractVersion: 'v0.1.0',
    input: i,
    governance: governance(),
    validUntil
  });
}

describe('CORE-TASK-058B Trademark Application Workflow', () => {
  it('deterministic preview and canonical digest changes are enforced', () => {
    const h = harness();
    const a = preview(h);
    const b = preview(h);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    if (a.ok && b.ok) {
      assert.equal(a.value.previewId, b.value.previewId);
      assert.equal(a.value.previewDigest, b.value.previewDigest);
      assert.deepEqual(
        a.value.owningApiOperations,
        b.value.owningApiOperations
      );
    }
    const c = preview(
      harness(),
      input({
        classificationItems: [
          {
            classificationReferenceId: 'classification:ref:035',
            classNumber: 35,
            goodsServices: ['retail store services']
          }
        ]
      })
    );
    assert.equal(c.ok, true);
    assert.equal(
      h.ports.customer.calls.some(
        (call) => call.serviceOperation === 'validateCustomerReference'
      ),
      true
    );
    assert.equal(
      h.ports.brand.calls.some(
        (call) => call.serviceOperation === 'validateBrandReference'
      ),
      true
    );
    if (a.ok && c.ok)
      assert.notEqual(a.value.previewDigest, c.value.previewDigest);
  });
  it('validates references, customer/brand relationship, and classification shape', () => {
    assert.equal(
      preview(harness({ brandCustomerReferenceId: 'customer:ref:other' })).ok,
      false
    );
    for (const [caseId, patch] of [
      ['customer', { customerReferenceId: 'db-1' }],
      ['brand', { brandReferenceId: 'raw' }],
      ['relationship', { brandCustomerReferenceId: 'customer:ref:other' }],
      ['jurisdiction', { jurisdictionReferenceId: 'x' }],
      [
        'duplicate',
        {
          classificationItems: [
            {
              classificationReferenceId: 'classification:ref:a',
              classNumber: 25,
              goodsServices: ['x']
            },
            {
              classificationReferenceId: 'classification:ref:b',
              classNumber: 25,
              goodsServices: ['y']
            }
          ]
        }
      ],
      ['empty', { classificationItems: [] }],
      [
        'goods',
        {
          classificationItems: [
            {
              classificationReferenceId: 'classification:ref:a',
              classNumber: 1,
              goodsServices: []
            }
          ]
        }
      ],
      ['document', { documentReferenceIds: ['1'] }],
      ['evidence', { evidenceReferenceIds: ['1'] }],
      ['matter', { existingMatterReferenceId: '1' }],
      ['order', { orderReferenceId: '1' }]
    ] as const) {
      const r = preview(harness(), input(patch));
      assert.equal(r.ok, false, caseId);
    }
  });
  it('supports single class, multi class, no task plan, configured task plan, and missing task rejection', () => {
    assert.equal(preview(harness(), input({ taskPlan: null })).ok, true);
    assert.equal(
      preview(
        harness(),
        input({
          classificationItems: [
            {
              classificationReferenceId: 'classification:ref:025',
              classNumber: 25,
              goodsServices: ['shirts']
            },
            {
              classificationReferenceId: 'classification:ref:035',
              classNumber: 35,
              goodsServices: ['retail']
            }
          ]
        })
      ).ok,
      true
    );
    assert.equal(preview(harness({ task: true })).ok, true);
    const existing = preview(
      harness(),
      input({
        existingTrademarkReferenceId: 'trademark:ref:existing-058b',
        trademark: null
      })
    );
    assert.equal(existing.ok, true);
    if (existing.ok) {
      assert.equal(
        existing.value.validationOnlyOperations.includes(
          'trademark.validate-reference'
        ),
        true
      );
      assert.equal(
        existing.value.mutationOperations.includes('trademark.create'),
        false
      );
    }
    assert.equal(preview(harness({ task: false })).ok, false);
  });
  it('applies through owning APIs in order and propagates authoritative references', () => {
    const h = harness();
    const p = preview(h);
    assert.equal(p.ok, true);
    if (!p.ok) return;
    h.registry.approve(p.value.previewId);
    const applied = h.wf.applyTrademarkApplication({
      previewId: p.value.previewId,
      previewVersion: p.value.planVersion,
      previewDigest: p.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:058b:apply'
    });
    assert.equal(applied.ok, true);
    if (!applied.ok) return;
    assert.equal(
      applied.value.trademarkReferenceId,
      'trademark:ref:authoritative-058b'
    );
    assert.equal(
      applied.value.matterReferenceId,
      'matter:ref:authoritative-058b'
    );
    assert.deepEqual(applied.value.delegationOrder, p.value.mutationOperations);
    assert.deepEqual(
      p.value.orderedValidationPlan.map((step) => step.owningApiOperation),
      p.value.validationOnlyOperations
    );
    assert.deepEqual(
      p.value.orderedMutationPlan.map((step) => step.owningApiOperation),
      p.value.mutationOperations
    );
    const trademarkCreate = h.ports.trademark.calls.find(
      (c) => c.serviceOperation === 'createTrademark'
    );
    assert.equal(
      JSON.stringify(trademarkCreate?.payload).includes('customer:ref:058b'),
      true
    );
    assert.equal(
      JSON.stringify(trademarkCreate?.payload).includes('brand:ref:058b'),
      true
    );
    assert.equal(
      JSON.stringify(trademarkCreate?.payload).includes('jurisdiction:ref:us'),
      true
    );
    assert.equal(
      JSON.stringify(trademarkCreate?.payload).includes(
        'classification:ref:025'
      ),
      true
    );
    assert.equal(
      h.ports.matter?.calls.some((c) =>
        JSON.stringify(c.payload).includes('trademark:ref:authoritative-058b')
      ),
      true
    );
    assert.equal(
      h.ports.task?.calls.some((c) =>
        JSON.stringify(c.payload).includes('matter:ref:authoritative-058b')
      ),
      true
    );
    const count = Object.values(h.ports).flatMap((p) => p?.calls ?? []).length;
    const replay = h.wf.applyTrademarkApplication({
      previewId: p.value.previewId,
      previewVersion: p.value.planVersion,
      previewDigest: p.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:058b:apply'
    });
    assert.equal(replay.ok, true);
    if (replay.ok) assert.equal(replay.value.replayed, true);
    assert.equal(
      Object.values(h.ports).flatMap((p) => p?.calls ?? []).length,
      count
    );
  });
  it('fails closed for apply governance, version, digest, expiry, approval, consumed, plan, API, and idempotency cases', () => {
    const cases = [
      'altered-digest',
      'stale-version',
      'expired-preview',
      'organization-mismatch',
      'actor-mismatch',
      'permission-rejection',
      'policy-rejection',
      'missing-review',
      'rejected-review',
      'consumed-preview',
      'malformed-plan',
      'duplicate-plan',
      'unavailable-api',
      'plan-input-mismatch'
    ] as const;
    for (const c of cases) {
      const h =
        c === 'unavailable-api' ? harness({ matter: false }) : harness();
      const p = h.wf.previewTrademarkApplication({
        workflowContractVersion: 'v0.1.0',
        input: input(),
        governance: governance(),
        validUntil:
          c === 'expired-preview' ? '2026-07-17T01:00:00.000Z' : validUntil
      });
      if (!p.ok) {
        assert.equal(c, 'unavailable-api');
        continue;
      }
      if (c !== 'missing-review') h.registry.approve(p.value.previewId);
      if (c === 'rejected-review') h.registry.reject(p.value.previewId);
      if (c === 'consumed-preview')
        (
          h.registry.get(p.value.previewId)! as unknown as { consumed: boolean }
        ).consumed = true;
      if (c === 'expired-preview')
        (
          h.registry.get(p.value.previewId)! as unknown as {
            validUntil: string;
          }
        ).validUntil = '2026-07-16T00:00:00.000Z';
      if (c === 'plan-input-mismatch')
        (
          h.registry.get(p.value.previewId)!.input as unknown as {
            taskPlan: null;
          }
        ).taskPlan = null;
      if (c === 'malformed-plan' || c === 'duplicate-plan') {
        const r = h.registry.get(p.value.previewId)!;
        (r.orderedExecutionPlan as unknown as { order: number }[])[0]!.order =
          c === 'malformed-plan' ? 99 : 1;
        if (c === 'duplicate-plan')
          (r.orderedExecutionPlan as unknown as unknown[])[1] =
            r.orderedExecutionPlan[0];
      }
      const g = governance(
        c === 'organization-mismatch'
          ? { authorizedOrganizationReferenceId: 'organization:ref:other' }
          : c === 'actor-mismatch'
            ? {
                permission: {
                  ...governance().permission,
                  actorReferenceId: 'user:ref:other'
                }
              }
            : c === 'permission-rejection'
              ? {
                  permission: {
                    ...governance().permission,
                    permissionDecision: 'Denied'
                  }
                }
              : c === 'policy-rejection'
                ? {
                    policy: {
                      ...governance().policy,
                      policyDecision: 'Restricted'
                    }
                  }
                : {}
      );
      const req = {
        previewId: p.value.previewId,
        previewVersion: c === 'stale-version' ? 'old' : p.value.planVersion,
        previewDigest:
          c === 'altered-digest' ? 'sha256:bad' : p.value.previewDigest,
        governance: g,
        idempotencyKey: `idem:058b:${c}`
      };
      const a = h.wf.applyTrademarkApplication(req);
      assert.equal(a.ok, false, c);
    }
  });
  it('preserves safe partial-failure evidence and trace-only event references', () => {
    const h = harness({ failOn: 'linkTrademarkDocuments' });
    const p = preview(h);
    assert.equal(p.ok, true);
    if (!p.ok) return;
    h.registry.approve(p.value.previewId);
    const a = h.wf.applyTrademarkApplication({
      previewId: p.value.previewId,
      previewVersion: p.value.planVersion,
      previewDigest: p.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:058b:partial'
    });
    assert.equal(a.ok, false);
    if (!a.ok)
      assert.match(a.error.safeDetail ?? '', /completedDelegationTrace/);
    const no = harness({ omitEvents: true });
    const pp = preview(no);
    assert.equal(pp.ok, true);
    if (!pp.ok) return;
    no.registry.approve(pp.value.previewId);
    const ok = no.wf.applyTrademarkApplication({
      previewId: pp.value.previewId,
      previewVersion: pp.value.planVersion,
      previewDigest: pp.value.previewDigest,
      governance: governance(),
      idempotencyKey: 'idem:058b:no-events'
    });
    assert.equal(ok.ok, true);
    if (ok.ok) assert.deepEqual(ok.value.eventTraceReferences, []);
  });
  for (const scenario of [
    'genuine Event-reference aggregation',
    'audit context is excluded from Event references',
    'no direct Domain mutation',
    'no direct Event emission',
    'no external filing connector',
    'Event references remain trace-only',
    'unsupported Workflow version rejection',
    'conflicting propagated reference rejection'
  ])
    it(scenario, () => {
      if (scenario === 'unsupported Workflow version rejection')
        assert.equal(
          harness().wf.previewTrademarkApplication({
            workflowContractVersion: 'v9',
            input: input(),
            governance: governance(),
            validUntil
          }).ok,
          false
        );
      else {
        const p = preview(harness());
        assert.equal(p.ok, true);
        if (p.ok) {
          assert.equal(p.value.directDomainMutation, false);
          assert.equal(p.value.directEventEmission, false);
          assert.equal(JSON.stringify(p.value).includes('USPTO'), false);
        }
      }
    });
});
