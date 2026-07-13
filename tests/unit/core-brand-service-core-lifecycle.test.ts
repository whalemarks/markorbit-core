import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../../src/behaviors/index.ts';
import { createCoreEventId, type CoreEventId } from '../../src/events/index.ts';
import {
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  type CoreMvpObjectBaseRecord
} from '../../src/objects/core-mvp-object-base-record.ts';
import {
  CORE_BRAND_STATUSES,
  CORE_BRAND_TYPES,
  CoreBrandService,
  CoreInMemoryBrandServiceStore,
  type CoreBrandGovernanceContext
} from '../../src/services/brand/index.ts';
import { validateCoreBrandServiceEvidenceFixture } from '../../src/service-coverage/index.ts';

const fixture = JSON.parse(
  readFileSync(
    'fixtures/services/core-brand-service-core-lifecycle.fixture.json',
    'utf8'
  )
) as Record<string, unknown>;

const brandReference = fixture.publicReferenceRecord as CoreReferenceRecord;
const customerReference =
  fixture.customerReferenceRecord as CoreReferenceRecord;
const objectRecord = fixture.objectRecord as unknown as CoreMvpObjectBaseRecord;
const brandReferenceId = String(fixture.brandReferenceId);
const customerReferenceId = String(fixture.customerReferenceId);
const organizationScopeReferenceId = String(
  fixture.organizationScopeReferenceId
);

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationReferenceId = organizationScopeReferenceId
): CoreBrandGovernanceContext {
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
      targetObjectType: 'brand-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'brand-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-037'
    }
  };
}

function setup(includeCustomer = true) {
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryBrandServiceStore();
  const references = [
    ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
    brandReference,
    ...(includeCustomer ? [customerReference] : [])
  ];
  const clocks = [
    String(fixture.fixedNow),
    String(fixture.updatedNow),
    String(fixture.updatedNow)
  ];
  const service = new CoreBrandService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    relatedReferenceRegistry: new CoreReferenceRegistry(references),
    now: () => clocks.shift() ?? String(fixture.updatedNow),
    eventIdFactory: (operation, referenceId, idempotencyKey) =>
      createCoreEventId(
        `event-test-${operation}-${referenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'brand-service-test-secret'
  });
  return { service, store, traces };
}

function createBrand(service: CoreBrandService) {
  return service.createBrand({
    objectRecord,
    publicReferenceRecord: brandReference,
    brandType: 'Word',
    brandStatus: 'Active',
    nameReference: 'name:synthetic:brand-037',
    sourceReference: 'source:synthetic:brand-037',
    customerReferenceId,
    idempotencyKey: 'idem:create:brand-test-037',
    governance: governance(
      'brand.create',
      'brand:create',
      'brand.write',
      brandReferenceId
    )
  });
}

describe('Brand Service core lifecycle boundary', () => {
  it('locks Brand Object controlled values and executes the canonical fixture', () => {
    assert.deepEqual(CORE_BRAND_TYPES, [
      'Word',
      'Logo',
      'Combined',
      'Slogan',
      'Series',
      'TradeName',
      'ProductLine',
      'Unknown'
    ]);
    assert.deepEqual(CORE_BRAND_STATUSES, [
      'Draft',
      'Active',
      'ReviewRequired',
      'Archived',
      'DeletedReferenceOnly'
    ]);
    assert.deepEqual(validateCoreBrandServiceEvidenceFixture(fixture), []);
  });

  it('creates and replays Brand state and status without duplicate Events', () => {
    const { service, store, traces } = setup();
    const created = createBrand(service);
    assert.equal(created.ok, true);
    const replayedCreate = createBrand(service);
    assert.deepEqual(replayedCreate, created);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Internal']).length, 1);

    const statusRequest = {
      brandReferenceId,
      targetStatus: 'Archived' as const,
      reasonReference: 'reason:synthetic:archive-brand',
      idempotencyKey: 'idem:status:brand-test-037',
      governance: governance(
        'brand.change_status',
        'brand:change_status',
        'brand.lifecycle',
        brandReferenceId
      )
    };
    const changed = service.changeBrandStatus(statusRequest);
    assert.equal(changed.ok, true);
    const replayedStatus = service.changeBrandStatus(statusRequest);
    assert.deepEqual(replayedStatus, changed);
    assert.equal(traces.visibleTo(['Internal']).length, 2);

    const conflict = service.changeBrandStatus({
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

  it('requires a registered active Customer reference', () => {
    const { service, traces } = setup(false);
    const result = createBrand(service);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(
        [result.error.code, result.error.category],
        ['InvalidBrandCustomerReference', 'Reference']
      );
    }
    assert.equal(traces.visibleTo(['Internal']).length, 0);
  });

  it('returns safe list and reference-validation outputs', () => {
    const { service, traces } = setup();
    assert.equal(createBrand(service).ok, true);
    const listed = service.listBrands({
      filters: { brandType: 'Word', brandStatus: 'Active' },
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'brand.list',
        'brand:list',
        'brand.list',
        'brand:collection'
      )
    });
    assert.equal(listed.ok, true);
    if (listed.ok) {
      assert.equal(listed.value.items.length, 1);
      const summary = listed.value.items[0];
      assert.equal('nameReference' in summary, false);
      assert.equal('sourceReference' in summary, false);
      assert.equal('customerReferenceId' in summary, false);
      assert.equal('visibility' in summary, false);
      assert.equal('metadata' in summary, false);
    }
    const validation = service.validateBrandReference({
      brandReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-reference-service',
      governance: governance(
        'brand.validate_reference',
        'brand:validate_reference',
        'brand.reference',
        brandReferenceId
      )
    });
    assert.equal(validation.ok, true);
    if (validation.ok) {
      assert.equal(validation.value.isValid, true);
      assert.equal('customerReferenceId' in validation.value, false);
    }
    assert.equal(traces.visibleTo(['Internal']).length, 1);
  });

  it('fails closed for missing archive reason and organization mismatch', () => {
    const { service } = setup();
    assert.equal(createBrand(service).ok, true);
    const missingReason = service.changeBrandStatus({
      brandReferenceId,
      targetStatus: 'Archived',
      idempotencyKey: 'idem:status:missing-reason-037',
      governance: governance(
        'brand.change_status',
        'brand:change_status',
        'brand.lifecycle',
        brandReferenceId
      )
    });
    assert.equal(missingReason.ok, false);
    if (!missingReason.ok) {
      assert.equal(missingReason.error.code, 'BrandReasonReferenceRequired');
    }
    const wrongScope = service.getBrand({
      brandReferenceId,
      governance: governance(
        'brand.read',
        'brand:read',
        'brand.read',
        brandReferenceId,
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
