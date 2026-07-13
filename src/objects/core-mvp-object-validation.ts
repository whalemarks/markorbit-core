import { type CoreReferenceRecord } from '../behaviors/core-reference-behavior.ts';
import { CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS } from '../contracts/object/core-object-contract-skeletons.ts';
import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import {
  createCoreValidationResult,
  type CoreValidationIssue,
  type CoreValidationResult
} from '../validation/index.ts';
import { createCoreObjectVersion } from './core-object-version.ts';
import { CORE_OBJECT_STATUSES } from './core-object-status.ts';
import {
  CORE_MVP_OBJECT_CANONICAL_PROFILES,
  CORE_MVP_OBJECT_PROFILE_ORDER,
  type CoreMvpObjectProfile
} from './core-mvp-object-profiles.ts';
import {
  CORE_MVP_OBJECT_BASE_RECORD_FIELDS,
  CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS,
  CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS,
  type CoreMvpObjectBaseRecord,
  type CoreMvpObjectValidationContext
} from './core-mvp-object-base-record.ts';

function issue(code: string, message: string, path?: string): CoreValidationIssue {
  return {
    code,
    severity: 'error',
    message,
    path
  };
}

function isAllowedBaseRecordKey(key: string): boolean {
  return (CORE_MVP_OBJECT_BASE_RECORD_FIELDS as readonly string[]).includes(key);
}
function isAuditKey(key: string): boolean {
  return ['createdAt', 'createdByReferenceId', 'updatedAt', 'updatedByReferenceId', 'correlationId'].includes(key);
}
function isVisibilityKey(key: string): boolean {
  return ['permissionScopeReferenceId', 'policyScopeReferenceId', 'organizationScopeReferenceId', 'actorScopeReferenceId'].includes(key);
}
function isVersionKey(key: string): boolean {
  return ['version', 'createdAt', 'updatedAt'].includes(key);
}
function isReservedMetadataInternalKey(key: string): boolean {
  return ['databaseid', 'internaldatabaseid', 'rowid', 'primarykey', 'internalid', 'storageid'].includes(key.toLowerCase());
}
function referencePatternMatches(value: string): boolean {
  return /^[a-z0-9][a-z0-9:_-]{2,127}$/.test(value);
}
function domainKnown(value: string): boolean {
  return CORE_DOMAIN_REGISTRY.some((domain) => domain.id === value);
}
function statusKnown(value: string): boolean {
  return Object.values(CORE_OBJECT_STATUSES).includes(value as (typeof CORE_OBJECT_STATUSES)[keyof typeof CORE_OBJECT_STATUSES]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function referenceStatusUsable(record: CoreReferenceRecord): boolean {
  return !['Invalid', 'Revoked', 'Suspended', 'DeletedReferenceOnly'].includes(record.status);
}

export function validateCoreReferenceRecordForUse(
  record: CoreReferenceRecord,
  expectedObjectType: string,
  expectedDomain: string,
  expectedReferenceId?: string
): CoreValidationIssue | undefined {
  if (expectedReferenceId !== undefined && record.referenceId !== expectedReferenceId)
    return issue('core.object.public_reference_mismatch', 'Reference record ID must match the Object publicReferenceId.', 'publicReferenceRecord.referenceId');
  if (!referencePatternMatches(record.referenceId))
    return issue('core.object.public_reference_invalid', 'Reference record ID is invalid.', 'publicReferenceRecord.referenceId');
  if (record.objectType !== expectedObjectType)
    return issue('core.object.public_reference_type_mismatch', 'Reference record object type does not match.', 'publicReferenceRecord.objectType');
  if (record.referenceDomain !== expectedDomain)
    return issue('core.object.public_reference_domain_mismatch', 'Reference record Domain does not match.', 'publicReferenceRecord.referenceDomain');
  if (!referenceStatusUsable(record))
    return issue('core.object.public_reference_invalid', 'Reference record status is not usable.', 'publicReferenceRecord.status');
  return undefined;
}

export function validateCoreMvpObjectProfiles(
  profiles: readonly CoreMvpObjectProfile[] = CORE_MVP_OBJECT_CANONICAL_PROFILES
): CoreValidationResult {
  const issues: CoreValidationIssue[] = [];
  if (profiles.length !== CORE_MVP_OBJECT_CANONICAL_PROFILES.length)
    issues.push(
      issue(
        profiles.length < CORE_MVP_OBJECT_CANONICAL_PROFILES.length
          ? 'core.object.profile_missing'
          : 'core.object.profile_extra',
        'The Must Build Object profile registry must contain exactly 18 profiles.'
      )
    );
  const domainsSeen = new Set<string>();
  const objectTypesSeen = new Set<string>();
  const contractIdsSeen = new Set<string>();
  profiles.forEach((profile, index) => {
    const path = `profiles[${index}]`;
    const canonical = CORE_MVP_OBJECT_CANONICAL_PROFILES[index];
    const contract = CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS.find(
      (entry) => entry.id === profile.objectContractId
    );
    if (domainsSeen.has(profile.domainId)) issues.push(issue('core.object.profile_duplicate', 'Duplicate Object profile Domain.', `${path}.domainId`));
    domainsSeen.add(profile.domainId);
    if (objectTypesSeen.has(profile.objectType)) issues.push(issue('core.object.profile_duplicate_object_type', 'Duplicate Object profile type.', `${path}.objectType`));
    objectTypesSeen.add(profile.objectType);
    if (contractIdsSeen.has(profile.objectContractId)) issues.push(issue('core.object.profile_duplicate_contract_id', 'Duplicate Object profile contract ID.', `${path}.objectContractId`));
    contractIdsSeen.add(profile.objectContractId);
    if (profile.domainId !== CORE_MVP_OBJECT_PROFILE_ORDER[index]) issues.push(issue('core.object.profile_order', 'Object profile order changed.', `${path}.domainId`));
    if (!domainKnown(profile.domainId)) issues.push(issue('core.object.domain_mismatch', 'Object profile domain is not recognized.', `${path}.domainId`));
    if (!canonical) return;
    for (const key of ['domainId', 'objectType', 'objectContractId', 'sourcePath', 'publicReferenceId', 'metadata', 'auditMetadata', 'status', 'version', 'visibility'] as const) {
      if (profile[key] !== canonical[key]) issues.push(issue('core.object.profile_drift', `Object profile ${key} changed.`, `${path}.${key}`));
    }
    if (!contract) {
      issues.push(issue('core.object.contract_missing', 'Object profile contract ID does not exist.', `${path}.objectContractId`));
      return;
    }
    if (profile.domainId !== contract.domainId || profile.objectType !== contract.objectType || profile.objectContractId !== contract.id)
      issues.push(issue('core.object.profile_contract_mismatch', 'Object profile does not match its real Object contract.', path));
    if (profile.sourcePath !== contract.sourcePath)
      issues.push(issue('core.object.profile_source_mismatch', 'Object profile source path does not match its Object contract.', `${path}.sourcePath`));
  });
  return createCoreValidationResult(issues);
}

function profileFor(record: Record<string, unknown>): CoreMvpObjectProfile | undefined {
  return CORE_MVP_OBJECT_CANONICAL_PROFILES.find(
    (profile) => profile.domainId === record.domainId && profile.objectType === record.objectType
  );
}

function validateMetadataValue(
  value: unknown,
  path: string,
  issues: CoreValidationIssue[],
  seen: WeakSet<object>,
  state: { entries: number },
  depth: number
): void {
  if (depth > 5) {
    issues.push(issue('core.object.metadata_depth_exceeded', 'Metadata exceeds maximum depth.', path));
    return;
  }
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
    issues.push(issue('core.object.metadata_non_json_value', 'Metadata contains a non-JSON value.', path));
    return;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    issues.push(issue('core.object.metadata_non_finite_number', 'Metadata contains a non-finite number.', path));
    return;
  }
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return;
  if (typeof value !== 'object') return;
  if (seen.has(value)) {
    issues.push(issue('core.object.metadata_cycle', 'Metadata contains a circular reference.', path));
    return;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    state.entries += value.length;
    if (state.entries > 50) {
      issues.push(issue('core.object.metadata_entry_limit', 'Metadata exceeds maximum entry count.', path));
      return;
    }
    value.forEach((entry, index) => validateMetadataValue(entry, `${path}.${index}`, issues, seen, state, depth + 1));
    return;
  }
  if (!isPlainObject(value)) {
    issues.push(issue('core.object.metadata_non_plain_object', 'Metadata contains a non-plain object.', path));
    return;
  }
  const entries = Object.entries(value);
  for (const [key] of entries) {
    if (isReservedMetadataInternalKey(key))
      issues.push(
        issue(
          'core.object.metadata_reserved_internal_key',
          'Metadata contains a reserved internal identifier key.',
          `${path}.${key}`
        )
      );
  }
  state.entries += entries.length;
  if (state.entries > 50) {
    issues.push(issue('core.object.metadata_entry_limit', 'Metadata exceeds maximum entry count.', path));
    return;
  }
  for (const [key, entry] of entries) validateMetadataValue(entry, `${path}.${key}`, issues, seen, state, depth + 1);
}

function validateMetadata(metadata: unknown, issues: CoreValidationIssue[]): void {
  if (metadata === undefined || metadata === null || Array.isArray(metadata) || typeof metadata !== 'object') {
    issues.push(issue('core.object.metadata_not_object', 'Core metadata must be a plain JSON object.', 'metadata'));
    return;
  }
  if (!isPlainObject(metadata)) {
    issues.push(issue('core.object.metadata_non_plain_object', 'Core metadata must be a plain JSON object.', 'metadata'));
    return;
  }
  validateMetadataValue(metadata, 'metadata', issues, new WeakSet<object>(), { entries: 0 }, 0);
}

function resolveRelatedReference(
  context: CoreMvpObjectValidationContext,
  referenceId: unknown,
  expectedObjectType: string,
  expectedDomain: string
): boolean {
  return (
    typeof referenceId === 'string' &&
    context.relatedReferenceRegistry.resolve({
      referenceId,
      expectedObjectType,
      expectedDomain
    }).ok
  );
}

function validateAudit(record: Record<string, unknown>, context: CoreMvpObjectValidationContext | undefined, issues: CoreValidationIssue[]): void {
  const audit = record.auditMetadata;
  if (!isPlainObject(audit)) {
    issues.push(issue('core.object.audit_missing', 'Audit metadata is required.', 'auditMetadata'));
    return;
  }
  for (const key of Object.keys(audit)) if (!isAuditKey(key)) issues.push(issue('core.object.audit_unknown_field', 'Unknown Audit metadata field.', `auditMetadata.${key}`));
  if (!validUtcTimestamp(audit.createdAt)) issues.push(issue('core.object.audit_created_at_invalid', 'createdAt must be a valid UTC timestamp.', 'auditMetadata.createdAt'));
  if (typeof audit.createdByReferenceId !== 'string' || audit.createdByReferenceId.length === 0) issues.push(issue('core.object.audit_created_by_missing', 'createdByReferenceId is required.', 'auditMetadata.createdByReferenceId'));
  else if (!context || !resolveRelatedReference(context, audit.createdByReferenceId, 'user-record', 'user')) issues.push(issue('core.object.audit_created_by_invalid', 'createdByReferenceId must resolve as a User reference.', 'auditMetadata.createdByReferenceId'));
  if (typeof audit.correlationId !== 'string' || !/^[a-z0-9][a-z0-9:_-]{2,127}$/.test(audit.correlationId)) issues.push(issue('core.object.audit_correlation_invalid', 'correlationId is invalid.', 'auditMetadata.correlationId'));
  const hasUpdatedAt = audit.updatedAt !== undefined;
  const hasUpdatedBy = audit.updatedByReferenceId !== undefined;
  if (hasUpdatedAt !== hasUpdatedBy) issues.push(issue('core.object.audit_update_pair_invalid', 'Update audit fields must be paired.', 'auditMetadata'));
  if (hasUpdatedAt && !validUtcTimestamp(audit.updatedAt)) issues.push(issue('core.object.audit_updated_at_invalid', 'updatedAt must be a valid UTC timestamp.', 'auditMetadata.updatedAt'));
  if (validUtcTimestamp(audit.createdAt) && validUtcTimestamp(audit.updatedAt) && new Date(audit.updatedAt).getTime() < new Date(audit.createdAt).getTime()) issues.push(issue('core.object.audit_time_order_invalid', 'updatedAt must not precede createdAt.', 'auditMetadata.updatedAt'));
  if (hasUpdatedBy && (!context || !resolveRelatedReference(context, audit.updatedByReferenceId, 'user-record', 'user'))) issues.push(issue('core.object.audit_updated_by_invalid', 'updatedByReferenceId must resolve as a User reference.', 'auditMetadata.updatedByReferenceId'));
}

function validateStatus(record: Record<string, unknown>, profile: CoreMvpObjectProfile, issues: CoreValidationIssue[]): void {
  if (profile.status === 'required' && record.status === undefined) issues.push(issue('core.object.status_required', 'Status is required.', 'status'));
  if (profile.status === 'not_applicable' && record.status !== undefined) issues.push(issue('core.object.status_not_applicable', 'Status is not applicable.', 'status'));
  if (record.status !== undefined && (typeof record.status !== 'string' || !statusKnown(record.status))) issues.push(issue('core.object.status_invalid', 'Status is invalid.', 'status'));
}

function validateVersion(record: Record<string, unknown>, profile: CoreMvpObjectProfile, issues: CoreValidationIssue[]): void {
  if (profile.version === 'required' && record.version === undefined) issues.push(issue('core.object.version_required', 'Version is required.', 'version'));
  if (profile.version === 'not_applicable' && record.version !== undefined) issues.push(issue('core.object.version_not_applicable', 'Version is not applicable.', 'version'));
  if (record.version === undefined) return;
  if (!isPlainObject(record.version)) {
    issues.push(issue('core.object.version_unsupported', 'Version is unsupported.', 'version'));
    return;
  }
  for (const key of Object.keys(record.version))
    if (!isVersionKey(key))
      issues.push(
        issue(
          'core.object.version_unknown_field',
          'Version contains an unknown field.',
          `version.${key}`
        )
      );
  try {
    createCoreObjectVersion({
      version: record.version.version as number,
      createdAt: record.version.createdAt as string,
      updatedAt: record.version.updatedAt as string | undefined
    });
  } catch {
    issues.push(issue('core.object.version_unsupported', 'Version is unsupported.', 'version'));
    return;
  }
  if (record.version.version !== 1 || !validUtcTimestamp(record.version.createdAt) || (record.version.updatedAt !== undefined && !validUtcTimestamp(record.version.updatedAt))) issues.push(issue('core.object.version_unsupported', 'Version is unsupported.', 'version'));
  if (validUtcTimestamp(record.version.createdAt) && validUtcTimestamp(record.version.updatedAt) && new Date(record.version.updatedAt).getTime() < new Date(record.version.createdAt).getTime()) issues.push(issue('core.object.version_time_order_invalid', 'Version updatedAt must not precede createdAt.', 'version.updatedAt'));
}

function validateVisibility(record: Record<string, unknown>, profile: CoreMvpObjectProfile, context: CoreMvpObjectValidationContext | undefined, issues: CoreValidationIssue[]): void {
  if (profile.visibility === 'required' && record.visibility === undefined) {
    issues.push(issue('core.object.visibility_required', 'Visibility metadata is required.', 'visibility'));
    return;
  }
  if (profile.visibility === 'not_applicable' && record.visibility !== undefined) {
    issues.push(issue('core.object.visibility_not_applicable', 'Visibility metadata is not applicable.', 'visibility'));
    return;
  }
  if (record.visibility === undefined) return;
  if (!isPlainObject(record.visibility)) {
    issues.push(issue('core.object.visibility_invalid', 'Visibility metadata is invalid.', 'visibility'));
    return;
  }
  for (const key of Object.keys(record.visibility)) if (!isVisibilityKey(key)) issues.push(issue('core.object.visibility_invalid', 'Unknown Visibility metadata field.', `visibility.${key}`));
  if (!context || !resolveRelatedReference(context, record.visibility.permissionScopeReferenceId, 'permission-record', 'permission')) issues.push(issue('core.object.permission_scope_invalid', 'Permission scope is invalid.', 'visibility.permissionScopeReferenceId'));
  if (!context || !resolveRelatedReference(context, record.visibility.policyScopeReferenceId, 'permission-policy-record', 'policy')) issues.push(issue('core.object.policy_scope_invalid', 'Policy scope is invalid.', 'visibility.policyScopeReferenceId'));
  if (record.visibility.organizationScopeReferenceId !== undefined && (!context || !resolveRelatedReference(context, record.visibility.organizationScopeReferenceId, 'organization-record', 'organization'))) issues.push(issue('core.object.organization_scope_invalid', 'Organization scope is invalid.', 'visibility.organizationScopeReferenceId'));
  if (record.visibility.actorScopeReferenceId !== undefined && (!context || !resolveRelatedReference(context, record.visibility.actorScopeReferenceId, 'user-record', 'user'))) issues.push(issue('core.object.actor_scope_invalid', 'Actor scope is invalid.', 'visibility.actorScopeReferenceId'));
}


export function validateCoreMvpObjectFieldApplicability(
  record: Record<string, unknown>,
  profile: CoreMvpObjectProfile,
  context?: CoreMvpObjectValidationContext
): CoreValidationResult {
  const issues: CoreValidationIssue[] = [];
  validateStatus(record, profile, issues);
  validateVersion(record, profile, issues);
  validateVisibility(record, profile, context, issues);
  return createCoreValidationResult(issues);
}

function cloneJson<T>(input: T): T {
  if (Array.isArray(input)) return input.map((entry) => cloneJson(entry)) as T;
  if (isPlainObject(input)) return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, cloneJson(value)])) as T;
  return input;
}

function deepFreeze<T>(input: T): T {
  if (typeof input !== 'object' || input === null) return input;
  for (const value of Object.values(input)) deepFreeze(value);
  return Object.freeze(input);
}

export function validateCoreMvpObjectBaseRecord(
  input: unknown,
  context?: CoreMvpObjectValidationContext
): CoreValidationResult {
  const issues: CoreValidationIssue[] = [];
  if (!isPlainObject(input)) return createCoreValidationResult([issue('core.object.record_invalid', 'Object base record must be a plain object.')]);
  const record = input;
  for (const key of Object.keys(record)) if (!isAllowedBaseRecordKey(key)) issues.push(issue('core.object.unknown_field', 'Unknown Object base field.', key));
  if (typeof record.publicReferenceId !== 'string' || record.publicReferenceId.length === 0) issues.push(issue('core.object.public_reference_missing', 'publicReferenceId is required.', 'publicReferenceId'));
  else if (/^\d+$/.test(record.publicReferenceId)) issues.push(issue('core.object.raw_database_id_forbidden', 'Raw numeric database IDs are forbidden.', 'publicReferenceId'));
  else if (!referencePatternMatches(record.publicReferenceId)) issues.push(issue('core.object.public_reference_invalid', 'publicReferenceId is invalid.', 'publicReferenceId'));
  if (typeof record.domainId !== 'string' || !domainKnown(record.domainId)) issues.push(issue('core.object.domain_mismatch', 'Domain ID is not recognized.', 'domainId'));
  const profile = profileFor(record);
  if (!profile) {
    issues.push(issue('core.object.profile_missing', 'Object profile is not registered.'));
  } else {
    if (record.objectContractId !== profile.objectContractId) issues.push(issue('core.object.contract_mismatch', 'Object contract ID mismatch.', 'objectContractId'));
    if (!context) issues.push(issue('core.object.reference_evidence_missing', 'A public Reference record is required for Object validation.', 'publicReferenceRecord'));
    else {
      const referenceIssue = validateCoreReferenceRecordForUse(context.publicReferenceRecord, profile.objectType, profile.domainId, record.publicReferenceId as string | undefined);
      if (referenceIssue) issues.push(referenceIssue);
    }
    validateStatus(record, profile, issues);
    validateVersion(record, profile, issues);
    validateVisibility(record, profile, context, issues);
  }
  validateMetadata(record.metadata, issues);
  validateAudit(record, context, issues);
  return createCoreValidationResult(issues);
}

export function createCoreMvpObjectBaseRecord(
  input: unknown,
  context?: CoreMvpObjectValidationContext
):
  | { readonly ok: true; readonly value: CoreMvpObjectBaseRecord }
  | { readonly ok: false; readonly issues: readonly CoreValidationIssue[] } {
  const result = validateCoreMvpObjectBaseRecord(input, context);
  if (!result.ok) return { ok: false, issues: result.issues };
  return {
    ok: true,
    value: deepFreeze(cloneJson(input as CoreMvpObjectBaseRecord))
  };
}

export const parseCoreMvpObjectBaseRecord = createCoreMvpObjectBaseRecord;

export function coreMvpObjectBaseRecordFieldNames(): readonly string[] {
  return [
    ...CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS,
    ...CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS
  ];
}
