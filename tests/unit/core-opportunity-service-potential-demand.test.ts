import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryOpportunityServiceStore,
  CoreOpportunityService,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreBehaviorResult,
  type CoreEventId,
  type CoreMvpObjectBaseRecord,
  type CoreOpportunityGovernanceContext
} from '../../src/index.ts';

const opportunityReferenceId = 'opportunity:ref:045';
const aiOpportunityReferenceId = 'opportunity:ref:045-ai';
const organizationReferenceId = 'organization:ref:scope-0001';

const opportunityReference = {
  referenceId: opportunityReferenceId,
  objectType: 'opportunity-record',
  referenceDomain: 'opportunity',
  status: 'Active' as const
};
const aiOpportunityReference = {
  referenceId: aiOpportunityReferenceId,
  objectType: 'opportunity-record',
  referenceDomain: 'opportunity',
  status: 'Active' as const
};

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = opportunityReferenceId,
  reviewed = false,
  organization = organizationReferenceId
): CoreOpportunityGovernanceContext {
  return {
    correlationId: 'corr:core-task-045',
    auditContextReferenceId: 'audit:ctx:core-task-045',
    authorizedOrganizationReferenceId: organization,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-045',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-045'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-045',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-045'
    },
    review: {
      humanReviewRequired: reviewed,
      humanReviewReferenceId: reviewed ? 'review:ref:045' : null,
      reviewStatus: reviewed ? 'Completed' : null,
      reviewScope: reviewed ? 'opportunity-governance' : null,
      reviewDecision: reviewed ? 'Approved' : null,
      reviewerUserReferenceId: reviewed ? 'user:ref:actor-0001' : null,
      targetObjectType: 'opportunity-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'opportunity-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-045',
      policyDecisionReferenceId: 'policy:decision:allow-045',
      humanReviewReferenceId: reviewed ? 'review:ref:045' : null,
      correlationId: 'corr:core-task-045'
    }
  };
}

function objectRecord(
  referenceId = opportunityReferenceId,
  organization = organizationReferenceId
): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: referenceId,
    objectType: createCoreObjectType('opportunity-record'),
    domainId: 'opportunity',
    objectContractId: createCoreContractId(
      'core-object-opportunity-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-14T21:00:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-14T21:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-045'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organization
    }
  };
}

function harness(failingEvents = false) {
  const store = new CoreInMemoryOpportunityServiceStore();
  const traces = new CoreEventTraceRegistry();
  const converted: string[] = [];
  const rolledBack: string[] = [];
  const clocks = Array.from({ length: 60 }, (_, index) =>
    new Date(Date.UTC(2026, 6, 14, 21, index + 1)).toISOString()
  );
  let shouldFailEvents = failingEvents;
  const eventTracePort = {
    append: (record: Parameters<CoreEventTraceRegistry['append']>[0]) =>
      shouldFailEvents
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
        : traces.append(record)
  };
  const service = new CoreOpportunityService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort,
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
      opportunityReference,
      aiOpportunityReference
    ]),
    orderConversionPort: {
      convert: ({ opportunityReferenceId: referenceId }) => {
        const orderReferenceId = `order:ref:from-${referenceId.replaceAll(':', '-')}`;
        converted.push(orderReferenceId);
        return { ok: true as const, value: { orderReferenceId } };
      },
      rollback: ({ orderReferenceId }) => {
        rolledBack.push(orderReferenceId);
        return { ok: true as const, value: null };
      }
    },
    requestingServiceDirectory: [
      { domainId: 'opportunity', serviceType: 'opportunity-service' },
      { domainId: 'order', serviceType: 'order-service' }
    ],
    now: () => clocks.shift() ?? '2026-07-14T21:59:00.000Z',
    eventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `event-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId,
    cursorSecret: 'core-task-045-opportunity-cursor-secret'
  });
  return {
    service,
    store,
    traces,
    converted,
    rolledBack,
    setFailingEvents: (value: boolean) => {
      shouldFailEvents = value;
    }
  };
}

function create(
  service: CoreOpportunityService,
  referenceId = opportunityReferenceId
) {
  return service.createOpportunity({
    objectRecord: objectRecord(referenceId),
    publicReferenceRecord:
      referenceId === opportunityReferenceId
        ? opportunityReference
        : aiOpportunityReference,
    opportunityType: 'NewFilingOpportunity',
    titleReference: 'title:ref:opportunity-045',
    opportunityStatus: 'Draft',
    sourceType: 'Manual',
    sourceReference: 'source:ref:opportunity-045',
    serviceScopeReference: 'service-scope:ref:filing-045',
    idempotencyKey: `idem:create:${referenceId}`,
    governance: governance(
      'opportunity.create',
      'opportunity:create',
      'opportunity.write',
      referenceId
    )
  });
}

function code(result: CoreBehaviorResult<unknown>) {
  return result.ok ? null : result.error.code;
}

function change(
  service: CoreOpportunityService,
  nextStatus: string,
  key: string,
  reviewed = false
) {
  return service.changeOpportunityStatus({
    opportunityReferenceId,
    nextStatus,
    reasonReferenceId: `reason:ref:${key}`,
    idempotencyKey: `idem:status:${key}`,
    governance: governance(
      'opportunity.change_status',
      'opportunity:change_status',
      'opportunity.lifecycle',
      opportunityReferenceId,
      reviewed
    )
  });
}

describe('CORE-TASK-045 Opportunity Service potential-demand foundation', () => {
  it('creates, links, qualifies, delegates conversion and archives without becoming CRM', () => {
    const { service, traces, converted } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(create(service).ok, true);

    const conflict = service.createOpportunity({
      objectRecord: objectRecord(),
      publicReferenceRecord: opportunityReference,
      opportunityType: 'RenewalOpportunity',
      titleReference: 'title:ref:different',
      opportunityStatus: 'Draft',
      sourceType: 'Manual',
      sourceReference: 'source:ref:different',
      idempotencyKey: `idem:create:${opportunityReferenceId}`,
      governance: governance(
        'opportunity.create',
        'opportunity:create',
        'opportunity.write'
      )
    });
    assert.equal(code(conflict), 'IdempotencyConflict');

    assert.equal(change(service, 'Identified', 'identified').ok, true);
    assert.equal(
      service.linkOpportunityCustomer({
        opportunityReferenceId,
        customerReferenceId: 'customer:ref:00006',
        idempotencyKey: 'idem:link:customer-045',
        governance: governance(
          'opportunity.link_customer',
          'opportunity:link_customer',
          'opportunity.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkOpportunityBrand({
        opportunityReferenceId,
        brandReferenceId: 'brand:ref:00007',
        idempotencyKey: 'idem:link:brand-045',
        governance: governance(
          'opportunity.link_brand',
          'opportunity:link_brand',
          'opportunity.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkOpportunityTrademark({
        opportunityReferenceId,
        trademarkReferenceId: 'trademark:ref:00008',
        idempotencyKey: 'idem:link:trademark-045',
        governance: governance(
          'opportunity.link_trademark',
          'opportunity:link_trademark',
          'opportunity.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      service.linkOpportunityCommunication({
        opportunityReferenceId,
        communicationReferenceId: 'communication:ref:00018',
        idempotencyKey: 'idem:link:communication-045',
        governance: governance(
          'opportunity.link_communication',
          'opportunity:link_communication',
          'opportunity.relationship'
        )
      }).ok,
      true
    );

    const unqualified = service.validateOpportunityReference({
      opportunityReferenceId,
      requestingDomain: 'order',
      requestingService: 'order-service',
      governance: governance(
        'opportunity.validate_reference',
        'opportunity:validate_reference',
        'opportunity.reference'
      )
    });
    assert.equal(unqualified.ok, true);
    if (unqualified.ok) assert.equal(unqualified.value.isValid, false);

    const qualified = service.qualifyOpportunity({
      opportunityReferenceId,
      qualificationReasonReferenceId: 'qualification:reason:045',
      idempotencyKey: 'idem:qualify:045',
      governance: governance(
        'opportunity.qualify',
        'opportunity:qualify',
        'opportunity.qualification',
        opportunityReferenceId,
        true
      )
    });
    assert.equal(qualified.ok, true);

    const convertedResult = service.convertOpportunityToOrder({
      opportunityReferenceId,
      conversionContextReferenceId: 'conversion:ctx:045',
      idempotencyKey: 'idem:convert:045',
      governance: governance(
        'opportunity.convert_to_order',
        'opportunity:convert_to_order',
        'opportunity.conversion',
        opportunityReferenceId,
        true
      )
    });
    assert.equal(convertedResult.ok, true);
    if (convertedResult.ok) {
      assert.equal(convertedResult.value.converted, true);
      assert.equal(convertedResult.value.reviewRequired, false);
    }
    assert.equal(converted.length, 1);

    const archived = service.archiveOpportunity({
      opportunityReferenceId,
      reasonReferenceId: 'reason:ref:archive-045',
      idempotencyKey: 'idem:archive:045',
      governance: governance(
        'opportunity.archive',
        'opportunity:archive',
        'opportunity.lifecycle',
        opportunityReferenceId,
        true
      )
    });
    assert.equal(archived.ok, true);

    const listed = service.listOpportunities({
      governance: governance(
        'opportunity.list',
        'opportunity:list',
        'opportunity.list',
        'opportunity:collection'
      )
    });
    assert.equal(listed.ok, true);
    if (listed.ok) {
      assert.equal(listed.value.items.length, 1);
      assert.equal('customerReferenceIds' in listed.value.items[0]!, false);
      assert.equal(listed.value.items[0]!.converted, true);
    }
    assert.ok(traces.visibleTo(['Internal']).length >= 8);
  });

  it('requires explicit approved review for AI-origin creation and qualification', () => {
    const { service } = harness();
    const withoutReview = service.createOpportunity({
      objectRecord: objectRecord(aiOpportunityReferenceId),
      publicReferenceRecord: aiOpportunityReference,
      opportunityType: 'ExpansionOpportunity',
      titleReference: 'title:ref:ai-opportunity-045',
      opportunityStatus: 'Draft',
      sourceType: 'AIRecommendation',
      sourceReference: 'ai:recommendation:045',
      aiRecommendationReferenceId: 'ai:output:045',
      idempotencyKey: 'idem:create:ai-045',
      governance: governance(
        'opportunity.create',
        'opportunity:create',
        'opportunity.write',
        aiOpportunityReferenceId
      )
    });
    assert.equal(code(withoutReview), 'HumanReviewRequired');

    const withReview = service.createOpportunity({
      objectRecord: objectRecord(aiOpportunityReferenceId),
      publicReferenceRecord: aiOpportunityReference,
      opportunityType: 'ExpansionOpportunity',
      titleReference: 'title:ref:ai-opportunity-045',
      opportunityStatus: 'Draft',
      sourceType: 'AIRecommendation',
      sourceReference: 'ai:recommendation:045',
      aiRecommendationReferenceId: 'ai:output:045',
      idempotencyKey: 'idem:create:ai-045-reviewed',
      governance: governance(
        'opportunity.create',
        'opportunity:create',
        'opportunity.write',
        aiOpportunityReferenceId,
        true
      )
    });
    assert.equal(withReview.ok, true);
    if (withReview.ok)
      assert.equal(withReview.value.qualificationStatus, 'ReviewRequired');
  });

  it('rolls back create and conversion state when Event trace append fails', () => {
    const createFailure = harness(true);
    const failedCreate = create(createFailure.service);
    assert.equal(code(failedCreate), 'EventTraceFailed');
    assert.equal(createFailure.store.get(opportunityReferenceId), undefined);

    const normal = harness();
    assert.equal(create(normal.service).ok, true);
    assert.equal(change(normal.service, 'Identified', 'identified').ok, true);
    assert.equal(
      normal.service.linkOpportunityCustomer({
        opportunityReferenceId,
        customerReferenceId: 'customer:ref:00006',
        idempotencyKey: 'idem:link:customer-rollback',
        governance: governance(
          'opportunity.link_customer',
          'opportunity:link_customer',
          'opportunity.relationship'
        )
      }).ok,
      true
    );
    assert.equal(
      normal.service.qualifyOpportunity({
        opportunityReferenceId,
        qualificationReasonReferenceId: 'qualification:reason:rollback',
        idempotencyKey: 'idem:qualify:rollback',
        governance: governance(
          'opportunity.qualify',
          'opportunity:qualify',
          'opportunity.qualification',
          opportunityReferenceId,
          true
        )
      }).ok,
      true
    );

    normal.setFailingEvents(true);
    const failedConversion = normal.service.convertOpportunityToOrder({
      opportunityReferenceId,
      conversionContextReferenceId: 'conversion:ctx:rollback',
      idempotencyKey: 'idem:convert:rollback',
      governance: governance(
        'opportunity.convert_to_order',
        'opportunity:convert_to_order',
        'opportunity.conversion',
        opportunityReferenceId,
        true
      )
    });
    assert.equal(code(failedConversion), 'EventTraceFailed');
    assert.equal(normal.rolledBack.length, 1);
    assert.equal(
      normal.store.get(opportunityReferenceId)?.opportunityStatus,
      'Qualified'
    );
  });

  it('does not enumerate records across organization boundaries', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const hidden = service.getOpportunity({
      opportunityReferenceId,
      governance: governance(
        'opportunity.read',
        'opportunity:read',
        'opportunity.read',
        opportunityReferenceId,
        false,
        'organization:ref:other'
      )
    });
    assert.equal(code(hidden), 'OpportunityNotFound');
  });
});
