import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS,
  CORE_OBJECT_CONTRACT_SKELETONS,
  CORE_STUB_OBJECT_CONTRACT_SKELETONS,
  CoreReferenceRegistry,
  CORE_MVP_OBJECT_BASE_RECORD_FIELDS,
  CORE_MVP_OBJECT_CANONICAL_PROFILES,
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,
  CORE_MVP_OBJECT_PROFILE_ORDER,
  createCoreMvpObjectBaseRecord,
  coreMvpObjectBaseRecordFieldNames,
  validateCoreMvpObjectBaseRecord,
  validateCoreMvpObjectFieldApplicability,
  validateCoreMvpObjectProfiles,
  type CoreMvpObjectValidationContext
} from '../../src/index.ts';

const relatedReferenceRegistry = new CoreReferenceRegistry(
  CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS
);

const validRecord: Record<string, unknown> = {
  publicReferenceId: 'customer:ref:any-valid-0001',
  objectType: 'customer-record',
  domainId: 'customer',
  objectContractId: 'core-object-customer-record-contract',
  status: 'active',
  version: { version: 1, createdAt: '2026-01-01T00:00:00.000Z' },
  metadata: { source: 'core-task-035', nested: { safe: true } },
  auditMetadata: {
    createdAt: '2026-01-01T00:00:00.000Z',
    createdByReferenceId: 'user:ref:actor-0001',
    correlationId: 'corr-core-task-035'
  },
  visibility: {
    permissionScopeReferenceId: 'permission:ref:scope-0001',
    policyScopeReferenceId: 'policy:ref:scope-0001',
    organizationScopeReferenceId: 'organization:ref:scope-0001',
    actorScopeReferenceId: 'user:ref:actor-0001'
  }
};

const context = (
  overrides: Partial<CoreMvpObjectValidationContext['publicReferenceRecord']> = {}
): CoreMvpObjectValidationContext => ({
  publicReferenceRecord: {
    referenceId: 'customer:ref:any-valid-0001',
    objectType: 'customer-record',
    referenceDomain: 'customer',
    status: 'Active',
    ...overrides
  },
  relatedReferenceRegistry
});

const codes = (input: unknown, ctx: CoreMvpObjectValidationContext | undefined = context()) =>
  validateCoreMvpObjectBaseRecord(input, ctx).issues.map((i) => i.code);
const auditMetadata = () => validRecord.auditMetadata as Record<string, unknown>;
const visibilityMetadata = () => validRecord.visibility as Record<string, unknown>;

describe('Core MVP Object public-reference foundation', () => {
  it('locks exactly 18 Object profiles in canonical Book 02 order', () => {
    assert.equal(CORE_MVP_OBJECT_CANONICAL_PROFILES.length, 18);
    assert.deepEqual(CORE_MVP_OBJECT_CANONICAL_PROFILES.map((p) => p.domainId), [
      ...CORE_MVP_OBJECT_PROFILE_ORDER
    ]);
    assert.equal(validateCoreMvpObjectProfiles().ok, true);
  });

  it('maps Policy to the real permission-policy Object contract', () => {
    const policy = CORE_MVP_OBJECT_CANONICAL_PROFILES.find(
      (profile) => profile.domainId === 'policy'
    );
    assert.equal(policy?.objectType, 'permission-policy-record');
    assert.equal(policy?.objectContractId, 'core-object-permission-policy-record-contract');
  });

  it('matches all 18 profiles to real canonical Object contracts and source paths', () => {
    for (const profile of CORE_MVP_OBJECT_CANONICAL_PROFILES) {
      const contract = CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS.find(
        (entry) => entry.id === profile.objectContractId
      );
      assert.equal(contract?.domainId, profile.domainId);
      assert.equal(contract?.objectType, profile.objectType);
      assert.equal(contract?.sourcePath, profile.sourcePath);
      assert.equal(contract?.implementationDepth, 'validated_skeleton');
      assert.equal(contract?.metadata?.specificationCommit, '3349ecb8955021a8714d023348f8b24f941eb98f');
    }
  });

  it('keeps exactly 8 Stub Object identities as stubs', () => {
    assert.deepEqual(CORE_STUB_OBJECT_CONTRACT_SKELETONS.map((entry) => entry.domainId), [
      'knowledge',
      'opportunity',
      'notification',
      'partner',
      'agent',
      'service-provider',
      'service-network',
      'routing'
    ]);
    assert.equal(
      CORE_STUB_OBJECT_CONTRACT_SKELETONS.every(
        (entry) => entry.metadata?.mvpRequirement === 'stub_now'
      ),
      true
    );
  });

  it('rejects profile duplicate, missing, extra, applicability drift, source drift, and contract drift', () => {
    assert.ok(
      validateCoreMvpObjectProfiles([
        CORE_MVP_OBJECT_CANONICAL_PROFILES[0],
        CORE_MVP_OBJECT_CANONICAL_PROFILES[0],
        ...CORE_MVP_OBJECT_CANONICAL_PROFILES.slice(2)
      ]).issues.some((i) => i.code === 'core.object.profile_duplicate')
    );
    assert.equal(
      validateCoreMvpObjectProfiles(CORE_MVP_OBJECT_CANONICAL_PROFILES.slice(1)).issues[0]?.code,
      'core.object.profile_missing'
    );
    assert.ok(
      validateCoreMvpObjectProfiles([
        ...CORE_MVP_OBJECT_CANONICAL_PROFILES,
        CORE_MVP_OBJECT_CANONICAL_PROFILES[0]
      ]).issues.some((i) => i.code === 'core.object.profile_extra')
    );
    assert.ok(
      validateCoreMvpObjectProfiles([
        { ...CORE_MVP_OBJECT_CANONICAL_PROFILES[0], visibility: 'required' },
        ...CORE_MVP_OBJECT_CANONICAL_PROFILES.slice(1)
      ]).issues.some((i) => i.code === 'core.object.profile_drift')
    );
    assert.ok(
      validateCoreMvpObjectProfiles([
        { ...CORE_MVP_OBJECT_CANONICAL_PROFILES[0], sourcePath: 'changed.md' },
        ...CORE_MVP_OBJECT_CANONICAL_PROFILES.slice(1)
      ]).issues.some((i) => i.code === 'core.object.profile_source_mismatch')
    );
    assert.ok(
      validateCoreMvpObjectProfiles([
        { ...CORE_MVP_OBJECT_CANONICAL_PROFILES[0], objectContractId: 'missing-contract' },
        ...CORE_MVP_OBJECT_CANONICAL_PROFILES.slice(1)
      ]).issues.some((i) => i.code === 'core.object.contract_missing')
    );
  });

  it('compares Object base contract fields with the implemented base-record fields', () => {
    assert.deepEqual(coreMvpObjectBaseRecordFieldNames(), CORE_MVP_OBJECT_BASE_RECORD_FIELDS);
    assert.equal(
      CORE_OBJECT_CONTRACT_SKELETONS.every(
        (entry) =>
          JSON.stringify([...(entry.requiredBaseFields ?? []), ...(entry.optionalBaseFields ?? [])]) ===
          JSON.stringify(CORE_MVP_OBJECT_BASE_RECORD_FIELDS)
      ),
      true
    );
  });

  it('accepts arbitrary valid supplied public IDs with a matching supplied Reference record', () => {
    assert.equal(validateCoreMvpObjectBaseRecord(validRecord, context()).ok, true);
    assert.ok(
      validateCoreMvpObjectBaseRecord(validRecord).issues.some(
        (issue) => issue.code === 'core.object.reference_evidence_missing'
      )
    );
    assert.ok(codes(validRecord, context({ objectType: 'brand-record' })).includes('core.object.public_reference_type_mismatch'));
    assert.ok(codes(validRecord, context({ referenceDomain: 'brand' })).includes('core.object.public_reference_domain_mismatch'));
    assert.ok(codes(validRecord, context({ status: 'DeletedReferenceOnly' })).includes('core.object.public_reference_invalid'));
  });

  it('rejects public reference shape failures with stable codes', () => {
    assert.ok(codes({ ...validRecord, publicReferenceId: undefined }).includes('core.object.public_reference_missing'));
    assert.ok(codes({ ...validRecord, publicReferenceId: 'bad path/value' }).includes('core.object.public_reference_invalid'));
    assert.ok(codes({ ...validRecord, publicReferenceId: '12345' }).includes('core.object.raw_database_id_forbidden'));
    assert.ok(codes({ ...validRecord, publicReferenceId: 'customer:ref:different' }).includes('core.object.public_reference_mismatch'));
  });

  it('rejects non-JSON metadata safely', () => {
    class NonPlainMetadata {
      readonly value = true;
    }
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    assert.ok(codes({ ...validRecord, metadata: [] }).includes('core.object.metadata_not_object'));
    assert.ok(codes({ ...validRecord, metadata: { value: Number.NaN } }).includes('core.object.metadata_non_finite_number'));
    assert.ok(codes({ ...validRecord, metadata: { value: Number.POSITIVE_INFINITY } }).includes('core.object.metadata_non_finite_number'));
    assert.ok(codes({ ...validRecord, metadata: { value: new Date('2026-01-01T00:00:00.000Z') } }).includes('core.object.metadata_non_plain_object'));
    assert.ok(codes({ ...validRecord, metadata: { value: new Map<string, string>() } }).includes('core.object.metadata_non_plain_object'));
    assert.ok(codes({ ...validRecord, metadata: { value: new Set<string>() } }).includes('core.object.metadata_non_plain_object'));
    assert.ok(codes({ ...validRecord, metadata: { value: new NonPlainMetadata() } }).includes('core.object.metadata_non_plain_object'));
    assert.ok(codes({ ...validRecord, metadata: circular }).includes('core.object.metadata_cycle'));
    assert.ok(codes({ ...validRecord, metadata: { a: { b: { c: { d: { e: { f: true } } } } } } }).includes('core.object.metadata_depth_exceeded'));
    assert.ok(codes({ ...validRecord, metadata: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`k${i}`, i])) }).includes('core.object.metadata_entry_limit'));
  });

  it('rejects invalid audit metadata', () => {
    assert.ok(codes({ ...validRecord, auditMetadata: { ...auditMetadata(), createdByReferenceId: undefined } }).includes('core.object.audit_created_by_missing'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...auditMetadata(), createdAt: '2026-99-99T00:00:00.000Z' } }).includes('core.object.audit_created_at_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...auditMetadata(), updatedAt: 123, updatedByReferenceId: 'user:ref:actor-0001' } }).includes('core.object.audit_updated_at_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...auditMetadata(), updatedAt: 'bad', updatedByReferenceId: 'user:ref:actor-0001' } }).includes('core.object.audit_updated_at_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...auditMetadata(), updatedAt: '2025-01-01T00:00:00.000Z', updatedByReferenceId: 'user:ref:actor-0001' } }).includes('core.object.audit_time_order_invalid'));
    assert.ok(codes({ ...validRecord, auditMetadata: { ...auditMetadata(), updatedAt: '2026-01-02T00:00:00.000Z' } }).includes('core.object.audit_update_pair_invalid'));
  });

  it('rejects invalid visibility/status/version applicability cases', () => {
    assert.ok(codes({ ...validRecord, visibility: { ...visibilityMetadata(), organizationScopeReferenceId: 'bad' } }).includes('core.object.organization_scope_invalid'));
    assert.ok(codes({ ...validRecord, visibility: { ...visibilityMetadata(), actorScopeReferenceId: 'bad' } }).includes('core.object.actor_scope_invalid'));
    const optionalProfile = CORE_MVP_OBJECT_CANONICAL_PROFILES[0];
    const notApplicableProfile = { ...optionalProfile, status: 'not_applicable' as const, version: 'not_applicable' as const, visibility: 'not_applicable' as const };
    assert.ok(validateCoreMvpObjectProfiles([notApplicableProfile, ...CORE_MVP_OBJECT_CANONICAL_PROFILES.slice(1)]).issues.some((i) => i.code === 'core.object.profile_drift'));
  });


  it('rejects unknown Version fields and reserved internal metadata keys', () => {
    assert.ok(codes({ ...validRecord, version: { version: 1, createdAt: '2026-01-01T00:00:00.000Z', extra: true } }).includes('core.object.version_unknown_field'));
    assert.ok(codes({ ...validRecord, version: { version: 1, createdAt: '2026-01-01T00:00:00.000Z', databaseId: 'db-1' } }).includes('core.object.version_unknown_field'));
    assert.ok(codes({ ...validRecord, metadata: { databaseId: 'db-1' } }).includes('core.object.metadata_reserved_internal_key'));
    assert.ok(codes({ ...validRecord, metadata: { internalDatabaseId: 'db-1' } }).includes('core.object.metadata_reserved_internal_key'));
    assert.ok(codes({ ...validRecord, metadata: { nested: { rowId: 'row-1' } } }).includes('core.object.metadata_reserved_internal_key'));
    assert.ok(codes({ ...validRecord, metadata: { nested: { primaryKey: 'pk-1' } } }).includes('core.object.metadata_reserved_internal_key'));
    assert.equal(codes({ ...validRecord, metadata: { externalId: 'ext-1', referenceId: 'ref-1', correlationId: 'corr-1', sourceId: 'source-1' } }).includes('core.object.metadata_reserved_internal_key'), false);
  });

  it('exercises required, optional, and not_applicable field applicability directly', () => {
    const baseProfile = CORE_MVP_OBJECT_CANONICAL_PROFILES.find((profile) => profile.domainId === 'customer');
    if (!baseProfile) throw new Error('Expected customer profile.');
    const optionalProfile = { ...baseProfile, status: 'optional' as const, version: 'optional' as const, visibility: 'optional' as const };
    const requiredProfile = { ...baseProfile, status: 'required' as const, version: 'required' as const, visibility: 'required' as const };
    const notApplicableProfile = { ...baseProfile, status: 'not_applicable' as const, version: 'not_applicable' as const, visibility: 'not_applicable' as const };
    assert.equal(validateCoreMvpObjectFieldApplicability({ metadata: {} }, optionalProfile, context()).ok, true);
    assert.ok(validateCoreMvpObjectFieldApplicability({ metadata: {} }, requiredProfile, context()).issues.some((issue) => issue.code === 'core.object.status_required'));
    assert.ok(validateCoreMvpObjectFieldApplicability({ metadata: {} }, requiredProfile, context()).issues.some((issue) => issue.code === 'core.object.version_required'));
    assert.ok(validateCoreMvpObjectFieldApplicability({ metadata: {} }, requiredProfile, context()).issues.some((issue) => issue.code === 'core.object.visibility_required'));
    assert.ok(validateCoreMvpObjectFieldApplicability(validRecord, notApplicableProfile, context()).issues.some((issue) => issue.code === 'core.object.status_not_applicable'));
    assert.ok(validateCoreMvpObjectFieldApplicability(validRecord, notApplicableProfile, context()).issues.some((issue) => issue.code === 'core.object.version_not_applicable'));
    assert.ok(validateCoreMvpObjectFieldApplicability(validRecord, notApplicableProfile, context()).issues.some((issue) => issue.code === 'core.object.visibility_not_applicable'));
  });

  it('does not freeze or mutate input and deeply freezes an independent result', () => {
    const input = structuredClone(validRecord);
    const before = JSON.stringify(input);
    const result = createCoreMvpObjectBaseRecord(input, context());
    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(input), before);
    assert.equal(Object.isFrozen(input), false);
    assert.equal(Object.isFrozen(input.metadata), false);
    assert.equal(Object.isFrozen((input.metadata as Record<string, unknown>).nested), false);
    assert.equal(Object.isFrozen(input.auditMetadata), false);
    assert.equal(Object.isFrozen(input.visibility), false);
    assert.equal(Object.isFrozen(input.version), false);
    if (result.ok) {
      assert.equal(Object.isFrozen(result.value), true);
      assert.equal(Object.isFrozen(result.value.metadata), true);
      assert.equal(Object.isFrozen(result.value.auditMetadata), true);
      assert.equal(Object.isFrozen(result.value.visibility), true);
      assert.notEqual(result.value.metadata, input.metadata);
    }
  });
});
