import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreEvidenceService,
  CoreIdempotencyRegistry,
  CoreInMemoryEvidenceServiceStore,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  createCoreSafeError,
  type CoreEventId,
  type CoreEvidenceGovernanceContext,
  type CoreMvpObjectBaseRecord
} from '../../src/index.ts';

const evidenceReferenceId = 'evidence:ref:00012';
const organizationReferenceId = 'organization:ref:scope-0001';
const evidenceReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (reference) => reference.referenceId === evidenceReferenceId
);

if (!evidenceReference)
  throw new Error('Evidence fixture reference is missing.');
const governedEvidenceReference = evidenceReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = evidenceReferenceId,
  humanReviewRequired = false,
  authorizedOrganizationReferenceId = organizationReferenceId
): CoreEvidenceGovernanceContext {
  const humanReviewReferenceId = humanReviewRequired
    ? 'human-review:ref:evidence-042b'
    : null;
  return {
    correlationId: 'corr:core-task-042b',
    auditContextReferenceId: 'audit:ctx:core-task-042b',
    authorizedOrganizationReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-042b',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-042b'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-042b',
      policyDecision: humanReviewRequired ? 'HumanReviewRequired' : 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-042b'
    },
    review: {
      humanReviewRequired,
      humanReviewReferenceId,
      reviewStatus: humanReviewRequired ? 'Completed' : null,
      reviewScope: humanReviewRequired ? 'evidence-professional-review' : null,
      reviewDecision: humanReviewRequired ? 'Approved' : null,
      reviewerUserReferenceId: humanReviewRequired
        ? 'user:ref:actor-0001'
        : null,
      targetObjectType: 'evidence-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'evidence-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-042b',
      policyDecisionReferenceId: 'policy:decision:allow-042b',
      humanReviewReferenceId,
      correlationId: 'corr:core-task-042b'
    }
  };
}

function objectRecord(): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: evidenceReferenceId,
    objectType: createCoreObjectType('evidence-record'),
    domainId: 'evidence',
    objectContractId: createCoreContractId(
      'core-object-evidence-record-contract'
    ),
    status: 'draft',
    version: {
      version: 1,
      createdAt: '2026-07-14T10:00:00.000Z'
    },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-14T10:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-042b'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organizationReferenceId
    }
  };
}

function buildHarness() {
  const store = new CoreInMemoryEvidenceServiceStore();
  const traces = new CoreEventTraceRegistry();
  const clocks = Array.from({ length: 32 }, (_, index) =>
    new Date(Date.UTC(2026, 6, 14, 10, index + 1)).toISOString()
  );
  const dependencies = {
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS
    ]),
    requestingServiceDirectory: [
      { domainId: 'evidence' as const, serviceType: 'evidence-service' }
    ],
    now: () => clocks.shift() ?? '2026-07-14T10:59:00.000Z',
    eventIdFactory: (
      operation: string,
      referenceId: string,
      idempotencyKey: string
    ) =>
      createCoreEventId(
        `event-${operation}-${referenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'core-task-042b-evidence-cursor-secret'
  };
  return {
    store,
    traces,
    dependencies,
    service: new CoreEvidenceService(dependencies)
  };
}

function createEvidence(service: CoreEvidenceService) {
  return service.createEvidence({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedEvidenceReference,
    evidenceType: 'UseEvidence',
    evidencePurpose: 'ProofOfUse',
    evidenceStatus: 'Draft',
    reviewStatus: 'Unreviewed',
    confidentialityLevel: 'Confidential',
    sourceReliability: 'ClientProvided',
    sourceType: 'ClientProvided',
    sourceReferenceId: 'source:client:042b',
    idempotencyKey: 'idem:create:evidence-042b',
    governance: governance(
      'evidence.create',
      'evidence:create',
      'evidence.write'
    )
  });
}

function errorCode(result: {
  readonly ok: boolean;
  readonly error?: { readonly code: string };
}): string | null {
  return result.ok ? null : (result.error?.code ?? null);
}

describe('CORE-TASK-042B Evidence Service MVP completion', () => {
  it('updates governed metadata and links required MVP relationships', () => {
    const { service } = buildHarness();
    assert.equal(createEvidence(service).ok, true);

    const updated = service.updateEvidence({
      evidenceReferenceId,
      patch: {
        evidenceType: 'OnlineUseEvidence',
        sourceReliability: 'PublicWeb',
        metadata: { captureKind: 'marketplace-listing' }
      },
      idempotencyKey: 'idem:update:evidence-042b',
      governance: governance(
        'evidence.update',
        'evidence:update',
        'evidence.write'
      )
    });
    assert.equal(updated.ok, true);
    if (!updated.ok) return;
    assert.equal(
      updated.value.objectRecord.publicReferenceId,
      evidenceReferenceId
    );
    assert.equal(updated.value.objectRecord.version?.version, 2);
    assert.equal(updated.value.evidenceType, 'OnlineUseEvidence');

    const replay = service.updateEvidence({
      evidenceReferenceId,
      patch: {
        evidenceType: 'OnlineUseEvidence',
        sourceReliability: 'PublicWeb',
        metadata: { captureKind: 'marketplace-listing' }
      },
      idempotencyKey: 'idem:update:evidence-042b',
      governance: governance(
        'evidence.update',
        'evidence:update',
        'evidence.write'
      )
    });
    assert.equal(replay.ok, true);
    if (replay.ok) assert.deepEqual(replay.value, updated.value);

    const conflict = service.updateEvidence({
      evidenceReferenceId,
      patch: { evidenceType: 'OwnershipEvidence' },
      idempotencyKey: 'idem:update:evidence-042b',
      governance: governance(
        'evidence.update',
        'evidence:update',
        'evidence.write'
      )
    });
    assert.equal(errorCode(conflict), 'IdempotencyConflict');

    const trademark = service.linkEvidenceTrademark({
      evidenceReferenceId,
      trademarkReferenceId: 'trademark:ref:00008',
      idempotencyKey: 'idem:link:trademark-042b',
      governance: governance(
        'evidence.link_trademark',
        'evidence:link_trademark',
        'evidence.relationship'
      )
    });
    assert.equal(trademark.ok, true);

    const brand = service.linkEvidenceBrand({
      evidenceReferenceId,
      brandReferenceId: 'brand:ref:00007',
      idempotencyKey: 'idem:link:brand-042b',
      governance: governance(
        'evidence.link_brand',
        'evidence:link_brand',
        'evidence.relationship'
      )
    });
    assert.equal(brand.ok, true);

    const classification = service.linkEvidenceClassification({
      evidenceReferenceId,
      classificationReferenceId: 'classification:ref:00010',
      goodsServicesItemReferenceIds: ['classification-item:ref:0001'],
      idempotencyKey: 'idem:link:classification-042b',
      governance: governance(
        'evidence.link_classification',
        'evidence:link_classification',
        'evidence.relationship'
      )
    });
    assert.equal(classification.ok, true);

    const validation = service.validateEvidenceReference({
      evidenceReferenceId,
      requestingDomain: 'evidence',
      requestingService: 'evidence-service',
      governance: governance(
        'evidence.validate_reference',
        'evidence:validate_reference',
        'evidence.reference'
      )
    });
    assert.equal(validation.ok, true);
    if (!validation.ok) return;
    assert.equal(validation.value.trademarkLinked, true);
    assert.equal(validation.value.brandLinked, true);
    assert.equal(validation.value.classificationLinked, true);
    assert.equal(validation.value.goodsServicesItemsLinked, true);
  });

  it('requires Reviewed before a professional Evidence decision', () => {
    const { service } = buildHarness();
    assert.equal(createEvidence(service).ok, true);

    assert.equal(
      service.requireEvidenceReview({
        evidenceReferenceId,
        reviewNoteReference: 'review-note:required:042b',
        idempotencyKey: 'idem:review-required:042b',
        governance: governance(
          'evidence.require_review',
          'evidence:require_review',
          'evidence.review'
        )
      }).ok,
      true
    );

    const directAcceptance = service.reviewEvidence({
      evidenceReferenceId,
      targetReviewStatus: 'AcceptedForUse',
      reviewNoteReference: 'review-note:accept:direct-042b',
      idempotencyKey: 'idem:review:direct-accept-042b',
      governance: governance(
        'evidence.review',
        'evidence:review',
        'evidence.review',
        evidenceReferenceId,
        true
      )
    });
    assert.equal(errorCode(directAcceptance), 'InvalidEvidenceTransition');

    const reviewed = service.reviewEvidence({
      evidenceReferenceId,
      targetReviewStatus: 'HumanReviewed',
      reviewNoteReference: 'review-note:human-reviewed-042b',
      idempotencyKey: 'idem:review:human-042b',
      governance: governance(
        'evidence.review',
        'evidence:review',
        'evidence.review',
        evidenceReferenceId,
        true
      )
    });
    assert.equal(reviewed.ok, true);
    if (!reviewed.ok) return;
    assert.equal(reviewed.value.evidenceStatus, 'Reviewed');

    const accepted = service.reviewEvidence({
      evidenceReferenceId,
      targetReviewStatus: 'AcceptedForUse',
      reviewNoteReference: 'review-note:accepted-042b',
      idempotencyKey: 'idem:review:accepted-042b',
      governance: governance(
        'evidence.review',
        'evidence:review',
        'evidence.review',
        evidenceReferenceId,
        true
      )
    });
    assert.equal(accepted.ok, true);
    if (!accepted.ok) return;
    assert.equal(accepted.value.evidenceStatus, 'Accepted');

    const filed = service.changeEvidenceStatus({
      evidenceReferenceId,
      targetStatus: 'Filed',
      idempotencyKey: 'idem:status:filed-042b',
      governance: governance(
        'evidence.change_status',
        'evidence:change_status',
        'evidence.lifecycle'
      )
    });
    assert.equal(filed.ok, true);

    const archived = service.changeEvidenceStatus({
      evidenceReferenceId,
      targetStatus: 'Archived',
      reasonReference: 'reason:archive:042b',
      idempotencyKey: 'idem:status:archived-042b',
      governance: governance(
        'evidence.change_status',
        'evidence:change_status',
        'evidence.lifecycle'
      )
    });
    assert.equal(archived.ok, true);

    const deleted = service.changeEvidenceStatus({
      evidenceReferenceId,
      targetStatus: 'DeletedReferenceOnly',
      reasonReference: 'reason:delete-reference:042b',
      idempotencyKey: 'idem:status:deleted-042b',
      governance: governance(
        'evidence.change_status',
        'evidence:change_status',
        'evidence.lifecycle'
      )
    });
    assert.equal(deleted.ok, true);
  });

  it('rolls back governed updates when Event append fails', () => {
    const harness = buildHarness();
    assert.equal(createEvidence(harness.service).ok, true);
    const before = harness.store.get(evidenceReferenceId);
    assert.ok(before);

    const failingService = new CoreEvidenceService({
      ...harness.dependencies,
      idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
      eventTracePort: {
        append: () => ({
          ok: false as const,
          error: createCoreSafeError({
            code: 'EventTraceFailed',
            category: 'Event',
            message: 'Event trace failed.'
          })
        })
      }
    });

    const failed = failingService.updateEvidence({
      evidenceReferenceId,
      patch: { evidenceType: 'OwnershipEvidence' },
      idempotencyKey: 'idem:update:event-failure-042b',
      governance: governance(
        'evidence.update',
        'evidence:update',
        'evidence.write'
      )
    });
    assert.equal(errorCode(failed), 'EventTraceFailed');
    assert.deepEqual(harness.store.get(evidenceReferenceId), before);
  });

  it('does not enumerate Evidence across organization scopes', () => {
    const { service } = buildHarness();
    assert.equal(createEvidence(service).ok, true);
    const validation = service.validateEvidenceReference({
      evidenceReferenceId,
      requestingDomain: 'evidence',
      requestingService: 'evidence-service',
      governance: governance(
        'evidence.validate_reference',
        'evidence:validate_reference',
        'evidence.reference',
        evidenceReferenceId,
        false,
        'organization:ref:other-scope'
      )
    });
    assert.equal(validation.ok, true);
    if (!validation.ok) return;
    assert.equal(validation.value.reasonCode, 'NotFound');
    assert.equal(validation.value.trademarkLinked, false);
    assert.equal(validation.value.policyHint, null);
  });
});
