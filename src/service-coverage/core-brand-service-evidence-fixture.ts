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
  CORE_BRAND_COLLECTION_TARGET,
  CoreBrandService,
  CoreInMemoryBrandServiceStore,
  type CoreBrandGovernanceContext,
  type CoreBrandStatus
} from '../services/brand/index.ts';

export interface CoreBrandServiceEvidenceFixtureIssue {
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
): CoreBrandServiceEvidenceFixtureIssue {
  return { code, message, path };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationScopeReferenceId: string
): CoreBrandGovernanceContext {
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

function referenceRecord(value: Record<string, unknown>): CoreReferenceRecord {
  return {
    referenceId: String(value.referenceId),
    objectType: String(value.objectType),
    referenceDomain: String(value.referenceDomain),
    status: String(value.status) as CoreReferenceRecord['status']
  };
}

export function validateCoreBrandServiceEvidenceFixture(
  fixture: unknown
): readonly CoreBrandServiceEvidenceFixtureIssue[] {
  const issues: CoreBrandServiceEvidenceFixtureIssue[] = [];
  if (!isRecord(fixture)) {
    return [
      issue(
        'core.brand_service.evidence_fixture_invalid',
        'Brand Service evidence fixture must be an object.'
      )
    ];
  }

  const publicReference = fixture.publicReferenceRecord;
  const customerReference = fixture.customerReferenceRecord;
  const objectRecord = fixture.objectRecord;
  const createRequest = fixture.createRequest;
  const conflictingCreateRequest = fixture.conflictingCreateRequest;
  const duplicateCreateRequest = fixture.duplicateCreateRequest;
  const statusRequest = fixture.statusTransitionRequest;
  const statusConflictRequest = fixture.statusConflictRequest;
  const invalidStatusRequest = fixture.invalidStatusTransitionRequest;
  const expected = fixture.expected;
  if (
    fixture.fixtureType !== 'core_brand_service_core_lifecycle' ||
    typeof fixture.brandReferenceId !== 'string' ||
    typeof fixture.customerReferenceId !== 'string' ||
    typeof fixture.organizationScopeReferenceId !== 'string' ||
    typeof fixture.fixedNow !== 'string' ||
    typeof fixture.updatedNow !== 'string' ||
    !isRecord(publicReference) ||
    !isRecord(customerReference) ||
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
        'core.brand_service.evidence_fixture_shape',
        'Brand Service evidence fixture is missing executable fields.'
      )
    ];
  }

  const brandReferenceRecord = referenceRecord(publicReference);
  const customerReferenceRecord = referenceRecord(customerReference);
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryBrandServiceStore();
  const clocks = [String(fixture.fixedNow), String(fixture.updatedNow)];
  const service = new CoreBrandService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(
      ({ domainId, serviceType }) => ({ domainId, serviceType })
    ),
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      brandReferenceRecord,
      customerReferenceRecord
    ]),
    now: () => clocks.shift() ?? String(fixture.updatedNow),
    eventIdFactory: (operation, brandReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-evidence-${operation}-${brandReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'brand-service-evidence-fixture-secret'
  });

  try {
    const createInput = {
      objectRecord: objectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: brandReferenceRecord,
      brandType: createRequest.brandType,
      brandStatus: createRequest.brandStatus,
      nameReference: String(createRequest.nameReference),
      sourceReference: String(createRequest.sourceReference),
      customerReferenceId: fixture.customerReferenceId,
      idempotencyKey: String(createRequest.idempotencyKey),
      governance: governance(
        'brand.create',
        'brand:create',
        'brand.write',
        fixture.brandReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const created = service.createBrand(createInput);
    if (
      !created.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreate
    ) {
      issues.push(
        issue(
          'core.brand_service.evidence_create_failed',
          'Brand Service evidence create scenario failed.',
          'createRequest'
        )
      );
    }

    const replayedCreate = service.createBrand(createInput);
    if (
      !replayedCreate.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReplay
    ) {
      issues.push(
        issue(
          'core.brand_service.evidence_create_replay_failed',
          'Brand Service evidence create replay failed.',
          'createRequest'
        )
      );
    }

    const createConflict = service.createBrand({
      ...createInput,
      brandType: conflictingCreateRequest.brandType
    });
    if (
      createConflict.ok ||
      createConflict.error.code !== expected.sameKeyConflictCode
    ) {
      issues.push(
        issue(
          'core.brand_service.evidence_create_conflict_failed',
          'Brand Service evidence create conflict failed.',
          'conflictingCreateRequest'
        )
      );
    }

    const duplicate = service.createBrand({
      ...createInput,
      idempotencyKey: String(duplicateCreateRequest.idempotencyKey)
    });
    if (duplicate.ok || duplicate.error.code !== expected.duplicateBrandCode) {
      issues.push(
        issue(
          'core.brand_service.evidence_duplicate_failed',
          'Brand Service evidence duplicate scenario failed.',
          'duplicateCreateRequest'
        )
      );
    }

    const get = service.getBrand({
      brandReferenceId: fixture.brandReferenceId,
      governance: governance(
        'brand.read',
        'brand:read',
        'brand.read',
        fixture.brandReferenceId,
        fixture.organizationScopeReferenceId
      )
    });
    const list = service.listBrands({
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'brand.list',
        'brand:list',
        'brand.list',
        CORE_BRAND_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    const validation = service.validateBrandReference({
      brandReferenceId: fixture.brandReferenceId,
      requestingDomain: 'trademark',
      requestingService: 'trademark-service',
      governance: governance(
        'brand.validate_reference',
        'brand:validate_reference',
        'brand.reference',
        fixture.brandReferenceId,
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
          'core.brand_service.evidence_read_failed',
          'Brand Service evidence read/list/reference scenarios failed.'
        )
      );
    }

    const statusInput = {
      brandReferenceId: fixture.brandReferenceId,
      targetStatus: String(statusRequest.targetStatus) as CoreBrandStatus,
      reasonReference: String(statusRequest.reasonReference),
      idempotencyKey: String(statusRequest.idempotencyKey),
      governance: governance(
        'brand.change_status',
        'brand:change_status',
        'brand.lifecycle',
        fixture.brandReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const changed = service.changeBrandStatus(statusInput);
    if (
      !changed.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusChange
    ) {
      issues.push(
        issue(
          'core.brand_service.evidence_status_failed',
          'Brand Service evidence status transition failed.',
          'statusTransitionRequest'
        )
      );
    }

    const replayedStatus = service.changeBrandStatus(statusInput);
    if (
      !replayedStatus.ok ||
      !changed.ok ||
      JSON.stringify(replayedStatus.value) !== JSON.stringify(changed.value) ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusReplay
    ) {
      issues.push(
        issue(
          'core.brand_service.evidence_status_replay_failed',
          'Brand Service evidence status replay failed.',
          'statusTransitionRequest'
        )
      );
    }

    const statusConflict = service.changeBrandStatus({
      ...statusInput,
      targetStatus: String(
        statusConflictRequest.targetStatus
      ) as CoreBrandStatus,
      reasonReference: String(statusConflictRequest.reasonReference)
    });
    if (
      statusConflict.ok ||
      statusConflict.error.code !== expected.statusConflictCode
    ) {
      issues.push(
        issue(
          'core.brand_service.evidence_status_conflict_failed',
          'Brand Service evidence status conflict failed.',
          'statusConflictRequest'
        )
      );
    }

    const invalid = service.changeBrandStatus({
      ...statusInput,
      targetStatus: String(
        invalidStatusRequest.targetStatus
      ) as CoreBrandStatus,
      reasonReference: null,
      idempotencyKey: String(invalidStatusRequest.idempotencyKey)
    });
    if (invalid.ok || invalid.error.code !== expected.invalidTransitionCode) {
      issues.push(
        issue(
          'core.brand_service.evidence_invalid_transition_failed',
          'Brand Service evidence invalid transition failed.',
          'invalidStatusTransitionRequest'
        )
      );
    }
  } catch {
    issues.push(
      issue(
        'core.brand_service.evidence_fixture_exception',
        'Brand Service evidence fixture failed safely.'
      )
    );
  }

  return issues;
}
