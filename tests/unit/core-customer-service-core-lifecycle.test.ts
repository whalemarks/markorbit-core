import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CoreEventTraceRegistry, CoreIdempotencyRegistry, CoreReferenceRegistry, CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS, CoreCustomerService, CoreInMemoryCustomerServiceStore, CORE_CUSTOMER_STATUS_TO_OBJECT_STATUS, type CoreCustomerGovernanceContext, type CoreMvpObjectBaseRecord, type CoreReferenceRecord, type CoreEventId, createCoreEventId, createCoreObjectType, createCoreContractId } from '../../src/index.ts';

const now = '2026-07-13T00:00:00.000Z';
const customerReference: CoreReferenceRecord = { referenceId: 'customer:ref:core-task-036', objectType: createCoreObjectType('customer-record'), referenceDomain: 'customer', status: 'Active' };
const references = new CoreReferenceRegistry([...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS, customerReference]);
const objectRecord: CoreMvpObjectBaseRecord = Object.freeze({
  publicReferenceId: customerReference.referenceId,
  objectType: createCoreObjectType('customer-record'),
  domainId: 'customer',
  objectContractId: createCoreContractId('core-object-customer-record-contract'),
  status: 'active',
  version: { version: 1, createdAt: now },
  metadata: {},
  auditMetadata: { createdAt: now, createdByReferenceId: 'user:ref:actor-0001', correlationId: 'corr:core-task-036' },
  visibility: { permissionScopeReferenceId: 'permission:ref:scope-0001', policyScopeReferenceId: 'policy:ref:scope-0001', organizationScopeReferenceId: 'organization:ref:scope-0001' }
});
function gov(operation: string, permission: string, scope: string, target = customerReference.referenceId): CoreCustomerGovernanceContext { return { correlationId: 'corr:core-task-036', auditContextReferenceId: 'audit:ctx:core-task-036', permission: { actorReferenceId: 'user:ref:actor-0001', intendedOperation: operation, requiredPermissionKeys: [permission], permissionDecisionReferenceId: 'permission:decision:allow-0001', permissionDecision: 'Allowed', correlationId: 'corr:core-task-036' }, policy: { intendedOperation: operation, requiredPolicyScopes: [scope], policyDecisionReferenceId: 'policy:decision:allow-0001', policyDecision: 'Allowed', restrictedFieldsOmitted: true, correlationId: 'corr:core-task-036' }, review: { humanReviewRequired: false, humanReviewReferenceId: null, reviewStatus: null, reviewScope: null, reviewDecision: null, reviewerUserReferenceId: null, targetObjectType: 'customer-record', targetObjectReferenceId: target }, audit: { operationName: operation, operationCategory: 'Service', actorReferenceId: 'user:ref:actor-0001', targetObjectType: 'customer-record', targetObjectReferenceId: target, permissionDecisionReferenceId: 'permission:decision:allow-0001', policyDecisionReferenceId: 'policy:decision:allow-0001', humanReviewReferenceId: null, correlationId: 'corr:core-task-036' }, authorizedOrganizationReferenceId: 'organization:ref:scope-0001' }; }
function service() { const traces = new CoreEventTraceRegistry(); const svc = new CoreCustomerService({ store: new CoreInMemoryCustomerServiceStore(), idempotencyRegistry: new CoreIdempotencyRegistry(() => 1), eventTracePort: traces, relatedReferenceRegistry: references, now: () => now, cursorSecret: 'customer-service-secret', eventIdFactory: (op, id, key) => createCoreEventId(`event-${op}-${id.replaceAll(':','-')}-${key}`) as CoreEventId }); return { svc, traces }; }
function create(svc: CoreCustomerService, key = 'idem:create:core-task-036') { return svc.createCustomer({ objectRecord, publicReferenceRecord: customerReference, customerType: 'Company', customerStatus: 'Active', nameReference: 'name:synthetic:customer-036', sourceReference: 'source:synthetic:customer-036', idempotencyKey: key, governance: gov('customer.create','customer:create','customer.write') }); }

describe('Customer Service core lifecycle boundary', () => {
  it('creates, replays, reads, lists, validates and changes status with safe event trace handoff', () => {
    const { svc, traces } = service();
    const created = create(svc);
    assert.equal(created.ok, true);
    assert.equal(traces.visibleTo(['Internal']).length, 1);
    const replay = create(svc);
    assert.equal(replay.ok, true);
    assert.equal(traces.visibleTo(['Internal']).length, 1);
    const get = svc.getCustomer({ customerReferenceId: customerReference.referenceId, governance: gov('customer.read','customer:read','customer.read') });
    assert.equal(get.ok, true);
    const list = svc.listCustomers({ filters: { customerType: 'Company' }, pagination: { limit: 10, sortField: 'publicReferenceId' }, governance: gov('customer.list','customer:list','customer.list','customer:collection') });
    assert.equal(list.ok, true);
    assert.deepEqual(Object.keys(list.value.items[0]).sort(), ['createdAt','customerStatus','customerType','genericObjectStatus','publicReferenceId','updatedAt'].sort());
    const valid = svc.validateCustomerReference({ customerReferenceId: customerReference.referenceId, requestingDomain: 'order', requestingService: 'order-service', governance: gov('customer.validate_reference','customer:validate_reference','customer.reference') });
    assert.equal(valid.ok, true);
    assert.equal(valid.value.reasonCode, 'Valid');
    const changed = svc.changeCustomerStatus({ customerReferenceId: customerReference.referenceId, targetStatus: 'Suspended', reasonReference: 'reason:synthetic:suspension', idempotencyKey: 'idem:status:core-task-036', governance: gov('customer.change_status','customer:change_status','customer.lifecycle') });
    assert.equal(changed.ok, true);
    assert.equal(changed.value.objectRecord.status, CORE_CUSTOMER_STATUS_TO_OBJECT_STATUS.Suspended);
    assert.equal(traces.visibleTo(['Internal']).length, 2);
  });

  it('rejects unsafe or out-of-scope customer lifecycle requests with exact safe codes', () => {
    const { svc, traces } = service();
    const missingName = svc.createCustomer({ objectRecord, publicReferenceRecord: customerReference, customerType: 'Company', customerStatus: 'Active', nameReference: '', sourceReference: 'source:synthetic:customer-036', idempotencyKey: 'idem:create:missing-name', governance: gov('customer.create','customer:create','customer.write') });
    assert.equal(missingName.ok, false);
    if (!missingName.ok) assert.equal(missingName.error.code, 'CustomerNameRequired');
    const created = create(svc);
    assert.equal(created.ok, true);
    const duplicate = create(svc, 'idem:create:different-key');
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) assert.equal(duplicate.error.code, 'CustomerAlreadyExists');
    const denied = svc.getCustomer({ customerReferenceId: customerReference.referenceId, governance: gov('customer.read','customer:create','customer.read') });
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.error.code, 'PermissionDenied');
    const invalid = svc.changeCustomerStatus({ customerReferenceId: customerReference.referenceId, targetStatus: 'Draft', idempotencyKey: 'idem:status:invalid', governance: gov('customer.change_status','customer:change_status','customer.lifecycle') });
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.error.code, 'InvalidCustomerTransition');
    assert.equal(traces.visibleTo(['Internal']).length, 1);
  });
});

describe('Customer Service repair semantics', () => {
  it('fails closed for governance linkage, organization-scope and requesting-service mismatches', () => {
    const { svc } = service();
    assert.equal(create(svc).ok, true);
    const baseReadGovernance = gov('customer.read', 'customer:read', 'customer.read');
    const wrongActor = {
      ...baseReadGovernance,
      audit: { ...baseReadGovernance.audit, actorReferenceId: 'user:ref:other-0001' }
    };
    const actorResult = svc.getCustomer({ customerReferenceId: customerReference.referenceId, governance: wrongActor });
    assert.equal(actorResult.ok, false);
    if (!actorResult.ok) assert.deepEqual([actorResult.error.code, actorResult.error.category], ['AuditContextMissing', 'Validation']);

    const wrongScope = {
      ...baseReadGovernance,
      authorizedOrganizationReferenceId: 'organization:ref:other-0001'
    };
    const scopeResult = svc.getCustomer({ customerReferenceId: customerReference.referenceId, governance: wrongScope });
    assert.equal(scopeResult.ok, false);
    if (!scopeResult.ok) assert.deepEqual([scopeResult.error.code, scopeResult.error.category], ['PolicyRestricted', 'Policy']);

    const requesterResult = svc.validateCustomerReference({ customerReferenceId: customerReference.referenceId, requestingDomain: 'brand', requestingService: 'order-service', governance: gov('customer.validate_reference', 'customer:validate_reference', 'customer.reference') });
    assert.equal(requesterResult.ok, false);
    if (!requesterResult.ok) assert.deepEqual([requesterResult.error.code, requesterResult.error.category], ['InvalidCustomerReference', 'Reference']);
  });

  it('isolates idempotency by organization and caches only successful effects', () => {
    const traces = new CoreEventTraceRegistry();
    const store = new CoreInMemoryCustomerServiceStore();
    let failedOnce = false;
    const failingOnce = { append: (record: Parameters<CoreEventTraceRegistry['append']>[0]) => { if (!failedOnce) { failedOnce = true; return { ok: false as const, error: { code: 'EventTraceFailed' as const, category: 'Event' as const, message: 'Synthetic failure.', safeDetail: null, retryable: false, correlationId: null } }; } return traces.append(record); } };
    const svc = new CoreCustomerService({ store, idempotencyRegistry: new CoreIdempotencyRegistry(() => 1), eventTracePort: failingOnce, relatedReferenceRegistry: references, now: () => now, cursorSecret: 'customer-service-secret', eventIdFactory: (op, id, key) => createCoreEventId(`event-retry-${op}-${id.replaceAll(':','-')}-${key}`) as CoreEventId });
    const failed = svc.createCustomer({ objectRecord, publicReferenceRecord: customerReference, customerType: 'Company', customerStatus: 'Active', nameReference: 'name:synthetic:customer-036', sourceReference: 'source:synthetic:customer-036', idempotencyKey: 'idem:create:retry-036', governance: gov('customer.create', 'customer:create', 'customer.write') });
    assert.equal(failed.ok, false);
    assert.equal(store.list().length, 0);
    const retried = svc.createCustomer({ objectRecord, publicReferenceRecord: customerReference, customerType: 'Company', customerStatus: 'Active', nameReference: 'name:synthetic:customer-036', sourceReference: 'source:synthetic:customer-036', idempotencyKey: 'idem:create:retry-036', governance: gov('customer.create', 'customer:create', 'customer.write') });
    assert.equal(retried.ok, true);
    assert.equal(store.list().length, 1);
  });

  it('rejects runtime-invalid list filters and safe errors include exact categories', () => {
    const { svc, traces } = service();
    assert.equal(create(svc).ok, true);
    const invalidType = svc.listCustomers({ filters: { customerType: 'Agency' }, governance: gov('customer.list', 'customer:list', 'customer.list', 'customer:collection') });
    assert.equal(invalidType.ok, false);
    if (!invalidType.ok) assert.deepEqual([invalidType.error.code, invalidType.error.category], ['InvalidCustomerType', 'Validation']);
    const invalidStatus = svc.changeCustomerStatus({ customerReferenceId: customerReference.referenceId, targetStatus: 'Draft', idempotencyKey: 'idem:invalid-category-036', governance: gov('customer.change_status', 'customer:change_status', 'customer.lifecycle') });
    assert.equal(invalidStatus.ok, false);
    if (!invalidStatus.ok) assert.deepEqual([invalidStatus.error.code, invalidStatus.error.category], ['InvalidCustomerTransition', 'State']);
    assert.equal(traces.visibleTo(['Internal']).length, 1);
  });
});
