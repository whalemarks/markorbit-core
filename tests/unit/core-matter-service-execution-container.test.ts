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

const matterId = 'matter:ref:00013';
const orgId = 'organization:ref:scope-0001';
const matterRef = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
  (r) => r.referenceId === matterId
)!;

function governance(
  operation: string,
  permission: string,
  scope: string,
  target = matterId
): CoreMatterGovernanceContext {
  return {
    correlationId: 'corr:core-task-043b',
    auditContextReferenceId: 'audit:ctx:core-task-043b',
    authorizedOrganizationReferenceId: orgId,
    permission: {
      actorReferenceId: 'user:ref:actor-0001',
      intendedOperation: operation,
      requiredPermissionKeys: [permission],
      permissionDecisionReferenceId: 'permission:decision:043b',
      permissionDecision: 'Allowed',
      correlationId: 'corr:core-task-043b'
    },
    policy: {
      intendedOperation: operation,
      requiredPolicyScopes: [scope],
      policyDecisionReferenceId: 'policy:decision:043b',
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
      permissionDecisionReferenceId: 'permission:decision:043b',
      policyDecisionReferenceId: 'policy:decision:043b',
      humanReviewReferenceId: null,
      correlationId: 'corr:core-task-043b'
    }
  };
}
function objectRecord(): CoreMvpObjectBaseRecord {
  return {
    publicReferenceId: matterId,
    objectType: createCoreObjectType('matter-record'),
    domainId: 'matter',
    objectContractId: createCoreContractId(
      'core-object-matter-record-contract'
    ),
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-15T00:00:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-15T00:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-043b'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: orgId
    }
  };
}
function harness() {
  const store = new CoreInMemoryMatterServiceStore();
  const traces = new CoreEventTraceRegistry();
  let n = 0;
  const service = new CoreMatterService({
    store,
    idempotencyRegistry: new CoreIdempotencyRegistry(() => 1),
    eventTracePort: traces,
    relatedReferenceRegistry: new CoreReferenceRegistry([
      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
      ...CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS
    ]),
    now: () => `2026-07-15T00:${String(++n).padStart(2, '0')}:00.000Z`,
    eventIdFactory: (op, id, key) =>
      createCoreEventId(
        `event-${op}-${id.replaceAll(':', '-')}-${key}`
      ) as CoreEventId
  });
  return { service, store, traces };
}
function create(service: CoreMatterService) {
  return service.createMatter({
    objectRecord: objectRecord(),
    publicReferenceRecord: matterRef,
    matterType: 'TrademarkFiling',
    titleReference: 'US trademark filing',
    matterStatus: 'Draft',
    sourceReference: 'source:intake:043b',
    idempotencyKey: 'idem:create:matter-043b',
    governance: governance('matter.create', 'matter:create', 'matter.write')
  });
}

describe('CORE-TASK-043B Matter Service', () => {
  it('creates, updates, links governed execution context and validates the reference', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const update = service.updateMatter({
      matterReferenceId: matterId,
      patch: {
        titleReference: 'US trademark filing — reviewed',
        metadata: { priority: 'normal' }
      },
      idempotencyKey: 'idem:update:matter-043b',
      governance: governance('matter.update', 'matter:update', 'matter.write')
    });
    assert.equal(update.ok, true);
    const links = [
      service.linkMatterOrder({
        matterReferenceId: matterId,
        orderReferenceId: 'order:ref:00014',
        idempotencyKey: 'idem:order:matter-043b',
        governance: governance(
          'matter.link_order',
          'matter:link_order',
          'matter.relationship'
        )
      }),
      service.linkMatterCustomer({
        matterReferenceId: matterId,
        customerReferenceId: 'customer:ref:00006',
        idempotencyKey: 'idem:customer:matter-043b',
        governance: governance(
          'matter.link_customer',
          'matter:link_customer',
          'matter.relationship'
        )
      }),
      service.linkMatterTrademark({
        matterReferenceId: matterId,
        trademarkReferenceId: 'trademark:ref:00008',
        idempotencyKey: 'idem:tm:matter-043b',
        governance: governance(
          'matter.link_trademark',
          'matter:link_trademark',
          'matter.relationship'
        )
      }),
      service.linkMatterWorkflowContract({
        matterReferenceId: matterId,
        workflowContractReferenceId: 'workflow-contract:ref:00015',
        idempotencyKey: 'idem:wf:matter-043b',
        governance: governance(
          'matter.link_workflow_contract',
          'matter:link_workflow_contract',
          'matter.relationship'
        )
      }),
      service.linkMatterTask({
        matterReferenceId: matterId,
        taskReferenceId: 'task:ref:00016',
        idempotencyKey: 'idem:task:matter-043b',
        governance: governance(
          'matter.link_task',
          'matter:link_task',
          'matter.relationship'
        )
      }),
      service.linkMatterDocument({
        matterReferenceId: matterId,
        documentReferenceId: 'document:ref:00011',
        idempotencyKey: 'idem:doc:matter-043b',
        governance: governance(
          'matter.link_document',
          'matter:link_document',
          'matter.relationship'
        )
      }),
      service.linkMatterEvidence({
        matterReferenceId: matterId,
        evidenceReferenceId: 'evidence:ref:00012',
        idempotencyKey: 'idem:evidence:matter-043b',
        governance: governance(
          'matter.link_evidence',
          'matter:link_evidence',
          'matter.relationship'
        )
      })
    ];
    assert.equal(
      links.every((r) => r.ok),
      true
    );
    assert.equal(
      service.changeMatterStatus({
        matterReferenceId: matterId,
        nextStatus: 'Open',
        idempotencyKey: 'idem:open:matter-043b',
        governance: governance(
          'matter.change_status',
          'matter:change_status',
          'matter.lifecycle'
        )
      }).ok,
      true
    );
    const validated = service.validateMatterReference({
      matterReferenceId: matterId,
      governance: governance(
        'matter.validate_reference',
        'matter:validate_reference',
        'matter.read'
      )
    });
    assert.equal(validated.ok, true);
    if (validated.ok) {
      assert.equal(validated.value.isValid, true);
      assert.equal(validated.value.orderLinked, true);
      assert.equal(validated.value.workflowContractLinked, true);
    }
  });
  it('enforces lifecycle, idempotency conflict and organization non-enumeration', () => {
    const { service } = harness();
    assert.equal(create(service).ok, true);
    const conflict = service.createMatter({
      objectRecord: objectRecord(),
      publicReferenceRecord: matterRef,
      matterType: 'Renewal',
      titleReference: 'changed',
      matterStatus: 'Draft',
      sourceReference: 'source:intake:043b',
      idempotencyKey: 'idem:create:matter-043b',
      governance: governance('matter.create', 'matter:create', 'matter.write')
    });
    assert.equal(conflict.ok, false);
    if (!conflict.ok) assert.equal(conflict.error.code, 'IdempotencyConflict');
    const invalid = service.changeMatterStatus({
      matterReferenceId: matterId,
      nextStatus: 'Completed',
      idempotencyKey: 'idem:skip:matter-043b',
      governance: governance(
        'matter.change_status',
        'matter:change_status',
        'matter.lifecycle'
      )
    });
    assert.equal(invalid.ok, false);
    const cross = service.getMatter({
      matterReferenceId: matterId,
      governance: {
        ...governance('matter.read', 'matter:read', 'matter.read'),
        authorizedOrganizationReferenceId: 'organization:ref:other'
      }
    });
    assert.equal(cross.ok, false);
    if (!cross.ok) assert.equal(cross.error.code, 'ReferenceNotFound');
  });
});
