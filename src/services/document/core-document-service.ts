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

export const CORE_DOCUMENT_TYPES = [
  'PowerOfAttorney',
  'ApplicationForm',
  'OfficialNotice',
  'OfficeAction',
  'Certificate',
  'AssignmentDocument',
  'RenewalDocument',
  'ChangeDocument',
  'EvidenceMaterial',
  'ClientInstruction',
  'AgentInstruction',
  'Translation',
  'Draft',
  'Other',
  'Unknown'
] as const;
export type CoreDocumentType = (typeof CORE_DOCUMENT_TYPES)[number];

export const CORE_DOCUMENT_STATUSES = [
  'Draft',
  'Received',
  'Uploaded',
  'ReviewRequired',
  'Reviewed',
  'Approved',
  'Rejected',
  'Filed',
  'Issued',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreDocumentStatus = (typeof CORE_DOCUMENT_STATUSES)[number];

export const CORE_DOCUMENT_REVIEW_STATUSES = [
  'Unreviewed',
  'ReviewRequired',
  'HumanReviewed',
  'AIReviewedDraft',
  'ApprovedForUse',
  'Rejected',
  'NeedsRevision'
] as const;
export type CoreDocumentReviewStatus =
  (typeof CORE_DOCUMENT_REVIEW_STATUSES)[number];

export type CoreDocumentReviewDecisionStatus =
  'HumanReviewed' | 'ApprovedForUse' | 'Rejected' | 'NeedsRevision';

export const CORE_DOCUMENT_CONFIDENTIALITY_LEVELS = [
  'Public',
  'Internal',
  'Confidential',
  'HighlyConfidential',
  'Restricted',
  'Unknown'
] as const;
export type CoreDocumentConfidentialityLevel =
  (typeof CORE_DOCUMENT_CONFIDENTIALITY_LEVELS)[number];

export const CORE_DOCUMENT_STATUS_TO_OBJECT_STATUS: Record<
  CoreDocumentStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  Received: 'draft',
  Uploaded: 'draft',
  ReviewRequired: 'draft',
  Reviewed: 'active',
  Approved: 'active',
  Rejected: 'inactive',
  Filed: 'active',
  Issued: 'active',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

export const CORE_DOCUMENT_IMPLEMENTED_OPERATIONS = [
  'createDocument',
  'getDocument',
  'listDocuments',
  'validateDocumentReference',
  'linkDocumentFile',
  'requireDocumentReview',
  'reviewDocument',
  'changeDocumentStatus'
] as const;

export const CORE_DOCUMENT_MINIMUM_CAPABILITIES = [
  'create where required',
  'read where required',
  'search/list where required',
  'validate_reference',
  'basic status transition where required',
  'file reference linkage',
  'human review gate',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'idempotency handling where duplicate-sensitive'
] as const;

export const CORE_DOCUMENT_COLLECTION_TARGET = 'document:collection';

const CONTRACT_ID = 'core-service-document-service-contract';
const DOCUMENT_OBJECT_TYPE = 'document-record';
const DOCUMENT_DOMAIN = 'document';
const DOCUMENT_OBJECT_CONTRACT_ID = 'core-object-document-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const lifecycleTransitions = new Set([
  'Draft->Received',
  'Received->Uploaded',
  'Approved->Archived',
  'Rejected->Archived'
]);

const documentErrorCategories: Partial<
  Record<CoreErrorCode, CoreErrorCategory>
> = {
  DocumentAlreadyExists: 'Conflict',
  DocumentNotFound: 'Reference',
  InvalidDocumentType: 'Validation',
  InvalidDocumentStatus: 'State',
  InvalidDocumentReviewStatus: 'State',
  InvalidDocumentConfidentialityLevel: 'Validation',
  InvalidDocumentTransition: 'State',
  InvalidDocumentReference: 'Reference',
  DocumentTitleRequired: 'Validation',
  DocumentSourceReferenceRequired: 'Validation',
  DocumentFileReferenceRequired: 'Validation',
  DocumentFileAlreadyLinked: 'Conflict',
  DocumentReviewNoteRequired: 'Validation',
  DocumentReasonReferenceRequired: 'Validation',
  DocumentObjectMismatch: 'Validation',
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

export interface CoreDocumentServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly documentType: CoreDocumentType;
  readonly titleReference: string;
  readonly documentStatus: CoreDocumentStatus;
  readonly reviewStatus: CoreDocumentReviewStatus;
  readonly confidentialityLevel: CoreDocumentConfidentialityLevel;
  readonly fileReferenceId?: string | null;
  readonly fileSourceReference?: string | null;
  readonly versionReference?: string | null;
  readonly sourceReference: string;
}

export interface CoreDocumentGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreDocumentServiceStore {
  get(documentReferenceId: string): CoreDocumentServiceRecord | undefined;
  list(): readonly CoreDocumentServiceRecord[];
  insert(
    record: CoreDocumentServiceRecord
  ): CoreBehaviorResult<CoreDocumentServiceRecord>;
  replace(
    record: CoreDocumentServiceRecord
  ): CoreBehaviorResult<CoreDocumentServiceRecord>;
  remove(documentReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreDocumentEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreDocumentRequestingServiceDirectoryEntry {
  readonly domainId: CoreDomainId;
  readonly serviceType: string;
}

export type CoreDocumentMutationOperation =
  | 'createDocument'
  | 'linkDocumentFile'
  | 'requireDocumentReview'
  | 'reviewDocument'
  | 'changeDocumentStatus';

export interface CoreDocumentServiceDependencies {
  readonly store: CoreDocumentServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreDocumentEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly requestingServiceDirectory: readonly CoreDocumentRequestingServiceDirectoryEntry[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: CoreDocumentMutationOperation,
    documentReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
}

export interface CoreDocumentListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly documentType: CoreDocumentType;
  readonly documentStatus: CoreDocumentStatus;
  readonly reviewStatus: CoreDocumentReviewStatus;
  readonly confidentialityLevel: CoreDocumentConfidentialityLevel;
  readonly fileLinked: boolean;
  readonly versionReferencePresent: boolean;
  readonly genericObjectStatus: CoreObjectStatus | undefined;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export type CoreDocumentValidationReason =
  | 'Valid'
  | 'ReviewRequired'
  | 'NotFound'
  | 'InvalidReference'
  | 'Archived'
  | 'Rejected'
  | 'ConfidentialityRestricted';

export interface CoreDocumentValidationResult {
  readonly isValid: boolean;
  readonly documentReferenceId: string;
  readonly documentType: CoreDocumentType | null;
  readonly documentStatus: CoreDocumentStatus | null;
  readonly reviewStatus: CoreDocumentReviewStatus | null;
  readonly versionReference: string | null;
  readonly reasonCode: CoreDocumentValidationReason;
  readonly reviewRequired: boolean;
  readonly confidentialityHint: 'Visible' | 'Restricted' | null;
  readonly fileLinked: boolean;
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
      category: documentErrorCategories[code] ?? 'Validation',
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
  record: CoreDocumentServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreDocumentGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Document organization scope is not authorized.',
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
  context: CoreDocumentGovernanceContext,
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
    context.review.targetObjectType !== DOCUMENT_OBJECT_TYPE ||
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
    context.audit.targetObjectType !== DOCUMENT_OBJECT_TYPE ||
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
    : safe('InvalidDocumentReference', 'Document reference is invalid.');
}

function validateRequestingService(
  requestingDomain: string,
  requestingService: string,
  directory: readonly CoreDocumentRequestingServiceDirectoryEntry[]
): CoreBehaviorResult<null> {
  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {
    return safe('InvalidDocumentReference', 'Requesting Domain is invalid.');
  }
  const service = directory.find(
    (entry) =>
      entry.serviceType === requestingService &&
      entry.domainId === requestingDomain
  );
  return service
    ? { ok: true, value: null }
    : safe('InvalidDocumentReference', 'Requesting Service is invalid.');
}

function idempotencyScope(
  governance: CoreDocumentGovernanceContext,
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
  readonly documentReferenceId: string;
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
      domainId: DOCUMENT_DOMAIN,
      object: {
        id: createCoreObjectId(input.documentReferenceId),
        type: createCoreObjectType(DOCUMENT_OBJECT_TYPE),
        domainId: DOCUMENT_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

function validStatusReviewPair(
  status: CoreDocumentStatus,
  reviewStatus: CoreDocumentReviewStatus
): boolean {
  if (['Draft', 'Received', 'Uploaded'].includes(status)) {
    return reviewStatus === 'Unreviewed' || reviewStatus === 'AIReviewedDraft';
  }
  if (status === 'ReviewRequired') {
    return (
      reviewStatus === 'ReviewRequired' || reviewStatus === 'NeedsRevision'
    );
  }
  if (status === 'Reviewed') return reviewStatus === 'HumanReviewed';
  if (status === 'Approved') return reviewStatus === 'ApprovedForUse';
  if (status === 'Rejected') return reviewStatus === 'Rejected';
  if (status === 'Filed' || status === 'Issued') {
    return reviewStatus === 'ApprovedForUse';
  }
  return true;
}

function validateDocumentRecord(
  record: CoreDocumentServiceRecord,
  publicReferenceRecord: CoreReferenceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreDocumentServiceRecord> {
  if (!included(CORE_DOCUMENT_TYPES, record.documentType)) {
    return safe('InvalidDocumentType', 'Document type is invalid.');
  }
  if (!included(CORE_DOCUMENT_STATUSES, record.documentStatus)) {
    return safe('InvalidDocumentStatus', 'Document status is invalid.');
  }
  if (
    !included(CORE_DOCUMENT_REVIEW_STATUSES, record.reviewStatus) ||
    !validStatusReviewPair(record.documentStatus, record.reviewStatus)
  ) {
    return safe(
      'InvalidDocumentReviewStatus',
      'Document review status is invalid.'
    );
  }
  if (
    !included(CORE_DOCUMENT_CONFIDENTIALITY_LEVELS, record.confidentialityLevel)
  ) {
    return safe(
      'InvalidDocumentConfidentialityLevel',
      'Document confidentiality level is invalid.'
    );
  }
  if (
    record.objectRecord.domainId !== DOCUMENT_DOMAIN ||
    record.objectRecord.objectType !== DOCUMENT_OBJECT_TYPE ||
    record.objectRecord.objectContractId !== DOCUMENT_OBJECT_CONTRACT_ID ||
    record.objectRecord.publicReferenceId !==
      publicReferenceRecord.referenceId ||
    record.objectRecord.status !==
      CORE_DOCUMENT_STATUS_TO_OBJECT_STATUS[record.documentStatus]
  ) {
    return safe(
      'DocumentObjectMismatch',
      'Document Object foundation does not match.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!opaque.test(record.titleReference)) {
    return safe(
      'DocumentTitleRequired',
      'Document title reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!opaque.test(record.sourceReference)) {
    return safe(
      'DocumentSourceReferenceRequired',
      'Document source reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  const hasFile =
    record.fileReferenceId !== undefined && record.fileReferenceId !== null;
  const hasFileSource =
    record.fileSourceReference !== undefined &&
    record.fileSourceReference !== null;
  if (
    hasFile !== hasFileSource ||
    (hasFile &&
      (!controlledReference.test(record.fileReferenceId ?? '') ||
        !opaque.test(record.fileSourceReference ?? '')))
  ) {
    return safe(
      'DocumentFileReferenceRequired',
      'Document file reference and source must be linked together.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    record.versionReference !== undefined &&
    record.versionReference !== null &&
    !opaque.test(record.versionReference)
  ) {
    return safe(
      'ValidationFailed',
      'Document version reference is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
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
      'Document Object base record is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  return { ok: true, value: immutable(record) };
}

function validationResult(
  record: CoreDocumentServiceRecord,
  restrictedFieldsOmitted: boolean
): CoreDocumentValidationResult {
  const base = {
    documentReferenceId: record.objectRecord.publicReferenceId,
    documentType: record.documentType,
    documentStatus: record.documentStatus,
    reviewStatus: record.reviewStatus,
    versionReference: record.versionReference ?? null,
    fileLinked: Boolean(record.fileReferenceId)
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
      confidentialityHint: 'Restricted'
    };
  }
  if (record.documentStatus === 'Archived') {
    return {
      ...base,
      isValid: false,
      reasonCode: 'Archived',
      reviewRequired: false,
      confidentialityHint: 'Visible'
    };
  }
  if (
    record.documentStatus === 'DeletedReferenceOnly' ||
    record.documentStatus === 'Rejected'
  ) {
    return {
      ...base,
      isValid: false,
      reasonCode:
        record.documentStatus === 'Rejected' ? 'Rejected' : 'InvalidReference',
      reviewRequired: false,
      confidentialityHint: 'Visible'
    };
  }
  const reviewRequired =
    record.documentStatus !== 'Approved' ||
    record.reviewStatus !== 'ApprovedForUse';
  return {
    ...base,
    isValid: true,
    reasonCode: reviewRequired ? 'ReviewRequired' : 'Valid',
    reviewRequired,
    confidentialityHint: 'Visible'
  };
}

function updateObjectRecord(
  current: CoreDocumentServiceRecord,
  now: string,
  actorReferenceId: string | null,
  documentStatus: CoreDocumentStatus
): CoreBehaviorResult<CoreMvpObjectBaseRecord> {
  if (current.objectRecord.version === undefined) {
    return safe(
      'ValidationFailed',
      'Document Object version is required.',
      current.objectRecord.auditMetadata.correlationId
    );
  }
  return {
    ok: true,
    value: {
      ...current.objectRecord,
      status: CORE_DOCUMENT_STATUS_TO_OBJECT_STATUS[documentStatus],
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

export class CoreInMemoryDocumentServiceStore implements CoreDocumentServiceStore {
  readonly #records = new Map<string, CoreDocumentServiceRecord>();

  get(id: string): CoreDocumentServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreDocumentServiceRecord[] {
    return [...this.#records.values()].map((record) => immutable(record));
  }

  insert(
    record: CoreDocumentServiceRecord
  ): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id)) {
      return safe(
        'DocumentAlreadyExists',
        'Document already exists.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreDocumentServiceRecord
  ): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id)) {
      return safe(
        'DocumentNotFound',
        'Document was not found.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(documentReferenceId: string): CoreBehaviorResult<null> {
    this.#records.delete(documentReferenceId);
    return { ok: true, value: null };
  }
}

export class CoreDocumentService {
  constructor(readonly deps: CoreDocumentServiceDependencies) {}

  createDocument(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly documentType: unknown;
    readonly titleReference: string;
    readonly documentStatus: unknown;
    readonly reviewStatus: unknown;
    readonly confidentialityLevel: unknown;
    readonly versionReference?: string | null;
    readonly sourceReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'document.create',
      permission: 'document:create',
      policyScope: 'document.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (
      input.documentStatus !== 'Draft' ||
      input.reviewStatus !== 'Unreviewed'
    ) {
      return safe(
        'InvalidDocumentStatus',
        'Document creation must start as Draft and Unreviewed.',
        input.governance.correlationId
      );
    }
    const registered = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.publicReferenceRecord.referenceId,
      expectedObjectType: DOCUMENT_OBJECT_TYPE,
      expectedDomain: DOCUMENT_DOMAIN
    });
    if (
      !registered.ok ||
      target !== input.publicReferenceRecord.referenceId ||
      !referenceMatches(input.publicReferenceRecord, registered.value)
    ) {
      return safe(
        'InvalidDocumentReference',
        'Document reference is invalid.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createDocument'),
        operationName: 'createDocument',
        request: {
          objectRecord: input.objectRecord,
          publicReferenceRecord: input.publicReferenceRecord,
          documentType: input.documentType,
          titleReference: input.titleReference,
          documentStatus: input.documentStatus,
          reviewStatus: input.reviewStatus,
          confidentialityLevel: input.confidentialityLevel,
          versionReference: input.versionReference ?? null,
          sourceReference: input.sourceReference
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target)) {
          return safe(
            'DocumentAlreadyExists',
            'Document already exists.',
            input.governance.correlationId
          );
        }
        const record: CoreDocumentServiceRecord = {
          objectRecord: input.objectRecord,
          documentType: input.documentType as CoreDocumentType,
          titleReference: input.titleReference,
          documentStatus: input.documentStatus as CoreDocumentStatus,
          reviewStatus: input.reviewStatus as CoreDocumentReviewStatus,
          confidentialityLevel:
            input.confidentialityLevel as CoreDocumentConfidentialityLevel,
          fileReferenceId: null,
          fileSourceReference: null,
          versionReference: input.versionReference ?? null,
          sourceReference: input.sourceReference
        };
        const valid = validateDocumentRecord(
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
        let inserted: CoreBehaviorResult<CoreDocumentServiceRecord>;
        try {
          inserted = this.deps.store.insert(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Document Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!inserted.ok) return inserted;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'createDocument',
                target,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-created',
              action: CORE_EVENT_ACTIONS.created,
              documentReferenceId: target,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                documentReferenceId: target,
                documentType: valid.value.documentType,
                documentStatus: valid.value.documentStatus,
                reviewStatus: valid.value.reviewStatus,
                confidentialityLevel: valid.value.confidentialityLevel,
                fileLinked: false
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
              'Document create rollback failed.',
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

  getDocument(input: {
    readonly documentReferenceId: string;
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'document.read',
      permission: 'document:read',
      policyScope: 'document.read',
      target: input.documentReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateDocumentReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.documentReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.documentReferenceId);
    if (!record) {
      return safe(
        'DocumentNotFound',
        'Document was not found.',
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

  listDocuments(input: {
    readonly filters?: {
      readonly documentType?: unknown;
      readonly documentStatus?: unknown;
      readonly reviewStatus?: unknown;
      readonly confidentialityLevel?: unknown;
      readonly publicReferenceId?: unknown;
      readonly fileLinked?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreDocumentListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'document.list',
      permission: 'document:list',
      policyScope: 'document.list',
      target: CORE_DOCUMENT_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.documentType !== undefined &&
      !included(CORE_DOCUMENT_TYPES, input.filters.documentType)
    ) {
      return safe('InvalidDocumentType', 'Document type filter is invalid.');
    }
    if (
      input.filters?.documentStatus !== undefined &&
      !included(CORE_DOCUMENT_STATUSES, input.filters.documentStatus)
    ) {
      return safe(
        'InvalidDocumentStatus',
        'Document status filter is invalid.'
      );
    }
    if (
      input.filters?.reviewStatus !== undefined &&
      !included(CORE_DOCUMENT_REVIEW_STATUSES, input.filters.reviewStatus)
    ) {
      return safe(
        'InvalidDocumentReviewStatus',
        'Document review filter is invalid.'
      );
    }
    if (
      input.filters?.confidentialityLevel !== undefined &&
      !included(
        CORE_DOCUMENT_CONFIDENTIALITY_LEVELS,
        input.filters.confidentialityLevel
      )
    ) {
      return safe(
        'InvalidDocumentConfidentialityLevel',
        'Document confidentiality filter is invalid.'
      );
    }
    if (
      input.filters?.publicReferenceId !== undefined &&
      (typeof input.filters.publicReferenceId !== 'string' ||
        !controlledReference.test(input.filters.publicReferenceId))
    ) {
      return safe(
        'InvalidDocumentReference',
        'Document list reference filter is invalid.'
      );
    }
    if (
      input.filters?.fileLinked !== undefined &&
      typeof input.filters.fileLinked !== 'boolean'
    ) {
      return safe(
        'DocumentFileReferenceRequired',
        'Document file-linked filter is invalid.'
      );
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
          (input.filters?.documentType === undefined ||
            record.documentType === input.filters.documentType) &&
          (input.filters?.documentStatus === undefined ||
            record.documentStatus === input.filters.documentStatus) &&
          (input.filters?.reviewStatus === undefined ||
            record.reviewStatus === input.filters.reviewStatus) &&
          (input.filters?.confidentialityLevel === undefined ||
            record.confidentialityLevel ===
              input.filters.confidentialityLevel) &&
          (input.filters?.publicReferenceId === undefined ||
            record.objectRecord.publicReferenceId ===
              input.filters.publicReferenceId) &&
          (input.filters?.fileLinked === undefined ||
            Boolean(record.fileReferenceId) === input.filters.fileLinked)
      )
      .map((record): CoreDocumentListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        documentType: record.documentType,
        documentStatus: record.documentStatus,
        reviewStatus: record.reviewStatus,
        confidentialityLevel: record.confidentialityLevel,
        fileLinked: Boolean(record.fileReferenceId),
        versionReferencePresent: Boolean(record.versionReference),
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
          'documentType',
          'documentStatus',
          'reviewStatus',
          'confidentialityLevel',
          'fileLinked'
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

  validateDocumentReference(input: {
    readonly documentReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CoreDocumentValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'document.validate_reference',
      permission: 'document:validate_reference',
      policyScope: 'document.reference',
      target: input.documentReferenceId
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService,
      this.deps.requestingServiceDirectory
    );
    if (!requester.ok) return requester;
    const reference = validateDocumentReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.documentReferenceId
    );
    if (!reference.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          documentReferenceId: input.documentReferenceId,
          documentType: null,
          documentStatus: null,
          reviewStatus: null,
          versionReference: null,
          reasonCode: 'InvalidReference',
          reviewRequired: false,
          confidentialityHint: null,
          fileLinked: false
        }
      };
    }
    const record = this.deps.store.get(input.documentReferenceId);
    if (
      !record ||
      organizationScopeOf(record) !==
        (input.governance.authorizedOrganizationReferenceId ?? null)
    ) {
      return {
        ok: true,
        value: {
          isValid: false,
          documentReferenceId: input.documentReferenceId,
          documentType: null,
          documentStatus: null,
          reviewStatus: null,
          versionReference: null,
          reasonCode: 'NotFound',
          reviewRequired: false,
          confidentialityHint: null,
          fileLinked: false
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

  linkDocumentFile(input: {
    readonly documentReferenceId: string;
    readonly fileReferenceId: string;
    readonly fileSourceReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'document.link_file',
      permission: 'document:link_file',
      policyScope: 'document.file',
      target: input.documentReferenceId
    });
    if (!governed.ok) return governed;
    if (
      !controlledReference.test(input.fileReferenceId) ||
      !opaque.test(input.fileSourceReference)
    ) {
      return safe(
        'DocumentFileReferenceRequired',
        'Document file reference and source are required.',
        input.governance.correlationId
      );
    }
    return this.mutate(
      {
        operationName: 'linkDocumentFile',
        idempotencyKey: input.idempotencyKey,
        documentReferenceId: input.documentReferenceId,
        governance: input.governance,
        request: {
          fileReferenceId: input.fileReferenceId,
          fileSourceReference: input.fileSourceReference
        }
      },
      (current, now) => {
        if (
          current.fileReferenceId !== undefined &&
          current.fileReferenceId !== null &&
          (current.fileReferenceId !== input.fileReferenceId ||
            current.fileSourceReference !== input.fileSourceReference)
        ) {
          return safe(
            'DocumentFileAlreadyLinked',
            'Document already has a different file reference.',
            input.governance.correlationId
          );
        }
        if (
          !['Draft', 'Received', 'Uploaded'].includes(current.documentStatus)
        ) {
          return safe(
            'InvalidDocumentTransition',
            'Document file cannot be linked in the current status.',
            input.governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          'Uploaded'
        );
        if (!objectRecord.ok) return objectRecord;
        return {
          ok: true,
          value: {
            record: {
              ...current,
              fileReferenceId: input.fileReferenceId,
              fileSourceReference: input.fileSourceReference,
              documentStatus: 'Uploaded',
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-updated',
            eventAction: CORE_EVENT_ACTIONS.updated,
            eventPayload: {
              documentReferenceId: input.documentReferenceId,
              fileReferenceId: input.fileReferenceId,
              documentStatus: 'Uploaded',
              fileLinked: true
            }
          }
        };
      }
    );
  }

  requireDocumentReview(input: {
    readonly documentReferenceId: string;
    readonly reviewNoteReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'document.require_review',
      permission: 'document:require_review',
      policyScope: 'document.review',
      target: input.documentReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reviewNoteReference)) {
      return safe(
        'DocumentReviewNoteRequired',
        'Document review note reference is required.',
        input.governance.correlationId
      );
    }
    return this.mutate(
      {
        operationName: 'requireDocumentReview',
        idempotencyKey: input.idempotencyKey,
        documentReferenceId: input.documentReferenceId,
        governance: input.governance,
        request: { reviewNoteReference: input.reviewNoteReference }
      },
      (current, now) => {
        if (
          !['Draft', 'Received', 'Uploaded'].includes(current.documentStatus)
        ) {
          return safe(
            'InvalidDocumentTransition',
            'Document cannot require review in the current status.',
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
        return {
          ok: true,
          value: {
            record: {
              ...current,
              documentStatus: 'ReviewRequired',
              reviewStatus: 'ReviewRequired',
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-status-changed',
            eventAction: CORE_EVENT_ACTIONS.requested,
            eventPayload: {
              documentReferenceId: input.documentReferenceId,
              previousStatus: current.documentStatus,
              newStatus: 'ReviewRequired',
              reviewStatus: 'ReviewRequired',
              reviewNoteReference: input.reviewNoteReference
            }
          }
        };
      }
    );
  }

  reviewDocument(input: {
    readonly documentReferenceId: string;
    readonly targetReviewStatus: CoreDocumentReviewDecisionStatus;
    readonly reviewNoteReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'document.review',
      permission: 'document:review',
      policyScope: 'document.review',
      target: input.documentReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reviewNoteReference)) {
      return safe(
        'DocumentReviewNoteRequired',
        'Document review note reference is required.',
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
        operationName: 'reviewDocument',
        idempotencyKey: input.idempotencyKey,
        documentReferenceId: input.documentReferenceId,
        governance: input.governance,
        request: {
          targetReviewStatus: input.targetReviewStatus,
          reviewNoteReference: input.reviewNoteReference
        }
      },
      (current, now) => {
        if (current.documentStatus !== 'ReviewRequired') {
          return safe(
            'InvalidDocumentTransition',
            'Document review requires ReviewRequired status.',
            input.governance.correlationId
          );
        }
        const statusByReview: Record<
          CoreDocumentReviewDecisionStatus,
          CoreDocumentStatus
        > = {
          HumanReviewed: 'Reviewed',
          ApprovedForUse: 'Approved',
          Rejected: 'Rejected',
          NeedsRevision: 'ReviewRequired'
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
              documentStatus: targetStatus,
              reviewStatus: input.targetReviewStatus,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-updated',
            eventAction:
              input.targetReviewStatus === 'ApprovedForUse'
                ? CORE_EVENT_ACTIONS.approved
                : input.targetReviewStatus === 'Rejected'
                  ? CORE_EVENT_ACTIONS.rejected
                  : CORE_EVENT_ACTIONS.reviewed,
            eventPayload: {
              documentReferenceId: input.documentReferenceId,
              previousStatus: current.documentStatus,
              newStatus: targetStatus,
              reviewStatus: input.targetReviewStatus,
              reviewNoteReference: input.reviewNoteReference
            }
          }
        };
      }
    );
  }

  changeDocumentStatus(input: {
    readonly documentReferenceId: string;
    readonly targetStatus: CoreDocumentStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreDocumentGovernanceContext;
  }): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'document.change_status',
      permission: 'document:change_status',
      policyScope: 'document.lifecycle',
      target: input.documentReferenceId
    });
    if (!governed.ok) return governed;
    if (!included(CORE_DOCUMENT_STATUSES, input.targetStatus)) {
      return safe(
        'InvalidDocumentStatus',
        'Document target status is invalid.',
        input.governance.correlationId
      );
    }
    return this.mutate(
      {
        operationName: 'changeDocumentStatus',
        idempotencyKey: input.idempotencyKey,
        documentReferenceId: input.documentReferenceId,
        governance: input.governance,
        request: {
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        }
      },
      (current, now) => {
        if (
          !lifecycleTransitions.has(
            `${current.documentStatus}->${input.targetStatus}`
          )
        ) {
          return safe(
            'InvalidDocumentTransition',
            'Document status transition is invalid.',
            input.governance.correlationId
          );
        }
        if (
          input.targetStatus === 'Archived' &&
          (typeof input.reasonReference !== 'string' ||
            !opaque.test(input.reasonReference))
        ) {
          return safe(
            'DocumentReasonReferenceRequired',
            'Document archive reason reference is required.',
            input.governance.correlationId
          );
        }
        const nextReviewStatus = current.reviewStatus;
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
              documentStatus: input.targetStatus,
              reviewStatus: nextReviewStatus,
              objectRecord: objectRecord.value
            },
            eventType: 'core-object-status-changed',
            eventAction:
              input.targetStatus === 'Archived'
                ? CORE_EVENT_ACTIONS.archived
                : CORE_EVENT_ACTIONS.statusChanged,
            eventPayload: {
              documentReferenceId: input.documentReferenceId,
              previousStatus: current.documentStatus,
              newStatus: input.targetStatus,
              reviewStatus: nextReviewStatus,
              reasonReference: input.reasonReference ?? null
            }
          }
        };
      }
    );
  }

  private mutate(
    input: {
      readonly operationName: Exclude<
        CoreDocumentMutationOperation,
        'createDocument'
      >;
      readonly idempotencyKey?: string | null;
      readonly documentReferenceId: string;
      readonly governance: CoreDocumentGovernanceContext;
      readonly request: Record<string, unknown>;
    },
    build: (
      current: CoreDocumentServiceRecord,
      now: string
    ) => CoreBehaviorResult<{
      readonly record: CoreDocumentServiceRecord;
      readonly eventType: string;
      readonly eventAction: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
      readonly eventPayload: Record<string, unknown>;
    }>
  ): CoreBehaviorResult<CoreDocumentServiceRecord> {
    const reference = validateDocumentReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.documentReferenceId
    );
    if (!reference.ok) return reference;
    const existing = this.deps.store.get(input.documentReferenceId);
    if (!existing) {
      return safe(
        'DocumentNotFound',
        'Document was not found.',
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
          documentReferenceId: input.documentReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const current = this.deps.store.get(input.documentReferenceId);
        if (!current) {
          return safe(
            'DocumentNotFound',
            'Document was not found.',
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
        const valid = validateDocumentRecord(
          built.value.record,
          reference.value,
          this.deps.relatedReferenceRegistry
        );
        if (!valid.ok) return valid;
        let replaced: CoreBehaviorResult<CoreDocumentServiceRecord>;
        try {
          replaced = this.deps.store.replace(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Document Service dependency failed safely.',
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
                input.documentReferenceId,
                input.idempotencyKey ?? ''
              ),
              type: built.value.eventType,
              action: built.value.eventAction,
              documentReferenceId: input.documentReferenceId,
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
              'Document mutation rollback failed.',
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
