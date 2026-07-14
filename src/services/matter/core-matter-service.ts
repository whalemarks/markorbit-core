import type { CoreEventTraceRecord } from '../../behaviors/core-event-pagination-behavior.ts';
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
  type CoreBehaviorResult
} from '../../behaviors/core-safe-error.ts';
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
  'linkMatterJurisdiction',
  'linkMatterClassification',
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
  'order and customer linkage',
  'brand and trademark linkage',
  'jurisdiction and classification linkage',
  'workflow contract linkage',
  'task, document and evidence linkage',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive'
] as const;

export interface CoreMatterGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreMatterServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly matterType: CoreMatterType;
  readonly titleReference: string;
  readonly matterStatus: CoreMatterStatus;
  readonly sourceReference: string;
  readonly customerReferenceId?: string | null;
  readonly orderReferenceId?: string | null;
  readonly brandReferenceId?: string | null;
  readonly trademarkReferenceId?: string | null;
  readonly jurisdictionReferenceId?: string | null;
  readonly classificationReferenceIds: readonly string[];
  readonly workflowContractReferenceId?: string | null;
  readonly taskReferenceIds: readonly string[];
  readonly documentReferenceIds: readonly string[];
  readonly evidenceReferenceIds: readonly string[];
}

export interface CoreMatterValidationResult {
  readonly isValid: boolean;
  readonly matterReferenceId: string;
  readonly matterType: CoreMatterType;
  readonly status: CoreMatterStatus;
  readonly orderLinked: boolean;
  readonly workflowContractLinked: boolean;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'NotOpen'
    | 'Cancelled'
    | 'Completed'
    | 'Archived'
    | 'ReviewRequired'
    | 'PolicyRestricted';
  readonly policyHint: 'Allowed' | 'Restricted' | null;
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
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: string,
    matterReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
}

const CONTRACT_ID = 'core-service-matter-service-contract';
const MATTER_TYPE = 'matter-record';
const MATTER_DOMAIN = 'matter';
const MATTER_CONTRACT = 'core-object-matter-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const titlePattern = /^.{1,240}$/s;

const statusMap: Record<CoreMatterStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Open: 'active',
  InProgress: 'active',
  WaitingForCustomer: 'active',
  WaitingForAgent: 'active',
  WaitingForOffice: 'active',
  ReviewRequired: 'draft',
  Blocked: 'inactive',
  Completed: 'active',
  Cancelled: 'inactive',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const transitions = new Set([
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

const relationship = {
  order: ['order-record', 'order', 'orderReferenceId'],
  customer: ['customer-record', 'customer', 'customerReferenceId'],
  brand: ['brand-record', 'brand', 'brandReferenceId'],
  trademark: ['trademark-record', 'trademark', 'trademarkReferenceId'],
  jurisdiction: [
    'jurisdiction-record',
    'jurisdiction',
    'jurisdictionReferenceId'
  ],
  classification: [
    'classification-record',
    'classification',
    'classificationReferenceIds'
  ],
  workflowContract: [
    'workflow-contract-record',
    'workflow-contract',
    'workflowContractReferenceId'
  ],
  task: ['task-record', 'task', 'taskReferenceIds'],
  document: ['document-record', 'document', 'documentReferenceIds'],
  evidence: ['evidence-record', 'evidence', 'evidenceReferenceIds']
} as const;

type RelationshipKind = keyof typeof relationship;

function fail<T = never>(
  code:
    | 'ValidationFailed'
    | 'ReferenceInvalid'
    | 'ReferenceNotFound'
    | 'StateTransitionNotAllowed'
    | 'Conflict'
    | 'EventTraceFailed'
    | 'InternalError',
  category:
    'Validation' | 'Reference' | 'State' | 'Conflict' | 'Event' | 'Internal',
  message: string,
  correlationId?: string
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({ code, category, message, correlationId })
  };
}
function freeze<T>(value: T): T {
  const v = structuredClone(value);
  const f = (x: unknown): void => {
    if (!x || typeof x !== 'object') return;
    for (const y of Object.values(x)) f(y);
    Object.freeze(x);
  };
  f(v);
  return v;
}
function org(record: CoreMatterServiceRecord): string | null {
  return record.objectRecord.visibility?.organizationScopeReferenceId ?? null;
}
function included<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}
function governed(
  context: CoreMatterGovernanceContext,
  operation: string,
  permission: string,
  scope: string,
  target: string
): CoreBehaviorResult<null> {
  if (
    context.correlationId !== context.audit.correlationId ||
    context.permission.correlationId !== context.correlationId ||
    context.policy.correlationId !== context.correlationId ||
    context.permission.intendedOperation !== operation ||
    context.policy.intendedOperation !== operation ||
    context.audit.operationName !== operation ||
    !context.permission.requiredPermissionKeys.includes(permission) ||
    !context.policy.requiredPolicyScopes.includes(scope) ||
    context.audit.targetObjectType !== MATTER_TYPE ||
    context.audit.targetObjectReferenceId !== target ||
    context.review.targetObjectType !== MATTER_TYPE ||
    context.review.targetObjectReferenceId !== target ||
    !opaque.test(context.auditContextReferenceId)
  )
    return fail(
      'ValidationFailed',
      'Validation',
      'Matter governance context is invalid.',
      context.correlationId
    );
  const result = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  return result.ok ? { ok: true, value: null } : result;
}
function sameOrg(
  context: CoreMatterGovernanceContext,
  record: CoreMatterServiceRecord
): CoreBehaviorResult<null> {
  const expected = context.authorizedOrganizationReferenceId ?? null;
  return expected && org(record) !== expected
    ? fail(
        'ReferenceNotFound',
        'Reference',
        'Matter was not found.',
        context.correlationId
      )
    : { ok: true, value: null };
}
function resolve(
  registry: CoreReferenceRegistry,
  id: string,
  objectType: string,
  domain: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const r = registry.resolve({
    referenceId: id,
    expectedObjectType: objectType,
    expectedDomain: domain,
    allowDeletedReferenceOnly: true
  });
  return r.ok
    ? r
    : fail('ReferenceInvalid', 'Reference', 'Related reference is invalid.');
}
function validRecord(
  record: CoreMatterServiceRecord
): CoreBehaviorResult<CoreMatterServiceRecord> {
  if (
    !included(CORE_MATTER_TYPES, record.matterType) ||
    record.matterType === 'Unknown'
  )
    return fail('ValidationFailed', 'Validation', 'Matter type is invalid.');
  if (!included(CORE_MATTER_STATUSES, record.matterStatus))
    return fail('ValidationFailed', 'Validation', 'Matter status is invalid.');
  if (
    !titlePattern.test(record.titleReference.trim()) ||
    !opaque.test(record.sourceReference)
  )
    return fail(
      'ValidationFailed',
      'Validation',
      'Matter title or source is invalid.'
    );
  if (
    record.objectRecord.objectType !== MATTER_TYPE ||
    record.objectRecord.domainId !== MATTER_DOMAIN ||
    record.objectRecord.objectContractId !== MATTER_CONTRACT ||
    record.objectRecord.status !== statusMap[record.matterStatus]
  )
    return fail(
      'ValidationFailed',
      'Validation',
      'Matter object foundation does not match.'
    );
  return { ok: true, value: freeze(record) };
}
function event(
  deps: CoreMatterServiceDependencies,
  input: {
    operation: string;
    id: string;
    key: string;
    status: CoreMatterStatus;
    previous?: CoreMatterStatus;
    payload?: Record<string, unknown>;
    governance: CoreMatterGovernanceContext;
  }
): CoreBehaviorResult<CoreEventTraceRecord> {
  return deps.eventTracePort.append({
    auditContextReferenceId: input.governance.auditContextReferenceId,
    visibility: 'Internal',
    event: {
      id: deps.eventIdFactory(input.operation, input.id, input.key),
      type: createCoreEventType(
        input.previous ? 'core-object-status-changed' : 'core-object-updated'
      ),
      action: input.previous
        ? CORE_EVENT_ACTIONS.statusChanged
        : CORE_EVENT_ACTIONS.updated,
      domainId: MATTER_DOMAIN,
      object: {
        id: createCoreObjectId(input.id),
        type: createCoreObjectType(MATTER_TYPE),
        domainId: MATTER_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: deps.now(),
      correlationId: input.governance.correlationId,
      payload: {
        matterReferenceId: input.id,
        status: input.status,
        ...(input.previous ? { previousStatus: input.previous } : {}),
        ...(input.payload ?? {})
      }
    }
  });
}
function updatedObject(
  current: CoreMatterServiceRecord,
  status: CoreMatterStatus,
  now: string,
  actor: string | null,
  metadata?: CoreJsonObject
): CoreMvpObjectBaseRecord {
  return {
    ...current.objectRecord,
    status: statusMap[status],
    metadata: metadata ?? current.objectRecord.metadata,
    auditMetadata: {
      ...current.objectRecord.auditMetadata,
      updatedAt: now,
      updatedByReferenceId:
        actor ?? current.objectRecord.auditMetadata.createdByReferenceId
    },
    version: current.objectRecord.version
      ? { ...current.objectRecord.version, updatedAt: now }
      : undefined
  };
}

export class CoreInMemoryMatterServiceStore implements CoreMatterServiceStore {
  readonly #records = new Map<string, CoreMatterServiceRecord>();
  get(id: string) {
    const v = this.#records.get(id);
    return v ? freeze(v) : undefined;
  }
  list() {
    return [...this.#records.values()].map(freeze);
  }
  insert(
    record: CoreMatterServiceRecord
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return fail('Conflict', 'Conflict', 'Matter already exists.');
    const v = freeze(record);
    this.#records.set(id, v);
    return { ok: true, value: freeze(v) };
  }
  replace(
    record: CoreMatterServiceRecord
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return fail('ReferenceNotFound', 'Reference', 'Matter was not found.');
    const v = freeze(record);
    this.#records.set(id, v);
    return { ok: true, value: freeze(v) };
  }
  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreMatterService {
  constructor(readonly deps: CoreMatterServiceDependencies) {}
  createMatter(input: {
    objectRecord: CoreMvpObjectBaseRecord;
    publicReferenceRecord: CoreReferenceRecord;
    matterType: unknown;
    titleReference: string;
    matterStatus: unknown;
    sourceReference: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const id = input.objectRecord.publicReferenceId;
    const g = governed(
      input.governance,
      'matter.create',
      'matter:create',
      'matter.write',
      id
    );
    if (!g.ok) return g;
    if (input.matterStatus !== 'Draft')
      return fail(
        'ValidationFailed',
        'Validation',
        'Matter creation must start as Draft.',
        input.governance.correlationId
      );
    const rr = resolve(
      this.deps.relatedReferenceRegistry,
      id,
      MATTER_TYPE,
      MATTER_DOMAIN
    );
    if (
      !rr.ok ||
      rr.value.referenceId !== input.publicReferenceRecord.referenceId
    )
      return fail(
        'ReferenceInvalid',
        'Reference',
        'Matter reference is invalid.'
      );
    const result = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: `${CONTRACT_ID}|create|${input.governance.authorizedOrganizationReferenceId ?? 'global'}`,
        operationName: 'createMatter',
        request: { ...input, governance: undefined },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const record: CoreMatterServiceRecord = {
          objectRecord: input.objectRecord,
          matterType: input.matterType as CoreMatterType,
          titleReference: input.titleReference.trim(),
          matterStatus: 'Draft',
          sourceReference: input.sourceReference,
          classificationReferenceIds: [],
          taskReferenceIds: [],
          documentReferenceIds: [],
          evidenceReferenceIds: []
        };
        const valid = validRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const ev = this.deps.eventTracePort.append({
          auditContextReferenceId: input.governance.auditContextReferenceId,
          visibility: 'Internal',
          event: {
            id: this.deps.eventIdFactory(
              'createMatter',
              id,
              input.idempotencyKey ?? ''
            ),
            type: createCoreEventType('core-object-created'),
            action: CORE_EVENT_ACTIONS.created,
            domainId: MATTER_DOMAIN,
            object: {
              id: createCoreObjectId(id),
              type: createCoreObjectType(MATTER_TYPE),
              domainId: MATTER_DOMAIN
            },
            source: { actorType: 'service', actorId: CONTRACT_ID },
            occurredAt: this.deps.now(),
            correlationId: input.governance.correlationId,
            payload: {
              matterReferenceId: id,
              matterType: record.matterType,
              status: record.matterStatus
            }
          }
        });
        if (!ev.ok) {
          this.deps.store.remove(id);
          return fail(
            'EventTraceFailed',
            'Event',
            'Matter event trace failed.',
            input.governance.correlationId
          );
        }
        return inserted;
      }
    );
    return result.ok ? { ok: true, value: result.value.result } : result;
  }
  getMatter(input: {
    matterReferenceId: string;
    governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const g = governed(
      input.governance,
      'matter.read',
      'matter:read',
      'matter.read',
      input.matterReferenceId
    );
    if (!g.ok) return g;
    const r = this.deps.store.get(input.matterReferenceId);
    if (!r)
      return fail(
        'ReferenceNotFound',
        'Reference',
        'Matter was not found.',
        input.governance.correlationId
      );
    const s = sameOrg(input.governance, r);
    return s.ok ? { ok: true, value: r } : s;
  }
  listMatters(input: {
    governance: CoreMatterGovernanceContext;
    status?: unknown;
  }): CoreBehaviorResult<readonly CoreMatterServiceRecord[]> {
    const g = governed(
      input.governance,
      'matter.list',
      'matter:list',
      'matter.list',
      'matter:collection'
    );
    if (!g.ok) return g;
    if (
      input.status !== undefined &&
      !included(CORE_MATTER_STATUSES, input.status)
    )
      return fail(
        'ValidationFailed',
        'Validation',
        'Matter status filter is invalid.'
      );
    return {
      ok: true,
      value: this.deps.store
        .list()
        .filter(
          (r) =>
            (!input.governance.authorizedOrganizationReferenceId ||
              org(r) === input.governance.authorizedOrganizationReferenceId) &&
            (!input.status || r.matterStatus === input.status)
        )
        .map(freeze)
    };
  }
  updateMatter(input: {
    matterReferenceId: string;
    patch: {
      titleReference?: string;
      matterType?: unknown;
      metadata?: CoreJsonObject;
    };
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const g = governed(
      input.governance,
      'matter.update',
      'matter:update',
      'matter.write',
      input.matterReferenceId
    );
    if (!g.ok) return g;
    const current = this.deps.store.get(input.matterReferenceId);
    if (!current)
      return fail('ReferenceNotFound', 'Reference', 'Matter was not found.');
    const s = sameOrg(input.governance, current);
    if (!s.ok) return s;
    if (
      ['Completed', 'Cancelled', 'Archived', 'DeletedReferenceOnly'].includes(
        current.matterStatus
      )
    )
      return fail(
        'StateTransitionNotAllowed',
        'State',
        'Finalized Matter cannot be updated.'
      );
    const result = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: `${CONTRACT_ID}|update|${input.matterReferenceId}`,
        operationName: 'updateMatter',
        request: input.patch,
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const now = this.deps.now();
        const next: CoreMatterServiceRecord = {
          ...current,
          titleReference:
            input.patch.titleReference?.trim() ?? current.titleReference,
          matterType: (input.patch.matterType ??
            current.matterType) as CoreMatterType,
          objectRecord: updatedObject(
            current,
            current.matterStatus,
            now,
            input.governance.permission.actorReferenceId,
            input.patch.metadata
          )
        };
        const valid = validRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const ev = event(this.deps, {
          operation: 'updateMatter',
          id: input.matterReferenceId,
          key: input.idempotencyKey ?? '',
          status: next.matterStatus,
          governance: input.governance
        });
        if (!ev.ok) {
          this.deps.store.replace(current);
          return fail(
            'EventTraceFailed',
            'Event',
            'Matter event trace failed.'
          );
        }
        return replaced;
      }
    );
    return result.ok ? { ok: true, value: result.value.result } : result;
  }
  changeMatterStatus(input: {
    matterReferenceId: string;
    nextStatus: unknown;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterServiceRecord> {
    const g = governed(
      input.governance,
      'matter.change_status',
      'matter:change_status',
      'matter.lifecycle',
      input.matterReferenceId
    );
    if (!g.ok) return g;
    const current = this.deps.store.get(input.matterReferenceId);
    if (!current)
      return fail('ReferenceNotFound', 'Reference', 'Matter was not found.');
    const s = sameOrg(input.governance, current);
    if (!s.ok) return s;
    if (
      !included(CORE_MATTER_STATUSES, input.nextStatus) ||
      !transitions.has(`${current.matterStatus}->${input.nextStatus}`)
    )
      return fail(
        'StateTransitionNotAllowed',
        'State',
        'Matter status transition is not allowed.',
        input.governance.correlationId
      );
    const result = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: `${CONTRACT_ID}|status|${input.matterReferenceId}`,
        operationName: 'changeMatterStatus',
        request: { nextStatus: input.nextStatus },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const nextStatus = input.nextStatus as CoreMatterStatus;
        const next = {
          ...current,
          matterStatus: nextStatus,
          objectRecord: updatedObject(
            current,
            nextStatus,
            this.deps.now(),
            input.governance.permission.actorReferenceId
          )
        } as CoreMatterServiceRecord;
        const replaced = this.deps.store.replace(next);
        if (!replaced.ok) return replaced;
        const ev = event(this.deps, {
          operation: 'changeMatterStatus',
          id: input.matterReferenceId,
          key: input.idempotencyKey ?? '',
          status: nextStatus,
          previous: current.matterStatus,
          governance: input.governance
        });
        if (!ev.ok) {
          this.deps.store.replace(current);
          return fail(
            'EventTraceFailed',
            'Event',
            'Matter event trace failed.'
          );
        }
        return replaced;
      }
    );
    return result.ok ? { ok: true, value: result.value.result } : result;
  }
  private link(
    kind: RelationshipKind,
    input: {
      matterReferenceId: string;
      referenceId: string;
      idempotencyKey?: string | null;
      governance: CoreMatterGovernanceContext;
    }
  ): CoreBehaviorResult<CoreMatterServiceRecord> {
    const def = relationship[kind];
    const op = `matter.link_${kind === 'workflowContract' ? 'workflow_contract' : kind}`;
    const g = governed(
      input.governance,
      op,
      `matter:link_${kind === 'workflowContract' ? 'workflow_contract' : kind}`,
      'matter.relationship',
      input.matterReferenceId
    );
    if (!g.ok) return g;
    const current = this.deps.store.get(input.matterReferenceId);
    if (!current)
      return fail('ReferenceNotFound', 'Reference', 'Matter was not found.');
    const s = sameOrg(input.governance, current);
    if (!s.ok) return s;
    if (
      ['Completed', 'Cancelled', 'Archived', 'DeletedReferenceOnly'].includes(
        current.matterStatus
      )
    )
      return fail(
        'StateTransitionNotAllowed',
        'State',
        'Finalized Matter cannot change relationships.'
      );
    const rr = resolve(
      this.deps.relatedReferenceRegistry,
      input.referenceId,
      def[0],
      def[1]
    );
    if (!rr.ok) return rr;
    const result = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: `${CONTRACT_ID}|${kind}|${input.matterReferenceId}`,
        operationName: `linkMatter${kind[0]!.toUpperCase()}${kind.slice(1)}`,
        request: { referenceId: input.referenceId },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const field = def[2];
        const existing = (current as unknown as Record<string, unknown>)[field];
        let next: CoreMatterServiceRecord;
        if (Array.isArray(existing)) {
          if (existing.includes(input.referenceId))
            return fail(
              'Conflict',
              'Conflict',
              'Matter relationship already exists.'
            );
          next = {
            ...current,
            [field]: [...existing, input.referenceId],
            objectRecord: updatedObject(
              current,
              current.matterStatus,
              this.deps.now(),
              input.governance.permission.actorReferenceId
            )
          } as CoreMatterServiceRecord;
        } else {
          if (existing && existing !== input.referenceId)
            return fail(
              'Conflict',
              'Conflict',
              'Matter relationship already exists.'
            );
          next = {
            ...current,
            [field]: input.referenceId,
            objectRecord: updatedObject(
              current,
              current.matterStatus,
              this.deps.now(),
              input.governance.permission.actorReferenceId
            )
          } as CoreMatterServiceRecord;
        }
        const replaced = this.deps.store.replace(next);
        if (!replaced.ok) return replaced;
        const ev = event(this.deps, {
          operation: `link-${kind}`,
          id: input.matterReferenceId,
          key: input.idempotencyKey ?? '',
          status: next.matterStatus,
          payload: { relationshipKind: kind, linked: true },
          governance: input.governance
        });
        if (!ev.ok) {
          this.deps.store.replace(current);
          return fail(
            'EventTraceFailed',
            'Event',
            'Matter event trace failed.'
          );
        }
        return replaced;
      }
    );
    return result.ok ? { ok: true, value: result.value.result } : result;
  }
  linkMatterOrder(input: {
    matterReferenceId: string;
    orderReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('order', {
      ...input,
      referenceId: input.orderReferenceId
    });
  }
  linkMatterCustomer(input: {
    matterReferenceId: string;
    customerReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('customer', {
      ...input,
      referenceId: input.customerReferenceId
    });
  }
  linkMatterBrand(input: {
    matterReferenceId: string;
    brandReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('brand', {
      ...input,
      referenceId: input.brandReferenceId
    });
  }
  linkMatterTrademark(input: {
    matterReferenceId: string;
    trademarkReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('trademark', {
      ...input,
      referenceId: input.trademarkReferenceId
    });
  }
  linkMatterJurisdiction(input: {
    matterReferenceId: string;
    jurisdictionReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('jurisdiction', {
      ...input,
      referenceId: input.jurisdictionReferenceId
    });
  }
  linkMatterClassification(input: {
    matterReferenceId: string;
    classificationReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('classification', {
      ...input,
      referenceId: input.classificationReferenceId
    });
  }
  linkMatterWorkflowContract(input: {
    matterReferenceId: string;
    workflowContractReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('workflowContract', {
      ...input,
      referenceId: input.workflowContractReferenceId
    });
  }
  linkMatterTask(input: {
    matterReferenceId: string;
    taskReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('task', { ...input, referenceId: input.taskReferenceId });
  }
  linkMatterDocument(input: {
    matterReferenceId: string;
    documentReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('document', {
      ...input,
      referenceId: input.documentReferenceId
    });
  }
  linkMatterEvidence(input: {
    matterReferenceId: string;
    evidenceReferenceId: string;
    idempotencyKey?: string | null;
    governance: CoreMatterGovernanceContext;
  }) {
    return this.link('evidence', {
      ...input,
      referenceId: input.evidenceReferenceId
    });
  }
  validateMatterReference(input: {
    matterReferenceId: string;
    governance: CoreMatterGovernanceContext;
  }): CoreBehaviorResult<CoreMatterValidationResult> {
    const g = governed(
      input.governance,
      'matter.validate_reference',
      'matter:validate_reference',
      'matter.read',
      input.matterReferenceId
    );
    if (!g.ok) return g;
    const record = this.deps.store.get(input.matterReferenceId);
    if (!record || !sameOrg(input.governance, record).ok)
      return {
        ok: true,
        value: {
          isValid: false,
          matterReferenceId: input.matterReferenceId,
          matterType: 'Unknown',
          status: 'DeletedReferenceOnly',
          orderLinked: false,
          workflowContractLinked: false,
          reasonCode: 'NotFound',
          policyHint: null
        }
      };
    const reason: CoreMatterValidationResult['reasonCode'] =
      record.matterStatus === 'Archived'
        ? 'Archived'
        : record.matterStatus === 'Cancelled'
          ? 'Cancelled'
          : record.matterStatus === 'Completed'
            ? 'Completed'
            : record.matterStatus === 'ReviewRequired'
              ? 'ReviewRequired'
              : ['Draft', 'Blocked', 'DeletedReferenceOnly'].includes(
                    record.matterStatus
                  )
                ? 'NotOpen'
                : 'Valid';
    return {
      ok: true,
      value: {
        isValid: reason === 'Valid',
        matterReferenceId: input.matterReferenceId,
        matterType: record.matterType,
        status: record.matterStatus,
        orderLinked: Boolean(record.orderReferenceId),
        workflowContractLinked: Boolean(record.workflowContractReferenceId),
        reasonCode: reason,
        policyHint:
          input.governance.policy.policyDecision === 'Restricted'
            ? 'Restricted'
            : 'Allowed'
      }
    };
  }
}
