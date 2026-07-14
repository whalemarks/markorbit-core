import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../behaviors/index.ts';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../contracts/service/core-service-contract-skeletons.ts';
import { createCoreEventId, type CoreEventId } from '../events/index.ts';
import {
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  type CoreMvpObjectBaseRecord
} from '../objects/core-mvp-object-base-record.ts';
import {
  CORE_TRADEMARK_COLLECTION_TARGET,
  CoreTrademarkService,
  CoreInMemoryTrademarkServiceStore,
  type CoreTrademarkGovernanceContext,
  type CoreTrademarkStatus
} from '../services/trademark/index.ts';

export interface CoreTrademarkServiceEvidenceFixtureIssue {
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
): CoreTrademarkServiceEvidenceFixtureIssue {
  return { code, message, path };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationScopeReferenceId: string
): CoreTrademarkGovernanceContext {
  return {
    correlationId: 'corr:core-task-037',
    auditContextReferenceId: 'audit:ctx:core-task-037',
    authorizedOrganizationReferenceId: organizationScopeReferenceId,
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

function referenceRecord(value: Record<string, unknown>): CoreReferenceRecord {
  return {
    referenceId: String(value.referenceId),
    objectType: String(value.objectType),
    referenceDomain: String(value.referenceDomain),
    status: String(value.status) as CoreReferenceRecord['status']
  };
}

export function validateCoreTrademarkServiceEvidenceFixture(
  fixture: unknown
): readonly CoreTrademarkServiceEvidenceFixtureIssue[] {
  const issues: CoreTrademarkServiceEvidenceFixtureIssue[] = [];
  if (!isRecord(fixture)) {
    return [
      issue(
        'core.trademark_service.evidence_fixture_invalid',
        'Trademark Service evidence fixture must be an object.'
      )
    ];
  }

  const publicReference = fixture.publicReferenceRecord;
  const brandReference = fixture.brandReferenceRecord;
  const jurisdictionReference = fixture.jurisdictionReferenceRecord;
  const objectRecord = fixture.objectRecord;
  const createRequest = fixture.createRequest;
  const conflictingCreateRequest = fixture.conflictingCreateRequest;
  const duplicateCreateRequest = fixture.duplicateCreateRequest;
  const statusRequest = fixture.statusTransitionRequest;
  const statusConflictRequest = fixture.statusConflictRequest;
  const invalidStatusRequest = fixture.invalidStatusTransitionRequest;
  const expected = fixture.expected;
  if (
    fixture.fixtureType !== 'core_trademark_service_core_lifecycle' ||
    typeof fixture.trademarkReferenceId !== 'string' ||
    typeof fixture.brandReferenceId !== 'string' ||
    typeof fixture.jurisdictionReferenceId !== 'string' ||
    typeof fixture.organizationScopeReferenceId !== 'string' ||
    typeof fixture.fixedNow !== 'string' ||
    typeof fixture.updatedNow !== 'string' ||
    !isRecord(publicReference) ||
    !isRecord(brandReference) ||
    !isRecord(jurisdictionReference) ||
    !isRecord(objectRecord) ||
    !isRecord(createRequest) ||
    !isRecord(conflictingCreateRequest) ||
    !isRecord(duplicateCreateRequest) ||
    !isRecord(statusRequest) ||
    !isRecord(statusConflictRequest) ||
    !isRecord(invalidStatusRequest) ||
    !isRecord(expected)
  ) {
    return [
      issue(
        'core.trademark_service.evidence_fixture_shape',
        'Trademark Service evidence fixture is missing executable fields.'
      )
    ];
  }

  const trademarkReferenceRecord = referenceRecord(publicReference);
  const brandReferenceRecord = referenceRecord(brandReference);
  const jurisdictionReferenceRecord = referenceRecord(jurisdictionReference);
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryTrademarkServiceStore();
  const clocks = [String(fixture.fixedNow), String(fixture.updatedNow)];
  const service = new CoreTrademarkService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      trademarkReferenceRecord,
      brandReferenceRecord,
      jurisdictionReferenceRecord
    ]),
    now: () => clocks.shift() ?? String(fixture.updatedNow),
    eventIdFactory: (operation, trademarkReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-evidence-${operation}-${trademarkReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'trademark-service-evidence-fixture-secret'
  });

  try {
    const createInput = {
      objectRecord: objectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: trademarkReferenceRecord,
      trademarkType: createRequest.trademarkType,
      trademarkStatus: createRequest.trademarkStatus,
      markRepresentationReference: String(
        createRequest.markRepresentationReference
      ),
      sourceReference: String(createRequest.sourceReference),
      jurisdictionReferenceId: fixture.jurisdictionReferenceId,
      brandReferenceId: fixture.brandReferenceId,
      idempotencyKey: String(createRequest.idempotencyKey),
      governance: governance(
        'trademark.create',
        'trademark:create',
        'trademark.write',
        fixture.trademarkReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const created = service.createTrademark(createInput);
    if (
      !created.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreate
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_create_failed',
          'Trademark Service evidence create scenario failed.',
          'createRequest'
        )
      );
    }

    const replayedCreate = service.createTrademark(createInput);
    if (
      !replayedCreate.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReplay
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_create_replay_failed',
          'Trademark Service evidence create replay failed.',
          'createRequest'
        )
      );
    }

    const createConflict = service.createTrademark({
      ...createInput,
      trademarkType: conflictingCreateRequest.trademarkType
    });
    if (
      createConflict.ok ||
      createConflict.error.code !== expected.sameKeyConflictCode
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_create_conflict_failed',
          'Trademark Service evidence create conflict failed.',
          'conflictingCreateRequest'
        )
      );
    }

    const duplicate = service.createTrademark({
      ...createInput,
      idempotencyKey: String(duplicateCreateRequest.idempotencyKey)
    });
    if (
      duplicate.ok ||
      duplicate.error.code !== expected.duplicateTrademarkCode
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_duplicate_failed',
          'Trademark Service evidence duplicate scenario failed.',
          'duplicateCreateRequest'
        )
      );
    }

    const get = service.getTrademark({
      trademarkReferenceId: fixture.trademarkReferenceId,
      governance: governance(
        'trademark.read',
        'trademark:read',
        'trademark.read',
        fixture.trademarkReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    const list = service.listTrademarks({
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'trademark.list',
        'trademark:list',
        'trademark.list',
        CORE_TRADEMARK_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    const validation = service.validateTrademarkReference({
      trademarkReferenceId: fixture.trademarkReferenceId,
      requestingDomain: 'matter',
      requestingService: 'matter-service',
      governance: governance(
        'trademark.validate_reference',
        'trademark:validate_reference',
        'trademark.reference',
        fixture.trademarkReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !get.ok ||
      !list.ok ||
      list.value.items.length !== 1 ||
      !validation.ok ||
      validation.value.reasonCode !== 'Valid'
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_read_failed',
          'Trademark Service evidence read/list/reference scenarios failed.'
        )
      );
    }

    const statusInput = {
      trademarkReferenceId: fixture.trademarkReferenceId,
      targetStatus: String(statusRequest.targetStatus) as CoreTrademarkStatus,
      reasonReference:
        statusRequest.reasonReference === null
          ? null
          : String(statusRequest.reasonReference),
      idempotencyKey: String(statusRequest.idempotencyKey),
      governance: governance(
        'trademark.change_status',
        'trademark:change_status',
        'trademark.lifecycle',
        fixture.trademarkReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const changed = service.changeTrademarkStatus(statusInput);
    if (
      !changed.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusChange
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_status_failed',
          'Trademark Service evidence status transition failed.',
          'statusTransitionRequest'
        )
      );
    }

    const replayedStatus = service.changeTrademarkStatus(statusInput);
    if (
      !replayedStatus.ok ||
      !changed.ok ||
      JSON.stringify(replayedStatus.value) !== JSON.stringify(changed.value) ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusReplay
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_status_replay_failed',
          'Trademark Service evidence status replay failed.',
          'statusTransitionRequest'
        )
      );
    }

    const statusConflict = service.changeTrademarkStatus({
      ...statusInput,
      targetStatus: String(
        statusConflictRequest.targetStatus
      ) as CoreTrademarkStatus,
      reasonReference:
        statusConflictRequest.reasonReference === null
          ? null
          : String(statusConflictRequest.reasonReference)
    });
    if (
      statusConflict.ok ||
      statusConflict.error.code !== expected.statusConflictCode
    ) {
      issues.push(
        issue(
          'core.trademark_service.evidence_status_conflict_failed',
          'Trademark Service evidence status conflict failed.',
          'statusConflictRequest'
        )
      );
    }

    const invalid = service.changeTrademarkStatus({
      ...statusInput,
      targetStatus: String(
        invalidStatusRequest.targetStatus
      ) as CoreTrademarkStatus,
      reasonReference: null,
      idempotencyKey: String(invalidStatusRequest.idempotencyKey)
    });
    if (invalid.ok || invalid.error.code !== expected.invalidTransitionCode) {
      issues.push(
        issue(
          'core.trademark_service.evidence_invalid_transition_failed',
          'Trademark Service evidence invalid transition failed.',
          'invalidStatusTransitionRequest'
        )
      );
    }
  } catch {
    issues.push(
      issue(
        'core.trademark_service.evidence_fixture_exception',
        'Trademark Service evidence fixture failed safely.'
      )
    );
  }

  return issues;
}
