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

export const CORE_CLASSIFICATION_SCHEMES = [
  'Nice',
  'Local',
  'Madrid',
  'USPTO_ID_Manual',
  'CN_Similar_Group',
  'Custom',
  'Unknown'
] as const;
export type CoreClassificationScheme =
  (typeof CORE_CLASSIFICATION_SCHEMES)[number];

export const CORE_CLASSIFICATION_STATUSES = [
  'Draft',
  'Recommended',
  'ReviewRequired',
  'Approved',
  'Rejected',
  'Filed',
  'Amended',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreClassificationStatus =
  (typeof CORE_CLASSIFICATION_STATUSES)[number];

export const CORE_CLASSIFICATION_REVIEW_STATUSES = [
  'Unreviewed',
  'AIRecommended',
  'HumanReviewed',
  'ApprovedForFiling',
  'Rejected',
  'NeedsRevision',
  'FiledScope'
] as const;
export type CoreClassificationReviewStatus =
  (typeof CORE_CLASSIFICATION_REVIEW_STATUSES)[number];

export const CORE_CLASSIFICATION_ITEM_TYPES = [
  'Goods',
  'Services',
  'ClassHeading',
  'CustomItem',
  'OfficialAcceptableItem',
  'LocalStandardItem',
  'Unknown'
] as const;
export type CoreClassificationItemType =
  (typeof CORE_CLASSIFICATION_ITEM_TYPES)[number];

export const CORE_CLASSIFICATION_STATUS_TO_OBJECT_STATUS: Record<
  CoreClassificationStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  Recommended: 'draft',
  ReviewRequired: 'draft',
  Approved: 'active',
  Rejected: 'inactive',
  Filed: 'active',
  Amended: 'active',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

export const CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS = [
  'createClassification',
  'getClassification',
  'listClassifications',
  'validateClassification',
  'validateClassificationReference',
  'changeClassificationStatus'
] as const;

export const CORE_CLASSIFICATION_MINIMUM_CAPABILITIES = [
  'create where required',
  'read where required',
  'search/list where required',
  'validate_reference',
  'basic status transition where required',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'idempotency handling where duplicate-sensitive'
] as const;

export const CORE_CLASSIFICATION_COLLECTION_TARGET =
  'classification:collection';

const CONTRACT_ID = 'core-service-classification-service-contract';
const CLASSIFICATION_OBJECT_TYPE = 'classification-record';
const CLASSIFICATION_DOMAIN = 'classification';
const CLASSIFICATION_OBJECT_CONTRACT_ID =
  'core-object-classification-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const transitions = new Set([
  'Draft->ReviewRequired',
  'ReviewRequired->Approved',
  'ReviewRequired->Rejected',
  'Approved->Archived',
  'Rejected->Archived'
]);

const classificationErrorCategories: Partial<
  Record<CoreErrorCode, CoreErrorCategory>
> = {
  ClassificationAlreadyExists: 'Conflict',
  ClassificationNotFound: 'Reference',
  InvalidClassificationScheme: 'Validation',
  InvalidClassificationStatus: 'State',
  InvalidClassificationReviewStatus: 'State',
  InvalidClassificationTransition: 'State',
  InvalidClassificationReference: 'Reference',
  InvalidClassificationTrademarkReference: 'Reference',
  InvalidClassificationBrandReference: 'Reference',
  InvalidClassificationJurisdictionReference: 'Reference',
  ClassReferenceRequired: 'Validation',
  GoodsServicesItemsRequired: 'Validation',
  ClassNumberOnlyNotAllowed: 'Validation',
  InvalidClassificationItemType: 'Validation',
  InvalidClassificationItemReference: 'Validation',
  ClassificationSourceReferenceRequired: 'Validation',
  ClassificationReasonReferenceRequired: 'Validation',
  ClassificationObjectMismatch: 'Validation',
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

export interface CoreClassificationItem {
  readonly itemReferenceId: string;
  readonly classReference: string;
  readonly itemType: CoreClassificationItemType;
  readonly sourceReference?: string | null;
}

export interface CoreClassificationServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly classificationScheme: CoreClassificationScheme;
  readonly classReferences: readonly string[];
  readonly goodsServicesItems: readonly CoreClassificationItem[];
  readonly classificationStatus: CoreClassificationStatus;
  readonly reviewStatus: CoreClassificationReviewStatus;
  readonly trademarkReferenceId?: string | null;
  readonly brandReferenceId?: string | null;
  readonly jurisdictionReferenceId?: string | null;
  readonly recommendationReferenceId?: string | null;
  readonly sourceReference: string;
}

export interface CoreClassificationGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreClassificationServiceStore {
  get(
    classificationReferenceId: string
  ): CoreClassificationServiceRecord | undefined;
  list(): readonly CoreClassificationServiceRecord[];
  insert(
    record: CoreClassificationServiceRecord
  ): CoreBehaviorResult<CoreClassificationServiceRecord>;
  replace(
    record: CoreClassificationServiceRecord
  ): CoreBehaviorResult<CoreClassificationServiceRecord>;
  remove(classificationReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreClassificationEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreClassificationRequestingServiceDirectoryEntry {
  readonly domainId: CoreDomainId;
  readonly serviceType: string;
}

export interface CoreClassificationServiceDependencies {
  readonly store: CoreClassificationServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreClassificationEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly requestingServiceDirectory: readonly CoreClassificationRequestingServiceDirectoryEntry[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: 'createClassification' | 'changeClassificationStatus',
    classificationReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
}

export interface CoreClassificationListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly classificationScheme: CoreClassificationScheme;
  readonly classificationStatus: CoreClassificationStatus;
  readonly reviewStatus: CoreClassificationReviewStatus;
  readonly classReferenceCount: number;
  readonly itemCount: number;
  readonly genericObjectStatus: CoreObjectStatus | undefined;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export type CoreClassificationValidationReason =
  | 'Valid'
  | 'ReviewRequired'
  | 'NotFound'
  | 'InvalidReference'
  | 'Archived'
  | 'Rejected';

export interface CoreClassificationValidationResult {
  readonly isValid: boolean;
  readonly classificationReferenceId: string;
  readonly classificationScheme: CoreClassificationScheme | null;
  readonly classReferences: readonly string[];
  readonly itemCount: number;
  readonly classificationStatus: CoreClassificationStatus | null;
  readonly reviewStatus: CoreClassificationReviewStatus | null;
  readonly reasonCode: CoreClassificationValidationReason;
  readonly reviewRequired: boolean;
  readonly jurisdictionReferenceId: string | null;
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
      category: classificationErrorCategories[code] ?? 'Validation',
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
  record: CoreClassificationServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreClassificationGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Classification organization scope is not authorized.',
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
  context: CoreClassificationGovernanceContext,
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
    context.review.targetObjectType !== CLASSIFICATION_OBJECT_TYPE ||
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
    context.audit.targetObjectType !== CLASSIFICATION_OBJECT_TYPE ||
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

function validateReference(
  registry: CoreReferenceRegistry,
  referenceId: string,
  expectedObjectType: string,
  expectedDomain: CoreDomainId,
  code: CoreErrorCode
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType,
    expectedDomain
  });
  return resolved.ok
    ? resolved
    : safe(code, 'Related Classification reference is invalid.');
}

function validateClassificationReferenceRecord(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<CoreReferenceRecord> {
  return validateReference(
    registry,
    referenceId,
    CLASSIFICATION_OBJECT_TYPE,
    CLASSIFICATION_DOMAIN,
    'InvalidClassificationReference'
  );
}

function validateRequestingService(
  requestingDomain: string,
  requestingService: string,
  directory: readonly CoreClassificationRequestingServiceDirectoryEntry[]
): CoreBehaviorResult<null> {
  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {
    return safe(
      'InvalidClassificationReference',
      'Requesting Domain is invalid.'
    );
  }
  const service = directory.find(
    (entry) =>
      entry.serviceType === requestingService &&
      entry.domainId === requestingDomain
  );
  return service
    ? { ok: true, value: null }
    : safe('InvalidClassificationReference', 'Requesting Service is invalid.');
}

function idempotencyScope(
  governance: CoreClassificationGovernanceContext,
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
  readonly classificationReferenceId: string;
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
      domainId: CLASSIFICATION_DOMAIN,
      object: {
        id: createCoreObjectId(input.classificationReferenceId),
        type: createCoreObjectType(CLASSIFICATION_OBJECT_TYPE),
        domainId: CLASSIFICATION_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

function normalizeClassReferences(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const refs = value.map((entry) =>
    typeof entry === 'string' ? entry.trim() : ''
  );
  if (
    refs.some((entry) => !controlledReference.test(entry)) ||
    new Set(refs).size !== refs.length
  ) {
    return null;
  }
  return refs;
}

function normalizeItems(
  value: unknown,
  classReferences: readonly string[]
): CoreBehaviorResult<readonly CoreClassificationItem[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return safe(
      classReferences.length > 0
        ? 'ClassNumberOnlyNotAllowed'
        : 'GoodsServicesItemsRequired',
      'Classification requires goods or services items.'
    );
  }
  const items: CoreClassificationItem[] = [];
  const ids = new Set<string>();
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return safe(
        'InvalidClassificationItemReference',
        'Classification item is invalid.'
      );
    }
    const item = raw as Record<string, unknown>;
    const itemReferenceId =
      typeof item.itemReferenceId === 'string'
        ? item.itemReferenceId.trim()
        : '';
    const classReference =
      typeof item.classReference === 'string' ? item.classReference.trim() : '';
    if (
      !controlledReference.test(itemReferenceId) ||
      !controlledReference.test(classReference) ||
      ids.has(itemReferenceId) ||
      !classReferences.includes(classReference)
    ) {
      return safe(
        'InvalidClassificationItemReference',
        'Classification item reference is invalid.'
      );
    }
    if (!included(CORE_CLASSIFICATION_ITEM_TYPES, item.itemType)) {
      return safe(
        'InvalidClassificationItemType',
        'Classification item type is invalid.'
      );
    }
    const sourceReference =
      item.sourceReference === undefined || item.sourceReference === null
        ? null
        : typeof item.sourceReference === 'string' &&
            opaque.test(item.sourceReference)
          ? item.sourceReference
          : null;
    if (
      item.sourceReference !== undefined &&
      item.sourceReference !== null &&
      sourceReference === null
    ) {
      return safe(
        'InvalidClassificationItemReference',
        'Classification item source reference is invalid.'
      );
    }
    ids.add(itemReferenceId);
    items.push({
      itemReferenceId,
      classReference,
      itemType: item.itemType,
      sourceReference
    });
  }
  return { ok: true, value: immutable(items) };
}

function validateRelatedReferences(
  record: CoreClassificationServiceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<null> {
  for (const [referenceId, objectType, domainId, code] of [
    [
      record.trademarkReferenceId,
      'trademark-record',
      'trademark',
      'InvalidClassificationTrademarkReference'
    ],
    [
      record.brandReferenceId,
      'brand-record',
      'brand',
      'InvalidClassificationBrandReference'
    ],
    [
      record.jurisdictionReferenceId,
      'jurisdiction-record',
      'jurisdiction',
      'InvalidClassificationJurisdictionReference'
    ]
  ] as const) {
    if (referenceId === undefined || referenceId === null) continue;
    const result = validateReference(
      registry,
      referenceId,
      objectType,
      domainId,
      code
    );
    if (!result.ok) return result;
  }
  return { ok: true, value: null };
}

function validStatusReviewPair(
  status: CoreClassificationStatus,
  reviewStatus: CoreClassificationReviewStatus
): boolean {
  if (status === 'Draft') return reviewStatus === 'Unreviewed';
  if (status === 'Recommended') return reviewStatus === 'AIRecommended';
  if (status === 'ReviewRequired') return reviewStatus === 'NeedsRevision';
  if (status === 'Approved') return reviewStatus === 'ApprovedForFiling';
  if (status === 'Rejected') return reviewStatus === 'Rejected';
  if (status === 'Filed') return reviewStatus === 'FiledScope';
  if (status === 'Amended') return reviewStatus === 'NeedsRevision';
  return true;
}

function validateClassificationRecord(
  record: CoreClassificationServiceRecord,
  publicReferenceRecord: CoreReferenceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreClassificationServiceRecord> {
  if (!included(CORE_CLASSIFICATION_SCHEMES, record.classificationScheme)) {
    return safe(
      'InvalidClassificationScheme',
      'Classification scheme is invalid.'
    );
  }
  if (!included(CORE_CLASSIFICATION_STATUSES, record.classificationStatus)) {
    return safe(
      'InvalidClassificationStatus',
      'Classification status is invalid.'
    );
  }
  if (
    !included(CORE_CLASSIFICATION_REVIEW_STATUSES, record.reviewStatus) ||
    !validStatusReviewPair(record.classificationStatus, record.reviewStatus)
  ) {
    return safe(
      'InvalidClassificationReviewStatus',
      'Classification review status is invalid.'
    );
  }
  if (
    record.objectRecord.domainId !== CLASSIFICATION_DOMAIN ||
    record.objectRecord.objectType !== CLASSIFICATION_OBJECT_TYPE ||
    record.objectRecord.objectContractId !==
      CLASSIFICATION_OBJECT_CONTRACT_ID ||
    record.objectRecord.publicReferenceId !==
      publicReferenceRecord.referenceId ||
    record.objectRecord.status !==
      CORE_CLASSIFICATION_STATUS_TO_OBJECT_STATUS[record.classificationStatus]
  ) {
    return safe(
      'ClassificationObjectMismatch',
      'Classification Object foundation does not match.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!opaque.test(record.sourceReference)) {
    return safe(
      'ClassificationSourceReferenceRequired',
      'Classification source reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  const classes = normalizeClassReferences(record.classReferences);
  if (classes === null) {
    return safe(
      'ClassReferenceRequired',
      'Classification class reference is required.'
    );
  }
  const items = normalizeItems(record.goodsServicesItems, classes);
  if (!items.ok) return items;
  const related = validateRelatedReferences(record, registry);
  if (!related.ok) return related;
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
      'Classification Object base record is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  return {
    ok: true,
    value: immutable({
      ...record,
      classReferences: classes,
      goodsServicesItems: items.value
    })
  };
}

function validationResult(
  record: CoreClassificationServiceRecord
): CoreClassificationValidationResult {
  if (record.classificationStatus === 'Archived') {
    return {
      isValid: false,
      classificationReferenceId: record.objectRecord.publicReferenceId,
      classificationScheme: record.classificationScheme,
      classReferences: record.classReferences,
      itemCount: record.goodsServicesItems.length,
      classificationStatus: record.classificationStatus,
      reviewStatus: record.reviewStatus,
      reasonCode: 'Archived',
      reviewRequired: false,
      jurisdictionReferenceId: record.jurisdictionReferenceId ?? null
    };
  }
  if (
    record.classificationStatus === 'DeletedReferenceOnly' ||
    record.classificationStatus === 'Rejected'
  ) {
    return {
      isValid: false,
      classificationReferenceId: record.objectRecord.publicReferenceId,
      classificationScheme: record.classificationScheme,
      classReferences: record.classReferences,
      itemCount: record.goodsServicesItems.length,
      classificationStatus: record.classificationStatus,
      reviewStatus: record.reviewStatus,
      reasonCode:
        record.classificationStatus === 'Rejected'
          ? 'Rejected'
          : 'InvalidReference',
      reviewRequired: false,
      jurisdictionReferenceId: record.jurisdictionReferenceId ?? null
    };
  }
  const reviewRequired =
    record.classificationStatus !== 'Approved' ||
    record.reviewStatus !== 'ApprovedForFiling';
  return {
    isValid: true,
    classificationReferenceId: record.objectRecord.publicReferenceId,
    classificationScheme: record.classificationScheme,
    classReferences: record.classReferences,
    itemCount: record.goodsServicesItems.length,
    classificationStatus: record.classificationStatus,
    reviewStatus: record.reviewStatus,
    reasonCode: reviewRequired ? 'ReviewRequired' : 'Valid',
    reviewRequired,
    jurisdictionReferenceId: record.jurisdictionReferenceId ?? null
  };
}

export class CoreInMemoryClassificationServiceStore implements CoreClassificationServiceStore {
  readonly #records = new Map<string, CoreClassificationServiceRecord>();

  get(id: string): CoreClassificationServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreClassificationServiceRecord[] {
    return [...this.#records.values()].map((record) => immutable(record));
  }

  insert(
    record: CoreClassificationServiceRecord
  ): CoreBehaviorResult<CoreClassificationServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id)) {
      return safe(
        'ClassificationAlreadyExists',
        'Classification already exists.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreClassificationServiceRecord
  ): CoreBehaviorResult<CoreClassificationServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id)) {
      return safe(
        'ClassificationNotFound',
        'Classification was not found.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(classificationReferenceId: string): CoreBehaviorResult<null> {
    this.#records.delete(classificationReferenceId);
    return { ok: true, value: null };
  }
}

export class CoreClassificationService {
  constructor(readonly deps: CoreClassificationServiceDependencies) {}

  createClassification(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly classificationScheme: unknown;
    readonly classReferences: unknown;
    readonly goodsServicesItems: unknown;
    readonly classificationStatus: unknown;
    readonly reviewStatus: unknown;
    readonly trademarkReferenceId?: string | null;
    readonly brandReferenceId?: string | null;
    readonly jurisdictionReferenceId?: string | null;
    readonly recommendationReferenceId?: string | null;
    readonly sourceReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreClassificationGovernanceContext;
  }): CoreBehaviorResult<CoreClassificationServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'classification.create',
      permission: 'classification:create',
      policyScope: 'classification.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (
      input.classificationStatus !== 'Draft' ||
      input.reviewStatus !== 'Unreviewed'
    ) {
      return safe(
        'InvalidClassificationStatus',
        'Classification creation must start as Draft and Unreviewed.',
        input.governance.correlationId
      );
    }
    const registered = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.publicReferenceRecord.referenceId,
      expectedObjectType: CLASSIFICATION_OBJECT_TYPE,
      expectedDomain: CLASSIFICATION_DOMAIN
    });
    if (
      !registered.ok ||
      target !== input.publicReferenceRecord.referenceId ||
      !referenceMatches(input.publicReferenceRecord, registered.value)
    ) {
      return safe(
        'InvalidClassificationReference',
        'Classification reference is invalid.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'createClassification'
        ),
        operationName: 'createClassification',
        request: {
          objectRecord: input.objectRecord,
          publicReferenceRecord: input.publicReferenceRecord,
          classificationScheme: input.classificationScheme,
          classReferences: input.classReferences,
          goodsServicesItems: input.goodsServicesItems,
          classificationStatus: input.classificationStatus,
          reviewStatus: input.reviewStatus,
          trademarkReferenceId: input.trademarkReferenceId ?? null,
          brandReferenceId: input.brandReferenceId ?? null,
          jurisdictionReferenceId: input.jurisdictionReferenceId ?? null,
          recommendationReferenceId: input.recommendationReferenceId ?? null,
          sourceReference: input.sourceReference
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target)) {
          return safe(
            'ClassificationAlreadyExists',
            'Classification already exists.',
            input.governance.correlationId
          );
        }
        const record: CoreClassificationServiceRecord = {
          objectRecord: input.objectRecord,
          classificationScheme:
            input.classificationScheme as CoreClassificationScheme,
          classReferences: input.classReferences as readonly string[],
          goodsServicesItems:
            input.goodsServicesItems as readonly CoreClassificationItem[],
          classificationStatus:
            input.classificationStatus as CoreClassificationStatus,
          reviewStatus: input.reviewStatus as CoreClassificationReviewStatus,
          trademarkReferenceId: input.trademarkReferenceId ?? null,
          brandReferenceId: input.brandReferenceId ?? null,
          jurisdictionReferenceId: input.jurisdictionReferenceId ?? null,
          recommendationReferenceId: input.recommendationReferenceId ?? null,
          sourceReference: input.sourceReference
        };
        const valid = validateClassificationRecord(
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
        let inserted: CoreBehaviorResult<CoreClassificationServiceRecord>;
        try {
          inserted = this.deps.store.insert(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Classification Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!inserted.ok) return inserted;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'createClassification',
                target,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-created',
              action: CORE_EVENT_ACTIONS.created,
              classificationReferenceId: target,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                classificationReferenceId: target,
                classificationScheme: valid.value.classificationScheme,
                classificationStatus: valid.value.classificationStatus,
                reviewStatus: valid.value.reviewStatus,
                classReferenceCount: valid.value.classReferences.length,
                itemCount: valid.value.goodsServicesItems.length
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
              'Classification create rollback failed.',
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

  getClassification(input: {
    readonly classificationReferenceId: string;
    readonly governance: CoreClassificationGovernanceContext;
  }): CoreBehaviorResult<CoreClassificationServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'classification.read',
      permission: 'classification:read',
      policyScope: 'classification.read',
      target: input.classificationReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateClassificationReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.classificationReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.classificationReferenceId);
    if (!record) {
      return safe(
        'ClassificationNotFound',
        'Classification was not found.',
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

  listClassifications(input: {
    readonly filters?: {
      readonly classificationScheme?: unknown;
      readonly classificationStatus?: unknown;
      readonly reviewStatus?: unknown;
      readonly publicReferenceId?: unknown;
      readonly trademarkReferenceId?: unknown;
      readonly brandReferenceId?: unknown;
      readonly jurisdictionReferenceId?: unknown;
      readonly classReference?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreClassificationGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreClassificationListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'classification.list',
      permission: 'classification:list',
      policyScope: 'classification.list',
      target: CORE_CLASSIFICATION_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.classificationScheme !== undefined &&
      !included(CORE_CLASSIFICATION_SCHEMES, input.filters.classificationScheme)
    ) {
      return safe(
        'InvalidClassificationScheme',
        'Classification scheme filter is invalid.'
      );
    }
    if (
      input.filters?.classificationStatus !== undefined &&
      !included(
        CORE_CLASSIFICATION_STATUSES,
        input.filters.classificationStatus
      )
    ) {
      return safe(
        'InvalidClassificationStatus',
        'Classification status filter is invalid.'
      );
    }
    if (
      input.filters?.reviewStatus !== undefined &&
      !included(CORE_CLASSIFICATION_REVIEW_STATUSES, input.filters.reviewStatus)
    ) {
      return safe(
        'InvalidClassificationReviewStatus',
        'Classification review filter is invalid.'
      );
    }
    for (const value of [
      input.filters?.publicReferenceId,
      input.filters?.trademarkReferenceId,
      input.filters?.brandReferenceId,
      input.filters?.jurisdictionReferenceId,
      input.filters?.classReference
    ]) {
      if (
        value !== undefined &&
        (typeof value !== 'string' || !controlledReference.test(value))
      ) {
        return safe(
          'InvalidClassificationReference',
          'Classification list reference filter is invalid.'
        );
      }
    }
    const classReferenceFilter =
      typeof input.filters?.classReference === 'string'
        ? input.filters.classReference
        : undefined;
    const classReferenceFilter =
      typeof input.filters?.classReference === 'string'
        ? input.filters.classReference
        : undefined;
    const items = this.deps.store
      .list()
      .filter(
        (record) =>
          organizationScopeOf(record) ===
          (input.governance.authorizedOrganizationReferenceId ?? null)
      )
      .filter(
        (record) =>
          (input.filters?.classificationScheme === undefined ||
            record.classificationScheme ===
              input.filters.classificationScheme) &&
          (input.filters?.classificationStatus === undefined ||
            record.classificationStatus ===
              input.filters.classificationStatus) &&
          (input.filters?.reviewStatus === undefined ||
            record.reviewStatus === input.filters.reviewStatus) &&
          (input.filters?.publicReferenceId === undefined ||
            record.objectRecord.publicReferenceId ===
              input.filters.publicReferenceId) &&
          (input.filters?.trademarkReferenceId === undefined ||
            record.trademarkReferenceId ===
              input.filters.trademarkReferenceId) &&
          (input.filters?.brandReferenceId === undefined ||
            record.brandReferenceId === input.filters.brandReferenceId) &&
          (input.filters?.jurisdictionReferenceId === undefined ||
            record.jurisdictionReferenceId ===
              input.filters.jurisdictionReferenceId) &&
          (classReferenceFilter === undefined ||
            record.classReferences.includes(classReferenceFilter))
      )
      .map((record): CoreClassificationListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        classificationScheme: record.classificationScheme,
        classificationStatus: record.classificationStatus,
        reviewStatus: record.reviewStatus,
        classReferenceCount: record.classReferences.length,
        itemCount: record.goodsServicesItems.length,
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
          'classificationScheme',
          'classificationStatus',
          'reviewStatus',
          'classReferenceCount',
          'itemCount'
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

  validateClassification(input: {
    readonly classificationReferenceId: string;
    readonly governance: CoreClassificationGovernanceContext;
  }): CoreBehaviorResult<CoreClassificationValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'classification.validate',
      permission: 'classification:validate',
      policyScope: 'classification.validation',
      target: input.classificationReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateClassificationReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.classificationReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.classificationReferenceId);
    if (!record) {
      return safe(
        'ClassificationNotFound',
        'Classification was not found.',
        input.governance.correlationId
      );
    }
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scope.ok) return scope;
    return { ok: true, value: immutable(validationResult(record)) };
  }

  validateClassificationReference(input: {
    readonly classificationReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreClassificationGovernanceContext;
  }): CoreBehaviorResult<CoreClassificationValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'classification.validate_reference',
      permission: 'classification:validate_reference',
      policyScope: 'classification.reference',
      target: input.classificationReferenceId
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService,
      this.deps.requestingServiceDirectory
    );
    if (!requester.ok) return requester;
    const reference = validateClassificationReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.classificationReferenceId
    );
    if (!reference.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          classificationReferenceId: input.classificationReferenceId,
          classificationScheme: null,
          classReferences: [],
          itemCount: 0,
          classificationStatus: null,
          reviewStatus: null,
          reasonCode: 'InvalidReference',
          reviewRequired: false,
          jurisdictionReferenceId: null
        }
      };
    }
    const record = this.deps.store.get(input.classificationReferenceId);
    if (
      !record ||
      organizationScopeOf(record) !==
        (input.governance.authorizedOrganizationReferenceId ?? null)
    ) {
      return {
        ok: true,
        value: {
          isValid: false,
          classificationReferenceId: input.classificationReferenceId,
          classificationScheme: null,
          classReferences: [],
          itemCount: 0,
          classificationStatus: null,
          reviewStatus: null,
          reasonCode: 'NotFound',
          reviewRequired: false,
          jurisdictionReferenceId: null
        }
      };
    }
    return { ok: true, value: immutable(validationResult(record)) };
  }

  changeClassificationStatus(input: {
    readonly classificationReferenceId: string;
    readonly targetStatus: CoreClassificationStatus;
    readonly targetReviewStatus: CoreClassificationReviewStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreClassificationGovernanceContext;
  }): CoreBehaviorResult<CoreClassificationServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'classification.change_status',
      permission: 'classification:change_status',
      policyScope: 'classification.lifecycle',
      target: input.classificationReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateClassificationReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.classificationReferenceId
    );
    if (!reference.ok) return reference;
    const existing = this.deps.store.get(input.classificationReferenceId);
    if (!existing) {
      return safe(
        'ClassificationNotFound',
        'Classification was not found.',
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
          'changeClassificationStatus'
        ),
        operationName: 'changeClassificationStatus',
        request: {
          classificationReferenceId: input.classificationReferenceId,
          targetStatus: input.targetStatus,
          targetReviewStatus: input.targetReviewStatus,
          reasonReference: input.reasonReference ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const current = this.deps.store.get(input.classificationReferenceId);
        if (!current) {
          return safe(
            'ClassificationNotFound',
            'Classification was not found.',
            input.governance.correlationId
          );
        }
        if (
          !included(CORE_CLASSIFICATION_STATUSES, input.targetStatus) ||
          !included(
            CORE_CLASSIFICATION_REVIEW_STATUSES,
            input.targetReviewStatus
          )
        ) {
          return safe(
            'InvalidClassificationStatus',
            'Classification target status is invalid.',
            input.governance.correlationId
          );
        }
        if (
          !transitions.has(
            `${current.classificationStatus}->${input.targetStatus}`
          ) ||
          !validStatusReviewPair(input.targetStatus, input.targetReviewStatus)
        ) {
          return safe(
            'InvalidClassificationTransition',
            'Classification status transition is invalid.',
            input.governance.correlationId
          );
        }
        const protectedTransition =
          current.classificationStatus === 'ReviewRequired' &&
          (input.targetStatus === 'Approved' ||
            input.targetStatus === 'Rejected');
        if (
          protectedTransition &&
          (input.governance.policy.policyDecision !== 'HumanReviewRequired' ||
            !input.governance.review.humanReviewRequired ||
            input.governance.review.reviewStatus !== 'Completed' ||
            input.governance.review.reviewDecision !== 'Approved' ||
            !input.governance.review.reviewerUserReferenceId)
        ) {
          return safe(
            'HumanReviewRequired',
            'Completed human review is required.',
            input.governance.correlationId
          );
        }
        if (
          input.targetStatus === 'Approved' &&
          (current.reviewStatus === 'AIRecommended' ||
            input.targetReviewStatus !== 'ApprovedForFiling')
        ) {
          return safe(
            'HumanReviewRequired',
            'AI recommendation cannot become approved filing scope.',
            input.governance.correlationId
          );
        }
        if (
          input.targetStatus === 'Archived' &&
          (typeof input.reasonReference !== 'string' ||
            !opaque.test(input.reasonReference))
        ) {
          return safe(
            'ClassificationReasonReferenceRequired',
            'Classification archive reason reference is required.',
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
        if (current.objectRecord.version === undefined) {
          return safe(
            'ValidationFailed',
            'Classification Object version is required.',
            input.governance.correlationId
          );
        }
        if (current.objectRecord.version === undefined) {
          return safe(
            'ValidationFailed',
            'Classification Object version is required.',
            input.governance.correlationId
          );
        }
        const updated: CoreClassificationServiceRecord = {
          ...current,
          classificationStatus: input.targetStatus,
          reviewStatus: input.targetReviewStatus,
          objectRecord: {
            ...current.objectRecord,
            status:
              CORE_CLASSIFICATION_STATUS_TO_OBJECT_STATUS[input.targetStatus],
            auditMetadata: {
              ...current.objectRecord.auditMetadata,
              updatedAt: now,
              updatedByReferenceId:
                input.governance.permission.actorReferenceId ??
                current.objectRecord.auditMetadata.createdByReferenceId
            },
            version: {
              ...current.objectRecord.version,
              updatedAt: now
            }
          }
        };
        const valid = validateClassificationRecord(
          updated,
          reference.value,
          this.deps.relatedReferenceRegistry
        );
        if (!valid.ok) return valid;
        const previous = current;
        let replaced: CoreBehaviorResult<CoreClassificationServiceRecord>;
        try {
          replaced = this.deps.store.replace(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Classification Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!replaced.ok) return replaced;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'changeClassificationStatus',
                input.classificationReferenceId,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-status-changed',
              action: CORE_EVENT_ACTIONS.statusChanged,
              classificationReferenceId: input.classificationReferenceId,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                classificationReferenceId: input.classificationReferenceId,
                previousStatus: previous.classificationStatus,
                newStatus: input.targetStatus,
                reviewStatus: input.targetReviewStatus,
                classReferenceCount: previous.classReferences.length,
                itemCount: previous.goodsServicesItems.length,
                reasonReference: input.reasonReference ?? null
              }
            })
          );
        } catch {
          event = safe('EventTraceFailed', 'Event trace failed.');
        }
        if (!event.ok) {
          const rollback = this.deps.store.replace(previous);
          if (!rollback.ok) {
            return safe(
              'InternalError',
              'Classification status rollback failed.',
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
