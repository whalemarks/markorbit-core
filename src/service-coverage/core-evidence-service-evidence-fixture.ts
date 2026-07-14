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
  CORE_EVIDENCE_COLLECTION_TARGET,
  CoreEvidenceService,
  CoreInMemoryEvidenceServiceStore,
  type CoreEvidenceGovernanceContext,
  type CoreEvidenceReviewDecisionStatus,
  type CoreEvidenceSourceType,
  type CoreEvidenceStatus
} from '../services/evidence/index.ts';

export interface CoreEvidenceServiceEvidenceFixtureIssue {
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
): CoreEvidenceServiceEvidenceFixtureIssue {
  return { code, message, path };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationScopeReferenceId: string,
  humanReviewRequired = false
): CoreEvidenceGovernanceContext {
  const reviewReferenceId = humanReviewRequired
    ? 'human-review:ref:evidence-042'
    : null;
  return {
    correlationId: 'corr:core-task-042',
    auditContextReferenceId: 'audit:ctx:core-task-042',
    authorizedOrganizationReferenceId: organizationScopeReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-042'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      policyDecision: humanReviewRequired ? 'HumanReviewRequired' : 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-042'
    },
    review: {
      humanReviewRequired,
      humanReviewReferenceId: reviewReferenceId,
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
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: reviewReferenceId,
      correlationId: 'corr:core-task-042'
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

function errorCode(result: {
  readonly ok: boolean;
  readonly error?: { readonly code: string };
}): string | null {
  return result.ok ? null : (result.error?.code ?? null);
}

export function validateCoreEvidenceServiceEvidenceFixture(
  fixture: unknown
): readonly CoreEvidenceServiceEvidenceFixtureIssue[] {
  const issues: CoreEvidenceServiceEvidenceFixtureIssue[] = [];
  if (!isRecord(fixture)) {
    return [
      issue(
        'core.evidence_service.evidence_fixture_invalid',
        'Evidence Service evidence fixture must be an object.'
      )
    ];
  }

  const publicReference = fixture.publicReferenceRecord;
  const secondaryDocumentReference = fixture.secondaryDocumentReferenceRecord;
  const objectRecord = fixture.objectRecord;
  const createRequest = fixture.createRequest;
  const conflictingCreateRequest = fixture.conflictingCreateRequest;
  const sourceRequest = fixture.sourceRequest;
  const sourceConflictRequest = fixture.sourceConflictRequest;
  const claimRequest = fixture.claimRequest;
  const claimConflictRequest = fixture.claimConflictRequest;
  const documentRequest = fixture.documentRequest;
  const documentConflictRequest = fixture.documentConflictRequest;
  const reviewRequiredRequest = fixture.reviewRequiredRequest;
  const approvalRequest = fixture.approvalRequest;
  const approvalConflictRequest = fixture.approvalConflictRequest;
  const archiveRequest = fixture.archiveRequest;
  const expected = fixture.expected;
  if (
    fixture.fixtureType !== 'core_evidence_service_proof_layer_foundation' ||
    typeof fixture.evidenceReferenceId !== 'string' ||
    typeof fixture.organizationScopeReferenceId !== 'string' ||
    !Array.isArray(fixture.clocks) ||
    !isRecord(publicReference) ||
    !isRecord(secondaryDocumentReference) ||
    !isRecord(objectRecord) ||
    !isRecord(createRequest) ||
    !isRecord(conflictingCreateRequest) ||
    !isRecord(sourceRequest) ||
    !isRecord(sourceConflictRequest) ||
    !isRecord(claimRequest) ||
    !isRecord(claimConflictRequest) ||
    !isRecord(documentRequest) ||
    !isRecord(documentConflictRequest) ||
    !isRecord(reviewRequiredRequest) ||
    !isRecord(approvalRequest) ||
    !isRecord(approvalConflictRequest) ||
    !isRecord(archiveRequest) ||
    !isRecord(expected)
  ) {
    return [
      issue(
        'core.evidence_service.evidence_fixture_shape',
        'Evidence Service evidence fixture is missing executable fields.'
      )
    ];
  }

  const evidenceReferenceRecord = referenceRecord(publicReference);
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryEvidenceServiceStore();
  const clocks = fixture.clocks.map(String);
  const lastClock = clocks.at(-1) ?? '';
  const service = new CoreEvidenceService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      evidenceReferenceRecord,
      referenceRecord(secondaryDocumentReference)
    ]),
    now: () => clocks.shift() ?? lastClock,
    eventIdFactory: (operation, evidenceReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-evidence-${operation}-${evidenceReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'evidence-service-proof-layer-fixture-secret'
  });

  try {
    const createInput = {
      objectRecord: objectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: evidenceReferenceRecord,
      evidenceType: createRequest.evidenceType,
      evidencePurpose: createRequest.evidencePurpose,
      evidenceStatus: createRequest.evidenceStatus,
      reviewStatus: createRequest.reviewStatus,
      confidentialityLevel: createRequest.confidentialityLevel,
      sourceReliability: createRequest.sourceReliability,
      sourceType: createRequest.sourceType,
      sourceReferenceId: String(createRequest.sourceReferenceId),
      idempotencyKey: String(createRequest.idempotencyKey),
      governance: governance(
        'evidence.create',
        'evidence:create',
        'evidence.write',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const created = service.createEvidence(createInput);
    if (
      !created.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreate
    ) {
      issues.push(
        issue(
          'core.evidence_service.create_failed',
          'Evidence create scenario failed.',
          'createRequest'
        )
      );
    }

    const createReplay = service.createEvidence(createInput);
    if (
      !createReplay.ok ||
      !created.ok ||
      JSON.stringify(createReplay.value) !== JSON.stringify(created.value) ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreateReplay
    ) {
      issues.push(
        issue(
          'core.evidence_service.create_replay_failed',
          'Evidence create replay failed.',
          'createRequest'
        )
      );
    }

    const createConflict = service.createEvidence({
      ...createInput,
      evidenceType: conflictingCreateRequest.evidenceType
    });
    if (errorCode(createConflict) !== expected.createConflictCode) {
      issues.push(
        issue(
          'core.evidence_service.create_conflict_failed',
          'Evidence create conflict failed.',
          'conflictingCreateRequest'
        )
      );
    }

    const draftValidation = service.validateEvidenceReference({
      evidenceReferenceId: fixture.evidenceReferenceId,
      requestingDomain: 'evidence',
      requestingService: 'evidence-service',
      governance: governance(
        'evidence.validate_reference',
        'evidence:validate_reference',
        'evidence.reference',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !draftValidation.ok ||
      draftValidation.value.reasonCode !== expected.draftValidationReason
    ) {
      issues.push(
        issue(
          'core.evidence_service.draft_validation_failed',
          'Draft Evidence validation failed.'
        )
      );
    }

    const listed = service.listEvidence({
      filters: { evidenceType: createRequest.evidenceType },
      governance: governance(
        'evidence.list',
        'evidence:list',
        'evidence.list',
        CORE_EVIDENCE_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    if (!listed.ok || listed.value.items.length !== 1) {
      issues.push(
        issue(
          'core.evidence_service.list_failed',
          'Evidence list scenario failed.'
        )
      );
    }

    const sourceInput = {
      evidenceReferenceId: fixture.evidenceReferenceId,
      sourceType: sourceRequest.sourceType as CoreEvidenceSourceType,
      sourceReferenceId: String(sourceRequest.sourceReferenceId),
      idempotencyKey: String(sourceRequest.idempotencyKey),
      governance: governance(
        'evidence.link_source',
        'evidence:link_source',
        'evidence.source',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const sourceLinked = service.linkEvidenceSource(sourceInput);
    if (
      !sourceLinked.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterSource
    ) {
      issues.push(
        issue(
          'core.evidence_service.source_link_failed',
          'Evidence source link failed.',
          'sourceRequest'
        )
      );
    }
    const sourceReplay = service.linkEvidenceSource(sourceInput);
    if (
      !sourceReplay.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterSourceReplay
    ) {
      issues.push(
        issue(
          'core.evidence_service.source_replay_failed',
          'Evidence source replay failed.',
          'sourceRequest'
        )
      );
    }
    const sourceConflict = service.linkEvidenceSource({
      ...sourceInput,
      sourceType: sourceConflictRequest.sourceType as CoreEvidenceSourceType,
      sourceReferenceId: String(sourceConflictRequest.sourceReferenceId)
    });
    if (errorCode(sourceConflict) !== expected.sourceConflictCode) {
      issues.push(
        issue(
          'core.evidence_service.source_conflict_failed',
          'Evidence source conflict failed.',
          'sourceConflictRequest'
        )
      );
    }

    const claimInput = {
      evidenceReferenceId: fixture.evidenceReferenceId,
      claimReferenceId: String(claimRequest.claimReferenceId),
      idempotencyKey: String(claimRequest.idempotencyKey),
      governance: governance(
        'evidence.link_claim',
        'evidence:link_claim',
        'evidence.claim',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const claimLinked = service.linkEvidenceClaim(claimInput);
    if (
      !claimLinked.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterClaim
    ) {
      issues.push(
        issue(
          'core.evidence_service.claim_link_failed',
          'Evidence claim link failed.',
          'claimRequest'
        )
      );
    }
    const claimReplay = service.linkEvidenceClaim(claimInput);
    if (
      !claimReplay.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterClaimReplay
    ) {
      issues.push(
        issue(
          'core.evidence_service.claim_replay_failed',
          'Evidence claim replay failed.',
          'claimRequest'
        )
      );
    }
    const claimConflict = service.linkEvidenceClaim({
      ...claimInput,
      claimReferenceId: String(claimConflictRequest.claimReferenceId)
    });
    if (errorCode(claimConflict) !== expected.claimConflictCode) {
      issues.push(
        issue(
          'core.evidence_service.claim_conflict_failed',
          'Evidence claim conflict failed.',
          'claimConflictRequest'
        )
      );
    }

    const documentInput = {
      evidenceReferenceId: fixture.evidenceReferenceId,
      documentReferenceId: String(documentRequest.documentReferenceId),
      idempotencyKey: String(documentRequest.idempotencyKey),
      governance: governance(
        'evidence.link_document',
        'evidence:link_document',
        'evidence.document',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const documentLinked = service.linkEvidenceDocument(documentInput);
    if (
      !documentLinked.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterDocument
    ) {
      issues.push(
        issue(
          'core.evidence_service.document_link_failed',
          'Evidence Document link failed.',
          'documentRequest'
        )
      );
    }
    const documentReplay = service.linkEvidenceDocument(documentInput);
    if (
      !documentReplay.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterDocumentReplay
    ) {
      issues.push(
        issue(
          'core.evidence_service.document_replay_failed',
          'Evidence Document replay failed.',
          'documentRequest'
        )
      );
    }
    const documentConflict = service.linkEvidenceDocument({
      ...documentInput,
      documentReferenceId: String(documentConflictRequest.documentReferenceId)
    });
    if (errorCode(documentConflict) !== expected.documentConflictCode) {
      issues.push(
        issue(
          'core.evidence_service.document_conflict_failed',
          'Evidence Document conflict failed.',
          'documentConflictRequest'
        )
      );
    }

    const reviewRequired = service.requireEvidenceReview({
      evidenceReferenceId: fixture.evidenceReferenceId,
      reviewNoteReference: String(reviewRequiredRequest.reviewNoteReference),
      idempotencyKey: String(reviewRequiredRequest.idempotencyKey),
      governance: governance(
        'evidence.require_review',
        'evidence:require_review',
        'evidence.review',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !reviewRequired.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReviewRequired
    ) {
      issues.push(
        issue(
          'core.evidence_service.review_required_failed',
          'Evidence review-required transition failed.',
          'reviewRequiredRequest'
        )
      );
    }

    const approvalWithoutReview = service.reviewEvidence({
      evidenceReferenceId: fixture.evidenceReferenceId,
      targetReviewStatus:
        approvalRequest.targetReviewStatus as CoreEvidenceReviewDecisionStatus,
      reviewNoteReference: String(approvalRequest.reviewNoteReference),
      idempotencyKey: String(approvalRequest.idempotencyKey),
      governance: governance(
        'evidence.review',
        'evidence:review',
        'evidence.review',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      errorCode(approvalWithoutReview) !== expected.approvalWithoutReviewCode
    ) {
      issues.push(
        issue(
          'core.evidence_service.approval_gate_failed',
          'Evidence approval gate failed.',
          'approvalRequest'
        )
      );
    }

    const approvalInput = {
      evidenceReferenceId: fixture.evidenceReferenceId,
      targetReviewStatus:
        approvalRequest.targetReviewStatus as CoreEvidenceReviewDecisionStatus,
      reviewNoteReference: String(approvalRequest.reviewNoteReference),
      idempotencyKey: String(approvalRequest.idempotencyKey),
      governance: governance(
        'evidence.review',
        'evidence:review',
        'evidence.review',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId,
        true
      )
    };
    const approved = service.reviewEvidence(approvalInput);
    if (
      !approved.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterApproval
    ) {
      issues.push(
        issue(
          'core.evidence_service.approval_failed',
          'Evidence professional approval failed.',
          'approvalRequest'
        )
      );
    }
    const approvalReplay = service.reviewEvidence(approvalInput);
    if (
      !approvalReplay.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterApprovalReplay
    ) {
      issues.push(
        issue(
          'core.evidence_service.approval_replay_failed',
          'Evidence approval replay failed.',
          'approvalRequest'
        )
      );
    }
    const approvalConflict = service.reviewEvidence({
      ...approvalInput,
      targetReviewStatus:
        approvalConflictRequest.targetReviewStatus as CoreEvidenceReviewDecisionStatus
    });
    if (errorCode(approvalConflict) !== expected.approvalConflictCode) {
      issues.push(
        issue(
          'core.evidence_service.approval_conflict_failed',
          'Evidence approval conflict failed.',
          'approvalConflictRequest'
        )
      );
    }

    const acceptedValidation = service.validateEvidenceReference({
      evidenceReferenceId: fixture.evidenceReferenceId,
      requestingDomain: 'evidence',
      requestingService: 'evidence-service',
      governance: governance(
        'evidence.validate_reference',
        'evidence:validate_reference',
        'evidence.reference',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !acceptedValidation.ok ||
      acceptedValidation.value.reasonCode !== expected.acceptedValidationReason
    ) {
      issues.push(
        issue(
          'core.evidence_service.accepted_validation_failed',
          'Accepted Evidence validation failed.'
        )
      );
    }

    const archiveInput = {
      evidenceReferenceId: fixture.evidenceReferenceId,
      targetStatus: archiveRequest.targetStatus as CoreEvidenceStatus,
      reasonReference: String(archiveRequest.reasonReference),
      idempotencyKey: String(archiveRequest.idempotencyKey),
      governance: governance(
        'evidence.change_status',
        'evidence:change_status',
        'evidence.lifecycle',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const archived = service.changeEvidenceStatus(archiveInput);
    if (
      !archived.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterArchive
    ) {
      issues.push(
        issue(
          'core.evidence_service.archive_failed',
          'Evidence archive failed.',
          'archiveRequest'
        )
      );
    }
    const archiveReplay = service.changeEvidenceStatus(archiveInput);
    if (
      !archiveReplay.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterArchiveReplay
    ) {
      issues.push(
        issue(
          'core.evidence_service.archive_replay_failed',
          'Evidence archive replay failed.',
          'archiveRequest'
        )
      );
    }

    const archivedValidation = service.validateEvidenceReference({
      evidenceReferenceId: fixture.evidenceReferenceId,
      requestingDomain: 'evidence',
      requestingService: 'evidence-service',
      governance: governance(
        'evidence.validate_reference',
        'evidence:validate_reference',
        'evidence.reference',
        fixture.evidenceReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !archivedValidation.ok ||
      archivedValidation.value.reasonCode !== expected.archivedValidationReason
    ) {
      issues.push(
        issue(
          'core.evidence_service.archived_validation_failed',
          'Archived Evidence validation failed.'
        )
      );
    }

    const finalRecord = store.get(fixture.evidenceReferenceId);
    if (
      !finalRecord ||
      finalRecord.sourceLinks.length !== expected.finalSourceCount ||
      finalRecord.claimReferenceIds.length !== expected.finalClaimCount ||
      finalRecord.documentReferenceIds.length !== expected.finalDocumentCount
    ) {
      issues.push(
        issue(
          'core.evidence_service.final_relationships_failed',
          'Evidence final relationship counts are incorrect.'
        )
      );
    }

    const traceJson = JSON.stringify(traces.visibleTo(['Internal']));
    for (const sensitive of [
      createRequest.sourceReferenceId,
      sourceRequest.sourceReferenceId,
      claimRequest.claimReferenceId,
      documentRequest.documentReferenceId,
      reviewRequiredRequest.reviewNoteReference,
      approvalRequest.reviewNoteReference,
      archiveRequest.reasonReference
    ]) {
      if (traceJson.includes(String(sensitive))) {
        issues.push(
          issue(
            'core.evidence_service.event_payload_leak',
            'Evidence Event payload leaked a protected reference.'
          )
        );
        break;
      }
    }
  } catch {
    issues.push(
      issue(
        'core.evidence_service.evidence_fixture_execution_failed',
        'Evidence Service evidence fixture execution failed safely.'
      )
    );
  }

  return issues;
}
