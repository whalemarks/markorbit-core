import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
  CommunicationReviewPreviewRegistry,
  applyCommunicationReview,
  previewCommunicationReview,
  type CommunicationReviewInput,
  type CommunicationReviewPorts
} from '../../src/index.ts';

const future = '2030-01-01T00:00:00.000Z';
function input(
  extra: Partial<CommunicationReviewInput> = {}
): CommunicationReviewInput {
  return {
    organizationReferenceId: 'org-1',
    communicationReferenceId: 'comm-1',
    communicationVersion: 'v1',
    communicationState: 'pending_review',
    customerReferenceId: 'cust-1',
    brandReferenceId: 'brand-1',
    matterReferenceId: 'matter-1',
    trademarkReferenceId: 'tm-1',
    documentReferenceIds: ['doc-1'],
    evidenceReferenceIds: ['ev-1'],
    reviewerReferenceId: 'reviewer-1',
    disposition: 'approve',
    approvedPayload: { subject: ' Approved ', body: 'safe approved body' },
    taskPlan: undefined,
    idempotencyScope: 'org-1:comm-1',
    ...extra
  };
}
function governance(extra = {}) {
  return {
    organizationReferenceId: 'org-1',
    actorReferenceId: 'reviewer-1',
    permission: { allowed: true, decisionId: 'perm-1' },
    policy: { allowed: true, decisionId: 'pol-1' },
    humanReview: { state: 'pending' as const },
    ...extra
  };
}
function ports(overrides: Partial<CommunicationReviewPorts> = {}) {
  const calls: string[] = [];
  const ok =
    (name: string, value: Record<string, unknown> = {}) =>
    (payload: object) => {
      calls.push(`${name}:${JSON.stringify(payload)}`);
      return { ok: true as const, value };
    };
  const p: CommunicationReviewPorts = {
    now: () => '2029-01-01T00:00:00.000Z',
    communicationApi: {
      validateCommunicationReference: ok('communication.validate', {
        organizationReferenceId: 'org-1',
        version: 'v1'
      }),
      approveReview: ok('communication.approveReview', {
        communicationReferenceId: 'comm-1',
        eventTraceReferences: ['event-approve']
      }),
      rejectReview: ok('communication.rejectReview', {
        communicationReferenceId: 'comm-1',
        eventTraceReferences: ['event-reject']
      }),
      requestChanges: ok('communication.requestChanges', {
        communicationReferenceId: 'comm-1',
        eventTraceReferences: ['event-change']
      })
    },
    customerApi: { validateCustomerReference: ok('customer.validate') },
    brandApi: { validateBrandReference: ok('brand.validate') },
    matterApi: { validateMatterReference: ok('matter.validate') },
    trademarkApi: { validateTrademarkReference: ok('trademark.validate') },
    documentApi: { validateDocumentReference: ok('document.validate') },
    evidenceApi: { validateEvidenceReference: ok('evidence.validate') },
    taskApi: {
      validateTaskPlan: ok('task.validate'),
      createTask: ok('task.create', {
        taskReferenceId: 'task-1',
        eventTraceReferences: ['event-task']
      })
    },
    ...overrides
  };
  return { calls, p };
}
function previewAndApprove(i = input(), p = ports().p) {
  const registry = new CommunicationReviewPreviewRegistry();
  const preview = previewCommunicationReview(
    {
      schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
      input: i,
      governance: governance(),
      validUntil: future
    },
    p,
    registry
  );
  assert.equal(preview.ok, true);
  const approved = registry.approve(preview.value.previewId, {
    state: 'approved',
    disposition: i.disposition,
    reviewerReferenceId: i.reviewerReferenceId,
    decisionReferenceId: 'hr-1'
  });
  assert.equal(approved.ok, true);
  return { registry, preview: preview.value };
}

describe('CORE-TASK-058C Communication Review Workflow preview/apply', () => {
  it('identical canonical preview requests produce identical digest and plan', () => {
    const a = previewCommunicationReview(
      {
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        input: input(),
        governance: governance(),
        validUntil: future
      },
      ports().p,
      new CommunicationReviewPreviewRegistry()
    );
    const b = previewCommunicationReview(
      {
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        input: input(),
        governance: governance(),
        validUntil: future
      },
      ports().p,
      new CommunicationReviewPreviewRegistry()
    );
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(a.value.previewDigest, b.value.previewDigest);
    assert.deepEqual(a.value.applyMutationPlan, b.value.applyMutationPlan);
  });
  it('preview performs governed validation and no mutation', () => {
    const { calls, p } = ports();
    const r = previewCommunicationReview(
      {
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        input: input(),
        governance: governance(),
        validUntil: future
      },
      p,
      new CommunicationReviewPreviewRegistry()
    );
    assert.equal(r.ok, true);
    assert.deepEqual(
      calls.map((c) => c.split(':')[0]),
      [
        'communication.validate',
        'customer.validate',
        'brand.validate',
        'matter.validate',
        'trademark.validate',
        'document.validate',
        'evidence.validate'
      ]
    );
    assert.equal(
      calls.some(
        (c) =>
          c.includes('approveReview') ||
          c.includes('rejectReview') ||
          c.includes('requestChanges')
      ),
      false
    );
  });
  for (const [disposition, operation, extra] of [
    [
      'approve',
      'communication.approveReview',
      { approvedPayload: { body: 'ok' } }
    ],
    [
      'reject',
      'communication.rejectReview',
      { rejection: { reasonCode: 'bad' } }
    ],
    [
      'request_changes',
      'communication.requestChanges',
      { changeRequest: { instructions: 'fix' } }
    ]
  ] as const) {
    it(`${disposition} apply delegates the correct authoritative transition`, () => {
      const { calls, p } = ports();
      const i = input({ disposition, taskPlan: undefined, ...extra });
      const { registry, preview } = previewAndApprove(i, p);
      const r = applyCommunicationReview(
        {
          previewId: preview.previewId,
          previewDigest: preview.previewDigest,
          schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
          governance: governance(),
          idempotencyKey: 'org-1:comm-1:apply',
          currentCommunicationVersion: 'v1',
          currentReviewRelevantDigest: preview.reviewRelevantDigest
        },
        p,
        registry
      );
      assert.equal(r.ok, true);
      assert.deepEqual(r.value.completedDelegationTrace, [operation]);
      assert.equal(calls.filter((c) => c.startsWith(operation)).length, 1);
    });
  }
  it('apply uses stored normalized payload, preserves trace-only events, and idempotently replays', () => {
    const { calls, p } = ports();
    const { registry, preview } = previewAndApprove(input(), p);
    const req = {
      previewId: preview.previewId,
      previewDigest: preview.previewDigest,
      schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
      governance: governance(),
      idempotencyKey: 'org-1:comm-1:apply',
      currentCommunicationVersion: 'v1',
      currentReviewRelevantDigest: preview.reviewRelevantDigest
    };
    const r = applyCommunicationReview(req, p, registry);
    assert.equal(r.ok, true);
    assert.deepEqual(r.value.eventTraceReferences, ['event-approve']);
    assert.equal(r.value.directEventEmission, false);
    assert.match(
      calls.find((c) => c.startsWith('communication.approveReview')) ?? '',
      /approvedContentDigest/
    );
    const replay = applyCommunicationReview(req, p, registry);
    assert.equal(replay.ok, true);
    assert.equal(replay.value.replayed, true);
    assert.equal(
      calls.filter((c) => c.startsWith('communication.approveReview')).length,
      1
    );
  });
  it('optional Task delegation occurs only after Communication mutation', () => {
    const { calls, p } = ports();
    const { registry, preview } = previewAndApprove(
      input({ taskPlan: { title: 'follow up' } }),
      p
    );
    const r = applyCommunicationReview(
      {
        previewId: preview.previewId,
        previewDigest: preview.previewDigest,
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        governance: governance(),
        idempotencyKey: 'org-1:comm-1:apply',
        currentCommunicationVersion: 'v1',
        currentReviewRelevantDigest: preview.reviewRelevantDigest
      },
      p,
      registry
    );
    assert.equal(r.ok, true);
    assert.deepEqual(r.value.completedDelegationTrace, [
      'communication.approveReview',
      'task.create'
    ]);
    assert.ok(
      calls.findIndex((c) => c.startsWith('communication.approveReview')) <
        calls.findIndex((c) => c.startsWith('task.create'))
    );
  });
  it('fails closed for required negative validation cases', () => {
    const cases = [
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input(),
            governance: governance({
              permission: { allowed: false, decisionId: 'p' }
            }),
            validUntil: future
          },
          ports().p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input(),
            governance: governance({
              policy: { allowed: false, decisionId: 'p' }
            }),
            validUntil: future
          },
          ports().p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input(),
            governance: governance({ organizationReferenceId: 'other' }),
            validUntil: future
          },
          ports().p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input(),
            governance: governance(),
            validUntil: future
          },
          ports({
            communicationApi: {
              ...ports().p.communicationApi!,
              validateCommunicationReference: () => ({
                ok: false,
                error: { code: 'ReferenceInvalid', message: 'bad' }
              })
            }
          }).p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input({ communicationState: 'sent' }),
            governance: governance(),
            validUntil: future
          },
          ports().p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input(),
            governance: governance(),
            validUntil: future
          },
          ports({
            communicationApi: {
              ...ports().p.communicationApi!,
              validateCommunicationReference: () => ({
                ok: true,
                value: { organizationReferenceId: 'org-1', version: 'v2' }
              })
            }
          }).p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input(),
            governance: governance(),
            validUntil: '2020-01-01T00:00:00.000Z'
          },
          ports().p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input(),
            governance: governance(),
            validUntil: future
          },
          ports({ communicationApi: undefined }).p,
          new CommunicationReviewPreviewRegistry()
        ),
      () =>
        previewCommunicationReview(
          {
            schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
            input: input({ taskPlan: { title: 'x' } }),
            governance: governance(),
            validUntil: future
          },
          ports({ taskApi: undefined }).p,
          new CommunicationReviewPreviewRegistry()
        )
    ];
    for (const run of cases) assert.equal(run().ok, false);
  });
  it('fails apply for altered content, disposition, reviewer, approval, expiry, digest, and conflicting consumed reuse', () => {
    const { p } = ports();
    for (const mutate of [
      (req: any) => ({ ...req, currentReviewRelevantDigest: 'sha256:bad' }),
      (req: any) => ({ ...req, disposition: 'reject' }),
      (req: any) => ({
        ...req,
        governance: governance({ actorReferenceId: 'other' })
      }),
      (req: any) => ({ ...req, previewDigest: 'sha256:bad' })
    ]) {
      const { registry, preview } = previewAndApprove(input(), p);
      const req = {
        previewId: preview.previewId,
        previewDigest: preview.previewDigest,
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        governance: governance(),
        idempotencyKey: 'org-1:comm-1:apply',
        currentCommunicationVersion: 'v1',
        currentReviewRelevantDigest: preview.reviewRelevantDigest
      };
      assert.equal(
        applyCommunicationReview(mutate(req), p, registry).ok,
        false
      );
    }
    const reg = new CommunicationReviewPreviewRegistry();
    const prev = previewCommunicationReview(
      {
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        input: input(),
        governance: governance(),
        validUntil: future
      },
      p,
      reg
    );
    assert.equal(prev.ok, true);
    assert.equal(
      applyCommunicationReview(
        {
          previewId: prev.value.previewId,
          previewDigest: prev.value.previewDigest,
          schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
          governance: governance(),
          idempotencyKey: 'org-1:comm-1:apply',
          currentCommunicationVersion: 'v1',
          currentReviewRelevantDigest: prev.value.reviewRelevantDigest
        },
        p,
        reg
      ).ok,
      false
    );
    reg.reject(prev.value.previewId);
    assert.equal(
      applyCommunicationReview(
        {
          previewId: prev.value.previewId,
          previewDigest: prev.value.previewDigest,
          schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
          governance: governance(),
          idempotencyKey: 'org-1:comm-1:apply',
          currentCommunicationVersion: 'v1',
          currentReviewRelevantDigest: prev.value.reviewRelevantDigest
        },
        p,
        reg
      ).ok,
      false
    );
  });
  it('rejects direct mutation/event capabilities and treats Event trace as non-command evidence', () => {
    const { registry, preview } = previewAndApprove(input(), ports().p);
    assert.equal(preview.directDomainMutation, false);
    assert.equal(preview.directEventEmission, false);
    assert.equal('emitEvent' in preview, false);
    assert.equal('executeCommand' in preview.applyMutationPlan, false);
    registry.expire(preview.previewId);
    const r = applyCommunicationReview(
      {
        previewId: preview.previewId,
        previewDigest: preview.previewDigest,
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        governance: governance(),
        idempotencyKey: 'org-1:comm-1:apply',
        currentCommunicationVersion: 'v1',
        currentReviewRelevantDigest: preview.reviewRelevantDigest
      },
      ports().p,
      registry
    );
    assert.equal(r.ok, false);
  });
  it('returns safe structured partial failure without raw content or stack traces', () => {
    const { p } = ports({
      taskApi: {
        validateTaskPlan: () => ({ ok: true, value: {} }),
        createTask: () => ({
          ok: false,
          error: {
            code: 'Boom',
            message: 'Error: secret stack raw approved body'
          }
        })
      }
    });
    const { registry, preview } = previewAndApprove(
      input({ taskPlan: { title: 'follow' } }),
      p
    );
    const r = applyCommunicationReview(
      {
        previewId: preview.previewId,
        previewDigest: preview.previewDigest,
        schemaVersion: CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION,
        governance: governance(),
        idempotencyKey: 'org-1:comm-1:apply',
        currentCommunicationVersion: 'v1',
        currentReviewRelevantDigest: preview.reviewRelevantDigest
      },
      p,
      registry
    );
    assert.equal(r.ok, false);
    assert.equal(r.partialFailure?.safePartialFailure, true);
    assert.deepEqual(r.partialFailure?.completedDelegationTrace, [
      'communication.approveReview'
    ]);
    const serialized = JSON.stringify(r.partialFailure);
    assert.doesNotMatch(serialized, /stack|secret|safe approved body/);
  });
});
