import { CoreReferenceRegistry } from '../behaviors/core-reference-behavior.ts';
import { createCoreValidationResult, type CoreValidationIssue, type CoreValidationResult } from '../validation/index.ts';
import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import { CORE_OBJECT_STATUSES } from './core-object-status.ts';
import { CORE_MVP_OBJECT_PROFILES, CORE_MVP_OBJECT_PROFILE_ORDER, type CoreMvpObjectProfile } from './core-mvp-object-profiles.ts';
import { CORE_MVP_OBJECT_REFERENCE_REGISTRY, deepFreezeCoreMvpObject, type CoreMvpObjectBaseRecord } from './core-mvp-object-base-record.ts';

const allowedKeys = new Set(['publicReferenceId', 'objectType', 'domainId', 'objectContractId', 'status', 'version', 'metadata', 'auditMetadata', 'visibility']);
const referencePattern = /^[a-z0-9][a-z0-9:_-]{2,127}$/;
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const domains = new Set<string>(CORE_DOMAIN_REGISTRY.map((d) => d.id));
const statusValues = new Set<string>(Object.values(CORE_OBJECT_STATUSES));
const issue = (code: string, message: string, path?: string): CoreValidationIssue => ({ code, severity: 'error', message, path });

export function validateCoreMvpObjectProfiles(profiles: readonly CoreMvpObjectProfile[] = CORE_MVP_OBJECT_PROFILES): CoreValidationResult {
  const issues: CoreValidationIssue[] = [];
  if (profiles.length !== CORE_MVP_OBJECT_PROFILE_ORDER.length) issues.push(issue(profiles.length < CORE_MVP_OBJECT_PROFILE_ORDER.length ? 'core.object.profile_missing' : 'core.object.profile_extra', 'The Must Build Object profile registry must contain exactly 18 profiles.'));
  const seen = new Set<string>();
  profiles.forEach((p, i) => {
    if (seen.has(p.domainId)) issues.push(issue('core.object.profile_duplicate', 'Duplicate Object profile.', `${i}.domainId`));
    seen.add(p.domainId);
    if (p.domainId !== CORE_MVP_OBJECT_PROFILE_ORDER[i]) issues.push(issue('core.object.profile_order', 'Object profile order changed.', `${i}.domainId`));
    if (p.objectType !== `${p.domainId}-record`) issues.push(issue('core.object.type_mismatch', 'Object type must match domain record type.', `${i}.objectType`));
    if (p.objectContractId !== `core-object-${p.objectType}-contract`) issues.push(issue('core.object.contract_mismatch', 'Object contract ID mismatch.', `${i}.objectContractId`));
    if (!domains.has(p.domainId)) issues.push(issue('core.object.domain_mismatch', 'Object profile domain is not recognized.', `${i}.domainId`));
    if (p.publicReferenceId !== 'required' || p.metadata !== 'required' || p.auditMetadata !== 'required') issues.push(issue('core.object.profile_missing', 'Public reference, metadata, and audit metadata are required for every profile.', `${i}`));
  });
  return createCoreValidationResult(issues);
}

const profileFor = (record: Record<string, unknown>) => CORE_MVP_OBJECT_PROFILES.find((p) => p.domainId === record.domainId && p.objectType === record.objectType);

function validateJson(value: unknown, path: string, issues: CoreValidationIssue[], depth = 0, entries = { count: 0 }): void {
  if (depth > 5) issues.push(issue('core.object.metadata_unbounded', 'Metadata exceeds maximum depth.', path));
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') issues.push(issue('core.object.metadata_invalid', 'Metadata must be JSON-safe.', path));
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return;
  if (typeof value !== 'object') return;
  if (Array.isArray(value)) {
    entries.count += value.length;
    if (entries.count > 50) issues.push(issue('core.object.metadata_unbounded', 'Metadata exceeds maximum entry count.', path));
    value.forEach((v, i) => validateJson(v, `${path}.${i}`, issues, depth + 1, entries));
  } else {
    entries.count += Object.keys(value).length;
    if (entries.count > 50) issues.push(issue('core.object.metadata_unbounded', 'Metadata exceeds maximum entry count.', path));
    for (const [k, v] of Object.entries(value)) validateJson(v, `${path}.${k}`, issues, depth + 1, entries);
  }
}

function validateAudit(record: Record<string, unknown>, registry: CoreReferenceRegistry, issues: CoreValidationIssue[]): void {
  const audit = record.auditMetadata as Record<string, unknown> | undefined;
  if (!audit || typeof audit !== 'object') { issues.push(issue('core.object.audit_missing', 'Audit metadata is required.', 'auditMetadata')); return; }
  if (typeof audit.createdAt !== 'string' || !iso.test(audit.createdAt)) issues.push(issue('core.object.audit_invalid', 'createdAt must be valid.', 'auditMetadata.createdAt'));
  if (typeof audit.correlationId !== 'string' || audit.correlationId.length === 0) issues.push(issue('core.object.audit_invalid', 'correlationId is required.', 'auditMetadata.correlationId'));
  const hasUpdatedAt = audit.updatedAt !== undefined;
  const hasUpdatedBy = audit.updatedByReferenceId !== undefined;
  if (hasUpdatedAt !== hasUpdatedBy) issues.push(issue('core.object.audit_invalid', 'Update audit fields must be paired.', 'auditMetadata'));
  if (typeof audit.updatedAt === 'string' && typeof audit.createdAt === 'string' && audit.updatedAt < audit.createdAt) issues.push(issue('core.object.audit_invalid', 'updatedAt must not precede createdAt.', 'auditMetadata.updatedAt'));
  for (const [field, ref] of [['createdByReferenceId', audit.createdByReferenceId], ['updatedByReferenceId', audit.updatedByReferenceId]] as const) {
    if (ref === undefined) continue;
    if (typeof ref !== 'string' || !referencePattern.test(ref) || !registry.resolve({ referenceId: ref, expectedObjectType: 'user-record', expectedDomain: 'user' }).ok) issues.push(issue('core.object.audit_invalid', 'Audit actor reference is invalid.', `auditMetadata.${field}`));
  }
}

export function validateCoreMvpObjectBaseRecord(input: unknown, registry: CoreReferenceRegistry = CORE_MVP_OBJECT_REFERENCE_REGISTRY): CoreValidationResult {
  const issues: CoreValidationIssue[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return createCoreValidationResult([issue('core.object.record_invalid', 'Object base record must be an object.')]);
  const record = input as Record<string, unknown>;
  for (const k of Object.keys(record)) if (!allowedKeys.has(k)) issues.push(issue('core.object.unknown_field', 'Unknown Object base field.', k));
  if (typeof record.publicReferenceId !== 'string' || record.publicReferenceId.length === 0) issues.push(issue('core.object.public_reference_missing', 'publicReferenceId is required.', 'publicReferenceId'));
  else if (/^\d+$/.test(record.publicReferenceId)) issues.push(issue('core.object.raw_database_id_forbidden', 'Raw numeric database IDs are forbidden.', 'publicReferenceId'));
  else if (!referencePattern.test(record.publicReferenceId)) issues.push(issue('core.object.public_reference_invalid', 'publicReferenceId is invalid.', 'publicReferenceId'));
  if (typeof record.domainId !== 'string' || !domains.has(record.domainId)) issues.push(issue('core.object.domain_mismatch', 'Domain ID is not recognized.', 'domainId'));
  const profile = profileFor(record);
  if (!profile) issues.push(issue('core.object.profile_missing', 'Object profile is not registered.'));
  else {
    if (record.objectContractId !== profile.objectContractId) issues.push(issue('core.object.contract_mismatch', 'Object contract ID mismatch.', 'objectContractId'));
    if (record.publicReferenceId && typeof record.publicReferenceId === 'string') {
      const expectedPrefix = `${profile.domainId}:`;
      if (!record.publicReferenceId.startsWith(expectedPrefix)) issues.push(issue('core.object.public_reference_domain_mismatch', 'Public reference domain does not match.', 'publicReferenceId'));
      const res = registry.resolve({ referenceId: record.publicReferenceId, expectedObjectType: profile.objectType, expectedDomain: profile.domainId });
      if (!res.ok && res.error.code === 'ReferenceTypeMismatch') issues.push(issue('core.object.public_reference_type_mismatch', 'Public reference type does not match.', 'publicReferenceId'));
      else if (!res.ok && res.error.code === 'ReferenceDomainMismatch') issues.push(issue('core.object.public_reference_domain_mismatch', 'Public reference domain does not match.', 'publicReferenceId'));
      else if (!res.ok) issues.push(issue('core.object.public_reference_invalid', 'Public reference is not usable.', 'publicReferenceId'));
    }
    if (profile.status === 'required' && record.status === undefined) issues.push(issue('core.object.status_invalid', 'Status is required.', 'status'));
    if (record.status !== undefined && (typeof record.status !== 'string' || !statusValues.has(record.status))) issues.push(issue('core.object.status_invalid', 'Status is invalid.', 'status'));
    if (profile.version === 'required' && record.version === undefined) issues.push(issue('core.object.version_unsupported', 'Version is required.', 'version'));
    const version = record.version as Record<string, unknown> | undefined;
    if (version !== undefined && (typeof version !== 'object' || version.version !== 1 || typeof version.createdAt !== 'string' || !iso.test(version.createdAt))) issues.push(issue('core.object.version_unsupported', 'Version is unsupported.', 'version'));
    if (profile.visibility === 'required' && record.visibility === undefined) issues.push(issue('core.object.visibility_missing', 'Visibility metadata is required.', 'visibility'));
  }
  if (record.metadata === undefined) issues.push(issue('core.object.metadata_invalid', 'Core metadata is required.', 'metadata'));
  else validateJson(record.metadata, 'metadata', issues);
  validateAudit(record, registry, issues);
  const vis = record.visibility as Record<string, unknown> | undefined;
  if (vis !== undefined) {
    if (typeof vis !== 'object') issues.push(issue('core.object.visibility_invalid', 'Visibility metadata is invalid.', 'visibility'));
    else {
      if (typeof vis.permissionScopeReferenceId !== 'string' || !registry.resolve({ referenceId: vis.permissionScopeReferenceId, expectedObjectType: 'permission-record', expectedDomain: 'permission' }).ok) issues.push(issue('core.object.visibility_invalid', 'Permission scope is invalid.', 'visibility.permissionScopeReferenceId'));
      if (typeof vis.policyScopeReferenceId !== 'string' || !registry.resolve({ referenceId: vis.policyScopeReferenceId, expectedObjectType: 'policy-record', expectedDomain: 'policy' }).ok) issues.push(issue('core.object.visibility_invalid', 'Policy scope is invalid.', 'visibility.policyScopeReferenceId'));
    }
  }
  return createCoreValidationResult(issues);
}

export function createCoreMvpObjectBaseRecord(input: unknown, registry?: CoreReferenceRegistry): { readonly ok: true; readonly value: CoreMvpObjectBaseRecord } | { readonly ok: false; readonly issues: readonly CoreValidationIssue[] } {
  const result = validateCoreMvpObjectBaseRecord(input, registry);
  if (!result.ok) return { ok: false, issues: result.issues };
  return { ok: true, value: deepFreezeCoreMvpObject({ ...(input as CoreMvpObjectBaseRecord) }) };
}

export const parseCoreMvpObjectBaseRecord = createCoreMvpObjectBaseRecord;
