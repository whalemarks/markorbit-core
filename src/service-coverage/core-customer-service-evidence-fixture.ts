import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../behaviors/index.ts';
import { createCoreEventId, type CoreEventId } from '../events/index.ts';
import {
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  type CoreMvpObjectBaseRecord
} from '../objects/core-mvp-object-base-record.ts';
import {
  CORE_CUSTOMER_COLLECTION_TARGET,
  CoreCustomerService,
  CoreInMemoryCustomerServiceStore,
  type CoreCustomerGovernanceContext
} from '../services/customer/index.ts';

export interface CoreCustomerServiceEvidenceFixtureIssue {
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
): CoreCustomerServiceEvidenceFixtureIssue {
  return { code, message, path };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target: string,
  organizationScopeReferenceId: string
): CoreCustomerGovernanceContext {
  return {
    correlationId: 'corr:core-task-036',
    auditContextReferenceId: 'audit:ctx:core-task-036',
    authorizedOrganizationReferenceId: organizationScopeReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-036'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-036'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'customer-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'customer-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-0001',
      policyDecisionReferenceId: 'policy:decision:allow-0001',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-036'
    }
  };
}

export function validateCoreCustomerServiceEvidenceFixture(
  fixture: unknown
): readonly CoreCustomerServiceEvidenceFixtureIssue[] {
  const issues: CoreCustomerServiceEvidenceFixtureIssue[] = [];
  if (!isRecord(fixture)) {
    return [
      issue(
        'core.customer_service.evidence_fixture_invalid',
        'Customer Service evidence fixture must be an object.'
      )
    ];
  }

  const reference = fixture.publicReferenceRecord;
  const objectRecord = fixture.objectRecord;
  const createRequest = fixture.createRequest;
  const statusRequest = fixture.statusTransitionRequest;
  const expected = fixture.expected;
  if (
    fixture.fixtureType !== 'core_customer_service_core_lifecycle' ||
    typeof fixture.customerReferenceId !== 'string' ||
    typeof fixture.organizationScopeReferenceId !== 'string' ||
    typeof fixture.fixedNow !== 'string' ||
    typeof fixture.updatedNow !== 'string' ||
    !isRecord(reference) ||
    !isRecord(objectRecord) ||
    !isRecord(createRequest) ||
    !isRecord(statusRequest) ||
    !isRecord(expected)
  ) {
    return [
      issue(
        'core.customer_service.evidence_fixture_shape',
        'Customer Service evidence fixture is missing executable fields.'
      )
    ];
  }

  const referenceRecord: CoreReferenceRecord = {
    referenceId: String(reference.referenceId),
    objectType: String(reference.objectType),
    referenceDomain: String(reference.referenceDomain),
    status: String(reference.status) as CoreReferenceRecord['status']
  };
  const traces = new CoreEventTraceRegistry();
  const store = new CoreInMemoryCustomerServiceStore();
  const clocks = [String(fixture.fixedNow), String(fixture.updatedNow)];
  const service = new CoreCustomerService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      referenceRecord
    ]),
    now: () => clocks.shift() ?? String(fixture.updatedNow),
    eventIdFactory: (operation, customerReferenceId, idempotencyKey) =>
      createCoreEventId(
        `event-evidence-${operation}-${customerReferenceId.replaceAll(':', '-')}-${idempotencyKey}`
      ) as CoreEventId,
    cursorSecret: 'customer-service-evidence-fixture-secret'
  });

  try {
    const createInput = {
      objectRecord: objectRecord as unknown as CoreMvpObjectBaseRecord,
      publicReferenceRecord: referenceRecord,
      customerType: createRequest.customerType,
      customerStatus: createRequest.customerStatus,
      nameReference: String(createRequest.nameReference),
      sourceReference: String(createRequest.sourceReference),
      idempotencyKey: String(createRequest.idempotencyKey),
      governance: governance(
        'customer.create',
        'customer:create',
        'customer.write',
        fixture.customerReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const created = service.createCustomer(createInput);
    if (
      !created.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterCreate
    ) {
      issues.push(
        issue(
          'core.customer_service.evidence_create_failed',
          'Customer Service evidence create scenario failed.',
          'createRequest'
        )
      );
    }

    const replayedCreate = service.createCustomer(createInput);
    if (
      !replayedCreate.ok ||
      store.list().length !== expected.recordCountAfterCreate ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterReplay
    ) {
      issues.push(
        issue(
          'core.customer_service.evidence_create_replay_failed',
          'Customer Service evidence create replay failed.',
          'createRequest'
        )
      );
    }

    const statusInput = {
      customerReferenceId: fixture.customerReferenceId,
      targetStatus: String(statusRequest.targetStatus) as 'Suspended',
      reasonReference: String(statusRequest.reasonReference),
      idempotencyKey: String(statusRequest.idempotencyKey),
      governance: governance(
        'customer.change_status',
        'customer:change_status',
        'customer.lifecycle',
        fixture.customerReferenceId,
        fixture.organizationScopeReferenceId
      )
    };
    const changed = service.changeCustomerStatus(statusInput);
    if (
      !changed.ok ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusChange
    ) {
      issues.push(
        issue(
          'core.customer_service.evidence_status_failed',
          'Customer Service evidence status transition failed.',
          'statusTransitionRequest'
        )
      );
    }

    const replayedStatus = service.changeCustomerStatus(statusInput);
    if (
      !replayedStatus.ok ||
      !changed.ok ||
      JSON.stringify(replayedStatus.value) !== JSON.stringify(changed.value) ||
      traces.visibleTo(['Internal']).length !==
        expected.eventTraceCountAfterStatusReplay
    ) {
      issues.push(
        issue(
          'core.customer_service.evidence_status_replay_failed',
          'Customer Service evidence status replay failed.',
          'statusTransitionRequest'
        )
      );
    }

    const conflict = service.changeCustomerStatus({
      ...statusInput,
      targetStatus: 'Active'
    });
    if (conflict.ok || conflict.error.code !== expected.statusConflictCode) {
      issues.push(
        issue(
          'core.customer_service.evidence_status_conflict_failed',
          'Customer Service evidence status conflict failed.',
          'statusConflictRequest'
        )
      );
    }

    const listed = service.listCustomers({
      pagination: { limit: 10, sortField: 'publicReferenceId' },
      governance: governance(
        'customer.list',
        'customer:list',
        'customer.list',
        CORE_CUSTOMER_COLLECTION_TARGET,
        fixture.organizationScopeReferenceId
      )
    });
    if (!listed.ok || listed.value.items.length !== 1) {
      issues.push(
        issue(
          'core.customer_service.evidence_list_failed',
          'Customer Service evidence list scenario failed.'
        )
      );
    }
  } catch {
    issues.push(
      issue(
        'core.customer_service.evidence_fixture_exception',
        'Customer Service evidence fixture failed safely.'
      )
    );
  }

  return issues;
}
