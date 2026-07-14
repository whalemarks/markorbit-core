import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../behaviors/index.ts';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../contracts/service/core-service-contract-skeletons.ts';
import { createCoreEventId, type CoreEventId } from '../events/index.ts';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  type CoreMvpObjectBaseRecord
} from '../objects/core-mvp-object-base-record.ts';
import {
  CORE_CLASSIFICATION_COLLECTION_TARGET,
  CoreClassificationService,
  CoreInMemoryClassificationServiceStore,
  type CoreClassificationGovernanceContext,
  type CoreClassificationReviewStatus,
  type CoreClassificationStatus
} from '../services/classification/index.ts';

export interface CoreClassificationServiceEvidenceFixtureIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(
  code: string,
  message: string,
  path?: string
): CoreClassificationServiceEvidenceFixtureIssue {
  return { code, message, path };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationScopeReferenceId: string,
  humanReviewRequired = false
): CoreClassificationGovernanceContext {
  const reviewReferenceId = humanReviewRequired
    ? 'human-review:ref:classification-040'
    : null;
  return {
    correlationId: 'corr:core-task-040',
    auditContextReferenceId: 'audit:ctx:core-task-040',
    authorizedOrganizationReferenceId: organizationScopeReferenceId,
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
      policyDecision: humanReviewRequired
        ? 'HumanReviewRequired'
        : 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-040'
    },
    review: {
      humanReviewRequired,
      humanReviewReferenceId: reviewReferenceId,
      reviewStatus: humanReviewRequired ? 'Completed' : null,
      reviewScope: humanReviewRequired
        ? 'classification-filing-scope-review'
        : null,
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

function referenceRecord(value: Record<string, unknown>): CoreReferenceRecord {
  return {
    referenceId: String(value.referenceId),
    objectType: String(value.objectType),
    referenceDomain: String(value.referenceDomain),
    status: String(value.status) as CoreReferenceRecord['status']
  };
}

export function validateCoreClassificationServiceEvidenceFixture(
  fixture: unknown
): readonly CoreClassificationServiceEvidenceFixtureIssue[] {
  const issues: CoreClassificationServiceEvidenceFixtureIssue[] = [];
  if (!isRecord(fixture)) {
    return [
      issue(
        'core.classification_service.evidence_fixture_invalid',
        'Classification Service evidence fixture must be an object.'
      )
    ];
  }

  const publicReference = fixture.publicReferenceRecord;
  const objectRecord = fixture.objectRecord;
  const createRequest = fixture.createRequest;
  const conflictingCreateRequest = fixture.conflictingCreateRequest;
  const reviewRequiredRequest = fixture.reviewRequiredRequest;
  const approvalRequest = fixture.approvalRequest;
  const approvalConflictRequest = fixture.approvalConflictRequest;
  const expected = fixture.expected;
  if (
    fixture.fixtureType !==
      'core_classification_service_core_scope_validation' ||
    typeof fixture.classificationReferenceId !== 'string' ||
    typeof fixture.organizationScopeReferenceId !== 'string' ||
    typeof fixture.fixedNow !== 'string' ||
    typeof fixture.reviewNow !== 'string' ||
    typeof fixture.approvedNow !== 'string' ||
    !isRecord(publicReference) ||
    !isRecord(objectRecord) ||
    !isRecord(createRequest) ||
    !isRecord(conflictingCreateRequest) ||
    !isRecord(reviewRequiredRequest) ||
    !isRecord(approvalRequest) ||
    !isRecord(approvalConflictRequest) ||
    !isRecord(expected)
  ) {
    return [
      issue(
        'core.classification_service.evidence_fixture_shape',
        'Classification Service evidence fixture is missing executable fields.'
      )
    ];
  }

  const classificationReferenceRecord = referenceRecord(publicReference);
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryClassificationServiceStore();
  const clocks = [
    String(fixture.fixedNow),
    String(fixture.reviewNow),
    String(fixture.approvedNow)
  ];
  const service = new CoreClassificationService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      classificationReferenceRecord
    ]),
    now: () => clocks.shift() ?? String(fixture.approvedNow),
    eventIdFactory: (operation, classificationReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-evidence-${operation}-${classificationReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'classification-service-evidence-fixture-secret'
  });

  try {
    const createInput = {
      objectRecord: objectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: classificationReferenceRecord,
      classificationScheme: createRequest.classificationScheme,
      classReferences: createRequest.classReferences,
      goodsServicesItems: createRequest.goodsServicesItems,
      classificationStatus: createRequest.classificationStatus,
      reviewStatus: createRequest.reviewStatus,
      trademarkReferenceId: String(createRequest.trademarkReferenceId),
      brandReferenceId: String(createRequest.brandReferenceId),
      jurisdictionReferenceId: String(createRequest.jurisdictionReferenceId),
      sourceReference: String(createRequest.sourceReference),
      idempotencyKey: String(createRequest.idempotencyKey),
      governance: governance(
        'classification.create',
        'classification:create',
        'classification.write',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const created = service.createClassification(createInput);
    if (
      !created.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreate
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_create_failed',
          'Classification Service create scenario failed.',
          'createRequest'
        )
      );
    }

    const replayedCreate = service.createClassification(createInput);
    if (
      !replayedCreate.ok ||
      !created.ok ||
      JSON.stringify(replayedCreate.value) !== JSON.stringify(created.value) ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreateReplay
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_create_replay_failed',
          'Classification Service create replay failed.',
          'createRequest'
        )
      );
    }

    const createConflict = service.createClassification({
      ...createInput,
      classificationScheme: conflictingCreateRequest.classificationScheme
    });
    if (
      createConflict.ok ||
      createConflict.error.code !== expected.createConflictCode
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_create_conflict_failed',
          'Classification Service create conflict failed.',
          'conflictingCreateRequest'
        )
      );
    }

    const get = service.getClassification({
      classificationReferenceId: fixture.classificationReferenceId,
      governance: governance(
        'classification.read',
        'classification:read',
        'classification.read',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    const list = service.listClassifications({
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'classification.list',
        'classification:list',
        'classification.list',
        CORE_CLASSIFICATION_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    const draftValidation = service.validateClassification({
      classificationReferenceId: fixture.classificationReferenceId,
      governance: governance(
        'classification.validate',
        'classification:validate',
        'classification.validation',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    const referenceValidation = service.validateClassificationReference({
      classificationReferenceId: fixture.classificationReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-service',
      governance: governance(
        'classification.validate_reference',
        'classification:validate_reference',
        'classification.reference',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !get.ok ||
      !list.ok ||
      list.value.items.length !== 1 ||
      'goodsServicesItems' in list.value.items[0] ||
      !draftValidation.ok ||
      draftValidation.value.reasonCode !==
        expected.draftValidationReason ||
      !referenceValidation.ok ||
      !referenceValidation.value.isValid
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_read_failed',
          'Classification Service read/list/validation scenarios failed.'
        )
      );
    }

    const reviewInput = {
      classificationReferenceId: fixture.classificationReferenceId,
      targetStatus: String(
        reviewRequiredRequest.targetStatus
      ) as CoreClassificationStatus,
      targetReviewStatus: String(
        reviewRequiredRequest.targetReviewStatus
      ) as CoreClassificationReviewStatus,
      idempotencyKey: String(reviewRequiredRequest.idempotencyKey),
      governance: governance(
        'classification.change_status',
        'classification:change_status',
        'classification.lifecycle',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const reviewRequired = service.changeClassificationStatus(reviewInput);
    if (
      !reviewRequired.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReviewRequired
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_review_required_failed',
          'Classification Service review-required transition failed.',
          'reviewRequiredRequest'
        )
      );
    }

    const approvalWithoutReview = service.changeClassificationStatus({
      classificationReferenceId: fixture.classificationReferenceId,
      targetStatus: String(
        approvalRequest.targetStatus
      ) as CoreClassificationStatus,
      targetReviewStatus: String(
        approvalRequest.targetReviewStatus
      ) as CoreClassificationReviewStatus,
      idempotencyKey: `${String(approvalRequest.idempotencyKey)}-without-review`,
      governance: governance(
        'classification.change_status',
        'classification:change_status',
        'classification.lifecycle',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId,
        false
      )
    });
    if (
      approvalWithoutReview.ok ||
      approvalWithoutReview.error.code !==
        expected.approvalWithoutReviewCode
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_review_gate_failed',
          'Classification Service approval did not require human review.',
          'approvalRequest'
        )
      );
    }

    const approvalInput = {
      classificationReferenceId: fixture.classificationReferenceId,
      targetStatus: String(
        approvalRequest.targetStatus
      ) as CoreClassificationStatus,
      targetReviewStatus: String(
        approvalRequest.targetReviewStatus
      ) as CoreClassificationReviewStatus,
      idempotencyKey: String(approvalRequest.idempotencyKey),
      governance: governance(
        'classification.change_status',
        'classification:change_status',
        'classification.lifecycle',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId,
        true
      )
    };
    const approved = service.changeClassificationStatus(approvalInput);
    const approvedReplay = service.changeClassificationStatus(approvalInput);
    const approvedValidation = service.validateClassification({
      classificationReferenceId: fixture.classificationReferenceId,
      governance: governance(
        'classification.validate',
        'classification:validate',
        'classification.validation',
        fixture.classificationReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !approved.ok ||
      !approvedReplay.ok ||
      JSON.stringify(approvedReplay.value) !== JSON.stringify(approved.value) ||
      !approvedValidation.ok ||
      approvedValidation.value.reasonCode !==
        expected.approvedValidationReason ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterApprovalReplay
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_approval_failed',
          'Classification Service governed approval or replay failed.',
          'approvalRequest'
        )
      );
    }

    const approvalConflict = service.changeClassificationStatus({
      ...approvalInput,
      targetStatus: String(
        approvalConflictRequest.targetStatus
      ) as CoreClassificationStatus,
      targetReviewStatus: String(
        approvalConflictRequest.targetReviewStatus
      ) as CoreClassificationReviewStatus
    });
    if (
      approvalConflict.ok ||
      approvalConflict.error.code !== expected.approvalConflictCode
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_approval_conflict_failed',
          'Classification Service approval idempotency conflict failed.',
          'approvalConflictRequest'
        )
      );
    }

    const payloads = traces
      .visibleTo(['Internal'])
      .map((entry) => JSON.stringify(entry.event.payload));
    if (
      payloads.some(
        (payload) =>
          payload.includes('goodsServicesItems') ||
          payload.includes('classification-item:ref:0001')
      )
    ) {
      issues.push(
        issue(
          'core.classification_service.evidence_event_leak',
          'Classification Service Event trace exposed item details.'
        )
      );
    }
  } catch {
    issues.push(
      issue(
        'core.classification_service.evidence_execution_failed',
        'Classification Service evidence fixture execution failed safely.'
      )
    );
  }

  return issues;
}
