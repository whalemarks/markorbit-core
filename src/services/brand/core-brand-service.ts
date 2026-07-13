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
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../contracts/index.ts';
import { CORE_DOMAIN_REGISTRY, type CoreDomainId } from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  createCoreEventType,
  type CoreEventId
} from '../../events/index.ts';
import type { CoreMvpObjectBaseRecord } from '../../objects/core-mvp-object-base-record.ts';
import type { CoreObjectStatus } from '../../objects/core-object-status.ts';
import { validateCoreMvpObjectBaseRecord } from '../../objects/core-mvp-object-validation.ts';
import { createCoreObjectId, createCoreObjectType } from '../../objects/index.ts';

export const CORE_BRAND_TYPES = [
  'Word',
  'Logo',
  'Combined',
  'Slogan',
  'Series',
  'TradeName',
  'ProductLine',
  'Unknown'
] as const;
export type CoreBrandType = (typeof CORE_BRAND_TYPES)[number];

export const CORE_BRAND_STATUSES = [
  'Draft',
  'Active',
  'ReviewRequired',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreBrandStatus = (typeof CORE_BRAND_STATUSES)[number];

export const CORE_BRAND_STATUS_TO_OBJECT_STATUS: Record<
  CoreBrandStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  ReviewRequired: 'draft',
  Active: 'active',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

export const CORE_BRAND_IMPLEMENTED_OPERATIONS = [
  'createBrand',
  'getBrand',
  'listBrands',
  'validateBrandReference',
  'changeBrandStatus'
] as const;

export const CORE_BRAND_MINIMUM_CAPABILITIES = [
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

export const CORE_BRAND_COLLECTION_TARGET = 'brand:collection';
const CONTRACT_ID = 'core-service-brand-service-contract';
const BRAND_OBJECT_TYPE = 'brand-record';
const BRAND_DOMAIN = 'brand';
const BRAND_OBJECT_CONTRACT_ID = 'core-object-brand-record-contract';
const CUSTOMER_OBJECT_TYPE = 'customer-record';
const CUSTOMER_DOMAIN = 'customer';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const transitions = new Set([
  'Draft->Active',
  'Draft->ReviewRequired',
  'ReviewRequired->Active',
  'Active->ReviewRequired',
  'Active->Archived',
  'Draft->Archived',
  'Archived->DeletedReferenceOnly'
]);
const reasonRequiredStatuses = new Set<CoreBrandStatus>([
  'Archived',
  'DeletedReferenceOnly'
]);

const brandErrorCategories: Partial<Record<CoreErrorCode, CoreErrorCategory>> = {
  BrandAlreadyExists: 'Conflict',
  BrandNotFound: 'Reference',
  InvalidBrandReference: 'Reference',
  InvalidBrandCustomerReference: 'Reference',
  InvalidBrandTransition: 'State',
  InvalidBrandStatus: 'State',
  PermissionDenied: 'Permission',
  PolicyRestricted: 'Policy',
  HumanReviewRequired: 'HumanReview',
  IdempotencyKeyRequired: 'Idempotency',
  IdempotencyKeyInvalid: 'Idempotency',
  IdempotencyConflict: 'Idempotency',
  EventTraceFailed: 'Event',
  AuditContextMissing: 'Validation',
  BrandObjectMismatch: 'Validation',
  InternalError: 'Internal'
};

export interface CoreBrandServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly brandType: CoreBrandType;
  readonly brandStatus: CoreBrandStatus;
  readonly nameReference: string;
  readonly sourceReference: string;
  readonly customerReferenceId: string | null;
}

export interface CoreBrandGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreBrandServiceStore {
  get(brandReferenceId: string): CoreBrandServiceRecord | undefined;
  list(): readonly CoreBrandServiceRecord[];
  insert(record: CoreBrandServiceRecord): CoreBehaviorResult<CoreBrandServiceRecord>;
  replace(record: CoreBrandServiceRecord): CoreBehaviorResult<CoreBrandServiceRecord>;
  remove(brandReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreBrandEventTracePort {
  append(record: CoreEventTraceRecord): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreBrandServiceDependencies {
  readonly store: CoreBrandServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreBrandEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: 'createBrand' | 'changeBrandStatus',
    brandReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
}

export interface CoreBrandListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly brandType: CoreBrandType;
  readonly brandStatus: CoreBrandStatus;
  readonly genericObjectStatus: CoreObjectStatus | undefined;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface CoreBrandReferenceValidationResult {
  readonly isValid: boolean;
  readonly brandReferenceId: string;
  readonly brandType: CoreBrandType | null;
  readonly brandStatus: CoreBrandStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Draft'
    | 'ReviewRequired'
    | 'Archived'
    | 'DeletedReferenceOnly'
    | 'InvalidReference';
}

function safe<T>(
  code: CoreErrorCode,
  message: string,
  correlationId?: string | null
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({
      code,
      category: brandErrorCategories[code] ?? 'Validation',
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

function isBrandType(value: unknown): value is CoreBrandType {
  return (
    typeof value === 'string' &&
    (CORE_BRAND_TYPES as readonly string[]).includes(value)
  );
}

function isBrandStatus(value: unknown): value is CoreBrandStatus {
  return (
    typeof value === 'string' &&
    (CORE_BRAND_STATUSES as readonly string[]).includes(value)
  );
}

function validUtcTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function organizationScopeOf(
  record: CoreBrandServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreBrandGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Brand organization scope is not authorized.',
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
  context: CoreBrandGovernanceContext,
  expected: GovernanceExpectation
): CoreBehaviorResult<null> {
  const correlationId = context.correlationId;
  if (
    context.permission.correlationId !== correlationId ||
    context.policy.correlationId !== correlationId ||
    context.audit.correlationId !== correlationId
  ) {
    return safe('ValidationFailed', 'Correlation IDs must match.', correlationId);
  }
  if (
    context.permission.intendedOperation !== expected.operation ||
    !context.permission.requiredPermissionKeys.includes(expected.permission)
  ) {
    return safe('PermissionDenied', 'Required permission is missing.', correlationId);
  }
  if (
    context.policy.intendedOperation !== expected.operation ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope)
  ) {
    return safe('PolicyRestricted', 'Required policy scope is missing.', correlationId);
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
    context.review.targetObjectType !== BRAND_OBJECT_TYPE ||
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
    context.audit.targetObjectType !== BRAND_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe('AuditContextMissing', 'Audit context is missing.', correlationId);
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

function validateBrandReferenceRecord(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: BRAND_OBJECT_TYPE,
    expectedDomain: BRAND_DOMAIN
  });
  return resolved.ok
    ? resolved
    : safe('InvalidBrandReference', 'Brand reference is invalid.');
}

function validateCustomerReference(
  registry: CoreReferenceRegistry,
  referenceId: string | null
): CoreBehaviorResult<null> {
  if (referenceId === null) return { ok: true, value: null };
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: CUSTOMER_OBJECT_TYPE,
    expectedDomain: CUSTOMER_DOMAIN
  });
  if (!resolved.ok || resolved.value.status !== 'Active') {
    return safe(
      'InvalidBrandCustomerReference',
      'Brand Customer reference is invalid.'
    );
  }
  return { ok: true, value: null };
}

function validateBrandRecord(
  record: CoreBrandServiceRecord,
  publicReferenceRecord: CoreReferenceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreBrandServiceRecord> {
  if (!isBrandType(record.brandType)) {
    return safe(
      'InvalidBrandType',
      'Brand type is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!isBrandStatus(record.brandStatus)) {
    return safe(
      'InvalidBrandStatus',
      'Brand status is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    record.objectRecord.domainId !== BRAND_DOMAIN ||
    record.objectRecord.objectType !== BRAND_OBJECT_TYPE ||
    record.objectRecord.objectContractId !== BRAND_OBJECT_CONTRACT_ID ||
    record.objectRecord.publicReferenceId !== publicReferenceRecord.referenceId ||
    record.objectRecord.status !==
      CORE_BRAND_STATUS_TO_OBJECT_STATUS[record.brandStatus]
  ) {
    return safe(
      'BrandObjectMismatch',
      'Brand Object foundation does not match.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!record.nameReference.trim() || record.nameReference.length > 128) {
    return safe(
      'BrandNameRequired',
      'Brand name reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!opaque.test(record.sourceReference)) {
    return safe(
      'BrandSourceReferenceRequired',
      'Brand source reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  const customer = validateCustomerReference(
    registry,
    record.customerReferenceId
  );
  if (!customer.ok) return customer;
  const validation = validateCoreMvpObjectBaseRecord(record.objectRecord, {
    publicReferenceRecord,
    relatedReferenceRegistry: registry
  });
  if (!validation.ok) {
    return safe(
      'ValidationFailed',
      'Brand Object base record is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  return { ok: true, value: immutable(record) };
}

function validateRequestingService(
  requestingDomain: string,
  requestingService: string
): CoreBehaviorResult<null> {
  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {
    return safe('InvalidBrandReference', 'Requesting Domain is invalid.');
  }
  const service = CORE_SERVICE_CONTRACT_SKELETONS.find(
    (contract) => contract.serviceType === requestingService
  );
  if (!service || service.domainId !== requestingDomain) {
    return safe('InvalidBrandReference', 'Requesting Service is invalid.');
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreBrandGovernanceContext,
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
  readonly brandReferenceId: string;
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
      domainId: BRAND_DOMAIN,
      object: {
        id: createCoreObjectId(input.brandReferenceId),
        type: createCoreObjectType(BRAND_OBJECT_TYPE),
        domainId: BRAND_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryBrandServiceStore implements CoreBrandServiceStore {
  readonly #records = new Map<string, CoreBrandServiceRecord>();

  get(id: string): CoreBrandServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreBrandServiceRecord[] {
    return [...this.#records.values()].map((record) => immutable(record));
  }

  insert(record: CoreBrandServiceRecord): CoreBehaviorResult<CoreBrandServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id)) {
      return safe(
        'BrandAlreadyExists',
        'Brand already exists.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(record: CoreBrandServiceRecord): CoreBehaviorResult<CoreBrandServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id)) {
      return safe(
        'BrandNotFound',
        'Brand was not found.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(brandReferenceId: string): CoreBehaviorResult<null> {
    this.#records.delete(brandReferenceId);
    return { ok: true, value: null };
  }
}

export class CoreBrandService {
  constructor(readonly deps: CoreBrandServiceDependencies) {}

  createBrand(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly brandType: unknown;
    readonly brandStatus: unknown;
    readonly nameReference: string;
    readonly sourceReference: string;
    readonly customerReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreBrandGovernanceContext;
  }): CoreBehaviorResult<CoreBrandServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'brand.create',
      permission: 'brand:create',
      policyScope: 'brand.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (!['Draft', 'ReviewRequired', 'Active'].includes(String(input.brandStatus))) {
      return safe(
        'InvalidBrandStatus',
        'Initial Brand status is invalid.',
        input.governance.correlationId
      );
    }
    const registered = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.publicReferenceRecord.referenceId,
      expectedObjectType: BRAND_OBJECT_TYPE,
      expectedDomain: BRAND_DOMAIN
    });
    if (
      !registered.ok ||
      target !== input.publicReferenceRecord.referenceId ||
      !referenceMatches(input.publicReferenceRecord, registered.value)
    ) {
      return safe(
        'InvalidBrandReference',
        'Brand reference is invalid.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior<
      {
        readonly objectRecord: CoreMvpObjectBaseRecord;
        readonly publicReferenceRecord: CoreReferenceRecord;
        readonly brandType: unknown;
        readonly brandStatus: unknown;
        readonly nameReference: string;
        readonly sourceReference: string;
        readonly customerReferenceId: string | null;
      },
      CoreBrandServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createBrand'),
        operationName: 'createBrand',
        request: {
          objectRecord: input.objectRecord,
          publicReferenceRecord: input.publicReferenceRecord,
          brandType: input.brandType,
          brandStatus: input.brandStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference,
          customerReferenceId: input.customerReferenceId ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target)) {
          return safe(
            'BrandAlreadyExists',
            'Brand already exists.',
            input.governance.correlationId
          );
        }
        const record: CoreBrandServiceRecord = {
          objectRecord: input.objectRecord,
          brandType: input.brandType as CoreBrandType,
          brandStatus: input.brandStatus as CoreBrandStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference,
          customerReferenceId: input.customerReferenceId ?? null
        };
        const valid = validateBrandRecord(
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
        let inserted: CoreBehaviorResult<CoreBrandServiceRecord>;
        try {
          inserted = this.deps.store.insert(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Brand Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!inserted.ok) return inserted;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'createBrand',
                target,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-created',
              action: CORE_EVENT_ACTIONS.created,
              brandReferenceId: target,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                brandReferenceId: target,
                brandType: valid.value.brandType,
                brandStatus: valid.value.brandStatus,
                customerReferenceId: valid.value.customerReferenceId
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
              'Brand create rollback failed.',
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

  getBrand(input: {
    readonly brandReferenceId: string;
    readonly governance: CoreBrandGovernanceContext;
  }): CoreBehaviorResult<CoreBrandServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'brand.read',
      permission: 'brand:read',
      policyScope: 'brand.read',
      target: input.brandReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateBrandReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.brandReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.brandReferenceId);
    if (!record || record.brandStatus === 'DeletedReferenceOnly') {
      return safe(
        'BrandNotFound',
        'Brand was not found.',
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

  listBrands(input: {
    readonly filters?: {
      readonly brandType?: unknown;
      readonly brandStatus?: unknown;
      readonly publicReferenceId?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreBrandGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreBrandListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'brand.list',
      permission: 'brand:list',
      policyScope: 'brand.list',
      target: CORE_BRAND_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (input.filters?.brandType !== undefined && !isBrandType(input.filters.brandType)) {
      return safe(
        'InvalidBrandType',
        'Brand type filter is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.filters?.brandStatus !== undefined &&
      !isBrandStatus(input.filters.brandStatus)
    ) {
      return safe(
        'InvalidBrandStatus',
        'Brand status filter is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.filters?.publicReferenceId !== undefined &&
      (typeof input.filters.publicReferenceId !== 'string' ||
        !controlledReference.test(input.filters.publicReferenceId))
    ) {
      return safe(
        'InvalidBrandReference',
        'Brand reference filter is invalid.',
        input.governance.correlationId
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
          (input.filters?.brandType === undefined ||
            record.brandType === input.filters.brandType) &&
          (input.filters?.brandStatus === undefined ||
            record.brandStatus === input.filters.brandStatus) &&
          (input.filters?.publicReferenceId === undefined ||
            record.objectRecord.publicReferenceId ===
              input.filters.publicReferenceId)
      )
      .map((record): CoreBrandListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        brandType: record.brandType,
        brandStatus: record.brandStatus,
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
        allowedSortFields: ['publicReferenceId', 'brandType', 'brandStatus'],
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

  validateBrandReference(input: {
    readonly brandReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreBrandGovernanceContext;
  }): CoreBehaviorResult<CoreBrandReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'brand.validate_reference',
      permission: 'brand:validate_reference',
      policyScope: 'brand.reference',
      target: input.brandReferenceId
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService
    );
    if (!requester.ok) return requester;
    const reference = validateBrandReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.brandReferenceId
    );
    if (!reference.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          brandReferenceId: input.brandReferenceId,
          brandType: null,
          brandStatus: null,
          reasonCode: 'InvalidReference'
        }
      };
    }
    const record = this.deps.store.get(input.brandReferenceId);
    if (!record) {
      return {
        ok: true,
        value: {
          isValid: false,
          brandReferenceId: input.brandReferenceId,
          brandType: null,
          brandStatus: null,
          reasonCode: 'NotFound'
        }
      };
    }
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scope.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          brandReferenceId: input.brandReferenceId,
          brandType: null,
          brandStatus: null,
          reasonCode: 'NotFound'
        }
      };
    }
    return {
      ok: true,
      value: {
        isValid: record.brandStatus === 'Active',
        brandReferenceId: input.brandReferenceId,
        brandType: record.brandType,
        brandStatus: record.brandStatus,
        reasonCode: record.brandStatus === 'Active' ? 'Valid' : record.brandStatus
      }
    };
  }

  changeBrandStatus(input: {
    readonly brandReferenceId: string;
    readonly targetStatus: CoreBrandStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreBrandGovernanceContext;
  }): CoreBehaviorResult<CoreBrandServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'brand.change_status',
      permission: 'brand:change_status',
      policyScope: 'brand.lifecycle',
      target: input.brandReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateBrandReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.brandReferenceId
    );
    if (!reference.ok) return reference;
    const existing = this.deps.store.get(input.brandReferenceId);
    if (!existing) {
      return safe(
        'BrandNotFound',
        'Brand was not found.',
        input.governance.correlationId
      );
    }
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(existing)
    );
    if (!scope.ok) return scope;
    const idempotent = this.deps.idempotencyRegistry.executeBehavior<
      {
        readonly brandReferenceId: string;
        readonly targetStatus: CoreBrandStatus;
        readonly reasonReference: string | null;
      },
      CoreBrandServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'changeBrandStatus'
        ),
        operationName: 'changeBrandStatus',
        request: {
          brandReferenceId: input.brandReferenceId,
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const current = this.deps.store.get(input.brandReferenceId);
        if (!current) {
          return safe(
            'BrandNotFound',
            'Brand was not found.',
            input.governance.correlationId
          );
        }
        const transition = `${current.brandStatus}->${input.targetStatus}`;
        if (!transitions.has(transition)) {
          return safe(
            'InvalidBrandTransition',
            'Brand status transition is invalid.',
            input.governance.correlationId
          );
        }
        if (
          reasonRequiredStatuses.has(input.targetStatus) &&
          (!input.reasonReference || !opaque.test(input.reasonReference))
        ) {
          return safe(
            'BrandReasonReferenceRequired',
            'Brand reason reference is required.',
            input.governance.correlationId
          );
        }
        const now = this.deps.now();
        if (!validUtcTimestamp(now)) {
          return safe(
            'ValidationFailed',
            'Clock value is invalid.',
            input.governance.correlationId
          );
        }
        const updated: CoreBrandServiceRecord = {
          ...current,
          brandStatus: input.targetStatus,
          objectRecord: {
            ...current.objectRecord,
            status: CORE_BRAND_STATUS_TO_OBJECT_STATUS[input.targetStatus],
            auditMetadata: {
              ...current.objectRecord.auditMetadata,
              updatedAt: now,
              updatedByReferenceId: input.governance.audit.actorReferenceId
            },
            version: current.objectRecord.version
              ? { ...current.objectRecord.version, updatedAt: now }
              : undefined
          }
        };
        if (
          updated.objectRecord.publicReferenceId !==
            current.objectRecord.publicReferenceId ||
          updated.objectRecord.objectType !== current.objectRecord.objectType ||
          updated.objectRecord.domainId !== current.objectRecord.domainId ||
          updated.objectRecord.objectContractId !==
            current.objectRecord.objectContractId ||
          updated.objectRecord.version?.version !== 1
        ) {
          return safe(
            'BrandObjectMismatch',
            'Brand immutable Object fields changed.',
            input.governance.correlationId
          );
        }
        const validated = validateBrandRecord(
          updated,
          reference.value,
          this.deps.relatedReferenceRegistry
        );
        if (!validated.ok) return validated;
        let replaced: CoreBehaviorResult<CoreBrandServiceRecord>;
        try {
          replaced = this.deps.store.replace(validated.value);
        } catch {
          return safe(
            'InternalError',
            'Brand Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!replaced.ok) return replaced;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'changeBrandStatus',
                input.brandReferenceId,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-status-changed',
              action: CORE_EVENT_ACTIONS.statusChanged,
              brandReferenceId: input.brandReferenceId,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                brandReferenceId: input.brandReferenceId,
                previousStatus: current.brandStatus,
                newStatus: input.targetStatus,
                reasonReference: input.reasonReference ?? null
              }
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
              'Brand status rollback failed.',
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
