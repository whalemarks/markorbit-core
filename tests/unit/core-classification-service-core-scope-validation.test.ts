import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreReferenceRegistry,
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreReferenceRecord
} from '../../src/behaviors/index.ts';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/contracts/service/core-service-contract-skeletons.ts';
import { createCoreEventId, type CoreEventId } from '../../src/events/index.ts';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  type CoreMvpObjectBaseRecord
} from '../../src/objects/core-mvp-object-base-record.ts';
import {
  CORE_CLASSIFICATION_ITEM_TYPES,
  CORE_CLASSIFICATION_REVIEW_STATUSES,
  CORE_CLASSIFICATION_SCHEMES,
  CORE_CLASSIFICATION_STATUSES,
  CoreClassificationService,
  CoreInMemoryClassificationServiceStore,
  type CoreClassificationEventTracePort,
  type CoreClassificationGovernanceContext
} from '../../src/services/classification/index.ts';
import { validateCoreClassificationServiceEvidenceFixture } from '../../src/service-coverage/core-classification-service-evidence-fixture.ts';

const fixture = JSON.parse(
  readFileSync(
    'fixtures/services/core-classification-service-core-scope-validation.fixture.json',
    'utf8'
  )
) as Record<string, unknown>;
const publicReference = fixture.publicReferenceRecord as CoreReferenceRecord;
const objectRecord = fixture.objectRecord as unknown as CoreMvpObjectBaseRecord;
const createRequest = fixture.createRequest as Record<string, unknown>;
const classificationReferenceId = String(fixture.classificationReferenceId);
const organizationScopeReferenceId = String(
  fixture.organizationScopeReferenceId
);

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationReferenceId = organizationScopeReferenceId,
  humanReviewRequired = false
): CoreClassificationGovernanceContext {
  const reviewReferenceId = humanReviewRequired
    ? 'human-review:ref:classification-test-040'
    : null;
  return {
    correlationId: 'corr:core-task-040',
    auditContextReferenceId: 'audit:ctx:core-task-040',
    authorizedOrganizationReferenceId: organizationReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-040'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      policyDecision: humanReviewRequired ? 'HumanReviewRequired' : 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-040'
    },
    review: {
      humanReviewRequired,
      humanReviewReferenceId: reviewReferenceId,
      reviewStatus: humanReviewRequired ? 'Completed' : null,
      reviewScope: humanReviewRequired ? 'classification-review' : null,
      reviewDecision: humanReviewRequired ? 'Approved' : null,
      reviewerUserReferenceId: humanReviewRequired
        ? 'user:ref:actor-0001'
        : null,
      targetObjectType: 'classification-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'classification-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: reviewReferenceId,
      correlationId: 'corr:core-task-040'
    }
  };
}

class FailingTracePort implements CoreClassificationEventTracePort {
  constructor(readonly failAt: number) {}
  count = 0;
  append(): CoreBehaviorResult<never> {
    this.count += 1;
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'EventTraceFailed',
        category: 'Event',
        message: 'Synthetic Event trace failure.'
      })
    };
  }
}

function setup(eventTracePort?: CoreClassificationEventTracePort) {
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryClassificationServiceStore();
  const clocks = [
    String(fixture.fixedNow),
    String(fixture.reviewNow),
    String(fixture.approvedNow),
    String(fixture.approvedNow)
  ];
  const service = new CoreClassificationService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: eventTracePort ?? traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      publicReference
    ]),
    now: () => clocks.shift() ?? String(fixture.approvedNow),
    eventIdFactory: (operation, referenceId, idempotencyKey) =>
      createCoreEventId(
        `event-test-${operation}-${referenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'classification-service-test-secret'
  });
  return { service, store, traces };
}

function createClassification(service: CoreClassificationService) {
  return service.createClassification({
    objectRecord,
    publicReferenceRecord: publicReference,
    classificationScheme: createRequest.classificationScheme,
    classReferences: createRequest.classReferences,
    goodsServicesItems: createRequest.goodsServicesItems,
    classificationStatus: createRequest.classificationStatus,
    reviewStatus: createRequest.reviewStatus,
    trademarkReferenceId: String(createRequest.trademarkReferenceId),
    brandReferenceId: String(createRequest.brandReferenceId),
    jurisdictionReferenceId: String(createRequest.jurisdictionReferenceId),
    sourceReference: String(createRequest.sourceReference),
    idempotencyKey: 'idem:create:classification-test-040',
    governance: governance(
      'classification.create',
      'classification:create',
      'classification.write',
      classificationReferenceId
    )
  });
}

describe('Classification Service core scope and validation boundary', () => {
  it('locks controlled values and executes the canonical fixture', () => {
    assert.deepEqual(CORE_CLASSIFICATION_SCHEMES, [
      'Nice',
      'Local',
      'Madrid',
      'USPTO_ID_Manual',
      'CN_Similar_Group',
      'Custom',
      'Unknown'
    ]);
    assert.equal(CORE_CLASSIFICATION_STATUSES.length, 9);
    assert.equal(CORE_CLASSIFICATION_REVIEW_STATUSES.length, 7);
    assert.equal(CORE_CLASSIFICATION_ITEM_TYPES.length, 7);
    assert.deepEqual(
      validateCoreClassificationServiceEvidenceFixture(fixture),
      []
    );
  });

  it('rejects class-number-only and inconsistent item scope', () => {
    const { service } = setup();
    const base = {
      objectRecord,
      publicReferenceRecord: publicReference,
      classificationScheme: 'Nice',
      classReferences: ['class:ref:025'],
      classificationStatus: 'Draft',
      reviewStatus: 'Unreviewed',
      sourceReference: 'source:synthetic:classification-test',
      governance: governance(
        'classification.create',
        'classification:create',
        'classification.write',
        classificationReferenceId
      )
    };
    const classOnly = service.createClassification({
      ...base,
      goodsServicesItems: [],
      idempotencyKey: 'idem:class-only:040'
    });
    assert.equal(classOnly.ok, false);
    if (!classOnly.ok)
      assert.equal(classOnly.error.code, 'ClassNumberOnlyNotAllowed');

    const mismatched = service.createClassification({
      ...base,
      goodsServicesItems: [
        {
          itemReferenceId: 'classification-item:ref:mismatch',
          classReference: 'class:ref:035',
          itemType: 'Services'
        }
      ],
      idempotencyKey: 'idem:mismatch:040'
    });
    assert.equal(mismatched.ok, false);
    if (!mismatched.ok)
      assert.equal(mismatched.error.code, 'InvalidClassificationItemReference');
  });

  it('creates, replays, lists and validates without leaking item details', () => {
    const { service, store, traces } = setup();
    const inputItems = structuredClone(createRequest.goodsServicesItems);
    const created = service.createClassification({
      objectRecord,
      publicReferenceRecord: publicReference,
      classificationScheme: createRequest.classificationScheme,
      classReferences: structuredClone(createRequest.classReferences),
      goodsServicesItems: inputItems,
      classificationStatus: 'Draft',
      reviewStatus: 'Unreviewed',
      trademarkReferenceId: String(createRequest.trademarkReferenceId),
      brandReferenceId: String(createRequest.brandReferenceId),
      jurisdictionReferenceId: String(createRequest.jurisdictionReferenceId),
      sourceReference: String(createRequest.sourceReference),
      idempotencyKey: 'idem:create:classification-safe-040',
      governance: governance(
        'classification.create',
        'classification:create',
        'classification.write',
        classificationReferenceId
      )
    });
    assert.equal(created.ok, true);
    assert.equal(Object.isFrozen(inputItems), false);
    const replay = service.createClassification({
      objectRecord,
      publicReferenceRecord: publicReference,
      classificationScheme: createRequest.classificationScheme,
      classReferences: structuredClone(createRequest.classReferences),
      goodsServicesItems: inputItems,
      classificationStatus: 'Draft',
      reviewStatus: 'Unreviewed',
      trademarkReferenceId: String(createRequest.trademarkReferenceId),
      brandReferenceId: String(createRequest.brandReferenceId),
      jurisdictionReferenceId: String(createRequest.jurisdictionReferenceId),
      sourceReference: String(createRequest.sourceReference),
      idempotencyKey: 'idem:create:classification-safe-040',
      governance: governance(
        'classification.create',
        'classification:create',
        'classification.write',
        classificationReferenceId
      )
    });
    assert.deepEqual(replay, created);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Internal']).length, 1);
    if (created.ok) {
      assert.equal(Object.isFrozen(created.value), true);
      assert.equal(Object.isFrozen(created.value.goodsServicesItems), true);
    }

    const list = service.listClassifications({
      governance: governance(
        'classification.list',
        'classification:list',
        'classification.list',
        'classification:collection'
      )
    });
    assert.equal(list.ok, true);
    if (list.ok) {
      assert.equal(list.value.items.length, 1);
      assert.equal('goodsServicesItems' in list.value.items[0], false);
      assert.equal('sourceReference' in list.value.items[0], false);
    }
    const validation = service.validateClassification({
      classificationReferenceId,
      governance: governance(
        'classification.validate',
        'classification:validate',
        'classification.validation',
        classificationReferenceId
      )
    });
    assert.equal(validation.ok, true);
    if (validation.ok) {
      assert.equal(validation.value.reasonCode, 'ReviewRequired');
      assert.equal(validation.value.reviewRequired, true);
      assert.equal('goodsServicesItems' in validation.value, false);
    }
  });

  it('requires governed human review for approval and replays status safely', () => {
    const { service, traces } = setup();
    assert.equal(createClassification(service).ok, true);
    const reviewRequired = service.changeClassificationStatus({
      classificationReferenceId,
      targetStatus: 'ReviewRequired',
      targetReviewStatus: 'NeedsRevision',
      idempotencyKey: 'idem:review-required:040',
      governance: governance(
        'classification.change_status',
        'classification:change_status',
        'classification.lifecycle',
        classificationReferenceId
      )
    });
    assert.equal(reviewRequired.ok, true);
    const denied = service.changeClassificationStatus({
      classificationReferenceId,
      targetStatus: 'Approved',
      targetReviewStatus: 'ApprovedForFiling',
      idempotencyKey: 'idem:approve-denied:040',
      governance: governance(
        'classification.change_status',
        'classification:change_status',
        'classification.lifecycle',
        classificationReferenceId
      )
    });
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.error.code, 'HumanReviewRequired');

    const approvalInput = {
      classificationReferenceId,
      targetStatus: 'Approved' as const,
      targetReviewStatus: 'ApprovedForFiling' as const,
      idempotencyKey: 'idem:approve:040',
      governance: governance(
        'classification.change_status',
        'classification:change_status',
        'classification.lifecycle',
        classificationReferenceId,
        organizationScopeReferenceId,
        true
      )
    };
    const approved = service.changeClassificationStatus(approvalInput);
    assert.equal(approved.ok, true);
    assert.deepEqual(
      service.changeClassificationStatus(approvalInput),
      approved
    );
    assert.equal(traces.visibleTo(['Internal']).length, 3);
    const conflict = service.changeClassificationStatus({
      ...approvalInput,
      targetStatus: 'Rejected',
      targetReviewStatus: 'Rejected'
    });
    assert.equal(conflict.ok, false);
    if (!conflict.ok) assert.equal(conflict.error.code, 'IdempotencyConflict');
  });

  it('returns non-enumerating reference validation across organization scope', () => {
    const { service } = setup();
    assert.equal(createClassification(service).ok, true);
    const result = service.validateClassificationReference({
      classificationReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-service',
      governance: governance(
        'classification.validate_reference',
        'classification:validate_reference',
        'classification.reference',
        classificationReferenceId,
        'organization:ref:other-scope'
      )
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.isValid, false);
      assert.equal(result.value.reasonCode, 'NotFound');
      assert.equal(result.value.classificationScheme, null);
    }
  });

  it('rolls back creation when Event trace handoff fails', () => {
    const failing = new FailingTracePort(1);
    const { service, store } = setup(failing);
    const result = createClassification(service);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, 'EventTraceFailed');
    assert.equal(store.list().length, 0);
  });
});
