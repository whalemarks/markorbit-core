import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreIdentityService,
  CoreInMemoryIdentityServiceStore,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreIdentityGovernanceContext,
  type CoreMvpObjectBaseRecord,
  type CoreReferenceRecord
} from '../../src/index.ts';

const identityReferenceId = 'identity:ref:00001';
const secondIdentityReferenceId = 'identity:ref:identity-050-second';
const organizationReferenceId = 'organization:ref:scope-0001';
const identityReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (entry) => entry.referenceId === identityReferenceId
);
if (!identityReference)
  throw new Error('Identity fixture reference is missing.');
const governedIdentityReference = identityReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = identityReferenceId,
  options: {
    readonly organization?: string;
    readonly policyDecision?: 'Allowed' | 'Restricted' | 'HumanReviewRequired';
    readonly reviewApproved?: boolean;
  } = {}
): CoreIdentityGovernanceContext {
  const reviewApproved = options.reviewApproved ?? false;
  return {
    correlationId: 'corr:core-task-050',
    auditContextReferenceId: 'audit:ctx:core-task-050',
    authorizedOrganizationReferenceId:
      options.organization ?? organizationReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-050',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-050'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-050',
      policyDecision: options.policyDecision ?? 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-050'
    },
    review: {
      humanReviewRequired: reviewApproved,
      humanReviewReferenceId: reviewApproved ? 'review:ref:identity-050' : null,
      reviewStatus: reviewApproved ? 'Completed' : null,
      reviewScope: reviewApproved ? 'identity.sensitive' : null,
      reviewDecision: reviewApproved ? 'Approved' : null,
      reviewerUserReferenceId: reviewApproved ? 'user:ref:reviewer-050' : null,
      targetObjectType: 'identity-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'identity-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-050',
      policyDecisionReferenceId: 'policy:decision:allow-050',
      humanReviewReferenceId: reviewApproved ? 'review:ref:identity-050' : null,
      correlationId: 'corr:core-task-050'
    }
  };
}

function objectRecord(
  referenceId = identityReferenceId,
  organization = organizationReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('identity-record'),
    domainId: 'identity',
    objectContractId: createCoreContractId(
      'core-object-identity-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-16T02:20:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-16T02:20:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-050'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organization
    }
  };
}

const secondIdentityReference: CoreReferenceRecord = {
  referenceId: secondIdentityReferenceId,
  objectType: 'identity-record',
  referenceDomain: 'identity',
  status: 'Active'
};

function harness(failAfter = Number.POSITIVE_INFINITY) {
  const store = new CoreInMemoryIdentityServiceStore();
  const traces = new CoreEventTraceRegistry();
  let traceCalls = 0;
  let clock = 0;
  const service = new CoreIdentityService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: {
      append(record) {
        traceCalls += 1;
        return traceCalls > failAfter
          ? {
              ok: false as const,
              error: {
                code: 'IdentityTraceFailed' as const,
                category: 'Event' as const,
                message: 'failed',
                safeDetail: null,
                retryable: false,
                correlationId: null
              }
            }
          : traces.append(record);
      }
    },
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      secondIdentityReference,
      {
        referenceId: 'agent:ref:identity-050',
        objectType: 'agent-record',
        referenceDomain: 'agent',
        status: 'Active'
      },
      {
        referenceId: 'communication:ref:identity-050-contact',
        objectType: 'communication-record',
        referenceDomain: 'communication',
        status: 'Active'
      }
    ]),
    now: () => new Date(Date.UTC(2026, 6, 16, 2, 20, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(
  service: CoreIdentityService,
  options: {
    readonly referenceId?: string;
    readonly referenceRecord?: CoreReferenceRecord;
    readonly identityType?: 'Human' | 'System' | 'AIAgent';
    readonly status?: 'Draft' | 'Active' | 'ReviewRequired';
    readonly aiInitiated?: boolean;
    readonly reviewApproved?: boolean;
  } = {}
) {
  const referenceId = options.referenceId ?? identityReferenceId;
  return service.createIdentity({
    objectRecord: objectRecord(referenceId),
    publicReferenceRecord: options.referenceRecord ?? governedIdentityReference,
    identityType: options.identityType ?? 'Human',
    displayReference: `display:${referenceId.replaceAll(':', '-')}`,
    status: options.status ?? 'Active',
    providerReference: 'provider:core:identity-050',
    sourceReference: 'source:identity:050',
    aiInitiated: options.aiInitiated ?? false,
    agentContractReferenceId: options.aiInitiated
      ? 'agent-contract:ref:identity-050'
      : null,
    idempotencyKey: `idem:identity:create:${referenceId.replaceAll(':', '-')}`,
    governance: governance(
      'identity.create',
      'identity:create',
      'identity.write',
      referenceId,
      { reviewApproved: options.reviewApproved }
    )
  });
}

function code(result: { ok: boolean; error?: { code: string } }) {
  return result.ok ? null : result.error?.code;
}

describe('CORE-TASK-050 Identity Service authority foundation', () => {
  it('creates a stable identity idempotently, returns safe views and updates only governed metadata', () => {
    const { service, store, traces } = harness();
    const first = create(service);
    const replay = create(service);
    assert.equal(first.ok, true);
    assert.equal(replay.ok, true);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Restricted']).length, 1);

    const read = service.getIdentity({
      identityReferenceId,
      governance: governance('identity.get', 'identity:read', 'identity.read')
    });
    assert.equal(
      read.ok && read.value.identityReferenceId,
      identityReferenceId
    );
    assert.equal(read.ok && read.value.grantsPermission, false);
    assert.equal(read.ok && read.value.authenticationImplemented, false);
    assert.equal(
      read.ok && Object.hasOwn(read.value, 'displayReference'),
      false
    );

    const updated = service.updateIdentity({
      identityReferenceId,
      displayReference: 'display:identity-updated-050',
      metadata: { source: 'governed-update' },
      idempotencyKey: 'idem:identity:update:050',
      governance: governance(
        'identity.update',
        'identity:update',
        'identity.write'
      )
    });
    assert.equal(
      updated.ok && updated.value.objectRecord.publicReferenceId,
      identityReferenceId
    );
    assert.equal(
      updated.ok && updated.value.displayReference,
      'display:identity-updated-050'
    );

    const validated = service.validateIdentityReference({
      identityReferenceId,
      requestingDomain: 'event',
      requestingService: 'event-service',
      governance: governance(
        'identity.reference.validate',
        'identity:read',
        'identity.reference'
      )
    });
    assert.equal(validated.ok && validated.value.reasonCode, 'Valid');
  });

  it('enforces controlled type/status and rejects AI-initiated human identity creation without review', () => {
    const { service } = harness();
    const invalidType = service.createIdentity({
      objectRecord: objectRecord(),
      publicReferenceRecord: governedIdentityReference,
      identityType: 'Person',
      displayReference: 'display:identity-050',
      status: 'Active',
      sourceReference: 'source:identity:050',
      idempotencyKey: 'idem:identity:invalid-type:050',
      governance: governance(
        'identity.create',
        'identity:create',
        'identity.write'
      )
    });
    assert.equal(code(invalidType), 'InvalidIdentityType');

    const denied = create(service, { aiInitiated: true });
    assert.equal(code(denied), 'IdentityHumanCreationReviewRequired');
    const approved = create(service, {
      aiInitiated: true,
      reviewApproved: true
    });
    assert.equal(approved.ok, true);
  });

  it('links and resolves actor references without creating User, Organization membership or Permission', () => {
    const { service, traces } = harness();
    assert.equal(create(service).ok, true);
    const linked = service.linkIdentity({
      identityReferenceId,
      linkType: 'UserAccount',
      linkedObjectReferenceId: 'user:ref:00003',
      idempotencyKey: 'idem:identity:link-user:050',
      governance: governance(
        'identity.link',
        'identity:link',
        'identity.relationship'
      )
    });
    assert.equal(linked.ok && linked.value.links.length, 1);
    assert.equal(linked.ok && Object.hasOwn(linked.value, 'permission'), false);
    assert.equal(
      linked.ok && Object.hasOwn(linked.value, 'organizationMembership'),
      false
    );

    const resolved = service.resolveIdentity({
      linkType: 'UserAccount',
      linkedObjectReferenceId: 'user:ref:00003',
      governance: governance(
        'identity.resolve',
        'identity:read',
        'identity.resolve',
        'user:ref:00003'
      )
    });
    assert.equal(
      resolved.ok && resolved.value.identityReferenceId,
      identityReferenceId
    );
    assert.equal(traces.visibleTo(['Restricted']).length, 2);

    assert.equal(
      create(service, {
        referenceId: secondIdentityReferenceId,
        referenceRecord: secondIdentityReference,
        identityType: 'System'
      }).ok,
      true
    );
    const duplicate = service.linkIdentity({
      identityReferenceId: secondIdentityReferenceId,
      linkType: 'UserAccount',
      linkedObjectReferenceId: 'user:ref:00003',
      idempotencyKey: 'idem:identity:duplicate-link:050',
      governance: governance(
        'identity.link',
        'identity:link',
        'identity.relationship',
        secondIdentityReferenceId
      )
    });
    assert.equal(code(duplicate), 'DuplicateIdentityLink');
  });

  it('enforces lifecycle validation, organization non-enumeration and event rollback', () => {
    const active = harness();
    assert.equal(create(active.service).ok, true);
    const suspended = active.service.changeIdentityStatus({
      identityReferenceId,
      nextStatus: 'Suspended',
      reasonReference: 'reason:identity:suspend-050',
      idempotencyKey: 'idem:identity:suspend:050',
      governance: governance(
        'identity.status.change',
        'identity:status',
        'identity.status'
      )
    });
    assert.equal(suspended.ok && suspended.value.identityStatus, 'Suspended');
    const validation = active.service.validateIdentityReference({
      identityReferenceId,
      requestingDomain: 'task',
      requestingService: 'task-service',
      governance: governance(
        'identity.reference.validate',
        'identity:read',
        'identity.reference'
      )
    });
    assert.equal(validation.ok && validation.value.reasonCode, 'Suspended');

    const deniedReactivation = active.service.changeIdentityStatus({
      identityReferenceId,
      nextStatus: 'Active',
      reasonReference: 'reason:identity:reactivate-050',
      idempotencyKey: 'idem:identity:reactivate-denied:050',
      governance: governance(
        'identity.status.change',
        'identity:status',
        'identity.status'
      )
    });
    assert.equal(code(deniedReactivation), 'HumanReviewRequired');

    const hidden = active.service.getIdentity({
      identityReferenceId,
      governance: governance(
        'identity.get',
        'identity:read',
        'identity.read',
        identityReferenceId,
        { organization: 'organization:ref:other-050' }
      )
    });
    assert.equal(code(hidden), 'IdentityNotFound');

    const failed = harness(0);
    assert.equal(code(create(failed.service)), 'IdentityTraceFailed');
    assert.equal(failed.store.list().length, 0);
  });
});
