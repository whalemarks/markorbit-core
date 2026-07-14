import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../../src/behaviors/index.ts';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/contracts/service/core-service-contract-skeletons.ts';
import { createCoreEventId, type CoreEventId } from '../../src/events/index.ts';
import {
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  type CoreMvpObjectBaseRecord
} from '../../src/objects/core-mvp-object-base-record.ts';
import {
  CORE_TRADEMARK_STATUSES,
  CORE_TRADEMARK_TYPES,
  CoreTrademarkService,
  CoreInMemoryTrademarkServiceStore,
  type CoreTrademarkGovernanceContext
} from '../../src/services/trademark/index.ts';
import { validateCoreTrademarkServiceEvidenceFixture } from '../../src/service-coverage/core-trademark-service-evidence-fixture.ts';

const fixture = JSON.parse(
  readFileSync(
    'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',
    'utf8'
  )
) as Record<string, unknown>;

const trademarkReference = fixture.publicReferenceRecord as CoreReferenceRecord;
const brandReference = fixture.brandReferenceRecord as CoreReferenceRecord;
const jurisdictionReference =
  fixture.jurisdictionReferenceRecord as CoreReferenceRecord;
const objectRecord = fixture.objectRecord as unknown as CoreMvpObjectBaseRecord;
const trademarkReferenceId = String(fixture.trademarkReferenceId);
const brandReferenceId = String(fixture.brandReferenceId);
const jurisdictionReferenceId = String(fixture.jurisdictionReferenceId);
const organizationScopeReferenceId = String(
  fixture.organizationScopeReferenceId
);

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationReferenceId = organizationScopeReferenceId
): CoreTrademarkGovernanceContext {
  return {
    correlationId: 'corr:core-task-037',
    auditContextReferenceId: 'audit:ctx:core-task-037',
    authorizedOrganizationReferenceId: organizationReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-037'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-037'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'trademark-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'trademark-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-037'
    }
  };
}

function setup(includeBrand = true, includeJurisdiction = true) {
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryTrademarkServiceStore();
  const references = [
    ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
    trademarkReference,
    ...(includeBrand ? [brandReference] : []),
    ...(includeJurisdiction ? [jurisdictionReference] : [])
  ];
  const clocks = [
    String(fixture.fixedNow),
    String(fixture.updatedNow),
    String(fixture.updatedNow)
  ];
  const service = new CoreTrademarkService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry(references),
    now: () => clocks.shift() ?? String(fixture.updatedNow),
    eventIdFactory: (operation, referenceId, idempotencyKey) =>
      createCoreEventId(
        `event-test-${operation}-${referenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'trademark-service-test-secret'
  });
  return { service, store, traces };
}

function createTrademark(service: CoreTrademarkService) {
  return service.createTrademark({
    objectRecord,
    publicReferenceRecord: trademarkReference,
    trademarkType: 'Word',
    trademarkStatus: 'Active',
    markRepresentationReference: 'name:synthetic:trademark-037',
    sourceReference: 'source:synthetic:trademark-037',
    jurisdictionReferenceId,
    brandReferenceId,
    idempotencyKey: 'idem:create:trademark-test-037',
    governance: governance(
      'trademark.create',
      'trademark:create',
      'trademark.write',
      trademarkReferenceId
    )
  });
}

describe('Trademark Service core lifecycle boundary', () => {
  it('locks Trademark Object controlled values and executes the canonical fixture', () => {
    assert.deepEqual(CORE_TRADEMARK_TYPES, [
      'Word',
      'Device',
      'Combined',
      'Slogan',
      'Sound',
      'Color',
      'ThreeDimensional',
      'Series',
      'Unknown'
    ]);
    assert.deepEqual(CORE_TRADEMARK_STATUSES, [
      'Draft',
      'Planned',
      'PendingFiling',
      'Filed',
      'UnderExamination',
      'Published',
      'Opposed',
      'Registered',
      'Refused',
      'Abandoned',
      'Cancelled',
      'Expired',
      'Invalidated',
      'RenewalDue',
      'ReviewRequired',
      'Archived',
      'DeletedReferenceOnly'
    ]);
    assert.deepEqual(validateCoreTrademarkServiceEvidenceFixture(fixture), []);
  });

  it('creates and replays Trademark state and status without duplicate Events', () => {
    const { service, store, traces } = setup();
    const created = createTrademark(service);
    assert.equal(created.ok, true);
    const replayedCreate = createTrademark(service);
    assert.deepEqual(replayedCreate, created);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Internal']).length, 1);

    const statusRequest = {
      trademarkReferenceId,
      targetStatus: 'Archived' as const,
      reasonReference: 'reason:synthetic:archive-trademark',
      idempotencyKey: 'idem:status:trademark-test-037',
      governance: governance(
        'trademark.change_status',
        'trademark:change_status',
        'trademark.lifecycle',
        trademarkReferenceId
      )
    };
    const changed = service.changeTrademarkStatus(statusRequest);
    assert.equal(changed.ok, true);
    const replayedStatus = service.changeTrademarkStatus(statusRequest);
    assert.deepEqual(replayedStatus, changed);
    assert.equal(traces.visibleTo(['Internal']).length, 2);

    const conflict = service.changeTrademarkStatus({
      ...statusRequest,
      targetStatus: 'ReviewRequired'
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

  it('requires a registered active Brand reference', () => {
    const { service, traces } = setup(false, true);
    const result = createTrademark(service);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(
        [result.error.code, result.error.category],
        ['InvalidTrademarkBrandReference', 'Reference']
      );
    }
    assert.equal(traces.visibleTo(['Internal']).length, 0);
  });

  it('requires a registered active Jurisdiction reference', () => {
    const { service, traces } = setup(true, false);
    const result = createTrademark(service);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(
        [result.error.code, result.error.category],
        ['InvalidTrademarkJurisdictionReference', 'Reference']
      );
    }
    assert.equal(traces.visibleTo(['Internal']).length, 0);
  });

  it('returns safe list and reference-validation outputs', () => {
    const { service, traces } = setup();
    assert.equal(createTrademark(service).ok, true);
    const listed = service.listTrademarks({
      filters: { trademarkType: 'Word', trademarkStatus: 'Active' },
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'trademark.list',
        'trademark:list',
        'trademark.list',
        'trademark:collection'
      )
    });
    assert.equal(listed.ok, true);
    if (listed.ok) {
      assert.equal(listed.value.items.length, 1);
      const summary = listed.value.items[0];
      assert.equal('markRepresentationReference' in summary, false);
      assert.equal('sourceReference' in summary, false);
      assert.equal('brandReferenceId' in summary, false);
      assert.equal('jurisdictionReferenceId' in summary, false);
      assert.equal('visibility' in summary, false);
      assert.equal('metadata' in summary, false);
    }
    const validation = service.validateTrademarkReference({
      trademarkReferenceId,
      requestingDomain: 'matter',
      requestingService: 'matter-service',
      governance: governance(
        'trademark.validate_reference',
        'trademark:validate_reference',
        'trademark.reference',
        trademarkReferenceId
      )
    });
    assert.equal(validation.ok, true);
    if (validation.ok) {
      assert.equal(validation.value.isValid, true);
      assert.equal('brandReferenceId' in validation.value, false);
      assert.equal('jurisdictionReferenceId' in validation.value, false);
    }
    assert.equal(traces.visibleTo(['Internal']).length, 1);
  });

  it('fails closed for missing archive reason and organization mismatch', () => {
    const { service } = setup();
    assert.equal(createTrademark(service).ok, true);
    const missingReason = service.changeTrademarkStatus({
      trademarkReferenceId,
      targetStatus: 'Archived',
      idempotencyKey: 'idem:status:missing-reason-037',
      governance: governance(
        'trademark.change_status',
        'trademark:change_status',
        'trademark.lifecycle',
        trademarkReferenceId
      )
    });
    assert.equal(missingReason.ok, false);
    if (!missingReason.ok) {
      assert.equal(
        missingReason.error.code,
        'TrademarkReasonReferenceRequired'
      );
    }
    const wrongScope = service.getTrademark({
      trademarkReferenceId,
      governance: governance(
        'trademark.read',
        'trademark:read',
        'trademark.read',
        trademarkReferenceId,
        'organization:ref:wrong-scope'
      )
    });
    assert.equal(wrongScope.ok, false);
    if (!wrongScope.ok) {
      assert.deepEqual(
        [wrongScope.error.code, wrongScope.error.category],
        ['PolicyRestricted', 'Policy']
      );
    }
  });
});
