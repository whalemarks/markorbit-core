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
  CORE_DOCUMENT_COLLECTION_TARGET,
  CoreDocumentService,
  CoreInMemoryDocumentServiceStore,
  type CoreDocumentGovernanceContext,
  type CoreDocumentReviewDecisionStatus,
  type CoreDocumentStatus
} from '../services/document/index.ts';

export interface CoreDocumentServiceEvidenceFixtureIssue {
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
): CoreDocumentServiceEvidenceFixtureIssue {
  return { code, message, path };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationScopeReferenceId: string,
  humanReviewRequired = false
): CoreDocumentGovernanceContext {
  const reviewReferenceId = humanReviewRequired
    ? 'human-review:ref:document-041'
    : null;
  return {
    correlationId: 'corr:core-task-041',
    auditContextReferenceId: 'audit:ctx:core-task-041',
    authorizedOrganizationReferenceId: organizationScopeReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-041'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      policyDecision: humanReviewRequired ? 'HumanReviewRequired' : 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-041'
    },
    review: {
      humanReviewRequired,
      humanReviewReferenceId: reviewReferenceId,
      reviewStatus: humanReviewRequired ? 'Completed' : null,
      reviewScope: humanReviewRequired ? 'document-professional-review' : null,
      reviewDecision: humanReviewRequired ? 'Approved' : null,
      reviewerUserReferenceId: humanReviewRequired
        ? 'user:ref:actor-0001'
        : null,
      targetObjectType: 'document-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'document-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: reviewReferenceId,
      correlationId: 'corr:core-task-041'
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

export function validateCoreDocumentServiceEvidenceFixture(
  fixture: unknown
): readonly CoreDocumentServiceEvidenceFixtureIssue[] {
  const issues: CoreDocumentServiceEvidenceFixtureIssue[] = [];
  if (!isRecord(fixture)) {
    return [
      issue(
        'core.document_service.evidence_fixture_invalid',
        'Document Service evidence fixture must be an object.'
      )
    ];
  }

  const publicReference = fixture.publicReferenceRecord;
  const objectRecord = fixture.objectRecord;
  const createRequest = fixture.createRequest;
  const conflictingCreateRequest = fixture.conflictingCreateRequest;
  const fileRequest = fixture.fileRequest;
  const fileConflictRequest = fixture.fileConflictRequest;
  const reviewRequiredRequest = fixture.reviewRequiredRequest;
  const approvalRequest = fixture.approvalRequest;
  const approvalConflictRequest = fixture.approvalConflictRequest;
  const archiveRequest = fixture.archiveRequest;
  const expected = fixture.expected;
  if (
    fixture.fixtureType !==
      'core_document_service_governed_artifact_foundation' ||
    typeof fixture.documentReferenceId !== 'string' ||
    typeof fixture.organizationScopeReferenceId !== 'string' ||
    !Array.isArray(fixture.clocks) ||
    !isRecord(publicReference) ||
    !isRecord(objectRecord) ||
    !isRecord(createRequest) ||
    !isRecord(conflictingCreateRequest) ||
    !isRecord(fileRequest) ||
    !isRecord(fileConflictRequest) ||
    !isRecord(reviewRequiredRequest) ||
    !isRecord(approvalRequest) ||
    !isRecord(approvalConflictRequest) ||
    !isRecord(archiveRequest) ||
    !isRecord(expected)
  ) {
    return [
      issue(
        'core.document_service.evidence_fixture_shape',
        'Document Service evidence fixture is missing executable fields.'
      )
    ];
  }

  const documentReferenceRecord = referenceRecord(publicReference);
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryDocumentServiceStore();
  const clocks = fixture.clocks.map(String);
  const service = new CoreDocumentService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      documentReferenceRecord
    ]),
    now: () => clocks.shift() ?? String(fixture.clocks.at(-1)),
    eventIdFactory: (operation, documentReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-evidence-${operation}-${documentReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'document-service-evidence-fixture-secret'
  });

  try {
    const createInput = {
      objectRecord: objectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: documentReferenceRecord,
      documentType: createRequest.documentType,
      titleReference: String(createRequest.titleReference),
      documentStatus: createRequest.documentStatus,
      reviewStatus: createRequest.reviewStatus,
      confidentialityLevel: createRequest.confidentialityLevel,
      versionReference:
        createRequest.versionReference === null
          ? null
          : String(createRequest.versionReference),
      sourceReference: String(createRequest.sourceReference),
      idempotencyKey: String(createRequest.idempotencyKey),
      governance: governance(
        'document.create',
        'document:create',
        'document.write',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const created = service.createDocument(createInput);
    if (
      !created.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreate
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_create_failed',
          'Document Service create scenario failed.',
          'createRequest'
        )
      );
    }

    const replayedCreate = service.createDocument(createInput);
    if (
      !replayedCreate.ok ||
      !created.ok ||
      JSON.stringify(replayedCreate.value) !== JSON.stringify(created.value) ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreateReplay
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_create_replay_failed',
          'Document Service create replay failed.',
          'createRequest'
        )
      );
    }

    const createConflict = service.createDocument({
      ...createInput,
      documentType: conflictingCreateRequest.documentType
    });
    if (
      createConflict.ok ||
      createConflict.error.code !== expected.createConflictCode
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_create_conflict_failed',
          'Document Service create conflict failed.',
          'conflictingCreateRequest'
        )
      );
    }

    const get = service.getDocument({
      documentReferenceId: fixture.documentReferenceId,
      governance: governance(
        'document.read',
        'document:read',
        'document.read',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    const list = service.listDocuments({
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'document.list',
        'document:list',
        'document.list',
        CORE_DOCUMENT_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    const draftReference = service.validateDocumentReference({
      documentReferenceId: fixture.documentReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-service',
      governance: governance(
        'document.validate_reference',
        'document:validate_reference',
        'document.reference',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !get.ok ||
      !list.ok ||
      list.value.items.length !== 1 ||
      'titleReference' in list.value.items[0] ||
      'fileReferenceId' in list.value.items[0] ||
      'sourceReference' in list.value.items[0] ||
      !draftReference.ok ||
      draftReference.value.reasonCode !== expected.draftValidationReason
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_read_failed',
          'Document Service read/list/reference scenarios failed.'
        )
      );
    }

    const fileInput = {
      documentReferenceId: fixture.documentReferenceId,
      fileReferenceId: String(fileRequest.fileReferenceId),
      fileSourceReference: String(fileRequest.fileSourceReference),
      idempotencyKey: String(fileRequest.idempotencyKey),
      governance: governance(
        'document.link_file',
        'document:link_file',
        'document.file',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const linked = service.linkDocumentFile(fileInput);
    const linkedReplay = service.linkDocumentFile(fileInput);
    const fileConflict = service.linkDocumentFile({
      ...fileInput,
      fileReferenceId: String(fileConflictRequest.fileReferenceId)
    });
    if (
      !linked.ok ||
      !linkedReplay.ok ||
      linkedReplay.value.fileReferenceId !== linked.value.fileReferenceId ||
      fileConflict.ok ||
      fileConflict.error.code !== expected.fileConflictCode ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterFileReplay
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_file_link_failed',
          'Document Service file-link scenarios failed.',
          'fileRequest'
        )
      );
    }

    const reviewRequiredInput = {
      documentReferenceId: fixture.documentReferenceId,
      reviewNoteReference: String(reviewRequiredRequest.reviewNoteReference),
      idempotencyKey: String(reviewRequiredRequest.idempotencyKey),
      governance: governance(
        'document.require_review',
        'document:require_review',
        'document.review',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const reviewRequired = service.requireDocumentReview(reviewRequiredInput);
    if (
      !reviewRequired.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReviewRequired
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_review_required_failed',
          'Document Service review-required scenario failed.',
          'reviewRequiredRequest'
        )
      );
    }

    const approvalWithoutReview = service.reviewDocument({
      documentReferenceId: fixture.documentReferenceId,
      targetReviewStatus: String(
        approvalRequest.targetReviewStatus
      ) as CoreDocumentReviewDecisionStatus,
      reviewNoteReference: String(approvalRequest.reviewNoteReference),
      idempotencyKey: `${String(approvalRequest.idempotencyKey)}-without-review`,
      governance: governance(
        'document.review',
        'document:review',
        'document.review',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId,
        false
      )
    });
    if (
      approvalWithoutReview.ok ||
      approvalWithoutReview.error.code !== expected.approvalWithoutReviewCode
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_review_gate_failed',
          'Document Service approval did not require human review.',
          'approvalRequest'
        )
      );
    }

    const approvalInput = {
      documentReferenceId: fixture.documentReferenceId,
      targetReviewStatus: String(
        approvalRequest.targetReviewStatus
      ) as CoreDocumentReviewDecisionStatus,
      reviewNoteReference: String(approvalRequest.reviewNoteReference),
      idempotencyKey: String(approvalRequest.idempotencyKey),
      governance: governance(
        'document.review',
        'document:review',
        'document.review',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId,
        true
      )
    };
    const approved = service.reviewDocument(approvalInput);
    const approvedReplay = service.reviewDocument(approvalInput);
    const approvalConflict = service.reviewDocument({
      ...approvalInput,
      targetReviewStatus: String(
        approvalConflictRequest.targetReviewStatus
      ) as CoreDocumentReviewDecisionStatus
    });
    if (
      !approved.ok ||
      !approvedReplay.ok ||
      approved.value.documentStatus !== 'Approved' ||
      approved.value.reviewStatus !== 'ApprovedForUse' ||
      approvalConflict.ok ||
      approvalConflict.error.code !== expected.approvalConflictCode ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterApprovalReplay
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_approval_failed',
          'Document Service approval scenarios failed.',
          'approvalRequest'
        )
      );
    }

    const approvedReference = service.validateDocumentReference({
      documentReferenceId: fixture.documentReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-service',
      governance: governance(
        'document.validate_reference',
        'document:validate_reference',
        'document.reference',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !approvedReference.ok ||
      approvedReference.value.reasonCode !== expected.approvedValidationReason ||
      !approvedReference.value.isValid ||
      approvedReference.value.reviewRequired
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_approved_validation_failed',
          'Document Service approved reference validation failed.'
        )
      );
    }

    const archiveInput = {
      documentReferenceId: fixture.documentReferenceId,
      targetStatus: String(archiveRequest.targetStatus) as CoreDocumentStatus,
      reasonReference: String(archiveRequest.reasonReference),
      idempotencyKey: String(archiveRequest.idempotencyKey),
      governance: governance(
        'document.change_status',
        'document:change_status',
        'document.lifecycle',
        fixture.documentReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const archived = service.changeDocumentStatus(archiveInput);
    const archivedReplay = service.changeDocumentStatus(archiveInput);
    if (
      !archived.ok ||
      !archivedReplay.ok ||
      archived.value.documentStatus !== 'Archived' ||
      store.list().length !== expected.recordCountAfterArchive ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterArchiveReplay
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_archive_failed',
          'Document Service archive scenarios failed.',
          'archiveRequest'
        )
      );
    }

    const serializedTraces = JSON.stringify(traces.visibleTo(['Internal']));
    if (
      serializedTraces.includes(String(createRequest.titleReference)) ||
      serializedTraces.includes(String(createRequest.sourceReference)) ||
      serializedTraces.includes(String(fileRequest.fileSourceReference))
    ) {
      issues.push(
        issue(
          'core.document_service.evidence_payload_unsafe',
          'Document Service Event payload exposed restricted artifact details.'
        )
      );
    }
  } catch {
    issues.push(
      issue(
        'core.document_service.evidence_execution_failed',
        'Document Service executable evidence failed safely.'
      )
    );
  }

  return issues;
}
