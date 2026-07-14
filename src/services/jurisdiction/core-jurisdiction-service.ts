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

export const CORE_JURISDICTION_TYPES = [
  'National',
  'Regional',
  'International',
  'Territory',
  'Office',
  'Custom',
  'Unknown'
] as const;
export type CoreJurisdictionType = (typeof CORE_JURISDICTION_TYPES)[number];

export const CORE_JURISDICTION_STATUSES = [
  'Draft',
  'Active',
  'ReviewRequired',
  'Deprecated',
  'Reserved',
  'Archived'
] as const;
export type CoreJurisdictionStatus =
  (typeof CORE_JURISDICTION_STATUSES)[number];

export const CORE_JURISDICTION_STATUS_TO_OBJECT_STATUS: Record<
  CoreJurisdictionStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  Active: 'active',
  ReviewRequired: 'draft',
  Deprecated: 'inactive',
  Reserved: 'inactive',
  Archived: 'archived'
};

export const CORE_JURISDICTION_IMPLEMENTED_OPERATIONS = [
  'createJurisdiction',
  'getJurisdiction',
  'listJurisdictions',
  'validateJurisdictionReference',
  'resolveJurisdictionByCode',
  'changeJurisdictionStatus'
] as const;

export const CORE_JURISDICTION_MINIMUM_CAPABILITIES = [
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

export const CORE_JURISDICTION_COLLECTION_TARGET = 'jurisdiction:collection';
const CONTRACT_ID = 'core-service-jurisdiction-service-contract';
const JURISDICTION_OBJECT_TYPE = 'jurisdiction-record';
const JURISDICTION_DOMAIN = 'jurisdiction';
const JURISDICTION_OBJECT_CONTRACT_ID =
  'core-object-jurisdiction-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const transitions = new Set([
  'Draft->Active',
  'Draft->ReviewRequired',
  'Draft->Reserved',
  'Draft->Archived',
  'Active->ReviewRequired',
  'Active->Deprecated',
  'Active->Archived',
  'ReviewRequired->Draft',
  'ReviewRequired->Active',
  'ReviewRequired->Deprecated',
  'ReviewRequired->Archived',
  'Reserved->Draft',
  'Reserved->Active',
  'Reserved->ReviewRequired',
  'Reserved->Archived',
  'Deprecated->ReviewRequired',
  'Deprecated->Archived'
]);
const reasonRequiredStatuses = new Set<CoreJurisdictionStatus>([
  'Deprecated',
  'Archived'
]);

const jurisdictionErrorCategories: Partial<
  Record<CoreErrorCode, CoreErrorCategory>
> = {
  JurisdictionAlreadyExists: 'Conflict',
  JurisdictionNotFound: 'Reference',
  InvalidJurisdictionReference: 'Reference',
  JurisdictionCodeAlreadyExists: 'Conflict',
  InvalidJurisdictionCode: 'Validation',
  InvalidJurisdictionTransition: 'State',
  InvalidJurisdictionStatus: 'State',
  PermissionDenied: 'Permission',
  PolicyRestricted: 'Policy',
  HumanReviewRequired: 'HumanReview',
  IdempotencyKeyRequired: 'Idempotency',
  IdempotencyKeyInvalid: 'Idempotency',
  IdempotencyConflict: 'Idempotency',
  EventTraceFailed: 'Event',
  AuditContextMissing: 'Validation',
  JurisdictionObjectMismatch: 'Validation',
  InternalError: 'Internal'
};

export interface CoreJurisdictionServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly jurisdictionCode: string;
  readonly jurisdictionType: CoreJurisdictionType;
  readonly jurisdictionStatus: CoreJurisdictionStatus;
  readonly nameReference: string;
  readonly sourceReference: string;
}

export interface CoreJurisdictionGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreJurisdictionServiceStore {
  get(
    jurisdictionReferenceId: string
  ): CoreJurisdictionServiceRecord | undefined;
  list(): readonly CoreJurisdictionServiceRecord[];
  insert(
    record: CoreJurisdictionServiceRecord
  ): CoreBehaviorResult<CoreJurisdictionServiceRecord>;
  replace(
    record: CoreJurisdictionServiceRecord
  ): CoreBehaviorResult<CoreJurisdictionServiceRecord>;
  remove(jurisdictionReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreJurisdictionEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreJurisdictionRequestingServiceDirectoryEntry {
  readonly domainId: CoreDomainId;
  readonly serviceType: string;
}

export interface CoreJurisdictionServiceDependencies {
  readonly store: CoreJurisdictionServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreJurisdictionEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly requestingServiceDirectory: readonly CoreJurisdictionRequestingServiceDirectoryEntry[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: 'createJurisdiction' | 'changeJurisdictionStatus',
    jurisdictionReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
}

export interface CoreJurisdictionListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly jurisdictionCode: string;
  readonly jurisdictionType: CoreJurisdictionType;
  readonly jurisdictionStatus: CoreJurisdictionStatus;
  readonly genericObjectStatus: CoreObjectStatus | undefined;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface CoreJurisdictionReferenceValidationResult {
  readonly isValid: boolean;
  readonly jurisdictionReferenceId: string;
  readonly jurisdictionCode: string | null;
  readonly jurisdictionType: CoreJurisdictionType | null;
  readonly jurisdictionStatus: CoreJurisdictionStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Draft'
    | 'ReviewRequired'
    | 'Deprecated'
    | 'Reserved'
    | 'Archived'
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
      category: jurisdictionErrorCategories[code] ?? 'Validation',
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

function isJurisdictionType(value: unknown): value is CoreJurisdictionType {
  return (
    typeof value === 'string' &&
    (CORE_JURISDICTION_TYPES as readonly string[]).includes(value)
  );
}

function isJurisdictionStatus(value: unknown): value is CoreJurisdictionStatus {
  return (
    typeof value === 'string' &&
    (CORE_JURISDICTION_STATUSES as readonly string[]).includes(value)
  );
}

function normalizeJurisdictionCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9-]{1,15}$/.test(normalized) ? normalized : null;
}

function validUtcTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function organizationScopeOf(
  record: CoreJurisdictionServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreJurisdictionGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Jurisdiction organization scope is not authorized.',
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
  context: CoreJurisdictionGovernanceContext,
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
    context.review.targetObjectType !== JURISDICTION_OBJECT_TYPE ||
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
    context.audit.targetObjectType !== JURISDICTION_OBJECT_TYPE ||
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

function validateJurisdictionReferenceRecord(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: JURISDICTION_OBJECT_TYPE,
    expectedDomain: JURISDICTION_DOMAIN
  });
  return resolved.ok
    ? resolved
    : safe(
        'InvalidJurisdictionReference',
        'Jurisdiction reference is invalid.'
      );
}

function validateJurisdictionRecord(
  record: CoreJurisdictionServiceRecord,
  publicReferenceRecord: CoreReferenceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreJurisdictionServiceRecord> {
  if (!isJurisdictionType(record.jurisdictionType)) {
    return safe(
      'InvalidJurisdictionType',
      'Jurisdiction type is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!isJurisdictionStatus(record.jurisdictionStatus)) {
    return safe(
      'InvalidJurisdictionStatus',
      'Jurisdiction status is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    record.objectRecord.domainId !== JURISDICTION_DOMAIN ||
    record.objectRecord.objectType !== JURISDICTION_OBJECT_TYPE ||
    record.objectRecord.objectContractId !== JURISDICTION_OBJECT_CONTRACT_ID ||
    record.objectRecord.publicReferenceId !==
      publicReferenceRecord.referenceId ||
    record.objectRecord.status !==
      CORE_JURISDICTION_STATUS_TO_OBJECT_STATUS[record.jurisdictionStatus]
  ) {
    return safe(
      'JurisdictionObjectMismatch',
      'Jurisdiction Object foundation does not match.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  const normalizedCode = normalizeJurisdictionCode(record.jurisdictionCode);
  if (normalizedCode === null || normalizedCode !== record.jurisdictionCode) {
    return safe(
      'InvalidJurisdictionCode',
      'Jurisdiction code is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!record.nameReference.trim() || record.nameReference.length > 128) {
    return safe(
      'JurisdictionNameRequired',
      'Jurisdiction name reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!opaque.test(record.sourceReference)) {
    return safe(
      'JurisdictionSourceReferenceRequired',
      'Jurisdiction source reference is required.',
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
      'Jurisdiction Object base record is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  return { ok: true, value: immutable(record) };
}

function validateRequestingService(
  requestingDomain: string,
  requestingService: string,
  directory: readonly CoreJurisdictionRequestingServiceDirectoryEntry[]
): CoreBehaviorResult<null> {
  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {
    return safe(
      'InvalidJurisdictionReference',
      'Requesting Domain is invalid.'
    );
  }
  const service = directory.find(
    (entry) =>
      entry.serviceType === requestingService &&
      entry.domainId === requestingDomain
  );
  if (!service) {
    return safe(
      'InvalidJurisdictionReference',
      'Requesting Service is invalid.'
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreJurisdictionGovernanceContext,
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
  readonly jurisdictionReferenceId: string;
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
      domainId: JURISDICTION_DOMAIN,
      object: {
        id: createCoreObjectId(input.jurisdictionReferenceId),
        type: createCoreObjectType(JURISDICTION_OBJECT_TYPE),
        domainId: JURISDICTION_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryJurisdictionServiceStore implements CoreJurisdictionServiceStore {
  readonly #records = new Map<string, CoreJurisdictionServiceRecord>();

  get(id: string): CoreJurisdictionServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreJurisdictionServiceRecord[] {
    return [...this.#records.values()].map((record) => immutable(record));
  }

  insert(
    record: CoreJurisdictionServiceRecord
  ): CoreBehaviorResult<CoreJurisdictionServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id)) {
      return safe(
        'JurisdictionAlreadyExists',
        'Jurisdiction already exists.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreJurisdictionServiceRecord
  ): CoreBehaviorResult<CoreJurisdictionServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id)) {
      return safe(
        'JurisdictionNotFound',
        'Jurisdiction was not found.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(jurisdictionReferenceId: string): CoreBehaviorResult<null> {
    this.#records.delete(jurisdictionReferenceId);
    return { ok: true, value: null };
  }
}

export class CoreJurisdictionService {
  constructor(readonly deps: CoreJurisdictionServiceDependencies) {}

  createJurisdiction(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly jurisdictionCode: string;
    readonly jurisdictionType: unknown;
    readonly jurisdictionStatus: unknown;
    readonly nameReference: string;
    readonly sourceReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreJurisdictionGovernanceContext;
  }): CoreBehaviorResult<CoreJurisdictionServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'jurisdiction.create',
      permission: 'jurisdiction:create',
      policyScope: 'jurisdiction.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (
      !['Draft', 'Active', 'ReviewRequired', 'Reserved'].includes(
        String(input.jurisdictionStatus)
      )
    ) {
      return safe(
        'InvalidJurisdictionStatus',
        'Initial Jurisdiction status is invalid.',
        input.governance.correlationId
      );
    }
    const registered = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.publicReferenceRecord.referenceId,
      expectedObjectType: JURISDICTION_OBJECT_TYPE,
      expectedDomain: JURISDICTION_DOMAIN
    });
    if (
      !registered.ok ||
      target !== input.publicReferenceRecord.referenceId ||
      !referenceMatches(input.publicReferenceRecord, registered.value)
    ) {
      return safe(
        'InvalidJurisdictionReference',
        'Jurisdiction reference is invalid.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior<
      {
        readonly objectRecord: CoreMvpObjectBaseRecord;
        readonly publicReferenceRecord: CoreReferenceRecord;
        readonly jurisdictionCode: string;
        readonly jurisdictionType: unknown;
        readonly jurisdictionStatus: unknown;
        readonly nameReference: string;
        readonly sourceReference: string;
      },
      CoreJurisdictionServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'createJurisdiction'
        ),
        operationName: 'createJurisdiction',
        request: {
          objectRecord: input.objectRecord,
          publicReferenceRecord: input.publicReferenceRecord,
          jurisdictionCode: input.jurisdictionCode,
          jurisdictionType: input.jurisdictionType,
          jurisdictionStatus: input.jurisdictionStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target)) {
          return safe(
            'JurisdictionAlreadyExists',
            'Jurisdiction already exists.',
            input.governance.correlationId
          );
        }
        const normalizedCode = normalizeJurisdictionCode(
          input.jurisdictionCode
        );
        if (normalizedCode === null) {
          return safe(
            'InvalidJurisdictionCode',
            'Jurisdiction code is invalid.',
            input.governance.correlationId
          );
        }
        if (
          this.deps.store
            .list()
            .some((entry) => entry.jurisdictionCode === normalizedCode)
        ) {
          return safe(
            'JurisdictionCodeAlreadyExists',
            'Jurisdiction code already exists.',
            input.governance.correlationId
          );
        }
        const record: CoreJurisdictionServiceRecord = {
          objectRecord: input.objectRecord,
          jurisdictionCode: normalizedCode,
          jurisdictionType: input.jurisdictionType as CoreJurisdictionType,
          jurisdictionStatus:
            input.jurisdictionStatus as CoreJurisdictionStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference
        };
        const valid = validateJurisdictionRecord(
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
        let inserted: CoreBehaviorResult<CoreJurisdictionServiceRecord>;
        try {
          inserted = this.deps.store.insert(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Jurisdiction Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!inserted.ok) return inserted;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'createJurisdiction',
                target,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-created',
              action: CORE_EVENT_ACTIONS.created,
              jurisdictionReferenceId: target,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                jurisdictionReferenceId: target,
                jurisdictionCode: valid.value.jurisdictionCode,
                jurisdictionType: valid.value.jurisdictionType,
                jurisdictionStatus: valid.value.jurisdictionStatus
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
              'Jurisdiction create rollback failed.',
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

  getJurisdiction(input: {
    readonly jurisdictionReferenceId: string;
    readonly governance: CoreJurisdictionGovernanceContext;
  }): CoreBehaviorResult<CoreJurisdictionServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'jurisdiction.read',
      permission: 'jurisdiction:read',
      policyScope: 'jurisdiction.read',
      target: input.jurisdictionReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateJurisdictionReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.jurisdictionReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.jurisdictionReferenceId);
    if (!record) {
      return safe(
        'JurisdictionNotFound',
        'Jurisdiction was not found.',
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

  listJurisdictions(input: {
    readonly filters?: {
      readonly jurisdictionCode?: unknown;
      readonly jurisdictionType?: unknown;
      readonly jurisdictionStatus?: unknown;
      readonly publicReferenceId?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreJurisdictionGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreJurisdictionListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'jurisdiction.list',
      permission: 'jurisdiction:list',
      policyScope: 'jurisdiction.list',
      target: CORE_JURISDICTION_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.jurisdictionCode !== undefined &&
      normalizeJurisdictionCode(input.filters.jurisdictionCode) === null
    ) {
      return safe(
        'InvalidJurisdictionCode',
        'Jurisdiction code filter is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.filters?.jurisdictionType !== undefined &&
      !isJurisdictionType(input.filters.jurisdictionType)
    ) {
      return safe(
        'InvalidJurisdictionType',
        'Jurisdiction type filter is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.filters?.jurisdictionStatus !== undefined &&
      !isJurisdictionStatus(input.filters.jurisdictionStatus)
    ) {
      return safe(
        'InvalidJurisdictionStatus',
        'Jurisdiction status filter is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.filters?.publicReferenceId !== undefined &&
      (typeof input.filters.publicReferenceId !== 'string' ||
        !controlledReference.test(input.filters.publicReferenceId))
    ) {
      return safe(
        'InvalidJurisdictionReference',
        'Jurisdiction reference filter is invalid.',
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
          (input.filters?.jurisdictionCode === undefined ||
            record.jurisdictionCode ===
              normalizeJurisdictionCode(input.filters.jurisdictionCode)) &&
          (input.filters?.jurisdictionType === undefined ||
            record.jurisdictionType === input.filters.jurisdictionType) &&
          (input.filters?.jurisdictionStatus === undefined ||
            record.jurisdictionStatus === input.filters.jurisdictionStatus) &&
          (input.filters?.publicReferenceId === undefined ||
            record.objectRecord.publicReferenceId ===
              input.filters.publicReferenceId)
      )
      .map((record): CoreJurisdictionListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        jurisdictionCode: record.jurisdictionCode,
        jurisdictionType: record.jurisdictionType,
        jurisdictionStatus: record.jurisdictionStatus,
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
          'jurisdictionCode',
          'jurisdictionType',
          'jurisdictionStatus'
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

  validateJurisdictionReference(input: {
    readonly jurisdictionReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreJurisdictionGovernanceContext;
  }): CoreBehaviorResult<CoreJurisdictionReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'jurisdiction.validate_reference',
      permission: 'jurisdiction:validate_reference',
      policyScope: 'jurisdiction.reference',
      target: input.jurisdictionReferenceId
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService,
      this.deps.requestingServiceDirectory
    );
    if (!requester.ok) return requester;
    const reference = validateJurisdictionReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.jurisdictionReferenceId
    );
    if (!reference.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          jurisdictionReferenceId: input.jurisdictionReferenceId,
          jurisdictionCode: null,
          jurisdictionType: null,
          jurisdictionStatus: null,
          reasonCode: 'InvalidReference'
        }
      };
    }
    const record = this.deps.store.get(input.jurisdictionReferenceId);
    if (!record) {
      return {
        ok: true,
        value: {
          isValid: false,
          jurisdictionReferenceId: input.jurisdictionReferenceId,
          jurisdictionCode: null,
          jurisdictionType: null,
          jurisdictionStatus: null,
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
          jurisdictionReferenceId: input.jurisdictionReferenceId,
          jurisdictionCode: null,
          jurisdictionType: null,
          jurisdictionStatus: null,
          reasonCode: 'NotFound'
        }
      };
    }
    return {
      ok: true,
      value: {
        isValid: record.jurisdictionStatus === 'Active',
        jurisdictionReferenceId: input.jurisdictionReferenceId,
        jurisdictionCode: record.jurisdictionCode,
        jurisdictionType: record.jurisdictionType,
        jurisdictionStatus: record.jurisdictionStatus,
        reasonCode:
          record.jurisdictionStatus === 'Draft'
            ? 'Draft'
            : record.jurisdictionStatus === 'ReviewRequired'
              ? 'ReviewRequired'
              : record.jurisdictionStatus === 'Deprecated'
                ? 'Deprecated'
                : record.jurisdictionStatus === 'Reserved'
                  ? 'Reserved'
                  : record.jurisdictionStatus === 'Archived'
                    ? 'Archived'
                    : 'Valid'
      }
    };
  }

  resolveJurisdictionByCode(input: {
    readonly jurisdictionCode: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreJurisdictionGovernanceContext;
  }): CoreBehaviorResult<CoreJurisdictionReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'jurisdiction.resolve_by_code',
      permission: 'jurisdiction:resolve',
      policyScope: 'jurisdiction.reference',
      target: CORE_JURISDICTION_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService,
      this.deps.requestingServiceDirectory
    );
    if (!requester.ok) return requester;
    const code = normalizeJurisdictionCode(input.jurisdictionCode);
    if (code === null)
      return safe(
        'InvalidJurisdictionCode',
        'Jurisdiction code is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store
      .list()
      .find((entry) => entry.jurisdictionCode === code);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          jurisdictionReferenceId: '',
          jurisdictionCode: code,
          jurisdictionType: null,
          jurisdictionStatus: null,
          reasonCode: 'NotFound'
        }
      };
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scope.ok)
      return {
        ok: true,
        value: {
          isValid: false,
          jurisdictionReferenceId: '',
          jurisdictionCode: code,
          jurisdictionType: null,
          jurisdictionStatus: null,
          reasonCode: 'NotFound'
        }
      };
    return {
      ok: true,
      value: {
        isValid: record.jurisdictionStatus === 'Active',
        jurisdictionReferenceId: record.objectRecord.publicReferenceId,
        jurisdictionCode: record.jurisdictionCode,
        jurisdictionType: record.jurisdictionType,
        jurisdictionStatus: record.jurisdictionStatus,
        reasonCode:
          record.jurisdictionStatus === 'Draft'
            ? 'Draft'
            : record.jurisdictionStatus === 'ReviewRequired'
              ? 'ReviewRequired'
              : record.jurisdictionStatus === 'Deprecated'
                ? 'Deprecated'
                : record.jurisdictionStatus === 'Reserved'
                  ? 'Reserved'
                  : record.jurisdictionStatus === 'Archived'
                    ? 'Archived'
                    : 'Valid'
      }
    };
  }

  changeJurisdictionStatus(input: {
    readonly jurisdictionReferenceId: string;
    readonly targetStatus: CoreJurisdictionStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreJurisdictionGovernanceContext;
  }): CoreBehaviorResult<CoreJurisdictionServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'jurisdiction.change_status',
      permission: 'jurisdiction:change_status',
      policyScope: 'jurisdiction.lifecycle',
      target: input.jurisdictionReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateJurisdictionReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.jurisdictionReferenceId
    );
    if (!reference.ok) return reference;
    const existing = this.deps.store.get(input.jurisdictionReferenceId);
    if (!existing) {
      return safe(
        'JurisdictionNotFound',
        'Jurisdiction was not found.',
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
        readonly jurisdictionReferenceId: string;
        readonly targetStatus: CoreJurisdictionStatus;
        readonly reasonReference: string | null;
      },
      CoreJurisdictionServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'changeJurisdictionStatus'
        ),
        operationName: 'changeJurisdictionStatus',
        request: {
          jurisdictionReferenceId: input.jurisdictionReferenceId,
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const current = this.deps.store.get(input.jurisdictionReferenceId);
        if (!current) {
          return safe(
            'JurisdictionNotFound',
            'Jurisdiction was not found.',
            input.governance.correlationId
          );
        }
        const transition = `${current.jurisdictionStatus}->${input.targetStatus}`;
        if (!transitions.has(transition)) {
          return safe(
            'InvalidJurisdictionTransition',
            'Jurisdiction status transition is invalid.',
            input.governance.correlationId
          );
        }
        if (
          reasonRequiredStatuses.has(input.targetStatus) &&
          (!input.reasonReference || !opaque.test(input.reasonReference))
        ) {
          return safe(
            'JurisdictionReasonReferenceRequired',
            'Jurisdiction reason reference is required.',
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
        const updated: CoreJurisdictionServiceRecord = {
          ...current,
          jurisdictionStatus: input.targetStatus,
          objectRecord: {
            ...current.objectRecord,
            status:
              CORE_JURISDICTION_STATUS_TO_OBJECT_STATUS[input.targetStatus],
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
            'JurisdictionObjectMismatch',
            'Jurisdiction immutable Object fields changed.',
            input.governance.correlationId
          );
        }
        const validated = validateJurisdictionRecord(
          updated,
          reference.value,
          this.deps.relatedReferenceRegistry
        );
        if (!validated.ok) return validated;
        let replaced: CoreBehaviorResult<CoreJurisdictionServiceRecord>;
        try {
          replaced = this.deps.store.replace(validated.value);
        } catch {
          return safe(
            'InternalError',
            'Jurisdiction Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!replaced.ok) return replaced;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'changeJurisdictionStatus',
                input.jurisdictionReferenceId,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-status-changed',
              action: CORE_EVENT_ACTIONS.statusChanged,
              jurisdictionReferenceId: input.jurisdictionReferenceId,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                jurisdictionReferenceId: input.jurisdictionReferenceId,
                previousStatus: current.jurisdictionStatus,
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
              'Jurisdiction status rollback failed.',
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
