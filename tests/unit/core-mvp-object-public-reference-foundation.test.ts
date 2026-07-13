import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CoreReferenceRegistry, CORE_MVP_OBJECT_PROFILES, CORE_MVP_OBJECT_PROFILE_ORDER, CORE_MVP_OBJECT_REFERENCE_RECORDS, createCoreMvpObjectBaseRecord, validateCoreMvpObjectBaseRecord, validateCoreMvpObjectProfiles } from '../../src/index.ts';

const validRecord = {
  publicReferenceId: 'customer:ref:00006',
  objectType: 'customer-record',
  domainId: 'customer',
  objectContractId: 'core-object-customer-record-contract',
  status: 'active',
  version: { version: 1, createdAt: '2026-01-01T00:00:00.000Z' },
  metadata: { source: 'core-task-035', nested: { safe: true } },
  auditMetadata: { createdAt: '2026-01-01T00:00:00.000Z', createdByReferenceId: 'user:ref:actor-0001', correlationId: 'corr-core-task-035' },
  visibility: { permissionScopeReferenceId: 'permission:ref:scope-0001', policyScopeReferenceId: 'policy:ref:scope-0001', organizationScopeReferenceId: 'organization:ref:scope-0001' }
} as const;

const codes = (input: unknown) => validateCoreMvpObjectBaseRecord(input).issues.map((i) => i.code);

describe('Core MVP Object public-reference foundation', () => {
  it('locks exactly 18 Object profiles in canonical Book 02 order', () => {
    assert.equal(CORE_MVP_OBJECT_PROFILES.length, 18);
    assert.deepEqual(CORE_MVP_OBJECT_PROFILES.map((p) => p.domainId), [...CORE_MVP_OBJECT_PROFILE_ORDER]);
    assert.equal(validateCoreMvpObjectProfiles().ok, true);
  });

  it('rejects profile duplicate, missing, extra, contract mismatch, and domain/type drift', () => {
    assert.equal(validateCoreMvpObjectProfiles([CORE_MVP_OBJECT_PROFILES[0], CORE_MVP_OBJECT_PROFILES[0], ...CORE_MVP_OBJECT_PROFILES.slice(2)]).issues.some((i) => i.code === 'core.object.profile_duplicate'), true);
    assert.equal(validateCoreMvpObjectProfiles(CORE_MVP_OBJECT_PROFILES.slice(1)).issues[0]?.code, 'core.object.profile_missing');
    assert.equal(validateCoreMvpObjectProfiles([...CORE_MVP_OBJECT_PROFILES, CORE_MVP_OBJECT_PROFILES[0]]).issues.some((i) => i.code === 'core.object.profile_extra'), true);
    assert.equal(validateCoreMvpObjectProfiles([{ ...CORE_MVP_OBJECT_PROFILES[0], objectContractId: 'wrong' }]).issues.some((i) => i.code === 'core.object.contract_mismatch'), true);
    assert.equal(validateCoreMvpObjectProfiles([{ ...CORE_MVP_OBJECT_PROFILES[0], domainId: 'unknown' }]).issues.some((i) => i.code === 'core.object.domain_mismatch'), true);
  });

  it('accepts and immutably constructs a valid supplied public Object reference record without side effects', () => {
    const before = JSON.stringify(validRecord);
    const result = createCoreMvpObjectBaseRecord(validRecord);
    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(validRecord), before);
    if (result.ok) {
      assert.equal(Object.isFrozen(result.value), true);
      assert.equal(result.value.publicReferenceId, validRecord.publicReferenceId);
      assert.equal('databaseId' in result.value, false);
    }
  });

  it('rejects public reference failures with stable codes', () => {
    assert.ok(codes({ ...validRecord, publicReferenceId: undefined }).includes('core.object.public_reference_missing'));
    assert.ok(codes({ ...validRecord, publicReferenceId: 'bad path/value' }).includes('core.object.public_reference_invalid'));
    assert.ok(codes({ ...validRecord, publicReferenceId: '12345' }).includes('core.object.raw_database_id_forbidden'));
    const typeRegistry = new CoreReferenceRegistry([{ ...CORE_MVP_OBJECT_REFERENCE_RECORDS[5], objectType: 'brand-record' }, ...CORE_MVP_OBJECT_REFERENCE_RECORDS.slice(6)]);
    assert.ok(validateCoreMvpObjectBaseRecord(validRecord, typeRegistry).issues.some((i) => i.code === 'core.object.public_reference_type_mismatch'));
    assert.ok(codes({ ...validRecord, publicReferenceId: 'brand:ref:00007' }).includes('core.object.public_reference_domain_mismatch'));
    const deletedRegistry = new CoreReferenceRegistry([{ ...CORE_MVP_OBJECT_REFERENCE_RECORDS[5], status: 'DeletedReferenceOnly' }, ...CORE_MVP_OBJECT_REFERENCE_RECORDS.slice(6)]);
    assert.ok(validateCoreMvpObjectBaseRecord(validRecord, deletedRegistry).issues.some((i) => i.code === 'core.object.public_reference_invalid'));
  });

  it('rejects unsafe or unbounded core metadata', () => {
    assert.ok(codes({ ...validRecord, metadata: undefined }).includes('core.object.metadata_invalid'));
    assert.ok(codes({ ...validRecord, metadata: { fn: () => undefined } }).includes('core.object.metadata_invalid'));
    assert.ok(codes({ ...validRecord, metadata: { bad: undefined } }).includes('core.object.metadata_invalid'));
    assert.ok(codes({ ...validRecord, metadata: { a: { b: { c: { d: { e: { f: true } } } } } } }).includes('core.object.metadata_unbounded'));
    assert.ok(codes({ ...validRecord, metadata: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`k${i}`, i])) }).includes('core.object.metadata_unbounded'));
  });

  it('rejects invalid audit metadata and partial update pairs', () => {
    assert.ok(codes({ ...validRecord, auditMetadata: undefined }).includes('core.object.audit_missing'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...validRecord.auditMetadata, createdAt: 'bad' } }).includes('core.object.audit_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...validRecord.auditMetadata, updatedAt: '2025-01-01T00:00:00.000Z', updatedByReferenceId: 'user:ref:actor-0001' } }).includes('core.object.audit_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...validRecord.auditMetadata, updatedAt: '2026-01-02T00:00:00.000Z' } }).includes('core.object.audit_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...validRecord.auditMetadata, updatedByReferenceId: 'user:ref:actor-0001' } }).includes('core.object.audit_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...validRecord.auditMetadata, createdByReferenceId: 'bad actor' } }).includes('core.object.audit_invalid'));
  });

  it('rejects visibility, status, version, unknown type/domain, and unknown fields', () => {
    assert.ok(codes({ ...validRecord, visibility: undefined }).includes('core.object.visibility_missing'));
    assert.ok(codes({ ...validRecord, visibility: { ...validRecord.visibility, permissionScopeReferenceId: 'bad' } }).includes('core.object.visibility_invalid'));
    assert.ok(codes({ ...validRecord, visibility: { ...validRecord.visibility, policyScopeReferenceId: 'bad' } }).includes('core.object.visibility_invalid'));
    assert.ok(codes({ ...validRecord, status: undefined }).includes('core.object.status_invalid'));
    assert.ok(codes({ ...validRecord, status: 'pending' }).includes('core.object.status_invalid'));
    assert.ok(codes({ ...validRecord, version: { version: 2, createdAt: '2026-01-01T00:00:00.000Z' } }).includes('core.object.version_unsupported'));
    assert.ok(codes({ ...validRecord, objectType: 'unknown-record' }).includes('core.object.profile_missing'));
    assert.ok(codes({ ...validRecord, domainId: 'unknown' }).includes('core.object.domain_mismatch'));
    assert.ok(codes({ ...validRecord, databaseId: 'db-1' }).includes('core.object.unknown_field'));
  });
});
