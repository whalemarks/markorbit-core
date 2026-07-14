import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CoreEventTraceRegistry,
  CoreIdempotencyRegistry,
  CoreInMemoryMatterServiceStore,
  CoreMatterService,
  CoreReferenceRegistry,
  createCoreContractId,
  createCoreEventId,
  createCoreObjectType,
  type CoreEventId,
  type CoreMatterGovernanceContext,
  type CoreMvpObjectBaseRecord
} from '../../src/index.ts';

const matterReferenceId = 'matter:ref:00013';
const organizationReferenceId = 'organization:ref:scope-0001';
const matterReference = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (reference) => reference.referenceId === matterReferenceId
);
if (!matterReference) throw new Error('Matter fixture reference is missing.');
const governedMatterReference = matterReference;

function governance(
  operation: string,
  permission: string,
  policyScope: string,
  target = matterReferenceId,
  organization = organizationReferenceId
): CoreMatterGovernanceContext {
  return {
    correlationId: 'corr:core-task-043b',
    auditContextReferenceId: 'audit:ctx:core-task-043b',
    authorizedOrganizationReferenceId: organization,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:allow-043b',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-043b'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [policyScope],
      policyDecisionReferenceId: 'policy:decision:allow-043b',
      policyDecision: 'Allowed',
      restrictedFieldsOmitted: true,
      correlationId: 'corr:core-task-043b'
    },
    review: {
      humanReviewRequired: false,
      humanReviewReferenceId: null,
      reviewStatus: null,
      reviewScope: null,
      reviewDecision: null,
      reviewerUserReferenceId: null,
      targetObjectType: 'matter-record',
      targetObjectReferenceId: target
    },
    audit: {
      operationName: operation,
      operationCategory: 'Service',
      actorReferenceId: 'user:ref:actor-0001',
      targetObjectType: 'matter-record',
      targetObjectReferenceId: target,
      permissionDecisionReferenceId: 'permission:decision:allow-043b',
      policyDecisionReferenceId: 'policy:decision:allow-043b',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-043b'
    }
  };
}

function objectRecord(): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: matterReferenceId,
    objectType: createCoreObjectType('matter-record'),
    domainId: 'matter',
    objectContractId: createCoreContractId(
      'core-object-matter-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-14T13:00:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-14T13:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-043b'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: organizationReferenceId
    }
  };
}

function harness(failingEvents = false) {
  const store = new CoreInMemoryMatterServiceStore();
  const traces = new CoreEventTraceRegistry();
  const clocks = Array.from({ length: 40 }, (_, index) =>
    new Date(Date.UTC(2026, 6, 14, 13, index + 1)).toISOString()
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
  const service = new CoreMatterService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort,
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS
    ]),
    requestingServiceDirectory: [
      { domainId: 'matter', serviceType: 'matter-service' }
    ],
    now: () => clocks.shift() ?? '2026-07-14T13:59:00.000Z',
    eventIdFactory: (operation, referenceId, key) =>
      createCoreEventId(
        `event-${operation}-${referenceId.replaceAll(':', '-')}-${key}`
      ) as CoreEventId,
    cursorSecret: 'core-task-043b-matter-cursor-secret'
  });
  return { service, store, traces };
}

function create(service: CoreMatterService) {
  return service.createMatter({
    objectRecord: objectRecord(),
    publicReferenceRecord: governedMatterReference,
    matterType: 'TrademarkFiling',
    titleReference: 'title:ref:matter-043b',
    matterStatus: 'Draft',
    sourceReference: 'source:ref:matter-043b',
    idempotencyKey: 'idem:create:matter-043b',
    governance: governance('matter.create', 'matter:create', 'matter.write')
  });
}

function code(result: {
  readonly ok: boolean;
  readonly error?: { readonly code: string };
}) {
  return result.ok ? null : (result.error?.code ?? null);
}

describe('CORE-TASK-043B Matter Service execution-container foundation', () => {
  it('creates, updates, links relationships and enforces lifecycle', () => {
    const { service, traces } = harness();
    assert.equal(create(service).ok, true);
    assert.equal(create(service).ok, true);

    const conflict = service.createMatter({
      objectRecord: objectRecord(),
      publicReferenceRecord: governedMatterReference,
      matterType: 'Renewal',
      titleReference: 'title:ref:other',
      matterStatus: 'Draft',
      sourceReference: 'source:ref:matter-043b',
      idempotencyKey: 'idem:create:matter-043b',
      governance: governance('matter.create', 'matter:create', 'matter.write')
    });
    assert.equal(code(conflict), 'IdempotencyConflict');

    const updated = service.updateMatter({
      matterReferenceId,
      patch: {
        titleReference: 'title:ref:matter-updated',
        metadata: { channel: 'partner' }
      },
      idempotencyKey: 'idem:update:matter-043b',
      governance: governance('matter.update', 'matter:update', 'matter.write')
    });
    assert.equal(updated.ok, true);

    const relationshipCases = [
      [
        'linkMatterOrder',
        'orderReferenceId',
        'order:ref:00014',
        { linkType: 'CreatedFromOrder' },
        'matter.link_order',
        'matter:link_order'
      ],
      [
        'linkMatterCustomer',
        'customerReferenceId',
        'customer:ref:00006',
        {},
        'matter.link_customer',
        'matter:link_customer'
      ],
      [
        'linkMatterBrand',
        'brandReferenceId',
        'brand:ref:00007',
        {},
        'matter.link_brand',
        'matter:link_brand'
      ],
      [
        'linkMatterTrademark',
        'trademarkReferenceId',
        'trademark:ref:00008',
        {},
        'matter.link_trademark',
        'matter:link_trademark'
      ],
      [
        'linkMatterWorkflowContract',
        'workflowContractReferenceId',
        'workflow-contract:ref:00015',
        {},
        'matter.link_workflow_contract',
        'matter:link_workflow_contract'
      ],
      [
        'linkMatterTask',
        'taskReferenceId',
        'task:ref:00016',
        {},
        'matter.link_task',
        'matter:link_task'
      ],
      [
        'linkMatterDocument',
        'documentReferenceId',
        'document:ref:00011',
        {},
        'matter.link_document',
        'matter:link_document'
      ],
      [
        'linkMatterEvidence',
        'evidenceReferenceId',
        'evidence:ref:00012',
        {},
        'matter.link_evidence',
        'matter:link_evidence'
      ]
    ] as const;
    for (const [
      method,
      field,
      value,
      extra,
      operation,
      permission
    ] of relationshipCases) {
      const result = (
        service[method] as unknown as (input: Record<string, unknown>) => {
          ok: boolean;
        }
      )({
        matterReferenceId,
        [field]: value,
        ...extra,
        idempotencyKey: `idem:${method}:043b`,
        governance: governance(operation, permission, 'matter.relationship')
      });
      assert.equal(result.ok, true, method);
    }

    const open = service.changeMatterStatus({
      matterReferenceId,
      nextStatus: 'Open',
      reasonReferenceId: 'reason:ref:open',
      idempotencyKey: 'idem:status:open',
      governance: governance(
        'matter.change_status',
        'matter:change_status',
        'matter.lifecycle'
      )
    });
    assert.equal(open.ok, true);
    const progress = service.changeMatterStatus({
      matterReferenceId,
      nextStatus: 'InProgress',
      reasonReferenceId: 'reason:ref:progress',
      idempotencyKey: 'idem:status:progress',
      governance: governance(
        'matter.change_status',
        'matter:change_status',
        'matter.lifecycle'
      )
    });
    assert.equal(progress.ok, true);
    const complete = service.changeMatterStatus({
      matterReferenceId,
      nextStatus: 'Completed',
      reasonReferenceId: 'reason:ref:complete',
      idempotencyKey: 'idem:status:complete',
      governance: governance(
        'matter.change_status',
        'matter:change_status',
        'matter.lifecycle'
      )
    });
    assert.equal(complete.ok, true);
    const archive = service.changeMatterStatus({
      matterReferenceId,
      nextStatus: 'Archived',
      reasonReferenceId: 'reason:ref:archive',
      idempotencyKey: 'idem:status:archive',
      governance: governance(
        'matter.change_status',
        'matter:change_status',
        'matter.lifecycle'
      )
    });
    assert.equal(archive.ok, true);
    const deleted = service.changeMatterStatus({
      matterReferenceId,
      nextStatus: 'DeletedReferenceOnly',
      reasonReferenceId: 'reason:ref:delete',
      idempotencyKey: 'idem:status:delete',
      governance: governance(
        'matter.change_status',
        'matter:change_status',
        'matter.lifecycle'
      )
    });
    assert.equal(deleted.ok, true);
    assert.equal(traces.visibleTo(['Internal']).length, 15);
  });

  it('returns safe validation and rolls back failed event append', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const valid = service.validateMatterReference({
      matterReferenceId,
      requestingDomain: 'matter',
      requestingService: 'matter-service',
      governance: governance(
        'matter.validate_reference',
        'matter:validate_reference',
        'matter.reference'
      )
    });
    assert.equal(valid.ok, true);
    if (valid.ok) assert.equal(valid.value.reasonCode, 'NotOpen');

    const crossOrg = service.getMatter({
      matterReferenceId,
      governance: governance(
        'matter.read',
        'matter:read',
        'matter.read',
        matterReferenceId,
        'organization:ref:other'
      )
    });
    assert.equal(code(crossOrg), 'MatterNotFound');

    const failed = harness(true);
    assert.equal(code(create(failed.service)), 'EventTraceFailed');
    assert.equal(failed.store.list().length, 0);
  });
});
