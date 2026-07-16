import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreCommunicationService,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryCommunicationServiceStore,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreCommunicationGovernanceContext,
  type CoreEventId,
  type CoreMvpObjectBaseRecord
} from '../../src/index.ts';

const communicationReferenceId = 'communication:ref:00018';
const organizationReferenceId = 'organization:ref:scope-0001';
const communicationReference =
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
    (entry) => entry.referenceId === communicationReferenceId
  );
if (!communicationReference)
  throw new Error('Communication fixture reference is missing.');
const governedCommunicationReference = communicationReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = communicationReferenceId,
  options: {
    readonly organization?: string;
    readonly policyDecision?: 'Allowed' | 'Restricted' | 'HumanReviewRequired';
    readonly reviewApproved?: boolean;
  } = {}
): CoreCommunicationGovernanceContext {
  const reviewApproved = options.reviewApproved ?? false;
  return {
    correlationId: 'corr:core-task-049',
    auditContextReferenceId: 'audit:ctx:core-task-049',
    authorizedOrganizationReferenceId:
      options.organization ?? organizationReferenceId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-049',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-049'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-049',
      policyDecision: options.policyDecision ?? 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-049'
    },
    review: {
      humanReviewRequired: reviewApproved,
      humanReviewReferenceId: reviewApproved
        ? 'review:ref:communication-049'
        : null,
      reviewStatus: reviewApproved ? 'Completed' : null,
      reviewScope: reviewApproved ? 'communication.outbound' : null,
      reviewDecision: reviewApproved ? 'Approved' : null,
      reviewerUserReferenceId: reviewApproved ? 'user:ref:reviewer-049' : null,
      targetObjectType: 'communication-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'communication-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-049',
      policyDecisionReferenceId: 'policy:decision:allow-049',
      humanReviewReferenceId: reviewApproved
        ? 'review:ref:communication-049'
        : null,
      correlationId: 'corr:core-task-049'
    }
  };
}

function objectRecord(
  referenceId = communicationReferenceId,
  organization = organizationReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('communication-record'),
    domainId: 'communication',
    objectContractId: createCoreContractId(
      'core-object-communication-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-15T18:55:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-15T18:55:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-049'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organization
    }
  };
}

function harness(failAfter = Number.POSITIVE_INFINITY) {
  const store = new CoreInMemoryCommunicationServiceStore();
  const traces = new CoreEventTraceRegistry();
  let traceCalls = 0;
  let clock = 0;
  const service = new CoreCommunicationService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort: {
      append(record) {
        traceCalls += 1;
        return traceCalls > failAfter
          ? {
              ok: false as const,
              error: {
                code: 'CommunicationTraceFailed' as const,
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
      {
        referenceId: 'agent:ref:communication-049',
        objectType: 'agent-record',
        referenceDomain: 'agent',
        status: 'Active'
      }
    ]),
    now: () => new Date(Date.UTC(2026, 6, 15, 19, clock++)).toISOString(),
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function create(
  service: CoreCommunicationService,
  options: {
    readonly aiDraft?: boolean;
    readonly direction?: 'Outbound' | 'Inbound';
  } = {}
) {
  return service.createCommunication({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedCommunicationReference,
    communicationType: 'Email',
    status: options.direction === 'Inbound' ? 'Received' : 'Draft',
    direction: options.direction ?? 'Outbound',
    channel: 'Email',
    participantReferences: [
      {
        participantReferenceId: 'customer-contact:ref:communication-049',
        participantRole: 'Recipient'
      }
    ],
    subjectReference: 'communication:subject:049',
    messageReference: 'communication:message:049',
    contentReference: 'communication:content:restricted-049',
    sourceReference: 'source:communication:049',
    confidentialityLevel: 'Internal',
    aiDraft: options.aiDraft ?? false,
    aiSourceReference: options.aiDraft
      ? 'agent:ref:communication-drafter-049'
      : null,
    idempotencyKey: options.aiDraft
      ? 'idem:communication:create:ai:049'
      : options.direction === 'Inbound'
        ? 'idem:communication:create:inbound:049'
        : 'idem:communication:create:049',
    governance: governance(
      'communication.create',
      'communication:create',
      'communication.write'
    )
  });
}

function code(result: { ok: boolean; error?: { code: string } }) {
  return result.ok ? null : result.error?.code;
}

describe('CORE-TASK-049 Communication Service governed communication foundation', () => {
  it('creates idempotently, reads/lists safely, updates and validates without exposing content', () => {
    const { service, store, traces } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(create(service).ok, true);
    assert.equal(store.list().length, 1);
    assert.equal(traces.visibleTo(['Internal']).length, 1);

    const read = service.getCommunication({
      communicationReferenceId,
      governance: governance(
        'communication.get',
        'communication:read',
        'communication.read'
      )
    });
    assert.equal(read.ok && read.value.restrictedFieldsOmitted, true);
    assert.equal(
      read.ok && Object.hasOwn(read.value, 'contentReference'),
      false
    );

    const listed = service.listCommunications({
      governance: governance(
        'communication.list',
        'communication:read',
        'communication.read',
        'communication:collection'
      )
    });
    assert.equal(listed.ok && listed.value.items.length, 1);

    const updated = service.updateCommunication({
      communicationReferenceId,
      subjectReference: 'communication:subject:updated-049',
      idempotencyKey: 'idem:communication:update:049',
      governance: governance(
        'communication.update',
        'communication:update',
        'communication.write'
      )
    });
    assert.equal(
      updated.ok && updated.value.subjectReference,
      'communication:subject:updated-049'
    );

    const validated = service.validateCommunicationReference({
      communicationReferenceId,
      requestingDomain: 'matter',
      requestingService: 'matter-service',
      governance: governance(
        'communication.reference.validate',
        'communication:read',
        'communication.reference'
      )
    });
    assert.equal(validated.ok && validated.value.reasonCode, 'Valid');
  });

  it('links participants and governed references while keeping attachments separate from Document and Evidence', () => {
    const { service, traces } = harness();
    assert.equal(create(service).ok, true);

    assert.equal(
      service.linkCommunicationParticipant({
        communicationReferenceId,
        participantReference: 'user:ref:reviewer-049',
        participantRole: 'Reviewer',
        idempotencyKey: 'idem:communication:participant:049',
        governance: governance(
          'communication.participant.link',
          'communication:link',
          'communication.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkCommunicationMatter({
        communicationReferenceId,
        matterReferenceId: 'matter:ref:00013',
        idempotencyKey: 'idem:communication:matter:049',
        governance: governance(
          'communication.matter.link',
          'communication:link',
          'communication.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkCommunicationCustomer({
        communicationReferenceId,
        customerReferenceId: 'customer:ref:00006',
        idempotencyKey: 'idem:communication:customer:049',
        governance: governance(
          'communication.customer.link',
          'communication:link',
          'communication.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkCommunicationAgent({
        communicationReferenceId,
        agentReferenceId: 'agent:ref:communication-049',
        idempotencyKey: 'idem:communication:agent:049',
        governance: governance(
          'communication.agent.link',
          'communication:link',
          'communication.relationship'
        )
      }).ok,
      true
    );
    const attachment = service.linkCommunicationAttachment({
      communicationReferenceId,
      attachmentReference: 'attachment:ref:communication-049',
      idempotencyKey: 'idem:communication:attachment:049',
      governance: governance(
        'communication.attachment.link',
        'communication:link',
        'communication.relationship'
      )
    });
    assert.equal(
      attachment.ok && attachment.value.documentReferenceIds.length,
      0
    );
    const document = service.linkCommunicationDocument({
      communicationReferenceId,
      documentReferenceId: 'document:ref:00011',
      idempotencyKey: 'idem:communication:document:049',
      governance: governance(
        'communication.document.link',
        'communication:link',
        'communication.relationship'
      )
    });
    assert.equal(document.ok && document.value.documentReferenceIds.length, 1);
    assert.equal(
      document.ok && Object.hasOwn(document.value, 'evidenceReferenceIds'),
      false
    );
    assert.equal(traces.visibleTo(['Internal']).length, 7);
  });

  it('requires governed approval for AI drafts and records sent state without performing gateway delivery', () => {
    const ai = harness();
    assert.equal(create(ai.service, { aiDraft: true }).ok, true);
    const denied = ai.service.recordCommunicationSent({
      communicationReferenceId,
      channel: 'Email',
      deliveryContextReference: 'delivery:context:049',
      idempotencyKey: 'idem:communication:sent:denied:049',
      governance: governance(
        'communication.sent.record',
        'communication:send-record',
        'communication.outbound'
      )
    });
    assert.equal(code(denied), 'OutboundReviewRequired');

    const normal = harness();
    assert.equal(create(normal.service).ok, true);
    const ready = normal.service.changeCommunicationStatus({
      communicationReferenceId,
      nextStatus: 'ReadyToSend',
      idempotencyKey: 'idem:communication:ready:049',
      governance: governance(
        'communication.status.change',
        'communication:status',
        'communication.status'
      )
    });
    assert.equal(ready.ok, true);
    const sent = normal.service.recordCommunicationSent({
      communicationReferenceId,
      channel: 'Email',
      deliveryContextReference: 'delivery:context:049',
      idempotencyKey: 'idem:communication:sent:049',
      governance: governance(
        'communication.sent.record',
        'communication:send-record',
        'communication.outbound'
      )
    });
    assert.equal(sent.ok && sent.value.communicationStatus, 'Sent');
    assert.equal(
      sent.ok && sent.value.deliveryState?.externalDeliveryPerformed,
      false
    );
  });

  it('records inbound receipt, hides cross-organization records and rolls back event-trace failure', () => {
    const inbound = harness();
    assert.equal(create(inbound.service, { direction: 'Inbound' }).ok, true);
    const received = inbound.service.recordCommunicationReceived({
      communicationReferenceId,
      channel: 'Email',
      deliveryContextReference: 'delivery:inbound:049',
      idempotencyKey: 'idem:communication:received:049',
      governance: governance(
        'communication.received.record',
        'communication:receive-record',
        'communication.inbound'
      )
    });
    assert.equal(received.ok && received.value.communicationStatus, 'Received');

    const hidden = inbound.service.getCommunication({
      communicationReferenceId,
      governance: governance(
        'communication.get',
        'communication:read',
        'communication.read',
        communicationReferenceId,
        { organization: 'organization:ref:other-049' }
      )
    });
    assert.equal(code(hidden), 'CommunicationNotFound');

    const failed = harness(0);
    assert.equal(code(create(failed.service)), 'CommunicationTraceFailed');
    assert.equal(failed.store.list().length, 0);
  });
});
