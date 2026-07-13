import { type CoreReferenceRecord, CoreReferenceRegistry } from '../behaviors/core-reference-behavior.ts';
import type { CoreContractId } from '../contracts/index.ts';
import type { CoreDomainId } from '../domains/index.ts';
import type { CoreObjectStatus } from './core-object-status.ts';
import type { CoreObjectType } from './core-object-type.ts';
import type { CoreObjectVersion } from './core-object-version.ts';

export type CoreJsonValue =
  | string
  | number
  | boolean
  | null
  | CoreJsonObject
  | readonly CoreJsonValue[];
export interface CoreJsonObject {
  readonly [key: string]: CoreJsonValue;
}

export interface CoreMvpObjectAuditMetadata {
  readonly createdAt: string;
  readonly createdByReferenceId: string;
  readonly updatedAt?: string;
  readonly updatedByReferenceId?: string;
  readonly correlationId: string;
}

export interface CoreMvpObjectVisibilityMetadata {
  readonly permissionScopeReferenceId: string;
  readonly policyScopeReferenceId: string;
  readonly organizationScopeReferenceId?: string;
  readonly actorScopeReferenceId?: string;
}

export interface CoreMvpObjectBaseRecord {
  readonly publicReferenceId: string;
  readonly objectType: CoreObjectType;
  readonly domainId: CoreDomainId;
  readonly objectContractId: CoreContractId;
  readonly status?: CoreObjectStatus;
  readonly version?: CoreObjectVersion;
  readonly metadata: CoreJsonObject;
  readonly auditMetadata: CoreMvpObjectAuditMetadata;
  readonly visibility?: CoreMvpObjectVisibilityMetadata;
}

export const CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS = [
  'publicReferenceId',
  'objectType',
  'domainId',
  'objectContractId',
  'metadata',
  'auditMetadata'
] as const;

export const CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS = [
  'status',
  'version',
  'visibility'
] as const;

export const CORE_MVP_OBJECT_BASE_RECORD_FIELDS = [
  ...CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS,
  ...CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS
] as const;

export interface CoreMvpObjectValidationContext {
  readonly publicReferenceRecord: CoreReferenceRecord;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
}

export const CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS: readonly CoreReferenceRecord[] = [
  {
    referenceId: 'user:ref:actor-0001',
    objectType: 'user-record',
    referenceDomain: 'user',
    status: 'Active'
  },
  {
    referenceId: 'permission:ref:scope-0001',
    objectType: 'permission-record',
    referenceDomain: 'permission',
    status: 'Active'
  },
  {
    referenceId: 'policy:ref:scope-0001',
    objectType: 'permission-policy-record',
    referenceDomain: 'policy',
    status: 'Active'
  },
  {
    referenceId: 'organization:ref:scope-0001',
    objectType: 'organization-record',
    referenceDomain: 'organization',
    status: 'Active'
  }
];

export const CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS: readonly CoreReferenceRecord[] = [
  {
    referenceId: 'identity:ref:00001',
    objectType: 'identity-record',
    referenceDomain: 'identity',
    status: 'Active'
  },
  {
    referenceId: 'organization:ref:00002',
    objectType: 'organization-record',
    referenceDomain: 'organization',
    status: 'Active'
  },
  {
    referenceId: 'user:ref:00003',
    objectType: 'user-record',
    referenceDomain: 'user',
    status: 'Active'
  },
  {
    referenceId: 'permission:ref:00004',
    objectType: 'permission-record',
    referenceDomain: 'permission',
    status: 'Active'
  },
  {
    referenceId: 'policy:ref:00005',
    objectType: 'permission-policy-record',
    referenceDomain: 'policy',
    status: 'Active'
  },
  {
    referenceId: 'customer:ref:00006',
    objectType: 'customer-record',
    referenceDomain: 'customer',
    status: 'Active'
  },
  {
    referenceId: 'brand:ref:00007',
    objectType: 'brand-record',
    referenceDomain: 'brand',
    status: 'Active'
  },
  {
    referenceId: 'trademark:ref:00008',
    objectType: 'trademark-record',
    referenceDomain: 'trademark',
    status: 'Active'
  },
  {
    referenceId: 'jurisdiction:ref:00009',
    objectType: 'jurisdiction-record',
    referenceDomain: 'jurisdiction',
    status: 'Active'
  },
  {
    referenceId: 'classification:ref:00010',
    objectType: 'classification-record',
    referenceDomain: 'classification',
    status: 'Active'
  },
  {
    referenceId: 'document:ref:00011',
    objectType: 'document-record',
    referenceDomain: 'document',
    status: 'Active'
  },
  {
    referenceId: 'evidence:ref:00012',
    objectType: 'evidence-record',
    referenceDomain: 'evidence',
    status: 'Active'
  },
  {
    referenceId: 'matter:ref:00013',
    objectType: 'matter-record',
    referenceDomain: 'matter',
    status: 'Active'
  },
  {
    referenceId: 'order:ref:00014',
    objectType: 'order-record',
    referenceDomain: 'order',
    status: 'Active'
  },
  {
    referenceId: 'workflow-contract:ref:00015',
    objectType: 'workflow-contract-record',
    referenceDomain: 'workflow-contract',
    status: 'Active'
  },
  {
    referenceId: 'task:ref:00016',
    objectType: 'task-record',
    referenceDomain: 'task',
    status: 'Active'
  },
  {
    referenceId: 'event:ref:00017',
    objectType: 'event-record',
    referenceDomain: 'event',
    status: 'Active'
  },
  {
    referenceId: 'communication:ref:00018',
    objectType: 'communication-record',
    referenceDomain: 'communication',
    status: 'Active'
  }
];

export const CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_REGISTRY =
  new CoreReferenceRegistry(CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS);

export const coreMvpObjectFixtureValidationContextFor = (
  publicReferenceId: string
): CoreMvpObjectValidationContext | undefined => {
  const publicReferenceRecord = CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
    (record) => record.referenceId === publicReferenceId
  );
  if (!publicReferenceRecord) return undefined;
  return {
    publicReferenceRecord,
    relatedReferenceRegistry: CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_REGISTRY
  };
};
