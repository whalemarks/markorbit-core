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
  CORE_JURISDICTION_STATUSES,
  CORE_JURISDICTION_TYPES,
  CoreJurisdictionService,
  CoreInMemoryJurisdictionServiceStore,
  type CoreJurisdictionGovernanceContext
} from '../../src/services/jurisdiction/index.ts';
import { validateCoreJurisdictionServiceEvidenceFixture } from '../../src/service-coverage/core-jurisdiction-service-evidence-fixture.ts';

const fixture = JSON.parse(
  readFileSync(
    'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',
    'utf8'
  )
) as Record<string, unknown>;

const jurisdictionReference =
  fixture.publicReferenceRecord as CoreReferenceRecord;
const objectRecord = fixture.objectRecord as unknown as CoreMvpObjectBaseRecord;
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
): CoreJurisdictionGovernanceContext {
  return {
    correlationId: 'corr:core-task-039',
    auditContextReferenceId: 'audit:ctx:core-task-039',
    authorizedOrganizationReferenceId: organizationReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-039'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-039'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'jurisdiction-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'jurisdiction-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-039'
    }
  };
}

function setup(extraReferences: readonly CoreReferenceRecord[] = []) {
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryJurisdictionServiceStore();
  const references = [
    ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
    jurisdictionReference,
    ...extraReferences
  ];
  const clocks = [
    String(fixture.fixedNow),
    String(fixture.updatedNow),
    String(fixture.updatedNow)
  ];
  const service = new CoreJurisdictionService({
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
    cursorSecret: 'jurisdiction-service-test-secret'
  });
  return { service, store, traces };
}

function createJurisdiction(service: CoreJurisdictionService) {
  return service.createJurisdiction({
    objectRecord,
    publicReferenceRecord: jurisdictionReference,
    jurisdictionCode: 'US',
    jurisdictionType: 'National',
    jurisdictionStatus: 'Active',
    nameReference: 'name:synthetic:jurisdiction-039',
    sourceReference: 'source:synthetic:jurisdiction-039',
    idempotencyKey: 'idem:create:jurisdiction-test-039',
    governance: governance(
      'jurisdiction.create',
      'jurisdiction:create',
      'jurisdiction.write',
      jurisdictionReferenceId
    )
  });
}

describe('Jurisdiction Service core lifecycle boundary', () => {
  it('locks Jurisdiction Object controlled values and executes the canonical fixture', () => {
    assert.deepEqual(CORE_JURISDICTION_TYPES, [
      'National',
      'Regional',
      'International',
      'Territory',
      'Office',
      'Custom',
      'Unknown'
    ]);
    assert.deepEqual(CORE_JURISDICTION_STATUSES, [
      'Draft',
      'Active',
      'ReviewRequired',
      'Deprecated',
      'Reserved',
      'Archived'
    ]);
    assert.deepEqual(
      validateCoreJurisdictionServiceEvidenceFixture(fixture),
      []
    );
  });

  it('creates and replays Jurisdiction state and status without duplicate Events', () => {
    const { service, store, traces } = setup();
    const created = createJurisdiction(service);
    assert.equal(created.ok, true);
    const replayedCreate = createJurisdiction(service);
    assert.deepEqual(replayedCreate, created);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Internal']).length, 1);

    const statusRequest = {
      jurisdictionReferenceId,
      targetStatus: 'Deprecated' as const,
      reasonReference: 'reason:synthetic:deprecate-jurisdiction',
      idempotencyKey: 'idem:status:jurisdiction-test-039',
      governance: governance(
        'jurisdiction.change_status',
        'jurisdiction:change_status',
        'jurisdiction.lifecycle',
        jurisdictionReferenceId
      )
    };
    const changed = service.changeJurisdictionStatus(statusRequest);
    assert.equal(changed.ok, true);
    const replayedStatus = service.changeJurisdictionStatus(statusRequest);
    assert.deepEqual(replayedStatus, changed);
    assert.equal(traces.visibleTo(['Internal']).length, 2);

    const conflict = service.changeJurisdictionStatus({
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

  it('resolves the canonical jurisdiction code', () => {
    const { service, traces } = setup();
    assert.equal(createJurisdiction(service).ok, true);
    const resolved = service.resolveJurisdictionByCode({
      jurisdictionCode: 'us',
      requestingDomain: 'classification',
      requestingService: 'classification-reference-service',
      governance: governance(
        'jurisdiction.resolve_by_code',
        'jurisdiction:resolve',
        'jurisdiction.reference',
        'jurisdiction:collection'
      )
    });
    assert.equal(resolved.ok, true);
    if (resolved.ok) {
      assert.equal(resolved.value.isValid, true);
      assert.equal(
        resolved.value.jurisdictionReferenceId,
        jurisdictionReferenceId
      );
      assert.equal(resolved.value.jurisdictionCode, 'US');
    }
    assert.equal(traces.visibleTo(['Internal']).length, 1);
  });

  it('returns safe list and reference-validation outputs', () => {
    const { service, traces } = setup();
    assert.equal(createJurisdiction(service).ok, true);
    const listed = service.listJurisdictions({
      filters: {
        jurisdictionCode: 'US',
        jurisdictionType: 'National',
        jurisdictionStatus: 'Active'
      },
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'jurisdiction.list',
        'jurisdiction:list',
        'jurisdiction.list',
        'jurisdiction:collection'
      )
    });
    assert.equal(listed.ok, true);
    if (listed.ok) {
      assert.equal(listed.value.items.length, 1);
      const summary = listed.value.items[0];
      assert.equal('nameReference' in summary, false);
      assert.equal('sourceReference' in summary, false);
      assert.equal('visibility' in summary, false);
      assert.equal('metadata' in summary, false);
    }
    const validation = service.validateJurisdictionReference({
      jurisdictionReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-service',
      governance: governance(
        'jurisdiction.validate_reference',
        'jurisdiction:validate_reference',
        'jurisdiction.reference',
        jurisdictionReferenceId
      )
    });
    assert.equal(validation.ok, true);
    if (validation.ok) {
      assert.equal(validation.value.isValid, true);
    }
    assert.equal(traces.visibleTo(['Internal']).length, 1);
  });

  it('fails closed for missing archive reason and organization mismatch', () => {
    const { service } = setup();
    assert.equal(createJurisdiction(service).ok, true);
    const missingReason = service.changeJurisdictionStatus({
      jurisdictionReferenceId,
      targetStatus: 'Deprecated',
      idempotencyKey: 'idem:status:missing-reason-039',
      governance: governance(
        'jurisdiction.change_status',
        'jurisdiction:change_status',
        'jurisdiction.lifecycle',
        jurisdictionReferenceId
      )
    });
    assert.equal(missingReason.ok, false);
    if (!missingReason.ok) {
      assert.equal(
        missingReason.error.code,
        'JurisdictionReasonReferenceRequired'
      );
    }
    const wrongScope = service.getJurisdiction({
      jurisdictionReferenceId,
      governance: governance(
        'jurisdiction.read',
        'jurisdiction:read',
        'jurisdiction.read',
        jurisdictionReferenceId,
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
