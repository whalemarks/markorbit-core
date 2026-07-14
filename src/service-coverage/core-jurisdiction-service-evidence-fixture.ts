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
  CORE_JURISDICTION_COLLECTION_TARGET,
  CoreJurisdictionService,
  CoreInMemoryJurisdictionServiceStore,
  type CoreJurisdictionGovernanceContext,
  type CoreJurisdictionStatus
} from '../services/jurisdiction/index.ts';

export interface CoreJurisdictionServiceEvidenceFixtureIssue {
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
): CoreJurisdictionServiceEvidenceFixtureIssue {
  return { code, message, path };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationScopeReferenceId: string
): CoreJurisdictionGovernanceContext {
  return {
    correlationId: 'corr:core-task-039',
    auditContextReferenceId: 'audit:ctx:core-task-039',
    authorizedOrganizationReferenceId: organizationScopeReferenceId,
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

function referenceRecord(value: Record<string, unknown>): CoreReferenceRecord {
  return {
    referenceId: String(value.referenceId),
    objectType: String(value.objectType),
    referenceDomain: String(value.referenceDomain),
    status: String(value.status) as CoreReferenceRecord['status']
  };
}

export function validateCoreJurisdictionServiceEvidenceFixture(
  fixture: unknown
): readonly CoreJurisdictionServiceEvidenceFixtureIssue[] {
  const issues: CoreJurisdictionServiceEvidenceFixtureIssue[] = [];
  if (!isRecord(fixture)) {
    return [
      issue(
        'core.jurisdiction_service.evidence_fixture_invalid',
        'Jurisdiction Service evidence fixture must be an object.'
      )
    ];
  }

  const publicReference = fixture.publicReferenceRecord;
  const duplicateCodePublicReference =
    fixture.duplicateCodePublicReferenceRecord;
  const objectRecord = fixture.objectRecord;
  const duplicateCodeObjectRecord = fixture.duplicateCodeObjectRecord;
  const createRequest = fixture.createRequest;
  const duplicateCodeCreateRequest = fixture.duplicateCodeCreateRequest;
  const conflictingCreateRequest = fixture.conflictingCreateRequest;
  const duplicateCreateRequest = fixture.duplicateCreateRequest;
  const statusRequest = fixture.statusTransitionRequest;
  const statusConflictRequest = fixture.statusConflictRequest;
  const invalidStatusRequest = fixture.invalidStatusTransitionRequest;
  const expected = fixture.expected;
  if (
    fixture.fixtureType !== 'core_jurisdiction_service_core_lifecycle' ||
    typeof fixture.jurisdictionReferenceId !== 'string' ||
    typeof fixture.duplicateCodeJurisdictionReferenceId !== 'string' ||
    typeof fixture.organizationScopeReferenceId !== 'string' ||
    typeof fixture.fixedNow !== 'string' ||
    typeof fixture.updatedNow !== 'string' ||
    !isRecord(publicReference) ||
    !isRecord(duplicateCodePublicReference) ||
    !isRecord(objectRecord) ||
    !isRecord(duplicateCodeObjectRecord) ||
    !isRecord(createRequest) ||
    !isRecord(duplicateCodeCreateRequest) ||
    !isRecord(conflictingCreateRequest) ||
    !isRecord(duplicateCreateRequest) ||
    !isRecord(statusRequest) ||
    !isRecord(statusConflictRequest) ||
    !isRecord(invalidStatusRequest) ||
    !isRecord(expected)
  ) {
    return [
      issue(
        'core.jurisdiction_service.evidence_fixture_shape',
        'Jurisdiction Service evidence fixture is missing executable fields.'
      )
    ];
  }

  const jurisdictionReferenceRecord = referenceRecord(publicReference);
  const duplicateCodeJurisdictionReferenceRecord = referenceRecord(
    duplicateCodePublicReference
  );
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryJurisdictionServiceStore();
  const clocks = [String(fixture.fixedNow), String(fixture.updatedNow)];
  const service = new CoreJurisdictionService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      jurisdictionReferenceRecord,
      duplicateCodeJurisdictionReferenceRecord
    ]),
    now: () => clocks.shift() ?? String(fixture.updatedNow),
    eventIdFactory: (operation, jurisdictionReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-evidence-${operation}-${jurisdictionReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'jurisdiction-service-evidence-fixture-secret'
  });

  try {
    const createInput = {
      objectRecord: objectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: jurisdictionReferenceRecord,
      jurisdictionCode: String(createRequest.jurisdictionCode),
      jurisdictionType: createRequest.jurisdictionType,
      jurisdictionStatus: createRequest.jurisdictionStatus,
      nameReference: String(createRequest.nameReference),
      sourceReference: String(createRequest.sourceReference),
      idempotencyKey: String(createRequest.idempotencyKey),
      governance: governance(
        'jurisdiction.create',
        'jurisdiction:create',
        'jurisdiction.write',
        fixture.jurisdictionReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const created = service.createJurisdiction(createInput);
    if (
      !created.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreate
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_create_failed',
          'Jurisdiction Service evidence create scenario failed.',
          'createRequest'
        )
      );
    }

    const replayedCreate = service.createJurisdiction(createInput);
    if (
      !replayedCreate.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReplay
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_create_replay_failed',
          'Jurisdiction Service evidence create replay failed.',
          'createRequest'
        )
      );
    }

    const createConflict = service.createJurisdiction({
      ...createInput,
      jurisdictionType: conflictingCreateRequest.jurisdictionType
    });
    if (
      createConflict.ok ||
      createConflict.error.code !== expected.sameKeyConflictCode
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_create_conflict_failed',
          'Jurisdiction Service evidence create conflict failed.',
          'conflictingCreateRequest'
        )
      );
    }

    const duplicate = service.createJurisdiction({
      ...createInput,
      idempotencyKey: String(duplicateCreateRequest.idempotencyKey)
    });
    if (
      duplicate.ok ||
      duplicate.error.code !== expected.duplicateJurisdictionCode
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_duplicate_failed',
          'Jurisdiction Service evidence duplicate scenario failed.',
          'duplicateCreateRequest'
        )
      );
    }

    const duplicateCode = service.createJurisdiction({
      objectRecord:
        duplicateCodeObjectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: duplicateCodeJurisdictionReferenceRecord,
      jurisdictionCode: String(duplicateCodeCreateRequest.jurisdictionCode),
      jurisdictionType: duplicateCodeCreateRequest.jurisdictionType,
      jurisdictionStatus: duplicateCodeCreateRequest.jurisdictionStatus,
      nameReference: String(duplicateCodeCreateRequest.nameReference),
      sourceReference: String(duplicateCodeCreateRequest.sourceReference),
      idempotencyKey: String(duplicateCodeCreateRequest.idempotencyKey),
      governance: governance(
        'jurisdiction.create',
        'jurisdiction:create',
        'jurisdiction.write',
        fixture.duplicateCodeJurisdictionReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      duplicateCode.ok ||
      duplicateCode.error.code !== expected.duplicateCodeConflictCode ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReplay
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_duplicate_code_failed',
          'Jurisdiction Service duplicate code scenario failed.',
          'duplicateCodeCreateRequest'
        )
      );
    }

    const get = service.getJurisdiction({
      jurisdictionReferenceId: fixture.jurisdictionReferenceId,
      governance: governance(
        'jurisdiction.read',
        'jurisdiction:read',
        'jurisdiction.read',
        fixture.jurisdictionReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    const list = service.listJurisdictions({
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'jurisdiction.list',
        'jurisdiction:list',
        'jurisdiction.list',
        CORE_JURISDICTION_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    const validation = service.validateJurisdictionReference({
      jurisdictionReferenceId: fixture.jurisdictionReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-service',
      governance: governance(
        'jurisdiction.validate_reference',
        'jurisdiction:validate_reference',
        'jurisdiction.reference',
        fixture.jurisdictionReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    const resolved = service.resolveJurisdictionByCode({
      jurisdictionCode: String(createRequest.jurisdictionCode),
      requestingDomain: 'classification',
      requestingService: 'classification-reference-service',
      governance: governance(
        'jurisdiction.resolve_by_code',
        'jurisdiction:resolve',
        'jurisdiction.reference',
        CORE_JURISDICTION_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    if (
      !get.ok ||
      !list.ok ||
      list.value.items.length !== 1 ||
      !validation.ok ||
      validation.value.reasonCode !== 'Valid' ||
      !resolved.ok ||
      resolved.value.jurisdictionReferenceId !== expected.resolvedReferenceId
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_read_failed',
          'Jurisdiction Service evidence read/list/reference scenarios failed.'
        )
      );
    }

    const statusInput = {
      jurisdictionReferenceId: fixture.jurisdictionReferenceId,
      targetStatus: String(
        statusRequest.targetStatus
      ) as CoreJurisdictionStatus,
      reasonReference: String(statusRequest.reasonReference),
      idempotencyKey: String(statusRequest.idempotencyKey),
      governance: governance(
        'jurisdiction.change_status',
        'jurisdiction:change_status',
        'jurisdiction.lifecycle',
        fixture.jurisdictionReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const changed = service.changeJurisdictionStatus(statusInput);
    if (
      !changed.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusChange
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_status_failed',
          'Jurisdiction Service evidence status transition failed.',
          'statusTransitionRequest'
        )
      );
    }

    const replayedStatus = service.changeJurisdictionStatus(statusInput);
    if (
      !replayedStatus.ok ||
      !changed.ok ||
      JSON.stringify(replayedStatus.value) !== JSON.stringify(changed.value) ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusReplay
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_status_replay_failed',
          'Jurisdiction Service evidence status replay failed.',
          'statusTransitionRequest'
        )
      );
    }

    const statusConflict = service.changeJurisdictionStatus({
      ...statusInput,
      targetStatus: String(
        statusConflictRequest.targetStatus
      ) as CoreJurisdictionStatus,
      reasonReference: String(statusConflictRequest.reasonReference)
    });
    if (
      statusConflict.ok ||
      statusConflict.error.code !== expected.statusConflictCode
    ) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_status_conflict_failed',
          'Jurisdiction Service evidence status conflict failed.',
          'statusConflictRequest'
        )
      );
    }

    const invalid = service.changeJurisdictionStatus({
      ...statusInput,
      targetStatus: String(
        invalidStatusRequest.targetStatus
      ) as CoreJurisdictionStatus,
      reasonReference: null,
      idempotencyKey: String(invalidStatusRequest.idempotencyKey)
    });
    if (invalid.ok || invalid.error.code !== expected.invalidTransitionCode) {
      issues.push(
        issue(
          'core.jurisdiction_service.evidence_invalid_transition_failed',
          'Jurisdiction Service evidence invalid transition failed.',
          'invalidStatusTransitionRequest'
        )
      );
    }
  } catch {
    issues.push(
      issue(
        'core.jurisdiction_service.evidence_fixture_exception',
        'Jurisdiction Service evidence fixture failed safely.'
      )
    );
  }

  return issues;
}
