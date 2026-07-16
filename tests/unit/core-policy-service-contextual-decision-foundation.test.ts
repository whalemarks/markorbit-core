import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryPolicyServiceStore,
  CorePolicyService,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreJsonObject,
  type CoreMvpObjectBaseRecord,
  type CorePolicyDecision,
  type CorePolicyServiceGovernanceContext,
  type CorePolicyType,
  type CoreReferenceRecord
} from '../../src/index.ts';

const policyReferenceId = 'policy:ref:00005';
const actorReferenceId = 'user:ref:policy-054';
const organizationReferenceId = 'organization:ref:policy-054';
const otherOrganizationReferenceId = 'organization:ref:policy-other-054';
const resourceReferenceId = 'document:ref:policy-054';
const jurisdictionReferenceId = 'jurisdiction:ref:policy-054';

function publicReference(referenceId = policyReferenceId): CoreReferenceRecord {
  return {
    referenceId,
    objectType: 'permission-policy-record',
    referenceDomain: 'policy',
    status: 'Active'
  };
}

function governance(
  operation: string,
  permission: string,
  target = policyReferenceId,
  options: {
    readonly organization?: string | null;
    readonly reviewApproved?: boolean;
    readonly permissionAllowed?: boolean;
    readonly governingActorReferenceId?: string;
  } = {}
): CorePolicyServiceGovernanceContext {
  const reviewApproved = options.reviewApproved ?? false;
  const governingActor =
    options.governingActorReferenceId ?? 'user:ref:policy-admin-054';
  return {
    correlationId: 'corr:core-task-054',
    auditContextReferenceId: 'audit:ctx:core-task-054',
    authorizedOrganizationReferenceId:
      options.organization === undefined
        ? organizationReferenceId
        : options.organization,
    permission: {
      actorReferenceId: governingActor,
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId:
        options.permissionAllowed === false
          ? 'permission:decision:deny-054'
          : 'permission:decision:allow-054',
      permissionDecision:
        options.permissionAllowed === false ? 'Denied' : 'Allowed',
      correlationId: 'corr:core-task-054'
    },
    review: {
      humanReviewRequired: reviewApproved,
      humanReviewReferenceId: reviewApproved ? 'review:ref:policy-054' : null,
      reviewStatus: reviewApproved ? 'Completed' : null,
      reviewScope: reviewApproved ? 'policy.sensitive' : null,
      reviewDecision: reviewApproved ? 'Approved' : null,
      reviewerUserReferenceId: reviewApproved ? 'user:ref:reviewer-054' : null,
      targetObjectType: 'permission-policy-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: governingActor,
      targetObjectType: 'permission-policy-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId:
        options.permissionAllowed === false
          ? 'permission:decision:deny-054'
          : 'permission:decision:allow-054',
      policyDecisionReferenceId: 'policy:decision:bootstrap-054',
      humanReviewReferenceId: reviewApproved ? 'review:ref:policy-054' : null,
      correlationId: 'corr:core-task-054'
    }
  };
}

function objectRecord(
  referenceId = policyReferenceId,
  organization = organizationReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('permission-policy-record'),
    domainId: 'policy',
    objectContractId: createCoreContractId(
      'core-object-permission-policy-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-16T10:15:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-16T10:15:00.000Z',
      createdByReferenceId: 'user:ref:policy-admin-054',
      correlationId: 'corr:core-task-054'
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
    referenceId: 'agent:ref:policy-054',
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
    referenceId: otherOrganizationReferenceId,
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
    referenceId: 'document:ref:policy-other-054',
    objectType: 'document-record',
    referenceDomain: 'document',
    status: 'Active'
  },
  {
    referenceId: jurisdictionReferenceId,
    objectType: 'jurisdiction-record',
    referenceDomain: 'jurisdiction',
    status: 'Active'
  }
];

function harness(failTrace = false) {
  const store = new CoreInMemoryPolicyServiceStore();
  const traces = new CoreEventTraceRegistry();
  let clock = 0;
  const service = new CorePolicyService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: failTrace
      ? {
          append() {
            return {
              ok: false as const,
              error: {
                code: 'PolicyTraceFailed' as const,
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
    now: () => new Date(Date.UTC(2026, 6, 16, 10, 15, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key.replaceAll(':', '-')}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(
  service: CorePolicyService,
  options: {
    readonly referenceId?: string;
    readonly policyType?: CorePolicyType;
    readonly decision?: CorePolicyDecision;
    readonly actorReferenceId?: string | null;
    readonly actorType?: 'User' | 'AIAgent' | null;
    readonly action?: string;
    readonly resourceType?: string;
    readonly resourceReferenceId?: string | null;
    readonly organizationReferenceId?: string | null;
    readonly jurisdictionReferenceId?: string | null;
    readonly confidentialityLevel?: 'Confidential' | 'Restricted' | null;
    readonly conditionReference?: string;
    readonly context?: CoreJsonObject;
    readonly reviewRequired?: boolean;
    readonly approvalRequired?: boolean;
    readonly redactionRequired?: boolean;
    readonly nonDisclosureRequired?: boolean;
    readonly aiSensitive?: boolean;
    readonly aiInitiated?: boolean;
    readonly reviewApproved?: boolean;
    readonly status?: 'Draft' | 'Active' | 'ReviewRequired';
    readonly idempotencyKey?: string;
  } = {}
) {
  const referenceId = options.referenceId ?? policyReferenceId;
  const decision = options.decision ?? 'Allowed';
  const policyType = options.policyType ?? 'AccessPolicy';
  const reviewApproved =
    options.reviewApproved ??
    (options.aiInitiated === true ||
      decision !== 'Allowed' ||
      ['AIAgentPolicy', 'SystemPolicy', 'ConfidentialityPolicy'].includes(
        policyType
      ));
  const actor =
    options.actorReferenceId === undefined
      ? actorReferenceId
      : options.actorReferenceId;
  const actorType =
    options.actorType === undefined ? 'User' : options.actorType;
  return service.createPolicy({
    objectRecord: objectRecord(
      referenceId,
      options.organizationReferenceId ?? organizationReferenceId
    ),
    publicReferenceRecord: publicReference(referenceId),
    policyType,
    policyScope: 'Resource',
    decision,
    actorReferenceId: actor,
    actorType,
    action: options.action ?? 'document:read',
    resourceType: options.resourceType ?? 'document',
    resourceReferenceId:
      options.resourceReferenceId === undefined
        ? resourceReferenceId
        : options.resourceReferenceId,
    organizationReferenceId:
      options.organizationReferenceId === undefined
        ? organizationReferenceId
        : options.organizationReferenceId,
    jurisdictionReferenceId:
      options.jurisdictionReferenceId === undefined
        ? jurisdictionReferenceId
        : options.jurisdictionReferenceId,
    confidentialityLevel:
      options.confidentialityLevel === undefined
        ? 'Confidential'
        : options.confidentialityLevel,
    conditionReference:
      options.conditionReference ?? `condition:policy:${referenceId}`,
    requiredContextAttributes: options.context ?? {
      channel: 'portal',
      classification: 'confidential'
    },
    sourceReference: 'source:policy:054',
    reasonCode: `reason:policy:${decision.toLowerCase()}`,
    status: options.status ?? 'Active',
    reviewRequired: options.reviewRequired,
    approvalRequired: options.approvalRequired,
    redactionRequired: options.redactionRequired,
    nonDisclosureRequired: options.nonDisclosureRequired,
    aiSensitive: options.aiSensitive,
    aiInitiated: options.aiInitiated ?? false,
    agentContractReferenceId: options.aiInitiated
      ? 'agent-contract:ref:policy-054'
      : null,
    idempotencyKey:
      options.idempotencyKey ?? `idem:policy:create:${referenceId}`,
    governance: governance('policy.create', 'policy:create', referenceId, {
      reviewApproved
    })
  });
}

function evaluate(
  service: CorePolicyService,
  options: {
    readonly permissionDecision?:
      'Allowed' | 'Denied' | 'PolicyRequired' | 'NotFound';
    readonly permissionReference?: string | null;
    readonly organizationReferenceId?: string | null;
    readonly context?: CoreJsonObject;
    readonly policyControlled?: boolean;
    readonly aiAction?: boolean;
    readonly protectedDataAction?: boolean;
    readonly externalCommunicationAction?: boolean;
  } = {}
) {
  return service.evaluatePolicy({
    requestingActorReferenceId: actorReferenceId,
    actorType: 'User',
    permissionDecision: options.permissionDecision ?? 'PolicyRequired',
    permissionDecisionReferenceId:
      options.permissionReference === undefined
        ? 'permission:decision:policy-required-054'
        : options.permissionReference,
    action: 'document:read',
    resourceType: 'document',
    resourceReferenceId,
    organizationReferenceId:
      options.organizationReferenceId === undefined
        ? organizationReferenceId
        : options.organizationReferenceId,
    jurisdictionReferenceId,
    confidentialityLevel: 'Confidential',
    contextAttributes: options.context ?? {
      channel: 'portal',
      classification: 'confidential'
    },
    policyControlled: options.policyControlled,
    aiAction: options.aiAction,
    protectedDataAction: options.protectedDataAction,
    externalCommunicationAction: options.externalCommunicationAction,
    governance: governance(
      'policy.evaluate',
      'policy:evaluate',
      resourceReferenceId,
      {
        organization:
          options.organizationReferenceId === undefined
            ? organizationReferenceId
            : options.organizationReferenceId
      }
    )
  });
}

describe('CORE-TASK-054 Policy Service contextual-decision foundation', () => {
  it('creates immutable governed Policy records and returns safe views', () => {
    const { service, store, traces } = harness();
    const created = create(service);
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.value.policyStatus, 'Active');
    assert.equal(created.value.objectRecord.status, 'active');
    assert.equal(Object.isFrozen(created.value), true);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Restricted']).length, 1);

    const view = service.getPolicy({
      policyReferenceId,
      governance: governance('policy.get', 'policy:read')
    });
    assert.equal(view.ok, true);
    if (!view.ok) return;
    assert.equal(view.value.grantsPermission, false);
    assert.equal(view.value.executesApproval, false);
    assert.equal(view.value.legalRuleEngineImplemented, false);
    assert.equal(view.value.protectedConditionsOmitted, true);
    assert.equal('requiredContextAttributes' in view.value, false);
  });

  it('fails closed when Permission does not authorize the underlying action', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const result = evaluate(service, {
      permissionDecision: 'Denied',
      permissionReference: 'permission:decision:deny-054'
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.decision, 'Denied');
    assert.equal(result.value.reasonCode, 'PermissionNotAllowed');
    assert.equal(result.value.matchedPolicyReferenceId, null);
    assert.equal(result.value.permissionGrantedByPolicy, false);
    assert.equal(result.value.mayProceed, false);
  });

  it('applies deterministic deny precedence over an otherwise matching allow', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(
      create(service, {
        referenceId: 'policy:ref:deny-054',
        decision: 'Denied',
        conditionReference: 'condition:policy:deny-054',
        reviewApproved: true
      }).ok,
      true
    );
    const result = evaluate(service);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.decision, 'Denied');
    assert.equal(result.value.reasonCode, 'ExplicitPolicyDeny');
    assert.equal(result.value.matchedPolicyReferenceId, 'policy:ref:deny-054');
  });

  it('returns non-disclosure, review, approval, and redaction guidance without executing approval', () => {
    const cases = [
      {
        referenceId: 'policy:ref:nondisclosure-054',
        decision: 'Restricted' as const,
        nonDisclosureRequired: true,
        expectedReason: 'PolicyNonDisclosure'
      },
      {
        referenceId: 'policy:ref:review-054',
        decision: 'ReviewRequired' as const,
        reviewRequired: true,
        expectedReason: 'PolicyReviewRequired'
      },
      {
        referenceId: 'policy:ref:approval-054',
        decision: 'ApprovalRequired' as const,
        approvalRequired: true,
        expectedReason: 'PolicyApprovalRequired'
      },
      {
        referenceId: 'policy:ref:redact-054',
        decision: 'RedactionRequired' as const,
        redactionRequired: true,
        expectedReason: 'PolicyRedactionRequired'
      }
    ];
    for (const testCase of cases) {
      const { service } = harness();
      assert.equal(
        create(service, {
          ...testCase,
          conditionReference: `condition:${testCase.referenceId}`,
          reviewApproved: true
        }).ok,
        true
      );
      const result = evaluate(service);
      assert.equal(result.ok, true);
      if (!result.ok) continue;
      assert.equal(result.value.reasonCode, testCase.expectedReason);
      assert.equal(result.value.approvalExecutedByPolicy, false);
      assert.equal(result.value.protectedConditionsOmitted, true);
      if (testCase.redactionRequired)
        assert.equal(result.value.mayProceed, true);
      else assert.equal(result.value.mayProceed, false);
    }
  });

  it('fails closed when a controlled action has no applicable Policy and distinguishes ungoverned context', () => {
    const { service } = harness();
    const controlled = evaluate(service);
    assert.equal(controlled.ok, true);
    if (!controlled.ok) return;
    assert.equal(controlled.value.decision, 'Denied');
    assert.equal(controlled.value.reasonCode, 'NoApplicablePolicy');

    const notRequired = evaluate(service, { policyControlled: false });
    assert.equal(notRequired.ok, true);
    if (!notRequired.ok) return;
    assert.equal(notRequired.value.decision, 'NotApplicable');
    assert.equal(notRequired.value.reasonCode, 'PolicyNotRequired');
  });

  it('requires explicit Policy evaluation for protected AI actions', () => {
    const { service } = harness();
    const missing = evaluate(service, {
      policyControlled: false,
      aiAction: true,
      protectedDataAction: true,
      externalCommunicationAction: true
    });
    assert.equal(missing.ok, false);
    if (missing.ok) return;
    assert.equal(missing.error.code, 'PolicyContextRequired');

    const noReview = create(service, {
      referenceId: 'policy:ref:ai-054',
      policyType: 'AIAgentPolicy',
      aiInitiated: true,
      actorReferenceId: 'agent:ref:policy-054',
      actorType: 'AIAgent',
      reviewApproved: false
    });
    assert.equal(noReview.ok, false);
    if (noReview.ok) return;
    assert.equal(noReview.error.code, 'PolicyCreationReviewRequired');
  });

  it('validates and lists only applicable Policies without exposing conditions', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const validation = service.validatePolicyReference({
      policyReferenceId,
      requestingDomain: 'document',
      requestingService: 'document-service',
      governance: governance(
        'policy.reference.validate',
        'policy:reference:validate'
      )
    });
    assert.equal(validation.ok, true);
    if (!validation.ok) return;
    assert.equal(validation.value.isValid, true);
    assert.equal(validation.value.protectedConditionsOmitted, true);

    const listed = service.listApplicablePolicies({
      requestingActorReferenceId: actorReferenceId,
      actorType: 'User',
      action: 'document:read',
      resourceType: 'document',
      resourceReferenceId,
      organizationReferenceId,
      jurisdictionReferenceId,
      confidentialityLevel: 'Confidential',
      contextAttributes: {
        channel: 'portal',
        classification: 'confidential'
      },
      governance: governance(
        'policy.list.applicable',
        'policy:list',
        resourceReferenceId
      )
    });
    assert.equal(listed.ok, true);
    if (!listed.ok) return;
    assert.equal(listed.value.length, 1);
    assert.equal('requiredContextAttributes' in listed.value[0]!, false);
  });

  it('uses non-enumerating cross-organization failures', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const result = service.getPolicy({
      policyReferenceId,
      governance: governance('policy.get', 'policy:read', policyReferenceId, {
        organization: otherOrganizationReferenceId
      })
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, 'PolicyNotFound');
  });

  it('supports governed lifecycle, update, archive, and idempotent replay', () => {
    const { service } = harness();
    const first = create(service, { status: 'Draft' });
    const replay = create(service, { status: 'Draft' });
    assert.equal(first.ok, true);
    assert.equal(replay.ok, true);
    if (!first.ok || !replay.ok) return;
    assert.deepEqual(replay.value, first.value);

    const updated = service.updatePolicy({
      policyReferenceId,
      decision: 'RedactionRequired',
      redactionRequired: true,
      reasonReference: 'reason:policy:update-054',
      idempotencyKey: 'idem:policy:update-054',
      governance: governance(
        'policy.update',
        'policy:update',
        policyReferenceId,
        {
          reviewApproved: true
        }
      )
    });
    assert.equal(updated.ok, true);
    if (!updated.ok) return;
    assert.equal(updated.value.decision, 'RedactionRequired');

    const activated = service.changePolicyStatus({
      policyReferenceId,
      nextStatus: 'Active',
      reasonReference: 'reason:policy:activate-054',
      idempotencyKey: 'idem:policy:activate-054',
      governance: governance(
        'policy.status.change',
        'policy:status',
        policyReferenceId,
        { reviewApproved: true }
      )
    });
    assert.equal(activated.ok, true);

    const archived = service.archivePolicy({
      policyReferenceId,
      reasonReference: 'reason:policy:archive-054',
      idempotencyKey: 'idem:policy:archive-054',
      governance: governance('policy.archive', 'policy:archive')
    });
    assert.equal(archived.ok, true);
    if (!archived.ok) return;
    assert.equal(archived.value.policyStatus, 'Archived');
  });

  it('rolls back mutation when Event trace handoff fails', () => {
    const { service, store } = harness(true);
    const result = create(service);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, 'PolicyTraceFailed');
    assert.equal(store.list().length, 0);
  });
});
