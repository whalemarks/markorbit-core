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
import type { CoreDomainId } from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  createCoreEventType,
  type CoreEventId
} from '../../events/index.ts';
import type {
  CoreJsonObject,
  CoreMvpObjectBaseRecord
} from '../../objects/core-mvp-object-base-record.ts';
import type { CoreObjectStatus } from '../../objects/core-object-status.ts';
import {
  createCoreObjectId,
  createCoreObjectType
} from '../../objects/index.ts';

export const CORE_ORDER_TYPES = [
  'TrademarkFiling',
  'TrademarkSearch',
  'OfficeActionResponse',
  'Renewal',
  'Change',
  'Assignment',
  'Opposition',
  'Cancellation',
  'EvidenceReview',
  'DocumentReview',
  'GeneralConsultation',
  'Bundle',
  'Other',
  'Unknown'
] as const;
export type CoreOrderType = (typeof CORE_ORDER_TYPES)[number];

export const CORE_ORDER_STATUSES = [
  'Draft',
  'PendingConfirmation',
  'Confirmed',
  'ReadyForMatter',
  'MatterCreated',
  'InProgress',
  'WaitingForCustomer',
  'Completed',
  'Cancelled',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreOrderStatus = (typeof CORE_ORDER_STATUSES)[number];

export const CORE_ORDER_CUSTOMER_LINK_TYPES = [
  'Requester',
  'Applicant',
  'Owner',
  'Payor',
  'Representative',
  'Beneficiary',
  'InterestedParty',
  'Unknown'
] as const;
export type CoreOrderCustomerLinkType =
  (typeof CORE_ORDER_CUSTOMER_LINK_TYPES)[number];

export const CORE_ORDER_MATTER_LINK_TYPES = [
  'PrimaryMatter',
  'SupplementalMatter',
  'RelatedMatter',
  'HistoricalMatter',
  'Unknown'
] as const;
export type CoreOrderMatterLinkType =
  (typeof CORE_ORDER_MATTER_LINK_TYPES)[number];

export const CORE_ORDER_IMPLEMENTED_OPERATIONS = [
  'createOrder',
  'getOrder',
  'listOrders',
  'updateOrder',
  'changeOrderStatus',
  'linkOrderCustomer',
  'linkOrderOpportunity',
  'linkOrderBrand',
  'linkOrderTrademark',
  'linkOrderMatter',
  'validateOrderReference',
  'validateOrderReadiness',
  'acceptOrder',
  'cancelOrder'
] as const;

export const CORE_ORDER_MINIMUM_CAPABILITIES = [
  'create where required',
  'read where required',
  'search/list where required',
  'governed metadata update',
  'validate_reference',
  'validate readiness without Matter creation',
  'complete Book 02 lifecycle enforcement',
  'customer, opportunity, brand, trademark, and matter linkage',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive'
] as const;

export const CORE_ORDER_COLLECTION_TARGET = 'order:collection';

const CONTRACT_ID = 'core-service-order-service-contract';
const ORDER_OBJECT_TYPE = 'order-record';
const ORDER_DOMAIN = 'order';
const ORDER_OBJECT_CONTRACT_ID = 'core-object-order-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreOrderStatus, CoreObjectStatus> = {
  Draft: 'draft',
  PendingConfirmation: 'draft',
  Confirmed: 'active',
  ReadyForMatter: 'active',
  MatterCreated: 'active',
  InProgress: 'active',
  WaitingForCustomer: 'active',
  Completed: 'active',
  Cancelled: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->PendingConfirmation',
  'Draft->Confirmed',
  'PendingConfirmation->Confirmed',
  'Confirmed->ReadyForMatter',
  'ReadyForMatter->MatterCreated',
  'MatterCreated->InProgress',
  'InProgress->WaitingForCustomer',
  'WaitingForCustomer->InProgress',
  'InProgress->Completed',
  'Draft->Cancelled',
  'PendingConfirmation->Cancelled',
  'Confirmed->Cancelled',
  'Completed->Archived',
  'Cancelled->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreOrderGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreOrderCustomerLink {
  readonly customerReferenceId: string;
  readonly linkType: CoreOrderCustomerLinkType;
}

export interface CoreOrderMatterLink {
  readonly matterReferenceId: string;
  readonly linkType: CoreOrderMatterLinkType;
}

export interface CoreOrderServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly orderType: CoreOrderType;
  readonly titleReference: string;
  readonly orderStatus: CoreOrderStatus;
  readonly serviceScopeReference: string;
  readonly sourceReference: string;
  readonly customerLinks: readonly CoreOrderCustomerLink[];
  readonly opportunityReferenceIds: readonly string[];
  readonly brandReferenceIds: readonly string[];
  readonly trademarkReferenceIds: readonly string[];
  readonly matterLinks: readonly CoreOrderMatterLink[];
}

export interface CoreOrderValidationResult {
  readonly isValid: boolean;
  readonly orderReferenceId: string;
  readonly orderType: CoreOrderType;
  readonly status: CoreOrderStatus;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'InvalidReference'
    | 'Draft'
    | 'Cancelled'
    | 'Completed'
    | 'Archived'
    | 'ReviewRequired'
    | 'PolicyRestricted';
  readonly customerReferenceHint: boolean;
  readonly serviceScopeHint: boolean;
  readonly matterReferenceHint: boolean;
  readonly policyHint: 'Allowed' | 'Restricted' | null;
}

export interface CoreOrderReadinessResult {
  readonly isReady: boolean;
  readonly missingRequiredReferences: readonly string[];
  readonly reviewRequired: boolean;
  readonly recommendedNextAction:
    | 'ConfirmOrder'
    | 'LinkCustomer'
    | 'AddServiceScope'
    | 'MarkReadyForMatter'
    | 'CreateMatter'
    | 'None';
  readonly reasonCode:
    | 'Ready'
    | 'Draft'
    | 'CustomerRequired'
    | 'ServiceScopeRequired'
    | 'Cancelled'
    | 'Completed'
    | 'Archived'
    | 'MatterAlreadyCreated';
}

export interface CoreOrderListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly orderType: CoreOrderType;
  readonly orderStatus: CoreOrderStatus;
  readonly customerLinked: boolean;
  readonly opportunityLinked: boolean;
  readonly brandLinked: boolean;
  readonly trademarkLinked: boolean;
  readonly matterCount: number;
  readonly serviceScopePresent: boolean;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface CoreOrderServiceStore {
  get(id: string): CoreOrderServiceRecord | undefined;
  list(): readonly CoreOrderServiceRecord[];
  insert(
    record: CoreOrderServiceRecord
  ): CoreBehaviorResult<CoreOrderServiceRecord>;
  replace(
    record: CoreOrderServiceRecord
  ): CoreBehaviorResult<CoreOrderServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreOrderEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreOrderServiceDependencies {
  readonly store: CoreOrderServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreOrderEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly requestingServiceDirectory: readonly {
    readonly domainId: CoreDomainId;
    readonly serviceType: string;
  }[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: string,
    orderReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
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

function safe<T = never>(
  code: CoreErrorCode,
  category: CoreErrorCategory,
  message: string,
  correlationId?: string
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({ code, category, message, correlationId })
  };
}

function included<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function organizationScopeOf(
  record: CoreOrderServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function ensureGovernance(
  context: CoreOrderGovernanceContext,
  expected: {
    readonly operation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly target: string;
  }
): CoreBehaviorResult<null> {
  if (
    context.permission.correlationId !== context.correlationId ||
    context.policy.correlationId !== context.correlationId ||
    context.audit.correlationId !== context.correlationId ||
    context.permission.intendedOperation !== expected.operation ||
    context.policy.intendedOperation !== expected.operation ||
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== ORDER_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Order governance context is invalid.',
      context.correlationId
    );
  }
  const governed = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  return governed.ok ? { ok: true, value: null } : governed;
}

function enforceOrganizationScope(
  governance: CoreOrderGovernanceContext,
  recordOrganization: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    recordOrganization &&
    governance.authorizedOrganizationReferenceId !== recordOrganization
  ) {
    return safe(
      'OrderNotFound',
      'Reference',
      'Order was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreOrderGovernanceContext,
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

function resolveReference(
  registry: CoreReferenceRegistry,
  referenceId: string,
  objectType: string,
  domain: string,
  code: CoreErrorCode,
  correlationId?: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: objectType,
    expectedDomain: domain
  });
  return resolved.ok
    ? resolved
    : safe(
        code,
        'Reference',
        'Related Order reference is invalid.',
        correlationId
      );
}

function eventTrace(input: {
  readonly id: CoreEventId;
  readonly action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
  readonly eventType: string;
  readonly orderReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreOrderGovernanceContext;
  readonly payload: Record<string, unknown>;
}): CoreEventTraceRecord {
  return {
    auditContextReferenceId: input.governance.auditContextReferenceId,
    visibility: 'Internal',
    event: {
      id: input.id,
      type: createCoreEventType(
        input.eventType.replaceAll('.', '-').replaceAll('_', '-')
      ),
      action: input.action,
      domainId: ORDER_DOMAIN,
      object: {
        id: createCoreObjectId(input.orderReferenceId),
        type: createCoreObjectType(ORDER_OBJECT_TYPE),
        domainId: ORDER_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function updatedObject(
  current: CoreOrderServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status: CoreOrderStatus
): CoreMvpObjectBaseRecord {
  return {
    ...current.objectRecord,
    status: statusToObjectStatus[status],
    version: current.objectRecord.version
      ? { ...current.objectRecord.version, updatedAt: now }
      : undefined,
    auditMetadata: {
      ...current.objectRecord.auditMetadata,
      updatedAt: now,
      updatedByReferenceId:
        actorReferenceId ??
        current.objectRecord.auditMetadata.createdByReferenceId
    }
  };
}

function validateRecord(
  record: CoreOrderServiceRecord
): CoreBehaviorResult<CoreOrderServiceRecord> {
  if (
    !included(CORE_ORDER_TYPES, record.orderType) ||
    record.orderType === 'Unknown'
  )
    return safe('InvalidOrderType', 'Validation', 'Order type is invalid.');
  if (!included(CORE_ORDER_STATUSES, record.orderStatus))
    return safe('InvalidOrderStatus', 'State', 'Order status is invalid.');
  if (!record.titleReference.trim())
    return safe(
      'OrderTitleRequired',
      'Validation',
      'Order title reference is required.'
    );
  if (!opaque.test(record.serviceScopeReference))
    return safe(
      'OrderServiceScopeRequired',
      'Validation',
      'Order service scope reference is required.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'OrderSourceReferenceRequired',
      'Validation',
      'Order source reference is required.'
    );
  if (record.customerLinks.length === 0)
    return safe(
      'OrderCustomerRequired',
      'Validation',
      'Order requires a Customer relationship.'
    );
  if (
    record.objectRecord.objectType !== ORDER_OBJECT_TYPE ||
    record.objectRecord.domainId !== ORDER_DOMAIN ||
    record.objectRecord.objectContractId !== ORDER_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.orderStatus]
  )
    return safe(
      'OrderObjectMismatch',
      'Validation',
      'Order Object foundation does not match.'
    );
  return { ok: true, value: immutable(record) };
}

export class CoreInMemoryOrderServiceStore implements CoreOrderServiceStore {
  readonly #records = new Map<string, CoreOrderServiceRecord>();
  get(id: string): CoreOrderServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }
  list(): readonly CoreOrderServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }
  insert(
    record: CoreOrderServiceRecord
  ): CoreBehaviorResult<CoreOrderServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe('OrderAlreadyExists', 'Conflict', 'Order already exists.');
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }
  replace(
    record: CoreOrderServiceRecord
  ): CoreBehaviorResult<CoreOrderServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe('OrderNotFound', 'Reference', 'Order was not found.');
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }
  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreOrderService {
  constructor(readonly deps: CoreOrderServiceDependencies) {}

  createOrder(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly orderType: unknown;
    readonly titleReference: string;
    readonly orderStatus: unknown;
    readonly serviceScopeReference: string;
    readonly sourceReference: string;
    readonly customerReferenceId: string;
    readonly customerLinkType: unknown;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'order.create',
      permission: 'order:create',
      policyScope: 'order.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (input.orderStatus !== 'Draft')
      return safe(
        'InvalidOrderStatus',
        'State',
        'Order creation must start as Draft.',
        input.governance.correlationId
      );
    const reference = resolveReference(
      this.deps.relatedReferenceRegistry,
      input.publicReferenceRecord.referenceId,
      ORDER_OBJECT_TYPE,
      ORDER_DOMAIN,
      'InvalidOrderReference',
      input.governance.correlationId
    );
    if (!reference.ok || target !== input.publicReferenceRecord.referenceId)
      return safe(
        'InvalidOrderReference',
        'Reference',
        'Order reference is invalid.',
        input.governance.correlationId
      );
    if (
      !included(CORE_ORDER_CUSTOMER_LINK_TYPES, input.customerLinkType) ||
      input.customerLinkType === 'Unknown'
    )
      return safe(
        'InvalidOrderCustomerLinkType',
        'Validation',
        'Order Customer link type is invalid.',
        input.governance.correlationId
      );
    const customer = resolveReference(
      this.deps.relatedReferenceRegistry,
      input.customerReferenceId,
      'customer-record',
      'customer',
      'InvalidOrderCustomerReference',
      input.governance.correlationId
    );
    if (!customer.ok) return customer;
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createOrder'),
        operationName: 'createOrder',
        request: {
          target,
          orderType: input.orderType,
          titleReference: input.titleReference,
          serviceScopeReference: input.serviceScopeReference,
          sourceReference: input.sourceReference,
          customerReferenceId: input.customerReferenceId,
          customerLinkType: input.customerLinkType
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe(
            'OrderAlreadyExists',
            'Conflict',
            'Order already exists.'
          );
        const record: CoreOrderServiceRecord = {
          objectRecord: input.objectRecord,
          orderType: input.orderType as CoreOrderType,
          titleReference: input.titleReference,
          orderStatus: input.orderStatus as CoreOrderStatus,
          serviceScopeReference: input.serviceScopeReference,
          sourceReference: input.sourceReference,
          customerLinks: [
            {
              customerReferenceId: input.customerReferenceId,
              linkType: input.customerLinkType as CoreOrderCustomerLinkType
            }
          ],
          opportunityReferenceIds: [],
          brandReferenceIds: [],
          trademarkReferenceIds: [],
          matterLinks: []
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const now = this.deps.now();
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              'createOrder',
              target,
              input.idempotencyKey ?? ''
            ),
            action: CORE_EVENT_ACTIONS.created,
            eventType: 'order-created',
            orderReferenceId: target,
            occurredAt: now,
            governance: input.governance,
            payload: {
              orderReferenceId: target,
              orderType: valid.value.orderType,
              status: valid.value.orderStatus
            }
          })
        );
        if (!event.ok) {
          this.deps.store.remove(target);
          return safe(
            'EventTraceFailed',
            'Event',
            'Order event trace failed.',
            input.governance.correlationId
          );
        }
        return inserted;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }

  getOrder(input: {
    readonly orderReferenceId: string;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'order.read',
      permission: 'order:read',
      policyScope: 'order.read',
      target: input.orderReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.orderReferenceId);
    if (!record)
      return safe(
        'OrderNotFound',
        'Reference',
        'Order was not found.',
        input.governance.correlationId
      );
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scope.ok ? { ok: true, value: immutable(record) } : scope;
  }

  listOrders(input: {
    readonly filters?: {
      readonly orderType?: unknown;
      readonly orderStatus?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreOrderListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'order.list',
      permission: 'order:list',
      policyScope: 'order.list',
      target: CORE_ORDER_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.orderType !== undefined &&
      !included(CORE_ORDER_TYPES, input.filters.orderType)
    )
      return safe(
        'InvalidOrderType',
        'Validation',
        'Order type filter is invalid.'
      );
    if (
      input.filters?.orderStatus !== undefined &&
      !included(CORE_ORDER_STATUSES, input.filters.orderStatus)
    )
      return safe(
        'InvalidOrderStatus',
        'State',
        'Order status filter is invalid.'
      );
    const items = this.deps.store
      .list()
      .filter((record) => {
        const org = organizationScopeOf(record);
        return (
          (!input.governance.authorizedOrganizationReferenceId ||
            !org ||
            org === input.governance.authorizedOrganizationReferenceId) &&
          (!input.filters?.orderType ||
            record.orderType === input.filters.orderType) &&
          (!input.filters?.orderStatus ||
            record.orderStatus === input.filters.orderStatus)
        );
      })
      .map((record): CoreOrderListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        orderType: record.orderType,
        orderStatus: record.orderStatus,
        customerLinked: record.customerLinks.length > 0,
        opportunityLinked: record.opportunityReferenceIds.length > 0,
        brandLinked: record.brandReferenceIds.length > 0,
        trademarkLinked: record.trademarkReferenceIds.length > 0,
        matterCount: record.matterLinks.length,
        serviceScopePresent: Boolean(record.serviceScopeReference),
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
        allowedSortFields: ['createdAt', 'publicReferenceId', 'orderStatus'],
        totalCountAllowed: true,
        correlationId: input.governance.correlationId
      },
      {
        queryKey: JSON.stringify(input.filters ?? {}),
        cursorSecret: this.deps.cursorSecret,
        visible: () => true
      }
    );
  }

  updateOrder(input: {
    readonly orderReferenceId: string;
    readonly patch: {
      readonly orderType?: unknown;
      readonly titleReference?: string;
      readonly serviceScopeReference?: string;
      readonly metadata?: CoreJsonObject;
    };
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    const current = this.deps.store.get(input.orderReferenceId);
    if (!current)
      return safe(
        'OrderNotFound',
        'Reference',
        'Order was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'order.update',
      permission: 'order:update',
      policyScope: 'order.write',
      target: input.orderReferenceId
    });
    if (!governed.ok) return governed;
    if (
      ['Completed', 'Cancelled', 'Archived', 'DeletedReferenceOnly'].includes(
        current.orderStatus
      )
    )
      return safe(
        'InvalidOrderTransition',
        'State',
        'Finalized Order cannot be updated.',
        input.governance.correlationId
      );
    if (Object.keys(input.patch).length === 0)
      return safe(
        'ValidationFailed',
        'Validation',
        'Order update patch is empty.'
      );
    return this.mutate(
      input.orderReferenceId,
      'updateOrder',
      input.idempotencyKey,
      input.governance,
      input.patch,
      (record, now) => ({
        ...record,
        orderType: (input.patch.orderType ?? record.orderType) as CoreOrderType,
        titleReference: input.patch.titleReference ?? record.titleReference,
        serviceScopeReference:
          input.patch.serviceScopeReference ?? record.serviceScopeReference,
        objectRecord: {
          ...updatedObject(
            record,
            now,
            input.governance.permission.actorReferenceId,
            record.orderStatus
          ),
          metadata: input.patch.metadata ?? record.objectRecord.metadata
        }
      }),
      CORE_EVENT_ACTIONS.updated,
      'order.updated'
    );
  }

  changeOrderStatus(input: {
    readonly orderReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    const current = this.deps.store.get(input.orderReferenceId);
    if (!current)
      return safe(
        'OrderNotFound',
        'Reference',
        'Order was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'order.change_status',
      permission: 'order:change_status',
      policyScope: 'order.lifecycle',
      target: input.orderReferenceId
    });
    if (!governed.ok) return governed;
    if (
      !included(CORE_ORDER_STATUSES, input.nextStatus) ||
      !lifecycleTransitions.has(`${current.orderStatus}->${input.nextStatus}`)
    )
      return safe(
        'InvalidOrderTransition',
        'State',
        'Order status transition is not allowed.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReferenceId))
      return safe(
        'OrderReasonReferenceRequired',
        'Validation',
        'Order reason reference is required.'
      );
    if (
      input.nextStatus === 'ReadyForMatter' &&
      (current.customerLinks.length === 0 || !current.serviceScopeReference)
    )
      return safe(
        'InvalidOrderTransition',
        'State',
        'Order readiness requires Customer and service scope references.',
        input.governance.correlationId
      );
    if (
      input.nextStatus === 'MatterCreated' &&
      current.matterLinks.length === 0
    )
      return safe(
        'InvalidOrderTransition',
        'State',
        'MatterCreated status requires a governed Matter relationship.',
        input.governance.correlationId
      );
    return this.mutate(
      input.orderReferenceId,
      'changeOrderStatus',
      input.idempotencyKey,
      input.governance,
      {
        nextStatus: input.nextStatus,
        reasonReferenceId: input.reasonReferenceId
      },
      (record, now) => ({
        ...record,
        orderStatus: input.nextStatus as CoreOrderStatus,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          input.nextStatus as CoreOrderStatus
        )
      }),
      input.nextStatus === 'Completed'
        ? CORE_EVENT_ACTIONS.completed
        : input.nextStatus === 'Archived'
          ? CORE_EVENT_ACTIONS.archived
          : CORE_EVENT_ACTIONS.statusChanged,
      'order.status_changed'
    );
  }

  linkOrderCustomer(input: {
    readonly orderReferenceId: string;
    readonly customerReferenceId: string;
    readonly linkType: unknown;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    if (
      !included(CORE_ORDER_CUSTOMER_LINK_TYPES, input.linkType) ||
      input.linkType === 'Unknown'
    )
      return safe(
        'InvalidOrderCustomerLinkType',
        'Validation',
        'Order Customer link type is invalid.'
      );
    return this.link(
      input.orderReferenceId,
      'linkOrderCustomer',
      input.customerReferenceId,
      'customer-record',
      'customer',
      'InvalidOrderCustomerReference',
      input.idempotencyKey,
      input.governance,
      (record) =>
        record.customerLinks.some(
          (link) => link.customerReferenceId === input.customerReferenceId
        )
          ? null
          : {
              ...record,
              customerLinks: [
                ...record.customerLinks,
                {
                  customerReferenceId: input.customerReferenceId,
                  linkType: input.linkType as CoreOrderCustomerLinkType
                }
              ]
            }
    );
  }

  linkOrderOpportunity(input: LinkInput<'opportunityReferenceId'>) {
    return this.linkArray(
      input,
      'linkOrderOpportunity',
      'opportunity-record',
      'opportunity',
      'InvalidOrderOpportunityReference',
      'opportunityReferenceIds'
    );
  }

  linkOrderBrand(input: LinkInput<'brandReferenceId'>) {
    return this.linkArray(
      input,
      'linkOrderBrand',
      'brand-record',
      'brand',
      'InvalidOrderBrandReference',
      'brandReferenceIds'
    );
  }

  linkOrderTrademark(input: LinkInput<'trademarkReferenceId'>) {
    return this.linkArray(
      input,
      'linkOrderTrademark',
      'trademark-record',
      'trademark',
      'InvalidOrderTrademarkReference',
      'trademarkReferenceIds'
    );
  }

  linkOrderMatter(input: {
    readonly orderReferenceId: string;
    readonly matterReferenceId: string;
    readonly linkType: unknown;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    if (
      !included(CORE_ORDER_MATTER_LINK_TYPES, input.linkType) ||
      input.linkType === 'Unknown'
    )
      return safe(
        'InvalidOrderMatterLinkType',
        'Validation',
        'Order Matter link type is invalid.'
      );
    return this.link(
      input.orderReferenceId,
      'linkOrderMatter',
      input.matterReferenceId,
      'matter-record',
      'matter',
      'InvalidOrderMatterReference',
      input.idempotencyKey,
      input.governance,
      (record) =>
        record.matterLinks.some(
          (link) => link.matterReferenceId === input.matterReferenceId
        )
          ? null
          : {
              ...record,
              matterLinks: [
                ...record.matterLinks,
                {
                  matterReferenceId: input.matterReferenceId,
                  linkType: input.linkType as CoreOrderMatterLinkType
                }
              ]
            }
    );
  }

  validateOrderReference(input: {
    readonly orderReferenceId: string;
    readonly requestingDomain: string;
    readonly requestingService: string;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'order.validate_reference',
      permission: 'order:validate_reference',
      policyScope: 'order.reference',
      target: input.orderReferenceId
    });
    if (!governed.ok) return governed;
    if (
      !this.deps.requestingServiceDirectory.some(
        (entry) =>
          entry.domainId === input.requestingDomain &&
          entry.serviceType === input.requestingService
      )
    )
      return safe(
        'InvalidOrderReference',
        'Reference',
        'Requesting Service is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.orderReferenceId);
    if (
      !record ||
      !enforceOrganizationScope(
        input.governance,
        record ? organizationScopeOf(record) : null
      ).ok
    ) {
      return {
        ok: true,
        value: {
          isValid: false,
          orderReferenceId: input.orderReferenceId,
          orderType: 'Unknown',
          status: 'DeletedReferenceOnly',
          reasonCode: 'NotFound',
          customerReferenceHint: false,
          serviceScopeHint: false,
          matterReferenceHint: false,
          policyHint: null
        }
      };
    }
    const reasonCode: CoreOrderValidationResult['reasonCode'] =
      record.orderStatus === 'DeletedReferenceOnly'
        ? 'InvalidReference'
        : record.orderStatus === 'Archived'
          ? 'Archived'
          : record.orderStatus === 'Cancelled'
            ? 'Cancelled'
            : record.orderStatus === 'Completed'
              ? 'Completed'
              : record.orderStatus === 'Draft' ||
                  record.orderStatus === 'PendingConfirmation'
                ? 'Draft'
                : 'Valid';
    return {
      ok: true,
      value: {
        isValid: reasonCode === 'Valid',
        orderReferenceId: input.orderReferenceId,
        orderType: record.orderType,
        status: record.orderStatus,
        reasonCode,
        customerReferenceHint: record.customerLinks.length > 0,
        serviceScopeHint: Boolean(record.serviceScopeReference),
        matterReferenceHint: record.matterLinks.length > 0,
        policyHint: 'Allowed'
      }
    };
  }

  validateOrderReadiness(input: {
    readonly orderReferenceId: string;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderReadinessResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'order.validate_readiness',
      permission: 'order:validate_readiness',
      policyScope: 'order.readiness',
      target: input.orderReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.orderReferenceId);
    if (!record)
      return safe(
        'OrderNotFound',
        'Reference',
        'Order was not found.',
        input.governance.correlationId
      );
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scope.ok) return scope;
    const missing = [
      ...(record.customerLinks.length === 0 ? ['customerReferenceId'] : []),
      ...(!record.serviceScopeReference ? ['serviceScopeReference'] : [])
    ];
    if (record.orderStatus === 'Cancelled')
      return {
        ok: true,
        value: {
          isReady: false,
          missingRequiredReferences: missing,
          reviewRequired: false,
          recommendedNextAction: 'None',
          reasonCode: 'Cancelled'
        }
      };
    if (record.orderStatus === 'Completed')
      return {
        ok: true,
        value: {
          isReady: false,
          missingRequiredReferences: missing,
          reviewRequired: false,
          recommendedNextAction: 'None',
          reasonCode: 'Completed'
        }
      };
    if (
      record.orderStatus === 'Archived' ||
      record.orderStatus === 'DeletedReferenceOnly'
    )
      return {
        ok: true,
        value: {
          isReady: false,
          missingRequiredReferences: missing,
          reviewRequired: false,
          recommendedNextAction: 'None',
          reasonCode: 'Archived'
        }
      };
    if (
      record.orderStatus === 'MatterCreated' ||
      record.orderStatus === 'InProgress' ||
      record.orderStatus === 'WaitingForCustomer'
    )
      return {
        ok: true,
        value: {
          isReady: false,
          missingRequiredReferences: missing,
          reviewRequired: false,
          recommendedNextAction: 'None',
          reasonCode: 'MatterAlreadyCreated'
        }
      };
    if (missing.includes('customerReferenceId'))
      return {
        ok: true,
        value: {
          isReady: false,
          missingRequiredReferences: missing,
          reviewRequired: true,
          recommendedNextAction: 'LinkCustomer',
          reasonCode: 'CustomerRequired'
        }
      };
    if (missing.includes('serviceScopeReference'))
      return {
        ok: true,
        value: {
          isReady: false,
          missingRequiredReferences: missing,
          reviewRequired: true,
          recommendedNextAction: 'AddServiceScope',
          reasonCode: 'ServiceScopeRequired'
        }
      };
    if (
      record.orderStatus === 'Draft' ||
      record.orderStatus === 'PendingConfirmation'
    )
      return {
        ok: true,
        value: {
          isReady: false,
          missingRequiredReferences: [],
          reviewRequired: true,
          recommendedNextAction: 'ConfirmOrder',
          reasonCode: 'Draft'
        }
      };
    return {
      ok: true,
      value: {
        isReady:
          record.orderStatus === 'Confirmed' ||
          record.orderStatus === 'ReadyForMatter',
        missingRequiredReferences: [],
        reviewRequired: false,
        recommendedNextAction:
          record.orderStatus === 'Confirmed'
            ? 'MarkReadyForMatter'
            : 'CreateMatter',
        reasonCode: 'Ready'
      }
    };
  }

  acceptOrder(input: {
    readonly orderReferenceId: string;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'order.accept',
      permission: 'order:accept',
      policyScope: 'order.lifecycle',
      target: input.orderReferenceId
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.orderReferenceId);
    if (!current)
      return safe(
        'OrderNotFound',
        'Reference',
        'Order was not found.',
        input.governance.correlationId
      );
    if (!['Draft', 'PendingConfirmation'].includes(current.orderStatus))
      return safe(
        'InvalidOrderTransition',
        'State',
        'Order cannot be accepted from its current state.',
        input.governance.correlationId
      );
    return this.changeOrderStatus({
      ...input,
      nextStatus: 'Confirmed',
      governance: {
        ...input.governance,
        permission: {
          ...input.governance.permission,
          intendedOperation: 'order.change_status',
          requiredPermissionKeys: ['order:change_status']
        },
        policy: {
          ...input.governance.policy,
          intendedOperation: 'order.change_status',
          requiredPolicyScopes: ['order.lifecycle']
        },
        audit: {
          ...input.governance.audit,
          operationName: 'order.change_status'
        }
      }
    });
  }

  cancelOrder(input: {
    readonly orderReferenceId: string;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOrderGovernanceContext;
  }): CoreBehaviorResult<CoreOrderServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'order.cancel',
      permission: 'order:cancel',
      policyScope: 'order.lifecycle',
      target: input.orderReferenceId
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.orderReferenceId);
    if (!current)
      return safe(
        'OrderNotFound',
        'Reference',
        'Order was not found.',
        input.governance.correlationId
      );
    if (
      !['Draft', 'PendingConfirmation', 'Confirmed'].includes(
        current.orderStatus
      )
    )
      return safe(
        'InvalidOrderTransition',
        'State',
        'Order cannot be cancelled from its current state.',
        input.governance.correlationId
      );
    return this.changeOrderStatus({
      ...input,
      nextStatus: 'Cancelled',
      governance: {
        ...input.governance,
        permission: {
          ...input.governance.permission,
          intendedOperation: 'order.change_status',
          requiredPermissionKeys: ['order:change_status']
        },
        policy: {
          ...input.governance.policy,
          intendedOperation: 'order.change_status',
          requiredPolicyScopes: ['order.lifecycle']
        },
        audit: {
          ...input.governance.audit,
          operationName: 'order.change_status'
        }
      }
    });
  }

  private linkArray<K extends string>(
    input: LinkInput<K>,
    operation: string,
    objectType: string,
    domain: string,
    code: CoreErrorCode,
    field:
      'opportunityReferenceIds' | 'brandReferenceIds' | 'trademarkReferenceIds'
  ): CoreBehaviorResult<CoreOrderServiceRecord> {
    const referenceId = String(
      input[
        Object.keys(input).find(
          (key) => key.endsWith('ReferenceId') && key !== 'orderReferenceId'
        ) as K
      ]
    );
    return this.link(
      input.orderReferenceId,
      operation,
      referenceId,
      objectType,
      domain,
      code,
      input.idempotencyKey,
      input.governance,
      (record) =>
        record[field].includes(referenceId)
          ? null
          : { ...record, [field]: [...record[field], referenceId] }
    );
  }

  private link(
    orderReferenceId: string,
    operation: string,
    relatedReferenceId: string,
    objectType: string,
    domain: string,
    code: CoreErrorCode,
    idempotencyKey: string | null | undefined,
    governance: CoreOrderGovernanceContext,
    apply: (record: CoreOrderServiceRecord) => CoreOrderServiceRecord | null
  ): CoreBehaviorResult<CoreOrderServiceRecord> {
    const current = this.deps.store.get(orderReferenceId);
    if (!current)
      return safe(
        'OrderNotFound',
        'Reference',
        'Order was not found.',
        governance.correlationId
      );
    const governed = ensureGovernance(governance, {
      operation: `order.${operation
        .replace('linkOrder', 'link_')
        .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
        .replace('__', '_')}`,
      permission: `order:${operation
        .replace('linkOrder', 'link_')
        .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
        .replace('__', '_')}`,
      policyScope: 'order.relationship',
      target: orderReferenceId
    });
    if (!governed.ok) return governed;
    if (
      ['Completed', 'Cancelled', 'Archived', 'DeletedReferenceOnly'].includes(
        current.orderStatus
      )
    )
      return safe(
        'InvalidOrderTransition',
        'State',
        'Finalized Order relationships cannot change.',
        governance.correlationId
      );
    const related = resolveReference(
      this.deps.relatedReferenceRegistry,
      relatedReferenceId,
      objectType,
      domain,
      code,
      governance.correlationId
    );
    if (!related.ok) return related;
    const next = apply(current);
    if (!next)
      return safe(
        'OrderRelationshipAlreadyLinked',
        'Conflict',
        'Order relationship is already linked.',
        governance.correlationId
      );
    return this.mutate(
      orderReferenceId,
      operation,
      idempotencyKey,
      governance,
      { relatedReferenceId },
      (record, now) => ({
        ...next,
        objectRecord: updatedObject(
          record,
          now,
          governance.permission.actorReferenceId,
          record.orderStatus
        )
      }),
      CORE_EVENT_ACTIONS.updated,
      'order.relationship_linked'
    );
  }

  private mutate(
    orderReferenceId: string,
    operation: string,
    idempotencyKey: string | null | undefined,
    governance: CoreOrderGovernanceContext,
    request: unknown,
    apply: (
      record: CoreOrderServiceRecord,
      now: string
    ) => CoreOrderServiceRecord,
    action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS],
    eventType: string
  ): CoreBehaviorResult<CoreOrderServiceRecord> {
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey,
        idempotencyScope: idempotencyScope(governance, operation),
        operationName: operation,
        request,
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: governance.correlationId
      },
      () => {
        const current = this.deps.store.get(orderReferenceId);
        if (!current)
          return safe(
            'OrderNotFound',
            'Reference',
            'Order was not found.',
            governance.correlationId
          );
        const scope = enforceOrganizationScope(
          governance,
          organizationScopeOf(current)
        );
        if (!scope.ok) return scope;
        const next = apply(current, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              operation,
              orderReferenceId,
              idempotencyKey ?? ''
            ),
            action,
            eventType,
            orderReferenceId,
            occurredAt:
              valid.value.objectRecord.auditMetadata.updatedAt ??
              valid.value.objectRecord.auditMetadata.createdAt,
            governance,
            payload: {
              orderReferenceId,
              eventType,
              status: valid.value.orderStatus
            }
          })
        );
        if (!event.ok) {
          this.deps.store.replace(current);
          return safe(
            'EventTraceFailed',
            'Event',
            'Order event trace failed.',
            governance.correlationId
          );
        }
        return replaced;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }
}

type LinkInput<K extends string> = {
  readonly orderReferenceId: string;
  readonly idempotencyKey?: string | null;
  readonly governance: CoreOrderGovernanceContext;
} & Readonly<Record<K, string>>;
