import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryUserServiceStore,
  CoreReferenceRegistry,
  CoreUserService,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CoreReferenceRecord,
  type CoreUserGovernanceContext
} from '../../src/index.ts';

const userReferenceId = 'user:ref:00003';
const organizationScopeReferenceId = 'organization:ref:scope-0001';
const userReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (entry) => entry.referenceId === userReferenceId
);
if (!userReference) throw new Error('User fixture reference is missing.');
const governedUserReference = userReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = userReferenceId,
  options: {
    readonly organization?: string;
    readonly reviewRequired?: boolean;
    readonly reviewApproved?: boolean;
  } = {}
): CoreUserGovernanceContext {
  const reviewRequired = options.reviewRequired ?? false;
  const reviewApproved = options.reviewApproved ?? false;
  return {
    correlationId: 'corr:core-task-052',
    auditContextReferenceId: 'audit:ctx:core-task-052',
    authorizedOrganizationReferenceId:
      options.organization ?? organizationScopeReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-052',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-052'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-052',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-052'
    },
    review: {
      humanReviewRequired: reviewRequired,
      humanReviewReferenceId:
        reviewRequired || reviewApproved ? 'review:ref:user-052' : null,
      reviewStatus: reviewApproved
        ? 'Completed'
        : reviewRequired
          ? 'Requested'
          : null,
      reviewScope: reviewRequired || reviewApproved ? 'user.sensitive' : null,
      reviewDecision: reviewApproved ? 'Approved' : null,
      reviewerUserReferenceId: reviewApproved ? 'user:ref:reviewer-052' : null,
      targetObjectType: 'user-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'user-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-052',
      policyDecisionReferenceId: 'policy:decision:allow-052',
      humanReviewReferenceId:
        reviewRequired || reviewApproved ? 'review:ref:user-052' : null,
      correlationId: 'corr:core-task-052'
    }
  };
}

function objectRecord(
  referenceId = userReferenceId,
  organization = organizationScopeReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('user-record'),
    domainId: 'user',
    objectContractId: createCoreContractId('core-object-user-record-contract'),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-16T06:35:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-16T06:35:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-052'
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
    referenceId: 'identity:ref:user-052',
    objectType: 'identity-record',
    referenceDomain: 'identity',
    status: 'Active'
  },
  {
    referenceId: 'identity:ref:user-relinked-052',
    objectType: 'identity-record',
    referenceDomain: 'identity',
    status: 'Active'
  },
  {
    referenceId: 'identity:ref:suspended-052',
    objectType: 'identity-record',
    referenceDomain: 'identity',
    status: 'Suspended'
  },
  {
    referenceId: organizationScopeReferenceId,
    objectType: 'organization-record',
    referenceDomain: 'organization',
    status: 'Active'
  },
  {
    referenceId: 'organization:ref:other-052',
    objectType: 'organization-record',
    referenceDomain: 'organization',
    status: 'Active'
  }
];

function harness(failTrace = false) {
  const store = new CoreInMemoryUserServiceStore();
  const traces = new CoreEventTraceRegistry();
  let clock = 0;
  const service = new CoreUserService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: failTrace
      ? {
          append() {
            return {
              ok: false as const,
              error: {
                code: 'UserTraceFailed' as const,
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
    now: () => new Date(Date.UTC(2026, 6, 16, 6, 35, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(
  service: CoreUserService,
  options: {
    readonly aiInitiated?: boolean;
    readonly reviewApproved?: boolean;
    readonly userType?: unknown;
    readonly identityReferenceId?: string;
  } = {}
) {
  return service.createUser({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedUserReference,
    userType: options.userType ?? 'InternalUser',
    displayNameReference: 'user:name:core-task-052',
    identityReferenceId: options.identityReferenceId ?? 'identity:ref:user-052',
    status: 'Active',
    sourceReference: 'source:user:052',
    aiInitiated: options.aiInitiated ?? false,
    agentContractReferenceId: options.aiInitiated
      ? 'agent-contract:ref:user-052'
      : null,
    idempotencyKey: 'idem:user:create:052',
    governance: governance(
      'user.create',
      'user:create',
      'user.write',
      userReferenceId,
      {
        reviewApproved: options.reviewApproved
      }
    )
  });
}

function code(result: { ok: boolean; error?: { code: string } }) {
  return result.ok ? null : result.error?.code;
}

describe('CORE-TASK-052 User Service account-participant foundation', () => {
  it('creates an immutable User idempotently and exposes only safe account-participant context', () => {
    const { service, store, traces } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(create(service).ok, true);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Restricted']).length, 1);

    const read = service.getUser({
      userReferenceId,
      governance: governance('user.get', 'user:read', 'user.read')
    });
    assert.equal(read.ok && read.value.userReferenceId, userReferenceId);
    assert.equal(
      read.ok && read.value.identityReferenceId,
      'identity:ref:user-052'
    );
    assert.equal(read.ok && read.value.grantsPermission, false);
    assert.equal(read.ok && read.value.evaluatesPolicy, false);
    assert.equal(read.ok && read.value.authenticationImplemented, false);
    assert.equal(read.ok && read.value.businessContactObjectsCreated, false);
    assert.equal(
      read.ok && Object.hasOwn(read.value, 'displayNameReference'),
      false
    );
  });

  it('requires an active Identity and preserves the Service user-type vocabulary', () => {
    const { service } = harness();
    assert.equal(
      code(
        create(service, { identityReferenceId: 'identity:ref:missing-052' })
      ),
      'InvalidIdentityReference'
    );
    assert.equal(
      code(
        create(service, { identityReferenceId: 'identity:ref:suspended-052' })
      ),
      'InvalidIdentityReference'
    );
    assert.equal(
      code(create(service, { userType: 'HumanUser' })),
      'InvalidUserType'
    );
  });

  it('governs Identity relinking, Organization linkage, and deterministic resolution without granting Permission', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);

    const noReview = service.linkUserIdentity({
      userReferenceId,
      identityReferenceId: 'identity:ref:user-relinked-052',
      reasonReference: 'reason:user:identity-relink-052',
      idempotencyKey: 'idem:user:identity-link:052',
      governance: governance(
        'user.identity.link',
        'user:identity:link',
        'user.relationship'
      )
    });
    assert.equal(code(noReview), 'HumanReviewRequired');

    const relinked = service.linkUserIdentity({
      userReferenceId,
      identityReferenceId: 'identity:ref:user-relinked-052',
      reasonReference: 'reason:user:identity-relink-052',
      idempotencyKey: 'idem:user:identity-link:052-reviewed',
      governance: governance(
        'user.identity.link',
        'user:identity:link',
        'user.relationship',
        userReferenceId,
        { reviewApproved: true }
      )
    });
    assert.equal(relinked.ok, true);

    const linked = service.linkUserOrganization({
      userReferenceId,
      organizationReferenceId: organizationScopeReferenceId,
      linkType: 'Member',
      idempotencyKey: 'idem:user:organization-link:052',
      governance: governance(
        'user.organization.link',
        'user:organization:link',
        'user.relationship'
      )
    });
    assert.equal(linked.ok && linked.value.organizationLinks.length, 1);

    const resolved = service.resolveUserByIdentity({
      identityReferenceId: 'identity:ref:user-relinked-052',
      organizationReferenceId: organizationScopeReferenceId,
      governance: governance(
        'user.identity.resolve',
        'user:read',
        'user.resolve',
        'identity:ref:user-relinked-052'
      )
    });
    assert.equal(
      resolved.ok && resolved.value.userReferenceId,
      userReferenceId
    );
    assert.equal(resolved.ok && resolved.value.grantsPermission, false);
  });

  it('enforces AI review, lifecycle validation, Organization context requirements, and cross-organization non-enumeration', () => {
    const { service } = harness();
    assert.equal(
      code(create(service, { aiInitiated: true })),
      'UserCreationReviewRequired'
    );
    assert.equal(
      create(service, { aiInitiated: true, reviewApproved: true }).ok,
      true
    );

    const missingOrganization = service.validateUserReference({
      userReferenceId,
      requestingDomain: 'task',
      requestingService: 'task-service',
      organizationReferenceId: organizationScopeReferenceId,
      governance: governance(
        'user.reference.validate',
        'user:read',
        'user.reference'
      )
    });
    assert.equal(
      missingOrganization.ok && missingOrganization.value.reasonCode,
      'OrganizationRequired'
    );

    const suspended = service.changeUserStatus({
      userReferenceId,
      nextStatus: 'Suspended',
      reasonReference: 'reason:user:suspended-052',
      idempotencyKey: 'idem:user:suspend:052',
      governance: governance('user.status.change', 'user:status', 'user.status')
    });
    assert.equal(suspended.ok, true);
    const validation = service.validateUserReference({
      userReferenceId,
      requestingDomain: 'communication',
      requestingService: 'communication-service',
      governance: governance(
        'user.reference.validate',
        'user:read',
        'user.reference'
      )
    });
    assert.equal(validation.ok && validation.value.isValid, false);
    assert.equal(validation.ok && validation.value.reasonCode, 'Suspended');

    const hidden = service.getUser({
      userReferenceId,
      governance: governance(
        'user.get',
        'user:read',
        'user.read',
        userReferenceId,
        {
          organization: 'organization:ref:other-052'
        }
      )
    });
    assert.equal(code(hidden), 'UserNotFound');
  });

  it('rolls back creation when Event trace handoff fails', () => {
    const { service, store } = harness(true);
    const result = create(service);
    assert.equal(code(result), 'UserTraceFailed');
    assert.equal(store.list().length, 0);
  });
});
