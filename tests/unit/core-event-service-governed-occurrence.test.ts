import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreEventService,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryEventServiceStore,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventGovernanceContext,
  type CoreEventId,
  type CoreMvpObjectBaseRecord
} from '../../src/index.ts';

const eventReferenceId = 'event:ref:00017';
const organizationReferenceId = 'organization:ref:scope-0001';
const eventReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (reference) => reference.referenceId === eventReferenceId
);
if (!eventReference) throw new Error('Event fixture reference is missing.');
const governedEventReference = eventReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = eventReferenceId,
  organization = organizationReferenceId
): CoreEventGovernanceContext {
  return {
    correlationId: 'corr:core-task-046',
    auditContextReferenceId: 'audit:ctx:core-task-046',
    authorizedOrganizationReferenceId: organization,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-046',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-046'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-046',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-046'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'event-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'event-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-046',
      policyDecisionReferenceId: 'policy:decision:allow-046',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-046'
    }
  };
}

function objectRecord(): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: eventReferenceId,
    objectType: createCoreObjectType('event-record'),
    domainId: 'event',
    objectContractId: createCoreContractId('core-object-event-record-contract'),
    status: 'active',
    version: { version: 1, createdAt: '2026-07-15T00:40:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-15T00:40:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-046'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organizationReferenceId
    }
  };
}

function harness(failAfter = Number.POSITIVE_INFINITY) {
  const store = new CoreInMemoryEventServiceStore();
  const traces = new CoreEventTraceRegistry();
  const clocks = Array.from({ length: 30 }, (_, index) =>
    new Date(Date.UTC(2026, 6, 15, 0, 41 + index)).toISOString()
  );
  let traceCalls = 0;
  const tracePort = {
    append: (record: Parameters<CoreEventTraceRegistry['append']>[0]) => {
      traceCalls += 1;
      return traceCalls > failAfter
        ? {
            ok: false as const,
            error: {
              code: 'EventTraceFailed' as const,
              category: 'Event' as const,
              message: 'failed',
              safeDetail: null,
              retryable: false,
              correlationId: null
            }
          }
        : traces.append(record);
    }
  };
  const service = new CoreEventService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    tracePort,
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS
    ]),
    payloadContracts: [
      {
        referenceId: 'payload-contract:ref:order-status-046',
        eventType: 'order-status-changed',
        requiredFields: ['orderReferenceId', 'nextStatus'],
        allowedFields: ['orderReferenceId', 'nextStatus', 'reasonCode']
      }
    ],
    requestingServiceDirectory: [
      { domainId: 'order', serviceType: 'order-service' },
      { domainId: 'task', serviceType: 'task-service' },
      { domainId: 'event', serviceType: 'event-service' }
    ],
    now: () => clocks.shift() ?? '2026-07-15T01:30:00.000Z',
    traceEventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `trace-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId
  });
  return { service, store, traces };
}

function record(service: CoreEventService) {
  return service.recordEvent({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedEventReference,
    eventType: 'order-status-changed',
    eventCategory: 'Domain',
    action: 'status_changed',
    sourceDomain: 'order',
    sourceService: 'order-service',
    sourceObjectType: 'order-record',
    sourceObjectReferenceId: 'order:ref:00014',
    sourceActorType: 'user',
    actorReferenceId: 'user:ref:actor-0001',
    payload: {
      orderReferenceId: 'order:ref:00014',
      nextStatus: 'Confirmed',
      reasonCode: 'CustomerConfirmed'
    },
    payloadContractReferenceId: 'payload-contract:ref:order-status-046',
    occurredAt: '2026-07-15T00:40:30.000Z',
    idempotencyKey: 'idem:event:record:046',
    governance: governance('event.record', 'event:record', 'event.write')
  });
}

function code(result: {
  readonly ok: boolean;
  readonly error?: { readonly code: string };
}) {
  return result.ok ? null : (result.error?.code ?? null);
}

function status(service: CoreEventService, nextStatus: string, key: string) {
  return service.updateEventStatus({
    eventReferenceId,
    nextStatus,
    reasonReferenceId: `reason:ref:${key}`,
    idempotencyKey: `idem:event:status:${key}`,
    governance: governance(
      'event.update_status',
      'event:update_status',
      'event.lifecycle'
    )
  });
}

describe('CORE-TASK-046 Event Service governed occurrence foundation', () => {
  it('records a payload-validated event, links a consumer and completes dispatch lifecycle', () => {
    const { service, store, traces } = harness();
    assert.equal(record(service).ok, true);
    assert.equal(record(service).ok, true);
    assert.equal(store.list().length, 1);

    const conflict = service.recordEvent({
      objectRecord: objectRecord(),
      publicReferenceRecord: governedEventReference,
      eventType: 'order-status-changed',
      eventCategory: 'Domain',
      action: 'status_changed',
      sourceDomain: 'order',
      sourceService: 'order-service',
      sourceObjectType: 'order-record',
      sourceObjectReferenceId: 'order:ref:00014',
      sourceActorType: 'user',
      actorReferenceId: 'user:ref:actor-0001',
      payload: {
        orderReferenceId: 'order:ref:00014',
        nextStatus: 'Cancelled'
      },
      payloadContractReferenceId: 'payload-contract:ref:order-status-046',
      occurredAt: '2026-07-15T00:40:30.000Z',
      idempotencyKey: 'idem:event:record:046',
      governance: governance('event.record', 'event:record', 'event.write')
    });
    assert.equal(code(conflict), 'IdempotencyConflict');

    const safeGet = service.getEvent({
      eventReferenceId,
      governance: governance('event.get', 'event:read', 'event.read')
    });
    assert.equal(safeGet.ok, true);
    if (safeGet.ok) {
      assert.equal(safeGet.value.payloadPresent, true);
      assert.equal(safeGet.value.restrictedFieldsOmitted, true);
      assert.equal('payload' in safeGet.value, false);
      assert.equal('actorReferenceId' in safeGet.value, false);
      assert.equal('sourceObjectReferenceId' in safeGet.value, false);
    }

    assert.equal(
      service.linkEventConsumer({
        eventReferenceId,
        consumerReferenceId: 'task:ref:00016',
        consumerObjectType: 'task-record',
        consumerDomain: 'task',
        idempotencyKey: 'idem:event:consumer:046',
        governance: governance(
          'event.link_consumer',
          'event:link_consumer',
          'event.relationship'
        )
      }).ok,
      true
    );
    assert.equal(status(service, 'Validated', 'validated').ok, true);
    assert.equal(status(service, 'ReadyForDispatch', 'ready').ok, true);
    assert.equal(
      service.markEventDispatched({
        eventReferenceId,
        dispatchReferenceId: 'dispatch:ref:046',
        idempotencyKey: 'idem:event:dispatch:046',
        governance: governance(
          'event.mark_dispatched',
          'event:dispatch',
          'event.dispatch'
        )
      }).ok,
      true
    );
    assert.equal(
      service.archiveEvent({
        eventReferenceId,
        reasonReferenceId: 'reason:ref:archive-046',
        idempotencyKey: 'idem:event:archive:046',
        governance: governance(
          'event.archive',
          'event:archive',
          'event.lifecycle'
        )
      }).ok,
      true
    );
    const finalRecord = store.get(eventReferenceId);
    assert.equal(finalRecord?.eventStatus, 'Archived');
    assert.equal(finalRecord?.dispatchAttemptCount, 1);
    assert.equal(finalRecord?.consumerReferenceIds.length, 1);
    assert.equal(traces.visibleTo(['Internal']).length, 6);
    for (const trace of traces.visibleTo(['Internal'])) {
      assert.equal('payload' in (trace.event.payload ?? {}), false);
      assert.equal(
        JSON.stringify(trace.event.payload).includes('CustomerConfirmed'),
        false
      );
    }
  });

  it('returns governed payload and reference validation without cross-organization enumeration', () => {
    const { service } = harness();
    const missing = service.validateEventPayload({
      eventReferenceId,
      eventType: 'order-status-changed',
      payload: { orderReferenceId: 'order:ref:00014' },
      payloadContractReferenceId: 'payload-contract:ref:order-status-046',
      governance: governance(
        'event.validate_payload',
        'event:validate_payload',
        'event.validation'
      )
    });
    assert.equal(missing.ok, true);
    if (missing.ok) {
      assert.equal(missing.value.isValid, false);
      assert.deepEqual(missing.value.missingRequiredFields, ['nextStatus']);
    }
    const restricted = service.validateEventPayload({
      eventReferenceId,
      eventType: 'order-status-changed',
      payload: {
        orderReferenceId: 'order:ref:00014',
        nextStatus: 'Confirmed',
        secretToken: 'never-store'
      },
      payloadContractReferenceId: 'payload-contract:ref:order-status-046',
      governance: governance(
        'event.validate_payload',
        'event:validate_payload',
        'event.validation'
      )
    });
    assert.equal(restricted.ok, true);
    if (restricted.ok)
      assert.equal(restricted.value.reasonCode, 'RestrictedField');

    assert.equal(record(service).ok, true);
    const crossOrg = service.validateEventReference({
      eventReferenceId,
      requestingDomain: 'task',
      requestingService: 'task-service',
      governance: governance(
        'event.validate_reference',
        'event:validate_reference',
        'event.reference',
        eventReferenceId,
        'organization:ref:other'
      )
    });
    assert.equal(crossOrg.ok, true);
    if (crossOrg.ok) {
      assert.equal(crossOrg.value.isValid, false);
      assert.equal(crossOrg.value.reasonCode, 'NotFound');
      assert.equal(crossOrg.value.eventType, null);
    }
  });

  it('records dispatch failure and rolls back every mutation when trace handoff fails', () => {
    const normal = harness();
    assert.equal(record(normal.service).ok, true);
    assert.equal(
      status(normal.service, 'Validated', 'validated-fail-flow').ok,
      true
    );
    assert.equal(
      status(normal.service, 'ReadyForDispatch', 'ready-fail-flow').ok,
      true
    );
    const failed = normal.service.markEventDispatchFailed({
      eventReferenceId,
      reasonReferenceId: 'reason:ref:transport-failed',
      idempotencyKey: 'idem:event:dispatch-failed:046',
      governance: governance(
        'event.mark_dispatch_failed',
        'event:dispatch',
        'event.dispatch'
      )
    });
    assert.equal(failed.ok, true);
    if (failed.ok) {
      assert.equal(failed.value.eventStatus, 'DispatchFailed');
      assert.equal(failed.value.dispatchAttemptCount, 1);
    }
    assert.equal(
      status(normal.service, 'ReadyForDispatch', 'retry-ready').ok,
      true
    );

    const brokenCreate = harness(0);
    assert.equal(code(record(brokenCreate.service)), 'EventTraceFailed');
    assert.equal(brokenCreate.store.list().length, 0);

    const brokenMutation = harness(1);
    assert.equal(record(brokenMutation.service).ok, true);
    const before = brokenMutation.store.get(eventReferenceId);
    const mutation = status(
      brokenMutation.service,
      'Validated',
      'rollback-validation'
    );
    assert.equal(code(mutation), 'EventTraceFailed');
    assert.deepEqual(brokenMutation.store.get(eventReferenceId), before);
  });
});
