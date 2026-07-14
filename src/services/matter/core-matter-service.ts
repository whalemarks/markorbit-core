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

export const CORE_MATTER_TYPES = [
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
  'Other',
  'Unknown'
] as const;
export type CoreMatterType = (typeof CORE_MATTER_TYPES)[number];

export const CORE_MATTER_STATUSES = [
  'Draft',
  'Open',
  'InProgress',
  'WaitingForCustomer',
  'WaitingForAgent',
  'WaitingForOffice',
  'ReviewRequired',
  'Blocked',
  'Completed',
  'Cancelled',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreMatterStatus = (typeof CORE_MATTER_STATUSES)[number];

export const CORE_MATTER_ORDER_LINK_TYPES = [
  'CreatedFromOrder',
  'RelatedOrder',
  'SupplementalOrder',
  'HistoricalOrder',
  'Unknown'
] as const;
export type CoreMatterOrderLinkType =
  (typeof CORE_MATTER_ORDER_LINK_TYPES)[number];

export const CORE_MATTER_IMPLEMENTED_OPERATIONS = [
  'createMatter',
  'getMatter',
  'listMatters',
  'updateMatter',
  'changeMatterStatus',
  'linkMatterOrder',
  'linkMatterCustomer',
  'linkMatterBrand',
  'linkMatterTrademark',
  'linkMatterWorkflowContract',
  'linkMatterTask',
  'linkMatterDocument',
  'linkMatterEvidence',
  'validateMatterReference'
] as const;

export const CORE_MATTER_MINIMUM_CAPABILITIES = [
  'create where required',
  'read where required',
  'search/list where required',
  'governed metadata update',
  'validate_reference',
  'complete Book 02 lifecycle enforcement',
  'order, customer, brand, and trademark linkage',
  'workflow-contract and task linkage',
  'document and evidence linkage',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive'
] as const;

export const CORE_MATTER_COLLECTION_TARGET = 'matter:collection';

const CONTRACT_ID = 'core-service-matter-service-contract';
const MATTER_OBJECT_TYPE = 'matter-record';
const MATTER_DOMAIN = 'matter';
const MATTER_OBJECT_CONTRACT_ID = 'core-object-matter-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreMatterStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Open: 'active',
  InProgress: 'active',
  WaitingForCustomer: 'active',
  WaitingForAgent: 'active',
  WaitingForOffice: 'active',
  ReviewRequired: 'active',
  Blocked: 'inactive',
  Completed: 'active',
  Cancelled: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Open',
  'Open->InProgress',
  'InProgress->WaitingForCustomer',
  'InProgress->WaitingForAgent',
  'InProgress->WaitingForOffice',
  'WaitingForCustomer->InProgress',
  'WaitingForAgent->InProgress',
  'WaitingForOffice->InProgress',
  'InProgress->ReviewRequired',
  'ReviewRequired->InProgress',
  'InProgress->Blocked',
  'Blocked->InProgress',
  'InProgress->Completed',
  'Open->Cancelled',
  'InProgress->Cancelled',
  'Completed->Archived',
  'Cancelled->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreMatterGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreMatterOrderLink {
  readonly orderReferenceId: string;
  readonly linkType: CoreMatterOrderLinkType;
}

export interface CoreMatterServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly matterType: CoreMatterType;
  readonly titleReference: string;
  readonly matterStatus: CoreMatterStatus;
  readonly sourceReference: string;
  readonly orderLinks: readonly CoreMatterOrderLink[];
  readonly customerReferenceIds: readonly string[];
  readonly brandReferenceIds: readonly string[];
  readonly trademarkReferenceIds: readonly string[];
  readonly workflowContractReferenceIds: readonly string[];
  readonly taskReferenceIds: readonly string[];
  readonly documentReferenceIds: readonly string[];
  readonly evidenceReferenceIds: readonly string[];
}

export interface CoreMatterValidationResult {
  readonly isValid: boolean;
  readonly matterReferenceId: string;
  readonly matterType: CoreMatterType;
  readonly status: CoreMatterStatus;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'InvalidReference'
    | 'NotOpen'
    | 'ReviewRequired'
    | 'Blocked'
    | 'Completed'
    | 'Cancelled'
    | 'Archived';
  readonly orderReferenceHint: boolean;
  readonly workflowContractReferenceHint: boolean;
  readonly policyHint: 'Allowed' | 'Restricted' | null;
}

export interface CoreMatterListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly matterType: CoreMatterType;
  readonly matterStatus: CoreMatterStatus;
  readonly orderLinked: boolean;
  readonly workflowContractLinked: boolean;
  readonly taskCount: number;
  readonly documentCount: number;
  readonly evidenceCount: number;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface CoreMatterServiceStore {
  get(id: string): CoreMatterServiceRecord | undefined;
  list(): readonly CoreMatterServiceRecord[];
  insert(
    record: CoreMatterServiceRecord
  ): CoreBehaviorResult<CoreMatterServiceRecord>;
  replace(
    record: CoreMatterServiceRecord
  ): CoreBehaviorResult<CoreMatterServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreMatterEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreMatterServiceDependencies {
  readonly store: CoreMatterServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreMatterEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly requestingServiceDirectory: readonly {
    readonly domainId: CoreDomainId;
    readonly serviceType: string;
  }[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: string,
    matterReferenceId: string,
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
  record: CoreMatterServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function ensureGovernance(
  context: CoreMatterGovernanceContext,
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
    context.audit.targetObjectType !== MATTER_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Matter governance context is invalid.',
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
  governance: CoreMatterGovernanceContext,
  recordOrganization: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    recordOrganization &&
    governance.authorizedOrganizationReferenceId !== recordOrganization
  ) {
    return safe(
      'MatterNotFound',
      'Reference',
      'Matter was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreMatterGovernanceContext,
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
        'Related Matter reference is invalid.',
        correlationId
      );
}

function eventTrace(input: {
  readonly id: CoreEventId;
  readonly action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
  readonly eventType: string;
  readonly matterReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreMatterGovernanceContext;
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
      domainId: MATTER_DOMAIN,
      object: {
        id: createCoreObjectId(input.matterReferenceId),
        type: createCoreObjectType(MATTER_OBJECT_TYPE),
        domainId: MATTER_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function updatedObject(
  current: CoreMatterServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status: CoreMatterStatus
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
  record: CoreMatterServiceRecord
): CoreBehaviorResult<CoreMatterServiceRecord> {
  if (
    !included(CORE_MATTER_TYPES, record.matterType) ||
    record.matterType === 'Unknown'
  )
    return safe('InvalidMatterType', 'Validation', 'Matter type is invalid.');
  if (!included(CORE_MATTER_STATUSES, record.matterStatus))
    return safe('InvalidMatterStatus', 'State', 'Matter status is invalid.');
  if (!record.titleReference.trim())
    return safe(
      'MatterTitleRequired',
      'Validation',
      'Matter title reference is required.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'MatterSourceReferenceRequired',
      'Validation',
      'Matter source reference is required.'
    );
  if (
    record.objectRecord.objectType !== MATTER_OBJECT_TYPE ||
    record.objectRecord.domainId !== MATTER_DOMAIN ||
    record.objectRecord.objectContractId !== MATTER_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.matterStatus]
  )
    return safe(
      'MatterObjectMismatch',
      'Validation',
      'Matter Object foundation does not match.'
    );
  return { ok: true, value: immutable(record) };
}

export class CoreInMemoryMatterServiceStore implements CoreMatterServiceStore {
  readonly #records = new Map<string, CoreMatterServiceRecord>();
  get(id: string): CoreMatterServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }
  list(): readonly CoreMatterServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }
  insert(
    record: CoreMatterServiceRecord
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe('MatterAlreadyExists', 'Conflict', 'Matter already exists.');
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }
  replace(
    record: CoreMatterServiceRecord
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe('MatterNotFound', 'Reference', 'Matter was not found.');
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }
  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreMatterService {
  constructor(readonly deps: CoreMatterServiceDependencies) {}

  createMatter(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly matterType: unknown;
    readonly titleReference: string;
    readonly matterStatus: unknown;
    readonly sourceReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'matter.create',
      permission: 'matter:create',
      policyScope: 'matter.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (input.matterStatus !== 'Draft')
      return safe(
        'InvalidMatterStatus',
        'State',
        'Matter creation must start as Draft.',
        input.governance.correlationId
      );
    const reference = resolveReference(
      this.deps.relatedReferenceRegistry,
      input.publicReferenceRecord.referenceId,
      MATTER_OBJECT_TYPE,
      MATTER_DOMAIN,
      'InvalidMatterReference',
      input.governance.correlationId
    );
    if (!reference.ok || target !== input.publicReferenceRecord.referenceId)
      return safe(
        'InvalidMatterReference',
        'Reference',
        'Matter reference is invalid.',
        input.governance.correlationId
      );
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createMatter'),
        operationName: 'createMatter',
        request: {
          target,
          matterType: input.matterType,
          titleReference: input.titleReference,
          sourceReference: input.sourceReference
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe(
            'MatterAlreadyExists',
            'Conflict',
            'Matter already exists.'
          );
        const record: CoreMatterServiceRecord = {
          objectRecord: input.objectRecord,
          matterType: input.matterType as CoreMatterType,
          titleReference: input.titleReference,
          matterStatus: input.matterStatus as CoreMatterStatus,
          sourceReference: input.sourceReference,
          orderLinks: [],
          customerReferenceIds: [],
          brandReferenceIds: [],
          trademarkReferenceIds: [],
          workflowContractReferenceIds: [],
          taskReferenceIds: [],
          documentReferenceIds: [],
          evidenceReferenceIds: []
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const now = this.deps.now();
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              'createMatter',
              target,
              input.idempotencyKey ?? ''
            ),
            action: CORE_EVENT_ACTIONS.created,
            eventType: 'matter-created',
            matterReferenceId: target,
            occurredAt: now,
            governance: input.governance,
            payload: {
              matterReferenceId: target,
              matterType: valid.value.matterType,
              status: valid.value.matterStatus
            }
          })
        );
        if (!event.ok) {
          this.deps.store.remove(target);
          return safe(
            'EventTraceFailed',
            'Event',
            'Matter event trace failed.',
            input.governance.correlationId
          );
        }
        return inserted;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }

  getMatter(input: {
    readonly matterReferenceId: string;
    readonly governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'matter.read',
      permission: 'matter:read',
      policyScope: 'matter.read',
      target: input.matterReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.matterReferenceId);
    if (!record)
      return safe(
        'MatterNotFound',
        'Reference',
        'Matter was not found.',
        input.governance.correlationId
      );
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scope.ok ? { ok: true, value: immutable(record) } : scope;
  }

  listMatters(input: {
    readonly filters?: {
      readonly matterType?: unknown;
      readonly matterStatus?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreMatterListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'matter.list',
      permission: 'matter:list',
      policyScope: 'matter.list',
      target: CORE_MATTER_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.matterType !== undefined &&
      !included(CORE_MATTER_TYPES, input.filters.matterType)
    )
      return safe(
        'InvalidMatterType',
        'Validation',
        'Matter type filter is invalid.'
      );
    if (
      input.filters?.matterStatus !== undefined &&
      !included(CORE_MATTER_STATUSES, input.filters.matterStatus)
    )
      return safe(
        'InvalidMatterStatus',
        'State',
        'Matter status filter is invalid.'
      );
    const items = this.deps.store
      .list()
      .filter((record) => {
        const org = organizationScopeOf(record);
        return (
          (!input.governance.authorizedOrganizationReferenceId ||
            !org ||
            org === input.governance.authorizedOrganizationReferenceId) &&
          (!input.filters?.matterType ||
            record.matterType === input.filters.matterType) &&
          (!input.filters?.matterStatus ||
            record.matterStatus === input.filters.matterStatus)
        );
      })
      .map((record): CoreMatterListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        matterType: record.matterType,
        matterStatus: record.matterStatus,
        orderLinked: record.orderLinks.length > 0,
        workflowContractLinked: record.workflowContractReferenceIds.length > 0,
        taskCount: record.taskReferenceIds.length,
        documentCount: record.documentReferenceIds.length,
        evidenceCount: record.evidenceReferenceIds.length,
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
        allowedSortFields: ['createdAt', 'publicReferenceId', 'matterStatus'],
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

  updateMatter(input: {
    readonly matterReferenceId: string;
    readonly patch: {
      readonly matterType?: unknown;
      readonly titleReference?: string;
      readonly metadata?: CoreJsonObject;
    };
    readonly idempotencyKey?: string | null;
    readonly governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const current = this.deps.store.get(input.matterReferenceId);
    if (!current)
      return safe(
        'MatterNotFound',
        'Reference',
        'Matter was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'matter.update',
      permission: 'matter:update',
      policyScope: 'matter.write',
      target: input.matterReferenceId
    });
    if (!governed.ok) return governed;
    if (
      ['Completed', 'Cancelled', 'Archived', 'DeletedReferenceOnly'].includes(
        current.matterStatus
      )
    )
      return safe(
        'InvalidMatterTransition',
        'State',
        'Finalized Matter cannot be updated.',
        input.governance.correlationId
      );
    if (Object.keys(input.patch).length === 0)
      return safe(
        'ValidationFailed',
        'Validation',
        'Matter update patch is empty.'
      );
    return this.mutate(
      input.matterReferenceId,
      'updateMatter',
      input.idempotencyKey,
      input.governance,
      input.patch,
      (record, now) => ({
        ...record,
        matterType: (input.patch.matterType ??
          record.matterType) as CoreMatterType,
        titleReference: input.patch.titleReference ?? record.titleReference,
        objectRecord: {
          ...updatedObject(
            record,
            now,
            input.governance.permission.actorReferenceId,
            record.matterStatus
          ),
          metadata: input.patch.metadata ?? record.objectRecord.metadata
        }
      }),
      CORE_EVENT_ACTIONS.updated,
      'matter.updated'
    );
  }

  changeMatterStatus(input: {
    readonly matterReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const current = this.deps.store.get(input.matterReferenceId);
    if (!current)
      return safe(
        'MatterNotFound',
        'Reference',
        'Matter was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'matter.change_status',
      permission: 'matter:change_status',
      policyScope: 'matter.lifecycle',
      target: input.matterReferenceId
    });
    if (!governed.ok) return governed;
    if (
      !included(CORE_MATTER_STATUSES, input.nextStatus) ||
      !lifecycleTransitions.has(`${current.matterStatus}->${input.nextStatus}`)
    )
      return safe(
        'InvalidMatterTransition',
        'State',
        'Matter status transition is not allowed.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReferenceId))
      return safe(
        'MatterReasonReferenceRequired',
        'Validation',
        'Matter reason reference is required.'
      );
    if (
      input.nextStatus === 'Completed' &&
      current.taskReferenceIds.length === 0
    )
      return safe(
        'InvalidMatterTransition',
        'State',
        'Matter completion requires task trace.',
        input.governance.correlationId
      );
    return this.mutate(
      input.matterReferenceId,
      'changeMatterStatus',
      input.idempotencyKey,
      input.governance,
      {
        nextStatus: input.nextStatus,
        reasonReferenceId: input.reasonReferenceId
      },
      (record, now) => ({
        ...record,
        matterStatus: input.nextStatus as CoreMatterStatus,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          input.nextStatus as CoreMatterStatus
        )
      }),
      input.nextStatus === 'Completed'
        ? CORE_EVENT_ACTIONS.completed
        : input.nextStatus === 'Archived'
          ? CORE_EVENT_ACTIONS.archived
          : CORE_EVENT_ACTIONS.statusChanged,
      'matter.status_changed'
    );
  }

  linkMatterOrder(input: {
    readonly matterReferenceId: string;
    readonly orderReferenceId: string;
    readonly linkType: unknown;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    if (
      !included(CORE_MATTER_ORDER_LINK_TYPES, input.linkType) ||
      input.linkType === 'Unknown'
    )
      return safe(
        'InvalidMatterOrderLinkType',
        'Validation',
        'Matter Order link type is invalid.'
      );
    return this.link(
      input.matterReferenceId,
      'linkMatterOrder',
      input.orderReferenceId,
      'order-record',
      'order',
      'InvalidMatterOrderReference',
      input.idempotencyKey,
      input.governance,
      (record) =>
        record.orderLinks.some(
          (link) => link.orderReferenceId === input.orderReferenceId
        )
          ? null
          : {
              ...record,
              orderLinks: [
                ...record.orderLinks,
                {
                  orderReferenceId: input.orderReferenceId,
                  linkType: input.linkType as CoreMatterOrderLinkType
                }
              ]
            }
    );
  }
  linkMatterCustomer(input: LinkInput<'customerReferenceId'>) {
    return this.linkArray(
      input,
      'linkMatterCustomer',
      'customer-record',
      'customer',
      'InvalidMatterCustomerReference',
      'customerReferenceIds'
    );
  }
  linkMatterBrand(input: LinkInput<'brandReferenceId'>) {
    return this.linkArray(
      input,
      'linkMatterBrand',
      'brand-record',
      'brand',
      'InvalidMatterBrandReference',
      'brandReferenceIds'
    );
  }
  linkMatterTrademark(input: LinkInput<'trademarkReferenceId'>) {
    return this.linkArray(
      input,
      'linkMatterTrademark',
      'trademark-record',
      'trademark',
      'InvalidMatterTrademarkReference',
      'trademarkReferenceIds'
    );
  }
  linkMatterWorkflowContract(input: LinkInput<'workflowContractReferenceId'>) {
    return this.linkArray(
      input,
      'linkMatterWorkflowContract',
      'workflow-contract-record',
      'workflow-contract',
      'InvalidMatterWorkflowContractReference',
      'workflowContractReferenceIds'
    );
  }
  linkMatterTask(input: LinkInput<'taskReferenceId'>) {
    return this.linkArray(
      input,
      'linkMatterTask',
      'task-record',
      'task',
      'InvalidMatterTaskReference',
      'taskReferenceIds'
    );
  }
  linkMatterDocument(input: LinkInput<'documentReferenceId'>) {
    return this.linkArray(
      input,
      'linkMatterDocument',
      'document-record',
      'document',
      'InvalidMatterDocumentReference',
      'documentReferenceIds'
    );
  }
  linkMatterEvidence(input: LinkInput<'evidenceReferenceId'>) {
    return this.linkArray(
      input,
      'linkMatterEvidence',
      'evidence-record',
      'evidence',
      'InvalidMatterEvidenceReference',
      'evidenceReferenceIds'
    );
  }

  validateMatterReference(input: {
    readonly matterReferenceId: string;
    readonly requestingDomain: string;
    readonly requestingService: string;
    readonly governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'matter.validate_reference',
      permission: 'matter:validate_reference',
      policyScope: 'matter.reference',
      target: input.matterReferenceId
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
        'InvalidMatterReference',
        'Reference',
        'Requesting Service is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.matterReferenceId);
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
          matterReferenceId: input.matterReferenceId,
          matterType: 'Unknown',
          status: 'DeletedReferenceOnly',
          reasonCode: 'NotFound',
          orderReferenceHint: false,
          workflowContractReferenceHint: false,
          policyHint: null
        }
      };
    }
    const reasonCode =
      record.matterStatus === 'Archived'
        ? 'Archived'
        : record.matterStatus === 'Cancelled'
          ? 'Cancelled'
          : record.matterStatus === 'Completed'
            ? 'Completed'
            : record.matterStatus === 'ReviewRequired'
              ? 'ReviewRequired'
              : record.matterStatus === 'Blocked'
                ? 'Blocked'
                : record.matterStatus === 'Draft'
                  ? 'NotOpen'
                  : 'Valid';
    return {
      ok: true,
      value: {
        isValid: reasonCode === 'Valid',
        matterReferenceId: input.matterReferenceId,
        matterType: record.matterType,
        status: record.matterStatus,
        reasonCode,
        orderReferenceHint: record.orderLinks.length > 0,
        workflowContractReferenceHint:
          record.workflowContractReferenceIds.length > 0,
        policyHint: 'Allowed'
      }
    };
  }

  private linkArray<K extends string>(
    input: LinkInput<K>,
    operation: string,
    objectType: string,
    domain: string,
    code: CoreErrorCode,
    field:
      | 'customerReferenceIds'
      | 'brandReferenceIds'
      | 'trademarkReferenceIds'
      | 'workflowContractReferenceIds'
      | 'taskReferenceIds'
      | 'documentReferenceIds'
      | 'evidenceReferenceIds'
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
    const referenceId = String(
      input[
        Object.keys(input).find(
          (key) => key.endsWith('ReferenceId') && key !== 'matterReferenceId'
        ) as K
      ]
    );
    return this.link(
      input.matterReferenceId,
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
    matterReferenceId: string,
    operation: string,
    relatedReferenceId: string,
    objectType: string,
    domain: string,
    code: CoreErrorCode,
    idempotencyKey: string | null | undefined,
    governance: CoreMatterGovernanceContext,
    apply: (record: CoreMatterServiceRecord) => CoreMatterServiceRecord | null
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
    const current = this.deps.store.get(matterReferenceId);
    if (!current)
      return safe(
        'MatterNotFound',
        'Reference',
        'Matter was not found.',
        governance.correlationId
      );
    const governed = ensureGovernance(governance, {
      operation: `matter.${operation
        .replace('linkMatter', 'link_')
        .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
        .replace('__', '_')}`,
      permission: `matter:${operation
        .replace('linkMatter', 'link_')
        .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
        .replace('__', '_')}`,
      policyScope: 'matter.relationship',
      target: matterReferenceId
    });
    if (!governed.ok) return governed;
    if (
      ['Completed', 'Cancelled', 'Archived', 'DeletedReferenceOnly'].includes(
        current.matterStatus
      )
    )
      return safe(
        'InvalidMatterTransition',
        'State',
        'Finalized Matter relationships cannot change.',
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
        'MatterRelationshipAlreadyLinked',
        'Conflict',
        'Matter relationship is already linked.',
        governance.correlationId
      );
    return this.mutate(
      matterReferenceId,
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
          record.matterStatus
        )
      }),
      CORE_EVENT_ACTIONS.updated,
      'matter.relationship_linked'
    );
  }

  private mutate(
    matterReferenceId: string,
    operation: string,
    idempotencyKey: string | null | undefined,
    governance: CoreMatterGovernanceContext,
    request: unknown,
    apply: (
      record: CoreMatterServiceRecord,
      now: string
    ) => CoreMatterServiceRecord,
    action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS],
    eventType: string
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
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
        const current = this.deps.store.get(matterReferenceId);
        if (!current)
          return safe(
            'MatterNotFound',
            'Reference',
            'Matter was not found.',
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
              matterReferenceId,
              idempotencyKey ?? ''
            ),
            action,
            eventType,
            matterReferenceId,
            occurredAt:
              valid.value.objectRecord.auditMetadata.updatedAt ??
              valid.value.objectRecord.auditMetadata.createdAt,
            governance,
            payload: {
              matterReferenceId,
              eventType,
              status: valid.value.matterStatus
            }
          })
        );
        if (!event.ok) {
          this.deps.store.replace(current);
          return safe(
            'EventTraceFailed',
            'Event',
            'Matter event trace failed.',
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
  readonly matterReferenceId: string;
  readonly idempotencyKey?: string | null;
  readonly governance: CoreMatterGovernanceContext;
} & Readonly<Record<K, string>>;
