import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryOrderServiceStore,
  CoreOrderService,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CoreOrderGovernanceContext
} from '../../src/index.ts';

const orderReferenceId = 'order:ref:00014';
const organizationReferenceId = 'organization:ref:scope-0001';
const orderReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (reference) => reference.referenceId === orderReferenceId
);
if (!orderReference) throw new Error('Order fixture reference is missing.');
const governedOrderReference = orderReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = orderReferenceId,
  organization = organizationReferenceId
): CoreOrderGovernanceContext {
  return {
    correlationId: 'corr:core-task-044',
    auditContextReferenceId: 'audit:ctx:core-task-044',
    authorizedOrganizationReferenceId: organization,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-044',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-044'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-044',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-044'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'order-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'order-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-044',
      policyDecisionReferenceId: 'policy:decision:allow-044',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-044'
    }
  };
}

function objectRecord(): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: orderReferenceId,
    objectType: createCoreObjectType('order-record'),
    domainId: 'order',
    objectContractId: createCoreContractId('core-object-order-record-contract'),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-14T19:00:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-14T19:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-044'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organizationReferenceId
    }
  };
}

function harness(failingEvents = false) {
  const store = new CoreInMemoryOrderServiceStore();
  const traces = new CoreEventTraceRegistry();
  const clocks = Array.from({ length: 50 }, (_, index) =>
    new Date(Date.UTC(2026, 6, 14, 19, index + 1)).toISOString()
  );
  const eventTracePort = failingEvents
    ? {
        append: () => ({
          ok: false as const,
          error: {
            code: 'EventTraceFailed' as const,
            category: 'Event' as const,
            message: 'failed',
            safeDetail: null,
            retryable: false,
            correlationId: null
          }
        })
      }
    : traces;
  const service = new CoreOrderService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort,
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      {
        referenceId: 'opportunity:ref:044',
        objectType: 'opportunity-record',
        referenceDomain: 'opportunity',
        status: 'Active'
      }
    ]),
    requestingServiceDirectory: [
      { domainId: 'order', serviceType: 'order-service' },
      { domainId: 'matter', serviceType: 'matter-service' }
    ],
    now: () => clocks.shift() ?? '2026-07-14T19:59:00.000Z',
    eventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `event-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId,
    cursorSecret: 'core-task-044-order-cursor-secret'
  });
  return { service, store, traces };
}

function create(service: CoreOrderService) {
  return service.createOrder({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedOrderReference,
    orderType: 'TrademarkFiling',
    titleReference: 'title:ref:order-044',
    orderStatus: 'Draft',
    serviceScopeReference: 'service-scope:ref:filing-044',
    sourceReference: 'source:ref:order-044',
    customerReferenceId: 'customer:ref:00006',
    customerLinkType: 'Requester',
    idempotencyKey: 'idem:create:order-044',
    governance: governance('order.create', 'order:create', 'order.write')
  });
}

function code(result: {
  readonly ok: boolean;
  readonly error?: { readonly code: string };
}) {
  return result.ok ? null : (result.error?.code ?? null);
}

function change(service: CoreOrderService, nextStatus: string, key: string) {
  return service.changeOrderStatus({
    orderReferenceId,
    nextStatus,
    reasonReferenceId: `reason:ref:${key}`,
    idempotencyKey: `idem:status:${key}`,
    governance: governance(
      'order.change_status',
      'order:change_status',
      'order.lifecycle'
    )
  });
}

describe('CORE-TASK-044 Order Service commercial-request foundation', () => {
  it('creates, updates, validates readiness, links relationships and completes lifecycle', () => {
    const { service, traces } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(create(service).ok, true);

    const conflict = service.createOrder({
      objectRecord: objectRecord(),
      publicReferenceRecord: governedOrderReference,
      orderType: 'Renewal',
      titleReference: 'title:ref:other',
      orderStatus: 'Draft',
      serviceScopeReference: 'service-scope:ref:renewal',
      sourceReference: 'source:ref:order-044',
      customerReferenceId: 'customer:ref:00006',
      customerLinkType: 'Requester',
      idempotencyKey: 'idem:create:order-044',
      governance: governance('order.create', 'order:create', 'order.write')
    });
    assert.equal(code(conflict), 'IdempotencyConflict');

    const updated = service.updateOrder({
      orderReferenceId,
      patch: {
        titleReference: 'title:ref:order-updated',
        metadata: { intakeChannel: 'partner' }
      },
      idempotencyKey: 'idem:update:order-044',
      governance: governance('order.update', 'order:update', 'order.write')
    });
    assert.equal(updated.ok, true);
    if (updated.ok) {
      assert.equal(
        updated.value.objectRecord.publicReferenceId,
        orderReferenceId
      );
      assert.equal(updated.value.objectRecord.version?.version, 1);
    }

    const draftReadiness = service.validateOrderReadiness({
      orderReferenceId,
      governance: governance(
        'order.validate_readiness',
        'order:validate_readiness',
        'order.readiness'
      )
    });
    assert.equal(draftReadiness.ok, true);
    if (draftReadiness.ok) {
      assert.equal(draftReadiness.value.isReady, false);
      assert.equal(draftReadiness.value.recommendedNextAction, 'ConfirmOrder');
    }

    assert.equal(
      service.linkOrderOpportunity({
        orderReferenceId,
        opportunityReferenceId: 'opportunity:ref:044',
        idempotencyKey: 'idem:link:opportunity-044',
        governance: governance(
          'order.link_opportunity',
          'order:link_opportunity',
          'order.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkOrderBrand({
        orderReferenceId,
        brandReferenceId: 'brand:ref:00007',
        idempotencyKey: 'idem:link:brand-044',
        governance: governance(
          'order.link_brand',
          'order:link_brand',
          'order.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkOrderTrademark({
        orderReferenceId,
        trademarkReferenceId: 'trademark:ref:00008',
        idempotencyKey: 'idem:link:trademark-044',
        governance: governance(
          'order.link_trademark',
          'order:link_trademark',
          'order.relationship'
        )
      }).ok,
      true
    );

    const duplicateCustomer = service.linkOrderCustomer({
      orderReferenceId,
      customerReferenceId: 'customer:ref:00006',
      linkType: 'Requester',
      idempotencyKey: 'idem:link:customer-duplicate',
      governance: governance(
        'order.link_customer',
        'order:link_customer',
        'order.relationship'
      )
    });
    assert.equal(code(duplicateCustomer), 'OrderRelationshipAlreadyLinked');

    const accepted = service.acceptOrder({
      orderReferenceId,
      reasonReferenceId: 'reason:ref:accept',
      idempotencyKey: 'idem:accept:order-044',
      governance: governance('order.accept', 'order:accept', 'order.lifecycle')
    });
    assert.equal(accepted.ok, true);

    const ready = service.validateOrderReadiness({
      orderReferenceId,
      governance: governance(
        'order.validate_readiness',
        'order:validate_readiness',
        'order.readiness'
      )
    });
    assert.equal(ready.ok, true);
    if (ready.ok) {
      assert.equal(ready.value.isReady, true);
      assert.equal(ready.value.recommendedNextAction, 'MarkReadyForMatter');
    }

    assert.equal(change(service, 'ReadyForMatter', 'ready').ok, true);
    assert.equal(
      service.linkOrderMatter({
        orderReferenceId,
        matterReferenceId: 'matter:ref:00013',
        linkType: 'PrimaryMatter',
        idempotencyKey: 'idem:link:matter-044',
        governance: governance(
          'order.link_matter',
          'order:link_matter',
          'order.relationship'
        )
      }).ok,
      true
    );
    assert.equal(change(service, 'MatterCreated', 'matter-created').ok, true);
    assert.equal(change(service, 'InProgress', 'progress').ok, true);
    assert.equal(change(service, 'WaitingForCustomer', 'waiting').ok, true);
    assert.equal(change(service, 'InProgress', 'resume').ok, true);
    assert.equal(change(service, 'Completed', 'complete').ok, true);
    assert.equal(change(service, 'Archived', 'archive').ok, true);
    assert.equal(change(service, 'DeletedReferenceOnly', 'delete').ok, true);

    const validation = service.validateOrderReference({
      orderReferenceId,
      requestingDomain: 'matter',
      requestingService: 'matter-service',
      governance: governance(
        'order.validate_reference',
        'order:validate_reference',
        'order.reference'
      )
    });
    assert.equal(validation.ok, true);
    if (validation.ok) assert.equal(validation.value.isValid, false);

    assert.equal(traces.visibleTo(['Internal']).length, 15);
  });

  it('enforces cancellation, organization isolation and Event rollback', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);

    const crossOrg = service.getOrder({
      orderReferenceId,
      governance: governance(
        'order.read',
        'order:read',
        'order.read',
        orderReferenceId,
        'organization:ref:other'
      )
    });
    assert.equal(code(crossOrg), 'OrderNotFound');

    const cancelled = service.cancelOrder({
      orderReferenceId,
      reasonReferenceId: 'reason:ref:cancel',
      idempotencyKey: 'idem:cancel:order-044',
      governance: governance('order.cancel', 'order:cancel', 'order.lifecycle')
    });
    assert.equal(cancelled.ok, true);
    assert.equal(
      code(change(service, 'InProgress', 'illegal')),
      'InvalidOrderTransition'
    );

    const failed = harness(true);
    assert.equal(code(create(failed.service)), 'EventTraceFailed');
    assert.equal(failed.store.list().length, 0);
  });
});
