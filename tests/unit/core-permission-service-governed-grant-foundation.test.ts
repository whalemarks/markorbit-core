import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryPermissionServiceStore,
  CorePermissionService,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CorePermissionServiceGovernanceContext,
  type CoreReferenceRecord
} from '../../src/index.ts';

const permissionReferenceId = 'permission:ref:00004';
const actorReferenceId = 'user:ref:permission-053';
const organizationReferenceId = 'organization:ref:permission-053';
const resourceReferenceId = 'document:ref:permission-053';

function publicReference(
  referenceId = permissionReferenceId
): CoreReferenceRecord {
  return {
    referenceId,
    objectType: 'permission-record',
    referenceDomain: 'permission',
    status: 'Active'
  };
}

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = permissionReferenceId,
  options: {
    readonly organization?: string | null;
    readonly reviewRequired?: boolean;
    readonly reviewApproved?: boolean;
    readonly actorReferenceId?: string;
  } = {}
): CorePermissionServiceGovernanceContext {
  const reviewRequired = options.reviewRequired ?? false;
  const reviewApproved = options.reviewApproved ?? false;
  const governingActor =
    options.actorReferenceId ?? 'user:ref:permission-admin-053';
  return {
    correlationId: 'corr:core-task-053',
    auditContextReferenceId: 'audit:ctx:core-task-053',
    authorizedOrganizationReferenceId:
      options.organization === undefined
        ? organizationReferenceId
        : options.organization,
    permission: {
      actorReferenceId: governingActor,
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-053',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-053'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-053',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-053'
    },
    review: {
      humanReviewRequired: reviewRequired,
      humanReviewReferenceId:
        reviewRequired || reviewApproved ? 'review:ref:permission-053' : null,
      reviewStatus: reviewApproved
        ? 'Completed'
        : reviewRequired
          ? 'Requested'
          : null,
      reviewScope:
        reviewRequired || reviewApproved ? 'permission.sensitive' : null,
      reviewDecision: reviewApproved ? 'Approved' : null,
      reviewerUserReferenceId: reviewApproved ? 'user:ref:reviewer-053' : null,
      targetObjectType: 'permission-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: governingActor,
      targetObjectType: 'permission-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-053',
      policyDecisionReferenceId: 'policy:decision:allow-053',
      humanReviewReferenceId:
        reviewRequired || reviewApproved ? 'review:ref:permission-053' : null,
      correlationId: 'corr:core-task-053'
    }
  };
}

function objectRecord(
  referenceId = permissionReferenceId,
  organization = organizationReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('permission-record'),
    domainId: 'permission',
    objectContractId: createCoreContractId(
      'core-object-permission-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-16T07:35:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-16T07:35:00.000Z',
      createdByReferenceId: 'user:ref:permission-admin-053',
      correlationId: 'corr:core-task-053'
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
    referenceId: actorReferenceId,
    objectType: 'user-record',
    referenceDomain: 'user',
    status: 'Active'
  },
  {
    referenceId: 'user:ref:permission-other-053',
    objectType: 'user-record',
    referenceDomain: 'user',
    status: 'Active'
  },
  {
    referenceId: 'identity:ref:permission-system-053',
    objectType: 'identity-record',
    referenceDomain: 'identity',
    status: 'Active'
  },
  {
    referenceId: 'agent:ref:permission-053',
    objectType: 'agent-record',
    referenceDomain: 'agent',
    status: 'Active'
  },
  {
    referenceId: organizationReferenceId,
    objectType: 'organization-record',
    referenceDomain: 'organization',
    status: 'Active'
  },
  {
    referenceId: 'organization:ref:permission-other-053',
    objectType: 'organization-record',
    referenceDomain: 'organization',
    status: 'Active'
  },
  {
    referenceId: resourceReferenceId,
    objectType: 'document-record',
    referenceDomain: 'document',
    status: 'Active'
  },
  {
    referenceId: 'document:ref:permission-other-053',
    objectType: 'document-record',
    referenceDomain: 'document',
    status: 'Active'
  }
];

function harness(failTrace = false) {
  const store = new CoreInMemoryPermissionServiceStore();
  const traces = new CoreEventTraceRegistry();
  let clock = 0;
  const service = new CorePermissionService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: failTrace
      ? {
          append() {
            return {
              ok: false as const,
              error: {
                code: 'PermissionTraceFailed' as const,
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
    now: () => new Date(Date.UTC(2026, 6, 16, 7, 35, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key.replaceAll(':', '-')}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(
  service: CorePermissionService,
  options: {
    readonly referenceId?: string;
    readonly permissionType?: unknown;
    readonly actorReferenceId?: string;
    readonly actorType?: unknown;
    readonly action?: unknown;
    readonly effect?: unknown;
    readonly policyRequired?: boolean;
    readonly reviewRequired?: boolean;
    readonly status?: unknown;
    readonly resourceReferenceId?: string | null;
    readonly organizationReferenceId?: string | null;
    readonly aiInitiated?: boolean;
    readonly reviewApproved?: boolean;
    readonly governanceActorReferenceId?: string;
    readonly idempotencyKey?: string;
  } = {}
) {
  const referenceId = options.referenceId ?? permissionReferenceId;
  return service.createPermission({
    objectRecord: objectRecord(referenceId),
    publicReferenceRecord: publicReference(referenceId),
    permissionType: options.permissionType ?? 'ActionPermission',
    actorReferenceId: options.actorReferenceId ?? actorReferenceId,
    actorType: options.actorType ?? 'User',
    action: options.action ?? 'Read',
    resourceType: 'document',
    resourceReferenceId:
      options.resourceReferenceId === undefined
        ? resourceReferenceId
        : options.resourceReferenceId,
    organizationReferenceId:
      options.organizationReferenceId === undefined
        ? organizationReferenceId
        : options.organizationReferenceId,
    scopeReference: 'scope:permission:document-read-053',
    effect: options.effect ?? 'Allow',
    status: options.status ?? 'Active',
    sourceReference: 'source:permission:053',
    policyRequired: options.policyRequired ?? false,
    reviewRequired: options.reviewRequired ?? false,
    aiInitiated: options.aiInitiated ?? false,
    agentContractReferenceId: options.aiInitiated
      ? 'agent-contract:ref:permission-053'
      : null,
    idempotencyKey:
      options.idempotencyKey ?? `idem:permission:create:${referenceId}`,
    governance: governance(
      'permission.create',
      'permission:create',
      'permission.write',
      referenceId,
      {
        reviewApproved: options.reviewApproved,
        actorReferenceId: options.governanceActorReferenceId
      }
    )
  });
}

function evaluate(
  service: CorePermissionService,
  options: {
    readonly actorReferenceId?: string;
    readonly action?: unknown;
    readonly resourceReferenceId?: string;
  } = {}
) {
  const actor = options.actorReferenceId ?? actorReferenceId;
  return service.evaluatePermission({
    requestingActorReferenceId: actor,
    actorType: 'User',
    action: options.action ?? 'Read',
    resourceType: 'document',
    resourceReferenceId: options.resourceReferenceId ?? resourceReferenceId,
    organizationReferenceId,
    scopeReference: 'scope:permission:document-read-053',
    taskAssignmentReferenceId: 'task:assignment:does-not-grant-053',
    organizationMembershipReferenceId:
      'organization:membership:does-not-grant-053',
    governance: governance(
      'permission.evaluate',
      'permission:evaluate',
      'permission.evaluate',
      actor
    )
  });
}

function code(result: { ok: boolean; error?: { code: string } }) {
  return result.ok ? null : result.error?.code;
}

describe('CORE-TASK-053 Permission Service governed grant foundation', () => {
  it('creates an immutable Permission idempotently and exposes only a safe rule summary', () => {
    const { service, store, traces } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(create(service).ok, true);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Restricted']).length, 1);

    const read = service.getPermission({
      permissionReferenceId,
      governance: governance(
        'permission.get',
        'permission:read',
        'permission.read'
      )
    });
    assert.equal(
      read.ok && read.value.permissionReferenceId,
      permissionReferenceId
    );
    assert.equal(read.ok && read.value.effect, 'Allow');
    assert.equal(read.ok && read.value.taskAssignmentGrantsPermission, false);
    assert.equal(
      read.ok && read.value.organizationMembershipGrantsPermission,
      false
    );
    assert.equal(read.ok && read.value.evaluatesPolicy, false);
    assert.equal(read.ok && read.value.authenticationImplemented, false);
    assert.equal(
      read.ok && Object.hasOwn(read.value, 'sourceReference'),
      false
    );
    assert.equal(
      read.ok && Object.hasOwn(read.value, 'resourceReferenceId'),
      false
    );
  });

  it('enforces controlled Service values and recognized actor/resource references', () => {
    const { service } = harness();
    assert.equal(
      code(create(service, { permissionType: 'Grant' })),
      'InvalidPermissionType'
    );
    assert.equal(
      code(create(service, { action: 'Fly' })),
      'InvalidPermissionAction'
    );
    assert.equal(
      code(create(service, { effect: 'Maybe' })),
      'InvalidPermissionEffect'
    );
    assert.equal(
      code(
        create(service, {
          actorReferenceId: 'user:ref:permission-missing-053'
        })
      ),
      'InvalidActorReference'
    );
    assert.equal(
      code(
        create(service, {
          resourceReferenceId: 'document:ref:permission-missing-053'
        })
      ),
      'InvalidResourceReference'
    );
  });

  it('evaluates explicit Deny, ReviewRequired, PolicyRequired, and Allow deterministically', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const allowed = evaluate(service);
    assert.equal(allowed.ok && allowed.value.decision, 'Allowed');
    assert.equal(allowed.ok && allowed.value.reasonCode, 'ExplicitAllow');
    assert.equal(allowed.ok && allowed.value.taskAssignmentInferred, false);
    assert.equal(
      allowed.ok && allowed.value.organizationMembershipInferred,
      false
    );

    assert.equal(
      create(service, {
        referenceId: 'permission:ref:deny-053',
        effect: 'Deny',
        idempotencyKey: 'idem:permission:create:deny-053'
      }).ok,
      true
    );
    const denied = evaluate(service);
    assert.equal(denied.ok && denied.value.decision, 'Denied');
    assert.equal(denied.ok && denied.value.reasonCode, 'ExplicitDeny');

    const reviewHarness = harness();
    assert.equal(
      create(reviewHarness.service, {
        effect: 'ReviewRequired',
        reviewRequired: true
      }).ok,
      true
    );
    const reviewed = evaluate(reviewHarness.service);
    assert.equal(reviewed.ok && reviewed.value.decision, 'ReviewRequired');

    const policyHarness = harness();
    assert.equal(
      create(policyHarness.service, { policyRequired: true }).ok,
      true
    );
    const policyRequired = evaluate(policyHarness.service);
    assert.equal(
      policyRequired.ok && policyRequired.value.decision,
      'PolicyRequired'
    );
    assert.equal(
      policyRequired.ok && policyRequired.value.policyRequired,
      true
    );
  });

  it('does not infer Permission from assignment or membership and safely returns NotFound', () => {
    const { service } = harness();
    const result = evaluate(service);
    assert.equal(result.ok && result.value.decision, 'NotFound');
    assert.equal(result.ok && result.value.reasonCode, 'NoMatchingPermission');
    assert.equal(result.ok && result.value.taskAssignmentInferred, false);
    assert.equal(
      result.ok && result.value.organizationMembershipInferred,
      false
    );
  });

  it('prevents AI self-grant, requires review for high-risk grants, and enforces cross-organization non-enumeration', () => {
    const { service } = harness();
    assert.equal(
      code(
        create(service, {
          permissionType: 'AIAgentPermission',
          actorReferenceId: 'agent:ref:permission-053',
          actorType: 'AIAgent',
          aiInitiated: true,
          governanceActorReferenceId: 'agent:ref:permission-053'
        })
      ),
      'PermissionSelfGrantNotAllowed'
    );
    assert.equal(
      code(
        create(service, {
          permissionType: 'AdminPermission',
          referenceId: 'permission:ref:admin-053',
          idempotencyKey: 'idem:permission:create:admin-053'
        })
      ),
      'PermissionCreationReviewRequired'
    );
    assert.equal(
      create(service, {
        permissionType: 'AdminPermission',
        referenceId: 'permission:ref:admin-reviewed-053',
        reviewApproved: true,
        idempotencyKey: 'idem:permission:create:admin-reviewed-053'
      }).ok,
      true
    );

    const hidden = service.getPermission({
      permissionReferenceId: 'permission:ref:admin-reviewed-053',
      governance: governance(
        'permission.get',
        'permission:read',
        'permission.read',
        'permission:ref:admin-reviewed-053',
        { organization: 'organization:ref:permission-other-053' }
      )
    });
    assert.equal(code(hidden), 'PermissionNotFound');
  });

  it('validates, lists, archives, and rolls back mutation when Event trace handoff fails', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const validation = service.validatePermissionReference({
      permissionReferenceId,
      requestingDomain: 'task',
      requestingService: 'task-service',
      governance: governance(
        'permission.reference.validate',
        'permission:read',
        'permission.reference'
      )
    });
    assert.equal(validation.ok && validation.value.isValid, true);

    const listed = service.listActorPermissions({
      actorReferenceId,
      actorType: 'User',
      organizationReferenceId,
      governance: governance(
        'permission.actor.list',
        'permission:read',
        'permission.read',
        actorReferenceId
      )
    });
    assert.equal(listed.ok && listed.value.length, 1);

    const archived = service.archivePermission({
      permissionReferenceId,
      reasonReference: 'reason:permission:archive-053',
      idempotencyKey: 'idem:permission:archive-053',
      governance: governance(
        'permission.archive',
        'permission:archive',
        'permission.status'
      )
    });
    assert.equal(archived.ok && archived.value.permissionStatus, 'Archived');

    const failed = harness(true);
    assert.equal(code(create(failed.service)), 'PermissionTraceFailed');
    assert.equal(failed.store.list().length, 0);
  });
});
