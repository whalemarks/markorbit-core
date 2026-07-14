import {
  paginateCoreItems,
  type CoreEventTraceRecord,
  type CorePaginatedResult
} from '../../behaviors/core-event-pagination-behavior.ts';
import {
  enforceCoreGovernedAction,
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext,
  type CorePolicyContext
} from '../../behaviors/core-governance-behavior.ts';
import { CoreIdempotencyRegistry } from '../../behaviors/core-idempotency-behavior.ts';
import {
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../../behaviors/core-reference-behavior.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreErrorCategory,
  type CoreErrorCode
} from '../../behaviors/core-safe-error.ts';
import {
  CORE_DOMAIN_REGISTRY,
  type CoreDomainId
} from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  createCoreEventType,
  type CoreEventId
} from '../../events/index.ts';
import type { CoreMvpObjectBaseRecord } from '../../objects/core-mvp-object-base-record.ts';
import type { CoreObjectStatus } from '../../objects/core-object-status.ts';
import { validateCoreMvpObjectBaseRecord } from '../../objects/core-mvp-object-validation.ts';
import {
  createCoreObjectId,
  createCoreObjectType
} from '../../objects/index.ts';

export const CORE_EVIDENCE_TYPES = [
  'UseEvidence',
  'OwnershipEvidence',
  'PriorityEvidence',
  'DistinctivenessEvidence',
  'ReputationEvidence',
  'SalesEvidence',
  'AdvertisingEvidence',
  'OnlineUseEvidence',
  'PackagingEvidence',
  'ProductEvidence',
  'OfficialRecordEvidence',
  'CommunicationEvidence',
  'Other',
  'Unknown'
] as const;
export type CoreEvidenceType = (typeof CORE_EVIDENCE_TYPES)[number];

export const CORE_EVIDENCE_PURPOSES = [
  'ProofOfUse',
  'ProofOfOwnership',
  'ProofOfPriority',
  'ProofOfDistinctiveness',
  'ProofOfReputation',
  'ProofOfGoodsServicesUse',
  'ProofOfJurisdictionUse',
  'ResponseSupport',
  'OppositionSupport',
  'CancellationSupport',
  'RenewalSupport',
  'DeclarationSupport',
  'GeneralSupport',
  'Unknown'
] as const;
export type CoreEvidencePurpose = (typeof CORE_EVIDENCE_PURPOSES)[number];

export const CORE_EVIDENCE_STATUSES = [
  'Draft',
  'Collected',
  'ReviewRequired',
  'Reviewed',
  'Accepted',
  'Rejected',
  'Insufficient',
  'Filed',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreEvidenceStatus = (typeof CORE_EVIDENCE_STATUSES)[number];

export const CORE_EVIDENCE_REVIEW_STATUSES = [
  'Unreviewed',
  'AIReviewedDraft',
  'HumanReviewed',
  'AcceptedForUse',
  'Rejected',
  'NeedsMoreEvidence',
  'NeedsTranslation',
  'NeedsSourceVerification'
] as const;
export type CoreEvidenceReviewStatus =
  (typeof CORE_EVIDENCE_REVIEW_STATUSES)[number];

export type CoreEvidenceReviewDecisionStatus = Exclude<
  CoreEvidenceReviewStatus,
  'Unreviewed' | 'AIReviewedDraft'
>;

export const CORE_EVIDENCE_SOURCE_TYPES = [
  'ClientProvided',
  'AgentProvided',
  'OfficialOffice',
  'DocumentReference',
  'WebsiteSnapshot',
  'ECommerceListing',
  'ProductPhoto',
  'PackagingPhoto',
  'Invoice',
  'SalesRecord',
  'Advertisement',
  'SocialMediaPost',
  'InternalRecord',
  'ExternalReport',
  'Other',
  'Unknown'
] as const;
export type CoreEvidenceSourceType =
  (typeof CORE_EVIDENCE_SOURCE_TYPES)[number];

export const CORE_EVIDENCE_SOURCE_RELIABILITIES = [
  'Official',
  'ClientProvided',
  'AgentProvided',
  'PublicWeb',
  'Marketplace',
  'SocialMedia',
  'InternalRecord',
  'ThirdPartyReport',
  'Unknown'
] as const;
export type CoreEvidenceSourceReliability =
  (typeof CORE_EVIDENCE_SOURCE_RELIABILITIES)[number];

export const CORE_EVIDENCE_CONFIDENTIALITY_LEVELS = [
  'Public',
  'Internal',
  'Confidential',
  'HighlyConfidential',
  'Restricted',
  'Unknown'
] as const;
export type CoreEvidenceConfidentialityLevel =
  (typeof CORE_EVIDENCE_CONFIDENTIALITY_LEVELS)[number];

export const CORE_EVIDENCE_STATUS_TO_OBJECT_STATUS: Record<
  CoreEvidenceStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  Collected: 'draft',
  ReviewRequired: 'draft',
  Reviewed: 'active',
  Accepted: 'active',
  Rejected: 'inactive',
  Insufficient: 'inactive',
  Filed: 'active',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

export const CORE_EVIDENCE_IMPLEMENTED_OPERATIONS = [
  'createEvidence',
  'getEvidence',
  'listEvidence',
  'validateEvidenceReference',
  'linkEvidenceSource',
  'linkEvidenceClaim',
  'linkEvidenceDocument',
  'requireEvidenceReview',
  'reviewEvidence',
  'changeEvidenceStatus'
] as const;

export const CORE_EVIDENCE_MINIMUM_CAPABILITIES = [
  'create where required',
  'read where required',
  'search/list where required',
  'validate_reference',
  'basic status transition where required',
  'source reference linkage',
  'claim and purpose linkage',
  'document reference linkage',
  'human review gate',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'idempotency handling where duplicate-sensitive'
] as const;

export const CORE_EVIDENCE_COLLECTION_TARGET = 'evidence:collection';

const CONTRACT_ID = 'core-service-evidence-service-contract';
const EVIDENCE_OBJECT_TYPE = 'evidence-record';
const EVIDENCE_DOMAIN = 'evidence';
const EVIDENCE_OBJECT_CONTRACT_ID = 'core-object-evidence-record-contract';
const DOCUMENT_OBJECT_TYPE = 'document-record';
const DOCUMENT_DOMAIN = 'document';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const lifecycleTransitions = new Set([
  'Draft->Collected',
  'Accepted->Filed',
  'Accepted->Archived',
  'Rejected->Archived',
  'Insufficient->Archived',
  'Filed->Archived'
]);

const evidenceErrorCategories: Partial<
  Record<CoreErrorCode, CoreErrorCategory>
> = {
  EvidenceAlreadyExists: 'Conflict',
  EvidenceNotFound: 'Reference',
  InvalidEvidenceType: 'Validation',
  InvalidEvidencePurpose: 'Validation',
  InvalidEvidenceStatus: 'State',
  InvalidEvidenceReviewStatus: 'State',
  InvalidEvidenceSourceType: 'Validation',
  InvalidEvidenceSourceReliability: 'Validation',
  InvalidEvidenceConfidentialityLevel: 'Validation',
  InvalidEvidenceTransition: 'State',
  InvalidEvidenceReference: 'Reference',
  InvalidEvidenceSourceReference: 'Reference',
  InvalidEvidenceClaimReference: 'Reference',
  InvalidEvidenceDocumentReference: 'Reference',
  EvidencePurposeRequired: 'Validation',
  EvidenceSourceRequired: 'Validation',
  EvidenceSourceAlreadyLinked: 'Conflict',
  EvidenceClaimAlreadyLinked: 'Conflict',
  EvidenceDocumentAlreadyLinked: 'Conflict',
  EvidenceReviewNoteRequired: 'Validation',
  EvidenceReasonReferenceRequired: 'Validation',
  EvidenceObjectMismatch: 'Validation',
  PermissionDenied: 'Permission',
  PolicyRestricted: 'Policy',
  HumanReviewRequired: 'HumanReview',
  IdempotencyKeyRequired: 'Idempotency',
  IdempotencyKeyInvalid: 'Idempotency',
  IdempotencyConflict: 'Idempotency',
  EventTraceFailed: 'Event',
  AuditContextMissing: 'Validation',
  InternalError: 'Internal'
};

export interface CoreEvidenceSourceLink {
  readonly sourceType: CoreEvidenceSourceType;
  readonly sourceReferenceId: string;
}

export interface CoreEvidenceServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly evidenceType: CoreEvidenceType;
  readonly evidencePurpose: CoreEvidencePurpose;
  readonly evidenceStatus: CoreEvidenceStatus;
  readonly reviewStatus: CoreEvidenceReviewStatus;
  readonly confidentialityLevel: CoreEvidenceConfidentialityLevel;
  readonly sourceReliability: CoreEvidenceSourceReliability;
  readonly sourceLinks: readonly CoreEvidenceSourceLink[];
  readonly claimReferenceIds: readonly string[];
  readonly documentReferenceIds: readonly string[];
}

export interface CoreEvidenceGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreEvidenceServiceStore {
  get(evidenceReferenceId: string): CoreEvidenceServiceRecord | undefined;
  list(): readonly CoreEvidenceServiceRecord[];
  insert(
    record: CoreEvidenceServiceRecord
  ): CoreBehaviorResult<CoreEvidenceServiceRecord>;
  replace(
    record: CoreEvidenceServiceRecord
  ): CoreBehaviorResult<CoreEvidenceServiceRecord>;
  remove(evidenceReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreEvidenceEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreEvidenceRequestingServiceDirectoryEntry {
  readonly domainId: CoreDomainId;
  readonly serviceType: string;
}

export type CoreEvidenceMutationOperation =
  | 'createEvidence'
  | 'linkEvidenceSource'
  | 'linkEvidenceClaim'
  | 'linkEvidenceDocument'
  | 'requireEvidenceReview'
  | 'reviewEvidence'
  | 'changeEvidenceStatus';

export interface CoreEvidenceServiceDependencies {
  readonly store: CoreEvidenceServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreEvidenceEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly requestingServiceDirectory: readonly CoreEvidenceRequestingServiceDirectoryEntry[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: CoreEvidenceMutationOperation,
    evidenceReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
}

export interface CoreEvidenceListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly evidenceType: CoreEvidenceType;
  readonly evidencePurpose: CoreEvidencePurpose;
  readonly evidenceStatus: CoreEvidenceStatus;
  readonly reviewStatus: CoreEvidenceReviewStatus;
  readonly confidentialityLevel: CoreEvidenceConfidentialityLevel;
  readonly primarySourceType: CoreEvidenceSourceType;
  readonly sourceCount: number;
  readonly claimCount: number;
  readonly documentCount: number;
  readonly genericObjectStatus: CoreObjectStatus | undefined;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export type CoreEvidenceValidationReason =
  | 'Valid'
  | 'ReviewRequired'
  | 'NotFound'
  | 'InvalidReference'
  | 'Archived'
  | 'Rejected'
  | 'Insufficient'
  | 'ConfidentialityRestricted';

export type CoreEvidenceSufficiencyHint =
  | 'Accepted'
  | 'PendingProfessionalReview'
  | 'Insufficient'
  | 'Rejected'
  | 'Unknown';

export interface CoreEvidenceValidationResult {
  readonly isValid: boolean;
  readonly evidenceReferenceId: string;
  readonly evidenceType: CoreEvidenceType | null;
  readonly evidencePurpose: CoreEvidencePurpose | null;
  readonly evidenceStatus: CoreEvidenceStatus | null;
  readonly reviewStatus: CoreEvidenceReviewStatus | null;
  readonly sourceType: CoreEvidenceSourceType | null;
  readonly reasonCode: CoreEvidenceValidationReason;
  readonly reviewRequired: boolean;
  readonly sufficiencyHint: CoreEvidenceSufficiencyHint | null;
  readonly confidentialityHint: 'Visible' | 'Restricted' | null;
  readonly sourceLinked: boolean;
  readonly claimLinked: boolean;
  readonly documentLinked: boolean;
}

function safe<T = never>(
  code: CoreErrorCode,
  message: string,
  correlationId?: string
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({
      code,
      category: evidenceErrorCategories[code] ?? 'Validation',
      message,
      correlationId
    })
  };
}

function immutable<T>(value: T): T {
  const cloned = structuredClone(value);
  const freeze = (candidate: unknown): void => {
    if (typeof candidate !== 'object' || candidate === null) return;
    for (const nested of Object.values(candidate)) freeze(nested);
    Object.freeze(candidate);
  };
  freeze(cloned);
  return cloned;
}

function included<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function validUtcTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function organizationScopeOf(
  record: CoreEvidenceServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreEvidenceGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Evidence organization scope is not authorized.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

interface GovernanceExpectation {
  readonly operation: string;
  readonly permission: string;
  readonly policyScope: string;
  readonly target: string;
}

function ensureGovernance(
  context: CoreEvidenceGovernanceContext,
  expected: GovernanceExpectation
): CoreBehaviorResult<null> {
  const correlationId = context.correlationId;
  if (
    context.permission.correlationId !== correlationId ||
    context.policy.correlationId !== correlationId ||
    context.audit.correlationId !== correlationId
  ) {
    return safe(
      'ValidationFailed',
      'Correlation IDs must match.',
      correlationId
    );
  }
  if (
    context.permission.intendedOperation !== expected.operation ||
    !context.permission.requiredPermissionKeys.includes(expected.permission)
  ) {
    return safe(
      'PermissionDenied',
      'Required permission is missing.',
      correlationId
    );
  }
  if (
    context.policy.intendedOperation !== expected.operation ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope)
  ) {
    return safe(
      'PolicyRestricted',
      'Required policy scope is missing.',
      correlationId
    );
  }
  if (
    context.permission.actorReferenceId !== context.audit.actorReferenceId ||
    context.permission.permissionDecisionReferenceId !==
      context.audit.permissionDecisionReferenceId ||
    context.policy.policyDecisionReferenceId !==
      context.audit.policyDecisionReferenceId
  ) {
    return safe(
      'AuditContextMissing',
      'Governance audit linkage is invalid.',
      correlationId
    );
  }
  if (
    context.review.targetObjectType !== EVIDENCE_OBJECT_TYPE ||
    context.review.targetObjectReferenceId !== expected.target
  ) {
    return safe(
      'HumanReviewRequired',
      'Human Review target is invalid.',
      correlationId
    );
  }
  if (
    context.review.humanReviewRequired &&
    context.review.humanReviewReferenceId !==
      context.audit.humanReviewReferenceId
  ) {
    return safe(
      'HumanReviewRequired',
      'Human Review audit linkage is invalid.',
      correlationId
    );
  }
  if (
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== EVIDENCE_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Audit context is missing.',
      correlationId
    );
  }
  const governed = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  if (!governed.ok) return governed;
  return { ok: true, value: null };
}

function referenceMatches(
  supplied: CoreReferenceRecord,
  registered: CoreReferenceRecord
): boolean {
  return (
    supplied.referenceId === registered.referenceId &&
    supplied.objectType === registered.objectType &&
    supplied.referenceDomain === registered.referenceDomain &&
    supplied.status === registered.status
  );
}

function validateEvidenceReferenceRecord(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: EVIDENCE_OBJECT_TYPE,
    expectedDomain: EVIDENCE_DOMAIN
  });
  return resolved.ok
    ? resolved
    : safe('InvalidEvidenceReference', 'Evidence reference is invalid.');
}

function validateDocumentReferenceRecord(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: DOCUMENT_OBJECT_TYPE,
    expectedDomain: DOCUMENT_DOMAIN
  });
  return resolved.ok
    ? resolved
    : safe(
        'InvalidEvidenceDocumentReference',
        'Evidence Document reference is invalid.'
      );
}

function validateRequestingService(
  requestingDomain: string,
  requestingService: string,
  directory: readonly CoreEvidenceRequestingServiceDirectoryEntry[]
): CoreBehaviorResult<null> {
  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {
    return safe('InvalidEvidenceReference', 'Requesting Domain is invalid.');
  }
  const service = directory.find(
    (entry) =>
      entry.serviceType === requestingService &&
      entry.domainId === requestingDomain
  );
  return service
    ? { ok: true, value: null }
    : safe('InvalidEvidenceReference', 'Requesting Service is invalid.');
}

function idempotencyScope(
  governance: CoreEvidenceGovernanceContext,
  operation: string
): string {
  return [
    CONTRACT_ID,
    operation,
    governance.authorizedOrganizationReferenceId ??
      governance.permission.actorReferenceId ??
      'anonymous'
  ].join('|');
}

function eventTrace(input: {
  readonly id: CoreEventId;
  readonly type: string;
  readonly action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
  readonly evidenceReferenceId: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly auditContextReferenceId: string;
  readonly payload: Record<string, unknown>;
}): CoreEventTraceRecord {
  return {
    auditContextReferenceId: input.auditContextReferenceId,
    visibility: 'Internal',
    event: {
      id: input.id,
      type: createCoreEventType(input.type),
      action: input.action,
      domainId: EVIDENCE_DOMAIN,
      object: {
        id: createCoreObjectId(input.evidenceReferenceId),
        type: createCoreObjectType(EVIDENCE_OBJECT_TYPE),
        domainId: EVIDENCE_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

function validStatusReviewPair(
  status: CoreEvidenceStatus,
  reviewStatus: CoreEvidenceReviewStatus
): boolean {
  if (status === 'Draft' || status === 'Collected') {
    return reviewStatus === 'Unreviewed' || reviewStatus === 'AIReviewedDraft';
  }
  if (status === 'ReviewRequired') {
    return reviewStatus === 'Unreviewed' || reviewStatus === 'AIReviewedDraft';
  }
  if (status === 'Reviewed') return reviewStatus === 'HumanReviewed';
  if (status === 'Accepted') return reviewStatus === 'AcceptedForUse';
  if (status === 'Rejected') return reviewStatus === 'Rejected';
  if (status === 'Insufficient') {
    return (
      reviewStatus === 'NeedsMoreEvidence' ||
      reviewStatus === 'NeedsTranslation' ||
      reviewStatus === 'NeedsSourceVerification'
    );
  }
  if (status === 'Filed') return reviewStatus === 'AcceptedForUse';
  return true;
}

function uniqueStrings(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function sourceKey(link: CoreEvidenceSourceLink): string {
  return `${link.sourceType}|${link.sourceReferenceId}`;
}

function validateSourceLink(
  link: CoreEvidenceSourceLink,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreEvidenceSourceLink> {
  if (
    !included(CORE_EVIDENCE_SOURCE_TYPES, link.sourceType) ||
    link.sourceType === 'Unknown'
  ) {
    return safe(
      'InvalidEvidenceSourceType',
      'Evidence source type is invalid.'
    );
  }
  if (!controlledReference.test(link.sourceReferenceId)) {
    return safe(
      'InvalidEvidenceSourceReference',
      'Evidence source reference is invalid.'
    );
  }
  if (link.sourceType === 'DocumentReference') {
    const document = validateDocumentReferenceRecord(
      registry,
      link.sourceReferenceId
    );
    if (!document.ok) return document;
  }
  return { ok: true, value: immutable(link) };
}

function validateEvidenceRecord(
  record: CoreEvidenceServiceRecord,
  publicReferenceRecord: CoreReferenceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreEvidenceServiceRecord> {
  if (!included(CORE_EVIDENCE_TYPES, record.evidenceType)) {
    return safe('InvalidEvidenceType', 'Evidence type is invalid.');
  }
  if (!included(CORE_EVIDENCE_PURPOSES, record.evidencePurpose)) {
    return safe('InvalidEvidencePurpose', 'Evidence purpose is invalid.');
  }
  if (!included(CORE_EVIDENCE_STATUSES, record.evidenceStatus)) {
    return safe('InvalidEvidenceStatus', 'Evidence status is invalid.');
  }
  if (
    !included(CORE_EVIDENCE_REVIEW_STATUSES, record.reviewStatus) ||
    !validStatusReviewPair(record.evidenceStatus, record.reviewStatus)
  ) {
    return safe(
      'InvalidEvidenceReviewStatus',
      'Evidence review status is invalid.'
    );
  }
  if (
    !included(CORE_EVIDENCE_CONFIDENTIALITY_LEVELS, record.confidentialityLevel)
  ) {
    return safe(
      'InvalidEvidenceConfidentialityLevel',
      'Evidence confidentiality level is invalid.'
    );
  }
  if (!included(CORE_EVIDENCE_SOURCE_RELIABILITIES, record.sourceReliability)) {
    return safe(
      'InvalidEvidenceSourceReliability',
      'Evidence source reliability is invalid.'
    );
  }
  if (
    record.objectRecord.domainId !== EVIDENCE_DOMAIN ||
    record.objectRecord.objectType !== EVIDENCE_OBJECT_TYPE ||
    record.objectRecord.objectContractId !== EVIDENCE_OBJECT_CONTRACT_ID ||
    record.objectRecord.publicReferenceId !==
      publicReferenceRecord.referenceId ||
    record.objectRecord.status !==
      CORE_EVIDENCE_STATUS_TO_OBJECT_STATUS[record.evidenceStatus]
  ) {
    return safe(
      'EvidenceObjectMismatch',
      'Evidence Object foundation does not match.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    record.evidencePurpose === 'Unknown' &&
    record.claimReferenceIds.length === 0
  ) {
    return safe(
      'EvidencePurposeRequired',
      'Evidence requires a proof purpose or claim relationship.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (record.sourceLinks.length === 0) {
    return safe(
      'EvidenceSourceRequired',
      'Evidence requires at least one source.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  const sourceKeys = record.sourceLinks.map(sourceKey);
  if (!uniqueStrings(sourceKeys)) {
    return safe(
      'EvidenceSourceAlreadyLinked',
      'Evidence source links must be unique.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  for (const link of record.sourceLinks) {
    const validSource = validateSourceLink(link, registry);
    if (!validSource.ok) return validSource;
  }
  if (
    !uniqueStrings(record.claimReferenceIds) ||
    record.claimReferenceIds.some(
      (reference) => !controlledReference.test(reference)
    )
  ) {
    return safe(
      'InvalidEvidenceClaimReference',
      'Evidence claim references are invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!uniqueStrings(record.documentReferenceIds)) {
    return safe(
      'EvidenceDocumentAlreadyLinked',
      'Evidence Document references must be unique.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  for (const documentReferenceId of record.documentReferenceIds) {
    const validDocument = validateDocumentReferenceRecord(
      registry,
      documentReferenceId
    );
    if (!validDocument.ok) return validDocument;
  }
  const objectValidation = validateCoreMvpObjectBaseRecord(
    record.objectRecord,
    {
      publicReferenceRecord,
      relatedReferenceRegistry: registry
    }
  );
  if (!objectValidation.ok) {
    return safe(
      'ValidationFailed',
      'Evidence Object base record is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  return { ok: true, value: immutable(record) };
}

function validationResult(
  record: CoreEvidenceServiceRecord,
  restrictedFieldsOmitted: boolean
): CoreEvidenceValidationResult {
  const primarySource = record.sourceLinks[0];
  const base = {
    evidenceReferenceId: record.objectRecord.publicReferenceId,
    evidenceType: record.evidenceType,
    evidencePurpose: record.evidencePurpose,
    evidenceStatus: record.evidenceStatus,
    reviewStatus: record.reviewStatus,
    sourceType: primarySource?.sourceType ?? null,
    sourceLinked: record.sourceLinks.length > 0,
    claimLinked: record.claimReferenceIds.length > 0,
    documentLinked: record.documentReferenceIds.length > 0
  } as const;
  if (
    ['HighlyConfidential', 'Restricted'].includes(
      record.confidentialityLevel
    ) &&
    restrictedFieldsOmitted
  ) {
    return {
      ...base,
      isValid: false,
      reasonCode: 'ConfidentialityRestricted',
      reviewRequired: false,
      sufficiencyHint: null,
      confidentialityHint: 'Restricted'
    };
  }
  if (record.evidenceStatus === 'Archived') {
    return {
      ...base,
      isValid: false,
      reasonCode: 'Archived',
      reviewRequired: false,
      sufficiencyHint: 'Unknown',
      confidentialityHint: 'Visible'
    };
  }
  if (record.evidenceStatus === 'Rejected') {
    return {
      ...base,
      isValid: false,
      reasonCode: 'Rejected',
      reviewRequired: false,
      sufficiencyHint: 'Rejected',
      confidentialityHint: 'Visible'
    };
  }
  if (record.evidenceStatus === 'Insufficient') {
    return {
      ...base,
      isValid: false,
      reasonCode: 'Insufficient',
      reviewRequired: true,
      sufficiencyHint: 'Insufficient',
      confidentialityHint: 'Visible'
    };
  }
  if (record.evidenceStatus === 'DeletedReferenceOnly') {
    return {
      ...base,
      isValid: false,
      reasonCode: 'InvalidReference',
      reviewRequired: false,
      sufficiencyHint: 'Unknown',
      confidentialityHint: 'Visible'
    };
  }
  const accepted =
    (record.evidenceStatus === 'Accepted' ||
      record.evidenceStatus === 'Filed') &&
    record.reviewStatus === 'AcceptedForUse';
  return {
    ...base,
    isValid: true,
    reasonCode: accepted ? 'Valid' : 'ReviewRequired',
    reviewRequired: !accepted,
    sufficiencyHint: accepted ? 'Accepted' : 'PendingProfessionalReview',
    confidentialityHint: 'Visible'
  };
}

function updateObjectRecord(
  current: CoreEvidenceServiceRecord,
  now: string,
  actorReferenceId: string | null,
  evidenceStatus: CoreEvidenceStatus
): CoreBehaviorResult<CoreMvpObjectBaseRecord> {
  if (current.objectRecord.version === undefined) {
    return safe(
      'ValidationFailed',
      'Evidence Object version is required.',
      current.objectRecord.auditMetadata.correlationId
    );
  }
  return {
    ok: true,
    value: {
      ...current.objectRecord,
      status: CORE_EVIDENCE_STATUS_TO_OBJECT_STATUS[evidenceStatus],
      auditMetadata: {
        ...current.objectRecord.auditMetadata,
        updatedAt: now,
        updatedByReferenceId:
          actorReferenceId ??
          current.objectRecord.auditMetadata.createdByReferenceId
      },
      version: {
        ...current.objectRecord.version,
        updatedAt: now
      }
    }
  };
}

function recordMutable(status: CoreEvidenceStatus): boolean {
  return ![
    'Accepted',
    'Rejected',
    'Filed',
    'Archived',
    'DeletedReferenceOnly'
  ].includes(status);
}

export class CoreInMemoryEvidenceServiceStore implements CoreEvidenceServiceStore {
  readonly #records = new Map<string, CoreEvidenceServiceRecord>();

  get(id: string): CoreEvidenceServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreEvidenceServiceRecord[] {
    return [...this.#records.values()].map((record) => immutable(record));
  }

  insert(
    record: CoreEvidenceServiceRecord
  ): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id)) {
      return safe(
        'EvidenceAlreadyExists',
        'Evidence already exists.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreEvidenceServiceRecord
  ): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id)) {
      return safe(
        'EvidenceNotFound',
        'Evidence was not found.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(evidenceReferenceId: string): CoreBehaviorResult<null> {
    this.#records.delete(evidenceReferenceId);
    return { ok: true, value: null };
  }
}

export class CoreEvidenceService {
  constructor(readonly deps: CoreEvidenceServiceDependencies) {}

  createEvidence(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly evidenceType: unknown;
    readonly evidencePurpose: unknown;
    readonly evidenceStatus: unknown;
    readonly reviewStatus: unknown;
    readonly confidentialityLevel: unknown;
    readonly sourceReliability: unknown;
    readonly sourceType: unknown;
    readonly sourceReferenceId: string;
    readonly initialClaimReferenceId?: string | null;
    readonly initialDocumentReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.create',
      permission: 'evidence:create',
      policyScope: 'evidence.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (
      input.evidenceStatus !== 'Draft' ||
      input.reviewStatus !== 'Unreviewed'
    ) {
      return safe(
        'InvalidEvidenceStatus',
        'Evidence creation must start as Draft and Unreviewed.',
        input.governance.correlationId
      );
    }
    const registered = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.publicReferenceRecord.referenceId,
      expectedObjectType: EVIDENCE_OBJECT_TYPE,
      expectedDomain: EVIDENCE_DOMAIN
    });
    if (
      !registered.ok ||
      target !== input.publicReferenceRecord.referenceId ||
      !referenceMatches(input.publicReferenceRecord, registered.value)
    ) {
      return safe(
        'InvalidEvidenceReference',
        'Evidence reference is invalid.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createEvidence'),
        operationName: 'createEvidence',
        request: {
          objectRecord: input.objectRecord,
          publicReferenceRecord: input.publicReferenceRecord,
          evidenceType: input.evidenceType,
          evidencePurpose: input.evidencePurpose,
          evidenceStatus: input.evidenceStatus,
          reviewStatus: input.reviewStatus,
          confidentialityLevel: input.confidentialityLevel,
          sourceReliability: input.sourceReliability,
          sourceType: input.sourceType,
          sourceReferenceId: input.sourceReferenceId,
          initialClaimReferenceId: input.initialClaimReferenceId ?? null,
          initialDocumentReferenceId: input.initialDocumentReferenceId ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target)) {
          return safe(
            'EvidenceAlreadyExists',
            'Evidence already exists.',
            input.governance.correlationId
          );
        }
        const record: CoreEvidenceServiceRecord = {
          objectRecord: input.objectRecord,
          evidenceType: input.evidenceType as CoreEvidenceType,
          evidencePurpose: input.evidencePurpose as CoreEvidencePurpose,
          evidenceStatus: input.evidenceStatus as CoreEvidenceStatus,
          reviewStatus: input.reviewStatus as CoreEvidenceReviewStatus,
          confidentialityLevel:
            input.confidentialityLevel as CoreEvidenceConfidentialityLevel,
          sourceReliability:
            input.sourceReliability as CoreEvidenceSourceReliability,
          sourceLinks: [
            {
              sourceType: input.sourceType as CoreEvidenceSourceType,
              sourceReferenceId: input.sourceReferenceId
            }
          ],
          claimReferenceIds:
            input.initialClaimReferenceId === undefined ||
            input.initialClaimReferenceId === null
              ? []
              : [input.initialClaimReferenceId],
          documentReferenceIds:
            input.initialDocumentReferenceId === undefined ||
            input.initialDocumentReferenceId === null
              ? []
              : [input.initialDocumentReferenceId]
        };
        const valid = validateEvidenceRecord(
          record,
          input.publicReferenceRecord,
          this.deps.relatedReferenceRegistry
        );
        if (!valid.ok) return valid;
        const now = this.deps.now();
        if (!validUtcTimestamp(now)) {
          return safe(
            'ValidationFailed',
            'Clock value is invalid.',
            input.governance.correlationId
          );
        }
        let inserted: CoreBehaviorResult<CoreEvidenceServiceRecord>;
        try {
          inserted = this.deps.store.insert(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Evidence Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!inserted.ok) return inserted;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'createEvidence',
                target,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-created',
              action: CORE_EVENT_ACTIONS.created,
              evidenceReferenceId: target,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                evidenceReferenceId: target,
                evidenceType: valid.value.evidenceType,
                evidencePurpose: valid.value.evidencePurpose,
                evidenceStatus: valid.value.evidenceStatus,
                reviewStatus: valid.value.reviewStatus,
                sourceType: valid.value.sourceLinks[0]?.sourceType ?? null,
                sourceCount: valid.value.sourceLinks.length,
                claimCount: valid.value.claimReferenceIds.length,
                documentCount: valid.value.documentReferenceIds.length
              }
            })
          );
        } catch {
          event = safe('EventTraceFailed', 'Event trace failed.');
        }
        if (!event.ok) {
          const rollback = this.deps.store.remove(target);
          if (!rollback.ok) {
            return safe(
              'InternalError',
              'Evidence create rollback failed.',
              input.governance.correlationId
            );
          }
          return safe(
            'EventTraceFailed',
            'Event trace failed.',
            input.governance.correlationId
          );
        }
        return inserted;
      }
    );
    return idempotent.ok
      ? { ok: true, value: idempotent.value.result }
      : idempotent;
  }

  getEvidence(input: {
    readonly evidenceReferenceId: string;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.read',
      permission: 'evidence:read',
      policyScope: 'evidence.read',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateEvidenceReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.evidenceReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.evidenceReferenceId);
    if (!record) {
      return safe(
        'EvidenceNotFound',
        'Evidence was not found.',
        input.governance.correlationId
      );
    }
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scope.ok) return scope;
    return { ok: true, value: immutable(record) };
  }

  listEvidence(input: {
    readonly filters?: {
      readonly evidenceType?: unknown;
      readonly evidencePurpose?: unknown;
      readonly evidenceStatus?: unknown;
      readonly reviewStatus?: unknown;
      readonly confidentialityLevel?: unknown;
      readonly sourceType?: unknown;
      readonly publicReferenceId?: unknown;
      readonly claimLinked?: unknown;
      readonly documentLinked?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreEvidenceListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.list',
      permission: 'evidence:list',
      policyScope: 'evidence.list',
      target: CORE_EVIDENCE_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.evidenceType !== undefined &&
      !included(CORE_EVIDENCE_TYPES, input.filters.evidenceType)
    ) {
      return safe('InvalidEvidenceType', 'Evidence type filter is invalid.');
    }
    if (
      input.filters?.evidencePurpose !== undefined &&
      !included(CORE_EVIDENCE_PURPOSES, input.filters.evidencePurpose)
    ) {
      return safe(
        'InvalidEvidencePurpose',
        'Evidence purpose filter is invalid.'
      );
    }
    if (
      input.filters?.evidenceStatus !== undefined &&
      !included(CORE_EVIDENCE_STATUSES, input.filters.evidenceStatus)
    ) {
      return safe(
        'InvalidEvidenceStatus',
        'Evidence status filter is invalid.'
      );
    }
    if (
      input.filters?.reviewStatus !== undefined &&
      !included(CORE_EVIDENCE_REVIEW_STATUSES, input.filters.reviewStatus)
    ) {
      return safe(
        'InvalidEvidenceReviewStatus',
        'Evidence review filter is invalid.'
      );
    }
    if (
      input.filters?.confidentialityLevel !== undefined &&
      !included(
        CORE_EVIDENCE_CONFIDENTIALITY_LEVELS,
        input.filters.confidentialityLevel
      )
    ) {
      return safe(
        'InvalidEvidenceConfidentialityLevel',
        'Evidence confidentiality filter is invalid.'
      );
    }
    if (
      input.filters?.sourceType !== undefined &&
      !included(CORE_EVIDENCE_SOURCE_TYPES, input.filters.sourceType)
    ) {
      return safe(
        'InvalidEvidenceSourceType',
        'Evidence source-type filter is invalid.'
      );
    }
    if (
      input.filters?.publicReferenceId !== undefined &&
      (typeof input.filters.publicReferenceId !== 'string' ||
        !controlledReference.test(input.filters.publicReferenceId))
    ) {
      return safe(
        'InvalidEvidenceReference',
        'Evidence list reference filter is invalid.'
      );
    }
    for (const value of [
      input.filters?.claimLinked,
      input.filters?.documentLinked
    ]) {
      if (value !== undefined && typeof value !== 'boolean') {
        return safe(
          'ValidationFailed',
          'Evidence relationship filter is invalid.'
        );
      }
    }
    const items = this.deps.store
      .list()
      .filter(
        (record) =>
          organizationScopeOf(record) ===
          (input.governance.authorizedOrganizationReferenceId ?? null)
      )
      .filter(
        (record) =>
          (input.filters?.evidenceType === undefined ||
            record.evidenceType === input.filters.evidenceType) &&
          (input.filters?.evidencePurpose === undefined ||
            record.evidencePurpose === input.filters.evidencePurpose) &&
          (input.filters?.evidenceStatus === undefined ||
            record.evidenceStatus === input.filters.evidenceStatus) &&
          (input.filters?.reviewStatus === undefined ||
            record.reviewStatus === input.filters.reviewStatus) &&
          (input.filters?.confidentialityLevel === undefined ||
            record.confidentialityLevel ===
              input.filters.confidentialityLevel) &&
          (input.filters?.sourceType === undefined ||
            record.sourceLinks.some(
              (link) => link.sourceType === input.filters?.sourceType
            )) &&
          (input.filters?.publicReferenceId === undefined ||
            record.objectRecord.publicReferenceId ===
              input.filters.publicReferenceId) &&
          (input.filters?.claimLinked === undefined ||
            record.claimReferenceIds.length > 0 ===
              input.filters.claimLinked) &&
          (input.filters?.documentLinked === undefined ||
            record.documentReferenceIds.length > 0 ===
              input.filters.documentLinked)
      )
      .map((record): CoreEvidenceListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        evidenceType: record.evidenceType,
        evidencePurpose: record.evidencePurpose,
        evidenceStatus: record.evidenceStatus,
        reviewStatus: record.reviewStatus,
        confidentialityLevel: record.confidentialityLevel,
        primarySourceType: record.sourceLinks[0]?.sourceType ?? 'Unknown',
        sourceCount: record.sourceLinks.length,
        claimCount: record.claimReferenceIds.length,
        documentCount: record.documentReferenceIds.length,
        genericObjectStatus: record.objectRecord.status,
        createdAt: record.objectRecord.auditMetadata.createdAt,
        updatedAt: record.objectRecord.auditMetadata.updatedAt
      }));
    return paginateCoreItems(
      items,
      input.pagination ?? {},
      {
        permissionAllowed: true,
        policyAllowed: true,
        actorReferenceId: input.governance.permission.actorReferenceId,
        allowedSortFields: [
          'publicReferenceId',
          'evidenceType',
          'evidencePurpose',
          'evidenceStatus',
          'reviewStatus',
          'confidentialityLevel',
          'primarySourceType',
          'sourceCount',
          'claimCount',
          'documentCount'
        ],
        totalCountAllowed:
          input.governance.policy.restrictedFieldsOmitted === false,
        correlationId: input.governance.correlationId
      },
      {
        queryKey: JSON.stringify(input.filters ?? {}),
        cursorSecret: this.deps.cursorSecret,
        visible: () => true
      }
    );
  }

  validateEvidenceReference(input: {
    readonly evidenceReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.validate_reference',
      permission: 'evidence:validate_reference',
      policyScope: 'evidence.reference',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService,
      this.deps.requestingServiceDirectory
    );
    if (!requester.ok) return requester;
    const reference = validateEvidenceReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.evidenceReferenceId
    );
    if (!reference.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          evidenceReferenceId: input.evidenceReferenceId,
          evidenceType: null,
          evidencePurpose: null,
          evidenceStatus: null,
          reviewStatus: null,
          sourceType: null,
          reasonCode: 'InvalidReference',
          reviewRequired: false,
          sufficiencyHint: null,
          confidentialityHint: null,
          sourceLinked: false,
          claimLinked: false,
          documentLinked: false
        }
      };
    }
    const record = this.deps.store.get(input.evidenceReferenceId);
    if (
      !record ||
      organizationScopeOf(record) !==
        (input.governance.authorizedOrganizationReferenceId ?? null)
    ) {
      return {
        ok: true,
        value: {
          isValid: false,
          evidenceReferenceId: input.evidenceReferenceId,
          evidenceType: null,
          evidencePurpose: null,
          evidenceStatus: null,
          reviewStatus: null,
          sourceType: null,
          reasonCode: 'NotFound',
          reviewRequired: false,
          sufficiencyHint: null,
          confidentialityHint: null,
          sourceLinked: false,
          claimLinked: false,
          documentLinked: false
        }
      };
    }
    return {
      ok: true,
      value: immutable(
        validationResult(
          record,
          input.governance.policy.restrictedFieldsOmitted
        )
      )
    };
  }

  linkEvidenceSource(input: {
    readonly evidenceReferenceId: string;
    readonly sourceType: CoreEvidenceSourceType;
    readonly sourceReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.link_source',
      permission: 'evidence:link_source',
      policyScope: 'evidence.source',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    const source = validateSourceLink(
      {
        sourceType: input.sourceType,
        sourceReferenceId: input.sourceReferenceId
      },
      this.deps.relatedReferenceRegistry
    );
    if (!source.ok) return source;
    return this.mutate(
      {
        operationName: 'linkEvidenceSource',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: {
          sourceType: input.sourceType,
          sourceReferenceId: input.sourceReferenceId
        }
      },
      (current, now) => {
        if (!recordMutable(current.evidenceStatus)) {
          return safe(
            'InvalidEvidenceTransition',
            'Evidence source cannot change after professional finalization.',
            input.governance.correlationId
          );
        }
        if (
          current.sourceLinks.some(
            (link) => sourceKey(link) === sourceKey(source.value)
          )
        ) {
          return safe(
            'EvidenceSourceAlreadyLinked',
            'Evidence source is already linked.',
            input.governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          current.evidenceStatus
        );
        if (!objectRecord.ok) return objectRecord;
        const nextLinks = [...current.sourceLinks, source.value];
        return {
          ok: true,
          value: {
            record: {
              ...current,
              sourceLinks: nextLinks,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-updated',
            eventAction: CORE_EVENT_ACTIONS.updated,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              evidenceStatus: current.evidenceStatus,
              sourceType: input.sourceType,
              sourceCount: nextLinks.length
            }
          }
        };
      }
    );
  }

  linkEvidenceClaim(input: {
    readonly evidenceReferenceId: string;
    readonly claimReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.link_claim',
      permission: 'evidence:link_claim',
      policyScope: 'evidence.claim',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    if (!controlledReference.test(input.claimReferenceId)) {
      return safe(
        'InvalidEvidenceClaimReference',
        'Evidence claim reference is invalid.',
        input.governance.correlationId
      );
    }
    return this.mutate(
      {
        operationName: 'linkEvidenceClaim',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: { claimReferenceId: input.claimReferenceId }
      },
      (current, now) => {
        if (!recordMutable(current.evidenceStatus)) {
          return safe(
            'InvalidEvidenceTransition',
            'Evidence claim cannot change after professional finalization.',
            input.governance.correlationId
          );
        }
        if (current.claimReferenceIds.includes(input.claimReferenceId)) {
          return safe(
            'EvidenceClaimAlreadyLinked',
            'Evidence claim is already linked.',
            input.governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          current.evidenceStatus
        );
        if (!objectRecord.ok) return objectRecord;
        const nextClaims = [
          ...current.claimReferenceIds,
          input.claimReferenceId
        ];
        return {
          ok: true,
          value: {
            record: {
              ...current,
              claimReferenceIds: nextClaims,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-updated',
            eventAction: CORE_EVENT_ACTIONS.updated,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              evidenceStatus: current.evidenceStatus,
              claimCount: nextClaims.length
            }
          }
        };
      }
    );
  }

  linkEvidenceDocument(input: {
    readonly evidenceReferenceId: string;
    readonly documentReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.link_document',
      permission: 'evidence:link_document',
      policyScope: 'evidence.document',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    const document = validateDocumentReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.documentReferenceId
    );
    if (!document.ok) return document;
    return this.mutate(
      {
        operationName: 'linkEvidenceDocument',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: { documentReferenceId: input.documentReferenceId }
      },
      (current, now) => {
        if (!recordMutable(current.evidenceStatus)) {
          return safe(
            'InvalidEvidenceTransition',
            'Evidence Document cannot change after professional finalization.',
            input.governance.correlationId
          );
        }
        if (current.documentReferenceIds.includes(input.documentReferenceId)) {
          return safe(
            'EvidenceDocumentAlreadyLinked',
            'Evidence Document is already linked.',
            input.governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          current.evidenceStatus
        );
        if (!objectRecord.ok) return objectRecord;
        const nextDocuments = [
          ...current.documentReferenceIds,
          input.documentReferenceId
        ];
        return {
          ok: true,
          value: {
            record: {
              ...current,
              documentReferenceIds: nextDocuments,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-updated',
            eventAction: CORE_EVENT_ACTIONS.updated,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              evidenceStatus: current.evidenceStatus,
              documentCount: nextDocuments.length
            }
          }
        };
      }
    );
  }

  requireEvidenceReview(input: {
    readonly evidenceReferenceId: string;
    readonly reviewNoteReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.require_review',
      permission: 'evidence:require_review',
      policyScope: 'evidence.review',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reviewNoteReference)) {
      return safe(
        'EvidenceReviewNoteRequired',
        'Evidence review note reference is required.',
        input.governance.correlationId
      );
    }
    return this.mutate(
      {
        operationName: 'requireEvidenceReview',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: { reviewNoteReference: input.reviewNoteReference }
      },
      (current, now) => {
        if (
          !['Draft', 'Collected', 'Insufficient'].includes(
            current.evidenceStatus
          )
        ) {
          return safe(
            'InvalidEvidenceTransition',
            'Evidence cannot enter review from the current status.',
            input.governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          'ReviewRequired'
        );
        if (!objectRecord.ok) return objectRecord;
        const nextReviewStatus =
          current.reviewStatus === 'AIReviewedDraft'
            ? 'AIReviewedDraft'
            : 'Unreviewed';
        return {
          ok: true,
          value: {
            record: {
              ...current,
              evidenceStatus: 'ReviewRequired',
              reviewStatus: nextReviewStatus,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-status-changed',
            eventAction: CORE_EVENT_ACTIONS.requested,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              previousStatus: current.evidenceStatus,
              newStatus: 'ReviewRequired',
              reviewStatus: nextReviewStatus,
              sourceCount: current.sourceLinks.length,
              claimCount: current.claimReferenceIds.length,
              documentCount: current.documentReferenceIds.length
            }
          }
        };
      }
    );
  }

  reviewEvidence(input: {
    readonly evidenceReferenceId: string;
    readonly targetReviewStatus: CoreEvidenceReviewDecisionStatus;
    readonly reviewNoteReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.review',
      permission: 'evidence:review',
      policyScope: 'evidence.review',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reviewNoteReference)) {
      return safe(
        'EvidenceReviewNoteRequired',
        'Evidence review note reference is required.',
        input.governance.correlationId
      );
    }
    const requestedReviewStatus = String(input.targetReviewStatus);
    if (
      !included(CORE_EVIDENCE_REVIEW_STATUSES, requestedReviewStatus) ||
      requestedReviewStatus === 'Unreviewed' ||
      requestedReviewStatus === 'AIReviewedDraft'
    ) {
      return safe(
        'InvalidEvidenceReviewStatus',
        'Evidence review decision is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.governance.policy.policyDecision !== 'HumanReviewRequired' ||
      !input.governance.review.humanReviewRequired ||
      input.governance.review.reviewStatus !== 'Completed' ||
      input.governance.review.reviewDecision !== 'Approved' ||
      !input.governance.review.reviewerUserReferenceId
    ) {
      return safe(
        'HumanReviewRequired',
        'Completed human review is required.',
        input.governance.correlationId
      );
    }
    return this.mutate(
      {
        operationName: 'reviewEvidence',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: {
          targetReviewStatus: input.targetReviewStatus,
          reviewNoteReference: input.reviewNoteReference
        }
      },
      (current, now) => {
        if (current.evidenceStatus !== 'ReviewRequired') {
          return safe(
            'InvalidEvidenceTransition',
            'Evidence review requires ReviewRequired status.',
            input.governance.correlationId
          );
        }
        const statusByReview: Record<
          CoreEvidenceReviewDecisionStatus,
          CoreEvidenceStatus
        > = {
          HumanReviewed: 'Reviewed',
          AcceptedForUse: 'Accepted',
          Rejected: 'Rejected',
          NeedsMoreEvidence: 'Insufficient',
          NeedsTranslation: 'Insufficient',
          NeedsSourceVerification: 'Insufficient'
        };
        const targetStatus = statusByReview[input.targetReviewStatus];
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          targetStatus
        );
        if (!objectRecord.ok) return objectRecord;
        return {
          ok: true,
          value: {
            record: {
              ...current,
              evidenceStatus: targetStatus,
              reviewStatus: input.targetReviewStatus,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-updated',
            eventAction:
              input.targetReviewStatus === 'AcceptedForUse'
                ? CORE_EVENT_ACTIONS.approved
                : input.targetReviewStatus === 'Rejected'
                  ? CORE_EVENT_ACTIONS.rejected
                  : CORE_EVENT_ACTIONS.reviewed,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              previousStatus: current.evidenceStatus,
              newStatus: targetStatus,
              reviewStatus: input.targetReviewStatus,
              sourceCount: current.sourceLinks.length,
              claimCount: current.claimReferenceIds.length,
              documentCount: current.documentReferenceIds.length
            }
          }
        };
      }
    );
  }

  changeEvidenceStatus(input: {
    readonly evidenceReferenceId: string;
    readonly targetStatus: CoreEvidenceStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.change_status',
      permission: 'evidence:change_status',
      policyScope: 'evidence.lifecycle',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    if (!included(CORE_EVIDENCE_STATUSES, input.targetStatus)) {
      return safe(
        'InvalidEvidenceStatus',
        'Evidence target status is invalid.',
        input.governance.correlationId
      );
    }
    return this.mutate(
      {
        operationName: 'changeEvidenceStatus',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: {
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        }
      },
      (current, now) => {
        if (
          !lifecycleTransitions.has(
            `${current.evidenceStatus}->${input.targetStatus}`
          )
        ) {
          return safe(
            'InvalidEvidenceTransition',
            'Evidence status transition is invalid.',
            input.governance.correlationId
          );
        }
        if (
          input.targetStatus === 'Archived' &&
          (typeof input.reasonReference !== 'string' ||
            !opaque.test(input.reasonReference))
        ) {
          return safe(
            'EvidenceReasonReferenceRequired',
            'Evidence archive reason reference is required.',
            input.governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          input.targetStatus
        );
        if (!objectRecord.ok) return objectRecord;
        return {
          ok: true,
          value: {
            record: {
              ...current,
              evidenceStatus: input.targetStatus,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-status-changed',
            eventAction:
              input.targetStatus === 'Archived'
                ? CORE_EVENT_ACTIONS.archived
                : CORE_EVENT_ACTIONS.statusChanged,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              previousStatus: current.evidenceStatus,
              newStatus: input.targetStatus,
              reviewStatus: current.reviewStatus,
              reasonPresent: Boolean(input.reasonReference)
            }
          }
        };
      }
    );
  }

  private mutate(
    input: {
      readonly operationName: Exclude<
        CoreEvidenceMutationOperation,
        'createEvidence'
      >;
      readonly idempotencyKey?: string | null;
      readonly evidenceReferenceId: string;
      readonly governance: CoreEvidenceGovernanceContext;
      readonly request: Record<string, unknown>;
    },
    build: (
      current: CoreEvidenceServiceRecord,
      now: string
    ) => CoreBehaviorResult<{
      readonly record: CoreEvidenceServiceRecord;
      readonly eventType: string;
      readonly eventAction: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
      readonly eventPayload: Record<string, unknown>;
    }>
  ): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const reference = validateEvidenceReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.evidenceReferenceId
    );
    if (!reference.ok) return reference;
    const existing = this.deps.store.get(input.evidenceReferenceId);
    if (!existing) {
      return safe(
        'EvidenceNotFound',
        'Evidence was not found.',
        input.governance.correlationId
      );
    }
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(existing)
    );
    if (!scope.ok) return scope;
    const idempotent = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          input.operationName
        ),
        operationName: input.operationName,
        request: {
          evidenceReferenceId: input.evidenceReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const current = this.deps.store.get(input.evidenceReferenceId);
        if (!current) {
          return safe(
            'EvidenceNotFound',
            'Evidence was not found.',
            input.governance.correlationId
          );
        }
        const now = this.deps.now();
        if (
          !validUtcTimestamp(now) ||
          new Date(now).getTime() <
            new Date(current.objectRecord.auditMetadata.createdAt).getTime()
        ) {
          return safe(
            'ValidationFailed',
            'Clock value is invalid.',
            input.governance.correlationId
          );
        }
        const built = build(current, now);
        if (!built.ok) return built;
        const valid = validateEvidenceRecord(
          built.value.record,
          reference.value,
          this.deps.relatedReferenceRegistry
        );
        if (!valid.ok) return valid;
        let replaced: CoreBehaviorResult<CoreEvidenceServiceRecord>;
        try {
          replaced = this.deps.store.replace(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Evidence Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!replaced.ok) return replaced;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                input.operationName,
                input.evidenceReferenceId,
                input.idempotencyKey ?? ''
              ),
              type: built.value.eventType,
              action: built.value.eventAction,
              evidenceReferenceId: input.evidenceReferenceId,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: built.value.eventPayload
            })
          );
        } catch {
          event = safe('EventTraceFailed', 'Event trace failed.');
        }
        if (!event.ok) {
          const rollback = this.deps.store.replace(current);
          if (!rollback.ok) {
            return safe(
              'InternalError',
              'Evidence mutation rollback failed.',
              input.governance.correlationId
            );
          }
          return safe(
            'EventTraceFailed',
            'Event trace failed.',
            input.governance.correlationId
          );
        }
        return replaced;
      }
    );
    return idempotent.ok
      ? { ok: true, value: idempotent.value.result }
      : idempotent;
  }
}
