import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyTrademarkApplication,
  previewTrademarkApplication,
  TrademarkApplicationPreviewRegistry,
  type TrademarkApplicationInput,
  type TrademarkApplicationPorts
} from '../../src/index.ts';

function input(
  extra: Partial<TrademarkApplicationInput> = {}
): TrademarkApplicationInput {
  return {
    customerReferenceId: 'customer-1',
    brandReferenceId: 'brand-1',
    jurisdictionReferenceId: 'jurisdiction-us',
    classificationReferenceIds: ['class-025', 'class-009'],
    documentReferenceIds: ['doc-1'],
    evidenceReferenceIds: ['ev-1'],
    existingTrademarkReferenceId: 'tm-existing',
    existingMatterReferenceId: 'matter-existing',
    orderReferenceId: 'order-1',
    organizationReferenceId: 'org-1',
    rawTrademarkPayload: { markName: 'WHALE' },
    ...extra
  };
}
function ports(overrides: Partial<TrademarkApplicationPorts> = {}) {
  const calls: string[] = [];
  const ok =
    (name: string, value: Record<string, unknown> = {}) =>
    (payload: object) => {
      calls.push(`${name}:${JSON.stringify(payload)}`);
      return { ok: true as const, value };
    };
  const p: TrademarkApplicationPorts = {
    customerApi: { validateCustomerReference: ok('customer.validate') },
    brandApi: {
      validateBrandReference: ok('brand.validate', {
        customerReferenceId: 'customer-1'
      })
    },
    jurisdictionApi: {
      validateJurisdictionReference: ok('jurisdiction.validate')
    },
    classificationApi: {
      validateClassificationReference: ok('classification.validate')
    },
    documentApi: { validateDocumentReference: ok('document.validate') },
    evidenceApi: { validateEvidenceReference: ok('evidence.validate') },
    trademarkApi: {
      validateTrademarkReference: ok('trademark.validate'),
      createTrademark: ok('trademark.create', {
        trademarkReferenceId: 'tm-1',
        eventTraceReferences: ['event-tm']
      }),
      linkTrademarkMatter: ok('trademark.link', {
        eventTraceReferences: ['event-link']
      })
    },
    matterApi: {
      validateMatterReference: ok('matter.validate'),
      createMatter: ok('matter.create', {
        matterReferenceId: 'matter-1',
        eventTraceReferences: ['event-matter']
      })
    },
    orderApi: { validateOrderReference: ok('order.validate') },
    taskApi: {
      createTask: ok('task.create', { eventTraceReferences: ['event-task'] })
    },
    ...overrides
  };
  return { calls, p };
}

describe('CORE-TASK-058B Trademark Application Workflow correction', () => {
  it('preview invokes all governed validators and performs no mutation', () => {
    const { calls, p } = ports();
    const result = previewTrademarkApplication(
      input(),
      p,
      new TrademarkApplicationPreviewRegistry()
    );
    assert.equal(result.ok, true);
    assert.deepEqual(
      calls.map((c) => c.split(':')[0]),
      [
        'customer.validate',
        'brand.validate',
        'jurisdiction.validate',
        'classification.validate',
        'classification.validate',
        'document.validate',
        'evidence.validate',
        'trademark.validate',
        'matter.validate',
        'order.validate'
      ]
    );
    assert.equal(
      calls.some((c) => c.includes('create') || c.includes('link')),
      false
    );
  });
  it('preview validation failure prevents registration', () => {
    const registry = new TrademarkApplicationPreviewRegistry();
    const { p } = ports({
      customerApi: {
        validateCustomerReference: () => ({
          ok: false,
          error: { code: 'ReferenceInvalid', message: 'bad customer' }
        })
      }
    });
    const result = previewTrademarkApplication(input(), p, registry);
    assert.equal(result.ok, false);
    assert.equal(registry.records.size, 0);
  });
  it('requires existing Trademark validation before linking through the owning API', () => {
    const { calls, p } = ports();
    const preview = previewTrademarkApplication(
      input(),
      p,
      new TrademarkApplicationPreviewRegistry()
    );
    assert.equal(preview.ok, true);
    assert.ok(calls.find((c) => c.startsWith('trademark.validate')));
    assert.ok(
      preview.value.previewValidationPlan.find(
        (s) => s.operation === 'trademark.validateReference'
      )
    );
  });
  it('requires Brand API to confirm the Brand-Customer relationship with both ids in payload', () => {
    const { calls, p } = ports();
    p.brandApi.validateBrandReference = (payload: object) => {
      calls.push(`brand.validate:${JSON.stringify(payload)}`);
      return { ok: true, value: { customerReferenceId: 'other' } };
    };
    const result = previewTrademarkApplication(
      input(),
      p,
      new TrademarkApplicationPreviewRegistry()
    );
    assert.equal(result.ok, false);
    assert.match(
      calls.find((c) => c.startsWith('brand.validate')) ?? '',
      /brandReferenceId.*customerReferenceId/
    );
  });
  it('normalizes the Trademark create payload and rejects conflicting raw fields', () => {
    const registry = new TrademarkApplicationPreviewRegistry();
    const { p } = ports();
    const result = previewTrademarkApplication(
      input({ classificationReferenceIds: ['b', 'a'] }),
      p,
      registry
    );
    assert.equal(result.ok, true);
    assert.deepEqual(
      result.value.normalizedTrademarkCreatePayload.classificationReferenceIds,
      ['a', 'b']
    );
    assert.equal(
      previewTrademarkApplication(
        input({ rawTrademarkPayload: { customerReferenceId: 'other' } }),
        p,
        registry
      ).ok,
      false
    );
  });
  it('separates validation and mutation plans and apply uses the stored normalized mutation plan', () => {
    const registry = new TrademarkApplicationPreviewRegistry();
    const { calls, p } = ports();
    const preview = previewTrademarkApplication(input(), p, registry);
    assert.equal(preview.ok, true);
    assert.ok(
      preview.value.previewValidationPlan.every((s) =>
        s.operation.includes('validate')
      )
    );
    assert.ok(
      preview.value.applyMutationPlan.every(
        (s) => !s.operation.includes('validate')
      )
    );
    const applied = applyTrademarkApplication(
      preview.value.previewId,
      input(),
      p,
      registry
    );
    assert.equal(applied.ok, true);
    assert.deepEqual(applied.value.completedDelegationTrace, [
      'trademark.create',
      'matter.create',
      'trademark.linkMatter',
      'task.create'
    ]);
    assert.ok(
      calls.find(
        (c) =>
          c.startsWith('trademark.create') && c.includes('customerReferenceId')
      )
    );
  });
  it('returns structured partial failure after Trademark creation, preserves events, and claims no rollback or external filing', () => {
    const registry = new TrademarkApplicationPreviewRegistry();
    const { p } = ports({
      matterApi: {
        validateMatterReference: () => ({ ok: true, value: {} }),
        createMatter: () => ({
          ok: false,
          error: { code: 'Boom', message: 'x' }
        })
      }
    });
    const preview = previewTrademarkApplication(input(), p, registry);
    assert.equal(preview.ok, true);
    const result = applyTrademarkApplication(
      preview.value.previewId,
      input(),
      p,
      registry
    );
    assert.equal(result.ok, false);
    assert.equal(result.partialFailure?.safePartialFailure, true);
    assert.deepEqual(result.partialFailure?.completedDelegationTrace, [
      'trademark.create'
    ]);
    assert.deepEqual(result.partialFailure?.eventTraceReferences, ['event-tm']);
    assert.equal(result.partialFailure?.compensationAvailable, false);
    assert.equal(result.partialFailure?.directDomainMutation, false);
    assert.equal(result.partialFailure?.directEventEmission, false);
  });
  it('returns structured partial failure after Matter creation and for missing authoritative references', () => {
    for (const override of [
      {
        trademarkApi: {
          ...ports().p.trademarkApi,
          createTrademark: () => ({
            ok: true as const,
            value: { eventTraceReferences: ['event-tm'] }
          })
        }
      },
      {
        matterApi: {
          validateMatterReference: () => ({ ok: true as const, value: {} }),
          createMatter: () => ({
            ok: true as const,
            value: { eventTraceReferences: ['event-matter'] }
          })
        }
      },
      {
        trademarkApi: {
          ...ports().p.trademarkApi,
          linkTrademarkMatter: () => ({
            ok: false as const,
            error: { code: 'Boom', message: 'x' }
          })
        }
      }
    ]) {
      const registry = new TrademarkApplicationPreviewRegistry();
      const { p } = ports(override as Partial<TrademarkApplicationPorts>);
      const preview = previewTrademarkApplication(input(), p, registry);
      assert.equal(preview.ok, true);
      const result = applyTrademarkApplication(
        preview.value.previewId,
        input(),
        p,
        registry
      );
      assert.equal(result.ok, false);
      assert.equal(result.partialFailure?.safePartialFailure, true);
      assert.equal(result.partialFailure?.compensationAvailable, false);
    }
  });
});
