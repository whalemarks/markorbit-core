import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryOrganizationServiceStore,
  CoreOrganizationService,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CoreOrganizationGovernanceContext,
  type CoreReferenceRecord
} from '../../src/index.ts';

const organizationReferenceId = 'organization:ref:00002';
const organizationScopeReferenceId = 'organization:ref:scope-0001';
const organizationReference =
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
    (entry) => entry.referenceId === organizationReferenceId
  );
if (!organizationReference)
  throw new Error('Organization fixture reference is missing.');
const governedOrganizationReference = organizationReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = organizationReferenceId,
  options: {
    readonly organization?: string;
    readonly reviewRequired?: boolean;
    readonly reviewApproved?: boolean;
  } = {}
): CoreOrganizationGovernanceContext {
  const reviewRequired = options.reviewRequired ?? false;
  const reviewApproved = options.reviewApproved ?? false;
  return {
    correlationId: 'corr:core-task-051',
    auditContextReferenceId: 'audit:ctx:core-task-051',
    authorizedOrganizationReferenceId:
      options.organization ?? organizationScopeReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-051',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-051'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-051',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-051'
    },
    review: {
      humanReviewRequired: reviewRequired,
      humanReviewReferenceId:
        reviewRequired || reviewApproved ? 'review:ref:organization-051' : null,
      reviewStatus: reviewApproved
        ? 'Completed'
        : reviewRequired
          ? 'Requested'
          : null,
      reviewScope:
        reviewRequired || reviewApproved ? 'organization.sensitive' : null,
      reviewDecision: reviewApproved ? 'Approved' : null,
      reviewerUserReferenceId: reviewApproved ? 'user:ref:reviewer-051' : null,
      targetObjectType: 'organization-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'organization-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-051',
      policyDecisionReferenceId: 'policy:decision:allow-051',
      humanReviewReferenceId:
        reviewRequired || reviewApproved ? 'review:ref:organization-051' : null,
      correlationId: 'corr:core-task-051'
    }
  };
}

function objectRecord(
  referenceId = organizationReferenceId,
  organization = organizationScopeReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('organization-record'),
    domainId: 'organization',
    objectContractId: createCoreContractId(
      'core-object-organization-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-16T04:45:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-16T04:45:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-051'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organization
    }
  };
}

const relatedReferences: readonly CoreReferenceRecord[] = [
  {
    referenceId: 'user:ref:member-051',
    objectType: 'user-record',
    referenceDomain: 'user',
    status: 'Active'
  },
  {
    referenceId: 'identity:ref:member-051',
    objectType: 'identity-record',
    referenceDomain: 'identity',
    status: 'Active'
  },
  {
    referenceId: 'organization:ref:parent-051',
    objectType: 'organization-record',
    referenceDomain: 'organization',
    status: 'Active'
  }
];

function harness(failTrace = false) {
  const store = new CoreInMemoryOrganizationServiceStore();
  const traces = new CoreEventTraceRegistry();
  let clock = 0;
  const service = new CoreOrganizationService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: failTrace
      ? {
          append() {
            return {
              ok: false as const,
              error: {
                code: 'OrganizationTraceFailed' as const,
                category: 'Event' as const,
                message: 'failed',
                safeDetail: null,
                retryable: false,
                correlationId: null
              }
            };
          }
        }
      : traces,
    relatedReferenceRegistry: new CoreReferenceRegistry(relatedReferences),
    now: () => new Date(Date.UTC(2026, 6, 16, 4, 45, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(
  service: CoreOrganizationService,
  options: {
    readonly aiInitiated?: boolean;
    readonly reviewApproved?: boolean;
    readonly organizationType?: unknown;
  } = {}
) {
  return service.createOrganization({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedOrganizationReference,
    organizationType: options.organizationType ?? 'InternalOrganization',
    nameReference: 'organization:name:markorbit-core',
    status: 'Active',
    sourceReference: 'source:organization:051',
    parentOrganizationReferenceId: 'organization:ref:parent-051',
    ownerIdentityReferenceId: 'identity:ref:member-051',
    aiInitiated: options.aiInitiated ?? false,
    agentContractReferenceId: options.aiInitiated
      ? 'agent-contract:ref:organization-051'
      : null,
    idempotencyKey: 'idem:organization:create:051',
    governance: governance(
      'organization.create',
      'organization:create',
      'organization.write',
      organizationReferenceId,
      { reviewApproved: options.reviewApproved }
    )
  });
}

function code(result: { ok: boolean; error?: { code: string } }) {
  return result.ok ? null : result.error?.code;
}

describe('CORE-TASK-051 Organization Service operating-context foundation', () => {
  it('creates an immutable operating context idempotently without authorization, billing, authentication, or business-party ownership', () => {
    const { service, store, traces } = harness();
    const first = create(service);
    const replay = create(service);
    assert.equal(first.ok, true);
    assert.equal(replay.ok, true);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Restricted']).length, 1);

    const read = service.getOrganization({
      organizationReferenceId,
      governance: governance(
        'organization.get',
        'organization:read',
        'organization.read'
      )
    });
    assert.equal(
      read.ok && read.value.organizationReferenceId,
      organizationReferenceId
    );
    assert.equal(read.ok && read.value.grantsPermission, false);
    assert.equal(read.ok && read.value.evaluatesPolicy, false);
    assert.equal(read.ok && read.value.billingImplemented, false);
    assert.equal(read.ok && read.value.authenticationImplemented, false);
    assert.equal(read.ok && read.value.businessPartyObjectsCreated, false);
    assert.equal(read.ok && Object.hasOwn(read.value, 'nameReference'), false);
  });

  it('links and resolves an explicit User reference while preserving Organization, User, and Identity boundaries', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const linked = service.linkOrganizationUser({
      organizationReferenceId,
      userReferenceId: 'user:ref:member-051',
      identityReferenceId: 'identity:ref:member-051',
      linkType: 'Member',
      idempotencyKey: 'idem:organization:user-link:051',
      governance: governance(
        'organization.user.link',
        'organization:user:link',
        'organization.relationship'
      )
    });
    assert.equal(linked.ok && linked.value.userLinks.length, 1);
    const resolved = service.resolveOrganizationContext({
      userReferenceId: 'user:ref:member-051',
      governance: governance(
        'organization.context.resolve',
        'organization:read',
        'organization.resolve',
        'user:ref:member-051'
      )
    });
    assert.equal(
      resolved.ok && resolved.value.organizationReferenceId,
      organizationReferenceId
    );
    assert.equal(resolved.ok && resolved.value.userLinkCount, 1);
  });

  it('enforces controlled values, human review for AI creation, lifecycle validation, and cross-organization non-enumeration', () => {
    const { service } = harness();
    assert.equal(
      code(create(service, { organizationType: 'Company' })),
      'InvalidOrganizationType'
    );
    assert.equal(
      code(create(service, { aiInitiated: true })),
      'OrganizationCreationReviewRequired'
    );
    assert.equal(
      create(service, { aiInitiated: true, reviewApproved: true }).ok,
      true
    );

    const suspended = service.changeOrganizationStatus({
      organizationReferenceId,
      nextStatus: 'Suspended',
      reasonReference: 'reason:organization:suspended-051',
      idempotencyKey: 'idem:organization:suspend:051',
      governance: governance(
        'organization.status.change',
        'organization:status',
        'organization.status'
      )
    });
    assert.equal(suspended.ok, true);
    const validation = service.validateOrganizationReference({
      organizationReferenceId,
      requestingDomain: 'matter',
      requestingService: 'matter-service',
      governance: governance(
        'organization.reference.validate',
        'organization:read',
        'organization.reference'
      )
    });
    assert.equal(validation.ok && validation.value.isValid, false);
    assert.equal(validation.ok && validation.value.reasonCode, 'Suspended');

    const hidden = service.getOrganization({
      organizationReferenceId,
      governance: governance(
        'organization.get',
        'organization:read',
        'organization.read',
        organizationReferenceId,
        { organization: 'organization:ref:other-051' }
      )
    });
    assert.equal(code(hidden), 'OrganizationNotFound');
  });

  it('rolls back creation when Event trace handoff fails', () => {
    const { service, store } = harness(true);
    const result = create(service);
    assert.equal(code(result), 'OrganizationTraceFailed');
    assert.equal(store.list().length, 0);
  });
});
