import {
  paginateCoreItems,
  type CoreEventTraceRecord,
  type CorePaginatedResult
} from '../../behaviors/core-event-pagination-behavior.ts';
import {
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext,
  type CorePolicyContext,
  enforceCoreGovernedAction
} from '../../behaviors/core-governance-behavior.ts';
import { CoreIdempotencyRegistry } from '../../behaviors/core-idempotency-behavior.ts';
import {
  type CoreReferenceRecord,
  CoreReferenceRegistry
} from '../../behaviors/core-reference-behavior.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreErrorCategory,
  type CoreErrorCode
} from '../../behaviors/core-safe-error.ts';
import {
  CORE_SERVICE_CONTRACT_SKELETONS,
} from '../../contracts/index.ts';
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

export const CORE_CUSTOMER_TYPES = [
  'Individual',
  'Company',
  'AgencyClient',
  'InternalClient',
  'Unknown'
] as const;
export type CoreCustomerType = (typeof CORE_CUSTOMER_TYPES)[number];

export const CORE_CUSTOMER_STATUSES = [
  'Draft',
  'Active',
  'ReviewRequired',
  'Suspended',
  'Inactive',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreCustomerStatus = (typeof CORE_CUSTOMER_STATUSES)[number];

export const CORE_CUSTOMER_STATUS_TO_OBJECT_STATUS: Record<
  CoreCustomerStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  ReviewRequired: 'draft',
  Active: 'active',
  Suspended: 'inactive',
  Inactive: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

export const CORE_CUSTOMER_IMPLEMENTED_OPERATIONS = [
  'createCustomer',
  'getCustomer',
  'listCustomers',
  'validateCustomerReference',
  'changeCustomerStatus'
] as const;

export const CORE_CUSTOMER_MINIMUM_CAPABILITIES = [
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

export const CORE_CUSTOMER_COLLECTION_TARGET = 'customer:collection';
const CONTRACT_ID = 'core-service-customer-service-contract';
const CUSTOMER_OBJECT_TYPE = 'customer-record';
const CUSTOMER_DOMAIN = 'customer';
const CUSTOMER_OBJECT_CONTRACT_ID = 'core-object-customer-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const transitions = new Set([
  'Draft->Active',
  'Draft->ReviewRequired',
  'ReviewRequired->Active',
  'Active->Suspended',
  'Suspended->Active',
  'Active->Inactive',
  'Inactive->Active',
  'Inactive->Archived',
  'Active->Archived',
  'Archived->DeletedReferenceOnly'
]);

const reasonRequiredStatuses = new Set<CoreCustomerStatus>([
  'Suspended',
  'Inactive',
  'Archived',
  'DeletedReferenceOnly'
]);

const customerErrorCategories: Partial<Record<CoreErrorCode, CoreErrorCategory>> = {
  CustomerAlreadyExists: 'Conflict',
  CustomerNotFound: 'Reference',
  InvalidCustomerReference: 'Reference',
  InvalidCustomerTransition: 'State',
  InvalidCustomerStatus: 'State',
  PermissionDenied: 'Permission',
  PolicyRestricted: 'Policy',
  HumanReviewRequired: 'HumanReview',
  IdempotencyKeyRequired: 'Idempotency',
  IdempotencyKeyInvalid: 'Idempotency',
  IdempotencyConflict: 'Idempotency',
  EventTraceFailed: 'Event',
  AuditContextMissing: 'Validation',
  CustomerObjectMismatch: 'Validation',
  InternalError: 'Internal'
};

export interface CoreCustomerServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly customerType: CoreCustomerType;
  readonly customerStatus: CoreCustomerStatus;
  readonly nameReference: string;
  readonly sourceReference: string;
}

export interface CoreCustomerGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreCustomerServiceStore {
  get(customerReferenceId: string): CoreCustomerServiceRecord | undefined;
  list(): readonly CoreCustomerServiceRecord[];
  insert(
    record: CoreCustomerServiceRecord
  ): CoreBehaviorResult<CoreCustomerServiceRecord>;
  replace(
    record: CoreCustomerServiceRecord
  ): CoreBehaviorResult<CoreCustomerServiceRecord>;
  remove?(customerReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreCustomerEventTracePort {
  append(record: CoreEventTraceRecord): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreCustomerServiceDependencies {
  readonly store: CoreCustomerServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreCustomerEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: 'createCustomer' | 'changeCustomerStatus',
    customerReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
}

export interface CoreCustomerListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly customerType: CoreCustomerType;
  readonly customerStatus: CoreCustomerStatus;
  readonly genericObjectStatus: CoreObjectStatus | undefined;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface CoreCustomerReferenceValidationResult {
  readonly isValid: boolean;
  readonly customerReferenceId: string;
  readonly customerType: CoreCustomerType | null;
  readonly customerStatus: CoreCustomerStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Draft'
    | 'ReviewRequired'
    | 'Suspended'
    | 'Inactive'
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
      category: customerErrorCategories[code] ?? 'Validation',
      message,
      correlationId
    })
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function immutable<T>(value: T): T {
  return deepFreeze(clone(value));
}

function isCustomerType(value: unknown): value is CoreCustomerType {
  return (
    typeof value === 'string' &&
    (CORE_CUSTOMER_TYPES as readonly string[]).includes(value)
  );
}

function isCustomerStatus(value: unknown): value is CoreCustomerStatus {
  return (
    typeof value === 'string' &&
    (CORE_CUSTOMER_STATUSES as readonly string[]).includes(value)
  );
}

function validUtcTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function recordOrganizationScope(
  record: CoreCustomerServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreCustomerGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Customer organization scope is not authorized.',
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
  context: CoreCustomerGovernanceContext,
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
    return safe('AuditContextMissing', 'Governance audit linkage is invalid.', correlationId);
  }
  if (
    context.review.targetObjectType !== CUSTOMER_OBJECT_TYPE ||
    context.review.targetObjectReferenceId !== expected.target
  ) {
    return safe('HumanReviewRequired', 'Human Review target is invalid.', correlationId);
  }
  if (
    context.review.humanReviewRequired &&
    context.review.humanReviewReferenceId !== context.audit.humanReviewReferenceId
  ) {
    return safe('HumanReviewRequired', 'Human Review audit linkage is invalid.', correlationId);
  }
  if (
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== CUSTOMER_OBJECT_TYPE ||
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

function validateCustomerReferenceRecord(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: CUSTOMER_OBJECT_TYPE,
    expectedDomain: CUSTOMER_DOMAIN
  });
  if (!resolved.ok) {
    return safe('InvalidCustomerReference', 'Customer reference is invalid.');
  }
  return resolved;
}

function validateCustomerRecord(
  record: CoreCustomerServiceRecord,
  publicReferenceRecord: CoreReferenceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreCustomerServiceRecord> {
  if (!isCustomerType(record.customerType)) {
    return safe(
      'InvalidCustomerType',
      'Customer type is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!isCustomerStatus(record.customerStatus)) {
    return safe(
      'InvalidCustomerStatus',
      'Customer status is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    record.objectRecord.domainId !== CUSTOMER_DOMAIN ||
    record.objectRecord.objectType !== CUSTOMER_OBJECT_TYPE ||
    record.objectRecord.objectContractId !== CUSTOMER_OBJECT_CONTRACT_ID ||
    record.objectRecord.publicReferenceId !== publicReferenceRecord.referenceId
  ) {
    return safe(
      'CustomerObjectMismatch',
      'Customer Object foundation does not match.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    record.objectRecord.status !==
    CORE_CUSTOMER_STATUS_TO_OBJECT_STATUS[record.customerStatus]
  ) {
    return safe(
      'CustomerObjectMismatch',
      'Customer and Object statuses are inconsistent.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!record.nameReference.trim() || record.nameReference.length > 128) {
    return safe(
      'CustomerNameRequired',
      'Customer name reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!opaque.test(record.sourceReference)) {
    return safe(
      'CustomerSourceReferenceRequired',
      'Customer source reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  const validation = validateCoreMvpObjectBaseRecord(record.objectRecord, {
    publicReferenceRecord,
    relatedReferenceRegistry: registry
  });
  if (!validation.ok) {
    return safe(
      'ValidationFailed',
      'Customer Object base record is invalid.',
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
    return safe('InvalidCustomerReference', 'Requesting Domain is invalid.');
  }
  const service = CORE_SERVICE_CONTRACT_SKELETONS.find(
    (contract) => contract.serviceType === requestingService
  );
  if (!service || service.domainId !== requestingDomain) {
    return safe('InvalidCustomerReference', 'Requesting Service is invalid.');
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreCustomerGovernanceContext,
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

function eventTrace(
  input: {
    readonly id: CoreEventId;
    readonly type: string;
    readonly action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
    readonly customerReferenceId: string;
    readonly occurredAt: string;
    readonly correlationId: string;
    readonly auditContextReferenceId: string;
    readonly payload: Record<string, unknown>;
  }
): CoreEventTraceRecord {
  return {
    auditContextReferenceId: input.auditContextReferenceId,
    visibility: 'Internal',
    event: {
      id: input.id,
      type: createCoreEventType(input.type),
      action: input.action,
      domainId: CUSTOMER_DOMAIN,
      object: {
        id: createCoreObjectId(input.customerReferenceId),
        type: createCoreObjectType(CUSTOMER_OBJECT_TYPE),
        domainId: CUSTOMER_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryCustomerServiceStore implements CoreCustomerServiceStore {
  readonly #records = new Map<string, CoreCustomerServiceRecord>();

  get(id: string): CoreCustomerServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreCustomerServiceRecord[] {
    return [...this.#records.values()].map((record) => immutable(record));
  }

  insert(
    record: CoreCustomerServiceRecord
  ): CoreBehaviorResult<CoreCustomerServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id)) {
      return safe(
        'CustomerAlreadyExists',
        'Customer already exists.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreCustomerServiceRecord
  ): CoreBehaviorResult<CoreCustomerServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id)) {
      return safe(
        'CustomerNotFound',
        'Customer was not found.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(customerReferenceId: string): CoreBehaviorResult<null> {
    this.#records.delete(customerReferenceId);
    return { ok: true, value: null };
  }
}

export class CoreCustomerService {
  constructor(readonly deps: CoreCustomerServiceDependencies) {}

  createCustomer(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly customerType: unknown;
    readonly customerStatus: unknown;
    readonly nameReference: string;
    readonly sourceReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCustomerGovernanceContext;
  }): CoreBehaviorResult<CoreCustomerServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'customer.create',
      permission: 'customer:create',
      policyScope: 'customer.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      recordOrganizationScope(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (!['Draft', 'ReviewRequired', 'Active'].includes(String(input.customerStatus))) {
      return safe(
        'InvalidCustomerStatus',
        'Initial Customer status is invalid.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior<
      {
        readonly objectRecord: CoreMvpObjectBaseRecord;
        readonly customerType: unknown;
        readonly customerStatus: unknown;
        readonly nameReference: string;
        readonly sourceReference: string;
      },
      CoreCustomerServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createCustomer'),
        operationName: 'createCustomer',
        request: {
          objectRecord: input.objectRecord,
          customerType: input.customerType,
          customerStatus: input.customerStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target)) {
          return safe<CoreCustomerServiceRecord>(
            'CustomerAlreadyExists',
            'Customer already exists.',
            input.governance.correlationId
          );
        }
        const record: CoreCustomerServiceRecord = {
          objectRecord: input.objectRecord,
          customerType: input.customerType as CoreCustomerType,
          customerStatus: input.customerStatus as CoreCustomerStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference
        };
        const valid = validateCustomerRecord(
          record,
          input.publicReferenceRecord,
          this.deps.relatedReferenceRegistry
        );
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const now = this.deps.now();
        if (!validUtcTimestamp(now)) {
          this.deps.store.remove?.(target);
          return safe('ValidationFailed', 'Clock value is invalid.', input.governance.correlationId);
        }
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              'createCustomer',
              target,
              input.idempotencyKey ?? ''
            ),
            type: 'core-object-created',
            action: CORE_EVENT_ACTIONS.created,
            customerReferenceId: target,
            occurredAt: now,
            correlationId: input.governance.correlationId,
            auditContextReferenceId: input.governance.auditContextReferenceId,
            payload: {
              customerReferenceId: target,
              customerType: valid.value.customerType,
              customerStatus: valid.value.customerStatus
            }
          })
        );
        if (!event.ok) {
          const rollback = this.deps.store.remove?.(target);
          if (rollback && !rollback.ok) {
            return safe('InternalError', 'Customer create rollback failed.', input.governance.correlationId);
          }
          return safe('EventTraceFailed', 'Event trace failed.', input.governance.correlationId);
        }
        return inserted;
      }
    );
    return idempotent.ok ? { ok: true, value: idempotent.value.result } : idempotent;
  }

  getCustomer(input: {
    readonly customerReferenceId: string;
    readonly governance: CoreCustomerGovernanceContext;
  }): CoreBehaviorResult<CoreCustomerServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'customer.read',
      permission: 'customer:read',
      policyScope: 'customer.read',
      target: input.customerReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateCustomerReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.customerReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.customerReferenceId);
    if (!record || record.customerStatus === 'DeletedReferenceOnly') {
      return safe('CustomerNotFound', 'Customer was not found.', input.governance.correlationId);
    }
    const scope = enforceOrganizationScope(input.governance, recordOrganizationScope(record));
    if (!scope.ok) return scope;
    if (record.objectRecord.publicReferenceId !== input.customerReferenceId) {
      return safe('InvalidCustomerReference', 'Customer reference is invalid.', input.governance.correlationId);
    }
    return { ok: true, value: immutable(record) };
  }

  listCustomers(input: {
    readonly filters?: {
      readonly customerType?: unknown;
      readonly customerStatus?: unknown;
      readonly publicReferenceId?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreCustomerGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreCustomerListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'customer.list',
      permission: 'customer:list',
      policyScope: 'customer.list',
      target: CORE_CUSTOMER_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (input.filters?.customerType !== undefined && !isCustomerType(input.filters.customerType)) {
      return safe('InvalidCustomerType', 'Customer type filter is invalid.', input.governance.correlationId);
    }
    if (input.filters?.customerStatus !== undefined && !isCustomerStatus(input.filters.customerStatus)) {
      return safe('InvalidCustomerStatus', 'Customer status filter is invalid.', input.governance.correlationId);
    }
    if (
      input.filters?.publicReferenceId !== undefined &&
      (typeof input.filters.publicReferenceId !== 'string' ||
        !controlledReference.test(input.filters.publicReferenceId))
    ) {
      return safe('InvalidCustomerReference', 'Customer reference filter is invalid.', input.governance.correlationId);
    }
    if (
      input.pagination?.sortDirection !== undefined &&
      input.pagination.sortDirection !== null &&
      input.pagination.sortDirection !== 'Asc' &&
      input.pagination.sortDirection !== 'Desc'
    ) {
      return safe('ValidationFailed', 'Pagination sort direction is invalid.', input.governance.correlationId);
    }
    const items = this.deps.store
      .list()
      .filter((record) =>
        recordOrganizationScope(record) ===
        (input.governance.authorizedOrganizationReferenceId ?? null)
      )
      .filter(
        (record) =>
          (input.filters?.customerType === undefined ||
            record.customerType === input.filters.customerType) &&
          (input.filters?.customerStatus === undefined ||
            record.customerStatus === input.filters.customerStatus) &&
          (input.filters?.publicReferenceId === undefined ||
            record.objectRecord.publicReferenceId === input.filters.publicReferenceId)
      )
      .map((record): CoreCustomerListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        customerType: record.customerType,
        customerStatus: record.customerStatus,
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
        allowedSortFields: ['publicReferenceId', 'customerType', 'customerStatus'],
        totalCountAllowed: input.governance.policy.restrictedFieldsOmitted === false,
        correlationId: input.governance.correlationId
      },
      {
        queryKey: JSON.stringify(input.filters ?? {}),
        cursorSecret: this.deps.cursorSecret,
        visible: () => true
      }
    );
  }

  validateCustomerReference(input: {
    readonly customerReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreCustomerGovernanceContext;
  }): CoreBehaviorResult<CoreCustomerReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'customer.validate_reference',
      permission: 'customer:validate_reference',
      policyScope: 'customer.reference',
      target: input.customerReferenceId
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService
    );
    if (!requester.ok) return requester;
    const reference = validateCustomerReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.customerReferenceId
    );
    if (!reference.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          customerReferenceId: input.customerReferenceId,
          customerType: null,
          customerStatus: null,
          reasonCode: 'InvalidReference'
        }
      };
    }
    const record = this.deps.store.get(input.customerReferenceId);
    if (!record) {
      return {
        ok: true,
        value: {
          isValid: false,
          customerReferenceId: input.customerReferenceId,
          customerType: null,
          customerStatus: null,
          reasonCode: 'NotFound'
        }
      };
    }
    const scope = enforceOrganizationScope(input.governance, recordOrganizationScope(record));
    if (!scope.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          customerReferenceId: input.customerReferenceId,
          customerType: null,
          customerStatus: null,
          reasonCode: 'NotFound'
        }
      };
    }
    return {
      ok: true,
      value: {
        isValid: record.customerStatus === 'Active',
        customerReferenceId: input.customerReferenceId,
        customerType: record.customerType,
        customerStatus: record.customerStatus,
        reasonCode: record.customerStatus === 'Active' ? 'Valid' : record.customerStatus
      }
    };
  }

  changeCustomerStatus(input: {
    readonly customerReferenceId: string;
    readonly targetStatus: CoreCustomerStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCustomerGovernanceContext;
  }): CoreBehaviorResult<CoreCustomerServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'customer.change_status',
      permission: 'customer:change_status',
      policyScope: 'customer.lifecycle',
      target: input.customerReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateCustomerReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.customerReferenceId
    );
    if (!reference.ok) return reference;
    const existing = this.deps.store.get(input.customerReferenceId);
    if (!existing) {
      return safe('CustomerNotFound', 'Customer was not found.', input.governance.correlationId);
    }
    const scope = enforceOrganizationScope(input.governance, recordOrganizationScope(existing));
    if (!scope.ok) return scope;
    const transition = `${existing.customerStatus}->${input.targetStatus}`;
    if (!transitions.has(transition)) {
      return safe(
        'InvalidCustomerTransition',
        'Customer status transition is invalid.',
        input.governance.correlationId
      );
    }
    if (
      reasonRequiredStatuses.has(input.targetStatus) &&
      (!input.reasonReference || !opaque.test(input.reasonReference))
    ) {
      return safe(
        'CustomerReasonReferenceRequired',
        'Customer reason reference is required.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior<
      {
        readonly customerReferenceId: string;
        readonly targetStatus: CoreCustomerStatus;
        readonly reasonReference: string | null;
      },
      CoreCustomerServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'changeCustomerStatus'),
        operationName: 'changeCustomerStatus',
        request: {
          customerReferenceId: input.customerReferenceId,
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const now = this.deps.now();
        if (!validUtcTimestamp(now)) {
          return safe('ValidationFailed', 'Clock value is invalid.', input.governance.correlationId);
        }
        const updated: CoreCustomerServiceRecord = {
          ...existing,
          customerStatus: input.targetStatus,
          objectRecord: {
            ...existing.objectRecord,
            status: CORE_CUSTOMER_STATUS_TO_OBJECT_STATUS[input.targetStatus],
            auditMetadata: {
              ...existing.objectRecord.auditMetadata,
              updatedAt: now,
              updatedByReferenceId: input.governance.audit.actorReferenceId
            },
            version: existing.objectRecord.version
              ? { ...existing.objectRecord.version, updatedAt: now }
              : undefined
          }
        };
        if (
          updated.objectRecord.publicReferenceId !== existing.objectRecord.publicReferenceId ||
          updated.objectRecord.objectType !== existing.objectRecord.objectType ||
          updated.objectRecord.domainId !== existing.objectRecord.domainId ||
          updated.objectRecord.objectContractId !== existing.objectRecord.objectContractId ||
          updated.objectRecord.version?.version !== 1
        ) {
          return safe('CustomerObjectMismatch', 'Customer immutable Object fields changed.', input.governance.correlationId);
        }
        const validated = validateCustomerRecord(updated, reference.value, this.deps.relatedReferenceRegistry);
        if (!validated.ok) return validated;
        const replaced = this.deps.store.replace(validated.value);
        if (!replaced.ok) return replaced;
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              'changeCustomerStatus',
              input.customerReferenceId,
              input.idempotencyKey ?? ''
            ),
            type: 'core-object-status-changed',
            action: CORE_EVENT_ACTIONS.statusChanged,
            customerReferenceId: input.customerReferenceId,
            occurredAt: now,
            correlationId: input.governance.correlationId,
            auditContextReferenceId: input.governance.auditContextReferenceId,
            payload: {
              customerReferenceId: input.customerReferenceId,
              previousStatus: existing.customerStatus,
              newStatus: input.targetStatus,
              reasonReference: input.reasonReference ?? null
            }
          })
        );
        if (!event.ok) {
          const rollback = this.deps.store.replace(existing);
          if (!rollback.ok) {
            return safe('InternalError', 'Customer status rollback failed.', input.governance.correlationId);
          }
          return safe('EventTraceFailed', 'Event trace failed.', input.governance.correlationId);
        }
        return replaced;
      }
    );
    return idempotent.ok ? { ok: true, value: idempotent.value.result } : idempotent;
  }
}
