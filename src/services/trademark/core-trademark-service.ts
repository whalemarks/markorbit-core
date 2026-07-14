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

export const CORE_TRADEMARK_TYPES = [
  'Word',
  'Device',
  'Combined',
  'Slogan',
  'Sound',
  'Color',
  'ThreeDimensional',
  'Series',
  'Unknown'
] as const;
export type CoreTrademarkType = (typeof CORE_TRADEMARK_TYPES)[number];

export const CORE_TRADEMARK_STATUSES = [
  'Draft',
  'Planned',
  'PendingFiling',
  'Filed',
  'UnderExamination',
  'Published',
  'Opposed',
  'Registered',
  'Refused',
  'Abandoned',
  'Cancelled',
  'Expired',
  'Invalidated',
  'RenewalDue',
  'ReviewRequired',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreTrademarkStatus = (typeof CORE_TRADEMARK_STATUSES)[number];

export const CORE_TRADEMARK_STATUS_TO_OBJECT_STATUS: Record<
  CoreTrademarkStatus,
  CoreObjectStatus
> = {
  Draft: 'draft',
  Planned: 'draft',
  PendingFiling: 'draft',
  Filed: 'active',
  UnderExamination: 'active',
  Published: 'active',
  Opposed: 'active',
  Registered: 'active',
  Refused: 'archived',
  Abandoned: 'archived',
  Cancelled: 'archived',
  Expired: 'archived',
  Invalidated: 'archived',
  RenewalDue: 'active',
  ReviewRequired: 'draft',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

export const CORE_TRADEMARK_IMPLEMENTED_OPERATIONS = [
  'createTrademark',
  'getTrademark',
  'listTrademarks',
  'validateTrademarkReference',
  'changeTrademarkStatus'
] as const;

export const CORE_TRADEMARK_MINIMUM_CAPABILITIES = [
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

export const CORE_TRADEMARK_COLLECTION_TARGET = 'trademark:collection';
const CONTRACT_ID = 'core-service-trademark-service-contract';
const TRADEMARK_OBJECT_TYPE = 'trademark-record';
const TRADEMARK_DOMAIN = 'trademark';
const TRADEMARK_OBJECT_CONTRACT_ID = 'core-object-trademark-record-contract';
const BRAND_OBJECT_TYPE = 'brand-record';
const BRAND_DOMAIN = 'brand';
const JURISDICTION_OBJECT_TYPE = 'jurisdiction-record';
const JURISDICTION_DOMAIN = 'jurisdiction';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const transitions = new Set([
  'Draft->Planned',
  'Draft->PendingFiling',
  'Draft->ReviewRequired',
  'Draft->Archived',
  'Planned->PendingFiling',
  'Planned->ReviewRequired',
  'Planned->Archived',
  'PendingFiling->Filed',
  'PendingFiling->ReviewRequired',
  'PendingFiling->Archived',
  'Filed->UnderExamination',
  'Filed->Published',
  'Filed->ReviewRequired',
  'Filed->Archived',
  'UnderExamination->Published',
  'UnderExamination->Registered',
  'UnderExamination->Refused',
  'UnderExamination->ReviewRequired',
  'UnderExamination->Archived',
  'Published->Opposed',
  'Published->Registered',
  'Published->Refused',
  'Published->Archived',
  'Opposed->Registered',
  'Opposed->Refused',
  'Opposed->Archived',
  'Registered->RenewalDue',
  'Registered->Archived',
  'RenewalDue->Registered',
  'RenewalDue->Expired',
  'RenewalDue->Archived',
  'ReviewRequired->Draft',
  'ReviewRequired->Planned',
  'ReviewRequired->PendingFiling',
  'ReviewRequired->Filed',
  'ReviewRequired->Archived',
  'Refused->Archived',
  'Abandoned->Archived',
  'Cancelled->Archived',
  'Expired->Archived',
  'Invalidated->Archived',
  'Archived->DeletedReferenceOnly'
]);
const reasonRequiredStatuses = new Set<CoreTrademarkStatus>([
  'Refused',
  'Abandoned',
  'Cancelled',
  'Expired',
  'Invalidated',
  'Archived',
  'DeletedReferenceOnly'
]);

const trademarkErrorCategories: Partial<
  Record<CoreErrorCode, CoreErrorCategory>
> = {
  TrademarkAlreadyExists: 'Conflict',
  TrademarkNotFound: 'Reference',
  InvalidTrademarkReference: 'Reference',
  InvalidTrademarkBrandReference: 'Reference',
  InvalidTrademarkJurisdictionReference: 'Reference',
  InvalidTrademarkTransition: 'State',
  InvalidTrademarkStatus: 'State',
  PermissionDenied: 'Permission',
  PolicyRestricted: 'Policy',
  HumanReviewRequired: 'HumanReview',
  IdempotencyKeyRequired: 'Idempotency',
  IdempotencyKeyInvalid: 'Idempotency',
  IdempotencyConflict: 'Idempotency',
  EventTraceFailed: 'Event',
  AuditContextMissing: 'Validation',
  TrademarkObjectMismatch: 'Validation',
  InternalError: 'Internal'
};

export interface CoreTrademarkServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly trademarkType: CoreTrademarkType;
  readonly trademarkStatus: CoreTrademarkStatus;
  readonly markRepresentationReference: string;
  readonly sourceReference: string;
  readonly jurisdictionReferenceId: string;
  readonly brandReferenceId: string | null;
}

export interface CoreTrademarkGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreTrademarkServiceStore {
  get(trademarkReferenceId: string): CoreTrademarkServiceRecord | undefined;
  list(): readonly CoreTrademarkServiceRecord[];
  insert(
    record: CoreTrademarkServiceRecord
  ): CoreBehaviorResult<CoreTrademarkServiceRecord>;
  replace(
    record: CoreTrademarkServiceRecord
  ): CoreBehaviorResult<CoreTrademarkServiceRecord>;
  remove(trademarkReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreTrademarkEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreTrademarkRequestingServiceDirectoryEntry {
  readonly domainId: CoreDomainId;
  readonly serviceType: string;
}

export interface CoreTrademarkServiceDependencies {
  readonly store: CoreTrademarkServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreTrademarkEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly requestingServiceDirectory: readonly CoreTrademarkRequestingServiceDirectoryEntry[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: 'createTrademark' | 'changeTrademarkStatus',
    trademarkReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
}

export interface CoreTrademarkListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly trademarkType: CoreTrademarkType;
  readonly trademarkStatus: CoreTrademarkStatus;
  readonly genericObjectStatus: CoreObjectStatus | undefined;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface CoreTrademarkReferenceValidationResult {
  readonly isValid: boolean;
  readonly trademarkReferenceId: string;
  readonly trademarkType: CoreTrademarkType | null;
  readonly trademarkStatus: CoreTrademarkStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
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
      category: trademarkErrorCategories[code] ?? 'Validation',
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

function isTrademarkType(value: unknown): value is CoreTrademarkType {
  return (
    typeof value === 'string' &&
    (CORE_TRADEMARK_TYPES as readonly string[]).includes(value)
  );
}

function isTrademarkStatus(value: unknown): value is CoreTrademarkStatus {
  return (
    typeof value === 'string' &&
    (CORE_TRADEMARK_STATUSES as readonly string[]).includes(value)
  );
}

function validUtcTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function organizationScopeOf(
  record: CoreTrademarkServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function enforceOrganizationScope(
  governance: CoreTrademarkGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Trademark organization scope is not authorized.',
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
  context: CoreTrademarkGovernanceContext,
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
    context.review.targetObjectType !== TRADEMARK_OBJECT_TYPE ||
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
    context.audit.targetObjectType !== TRADEMARK_OBJECT_TYPE ||
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

function validateTrademarkReferenceRecord(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: TRADEMARK_OBJECT_TYPE,
    expectedDomain: TRADEMARK_DOMAIN
  });
  return resolved.ok
    ? resolved
    : safe('InvalidTrademarkReference', 'Trademark reference is invalid.');
}

function validateBrandRelationshipReference(
  registry: CoreReferenceRegistry,
  referenceId: string | null
): CoreBehaviorResult<null> {
  if (referenceId === null) return { ok: true, value: null };
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: BRAND_OBJECT_TYPE,
    expectedDomain: BRAND_DOMAIN
  });
  if (!resolved.ok || resolved.value.status !== 'Active') {
    return safe(
      'InvalidTrademarkBrandReference',
      'Trademark Brand reference is invalid.'
    );
  }
  return { ok: true, value: null };
}

function validateJurisdictionReference(
  registry: CoreReferenceRegistry,
  referenceId: string
): CoreBehaviorResult<null> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: JURISDICTION_OBJECT_TYPE,
    expectedDomain: JURISDICTION_DOMAIN
  });
  if (!resolved.ok || resolved.value.status !== 'Active') {
    return safe(
      'InvalidTrademarkJurisdictionReference',
      'Trademark Jurisdiction reference is invalid.'
    );
  }
  return { ok: true, value: null };
}

function validateTrademarkRecord(
  record: CoreTrademarkServiceRecord,
  publicReferenceRecord: CoreReferenceRecord,
  registry: CoreReferenceRegistry
): CoreBehaviorResult<CoreTrademarkServiceRecord> {
  if (!isTrademarkType(record.trademarkType)) {
    return safe(
      'InvalidTrademarkType',
      'Trademark type is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!isTrademarkStatus(record.trademarkStatus)) {
    return safe(
      'InvalidTrademarkStatus',
      'Trademark status is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    record.objectRecord.domainId !== TRADEMARK_DOMAIN ||
    record.objectRecord.objectType !== TRADEMARK_OBJECT_TYPE ||
    record.objectRecord.objectContractId !== TRADEMARK_OBJECT_CONTRACT_ID ||
    record.objectRecord.publicReferenceId !==
      publicReferenceRecord.referenceId ||
    record.objectRecord.status !==
      CORE_TRADEMARK_STATUS_TO_OBJECT_STATUS[record.trademarkStatus]
  ) {
    return safe(
      'TrademarkObjectMismatch',
      'Trademark Object foundation does not match.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (
    !record.markRepresentationReference.trim() ||
    record.markRepresentationReference.length > 128
  ) {
    return safe(
      'TrademarkMarkRepresentationRequired',
      'Trademark mark representation reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  if (!opaque.test(record.sourceReference)) {
    return safe(
      'TrademarkSourceReferenceRequired',
      'Trademark source reference is required.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  const jurisdiction = validateJurisdictionReference(
    registry,
    record.jurisdictionReferenceId
  );
  if (!jurisdiction.ok) return jurisdiction;
  const brand = validateBrandRelationshipReference(
    registry,
    record.brandReferenceId
  );
  if (!brand.ok) return brand;
  const validation = validateCoreMvpObjectBaseRecord(record.objectRecord, {
    publicReferenceRecord,
    relatedReferenceRegistry: registry
  });
  if (!validation.ok) {
    return safe(
      'ValidationFailed',
      'Trademark Object base record is invalid.',
      record.objectRecord.auditMetadata.correlationId
    );
  }
  return { ok: true, value: immutable(record) };
}

function validateRequestingService(
  requestingDomain: string,
  requestingService: string,
  directory: readonly CoreTrademarkRequestingServiceDirectoryEntry[]
): CoreBehaviorResult<null> {
  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {
    return safe('InvalidTrademarkReference', 'Requesting Domain is invalid.');
  }
  const service = directory.find(
    (entry) =>
      entry.serviceType === requestingService &&
      entry.domainId === requestingDomain
  );
  if (!service) {
    return safe('InvalidTrademarkReference', 'Requesting Service is invalid.');
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreTrademarkGovernanceContext,
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
  readonly trademarkReferenceId: string;
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
      domainId: TRADEMARK_DOMAIN,
      object: {
        id: createCoreObjectId(input.trademarkReferenceId),
        type: createCoreObjectType(TRADEMARK_OBJECT_TYPE),
        domainId: TRADEMARK_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

export class CoreInMemoryTrademarkServiceStore implements CoreTrademarkServiceStore {
  readonly #records = new Map<string, CoreTrademarkServiceRecord>();

  get(id: string): CoreTrademarkServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreTrademarkServiceRecord[] {
    return [...this.#records.values()].map((record) => immutable(record));
  }

  insert(
    record: CoreTrademarkServiceRecord
  ): CoreBehaviorResult<CoreTrademarkServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id)) {
      return safe(
        'TrademarkAlreadyExists',
        'Trademark already exists.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreTrademarkServiceRecord
  ): CoreBehaviorResult<CoreTrademarkServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id)) {
      return safe(
        'TrademarkNotFound',
        'Trademark was not found.',
        record.objectRecord.auditMetadata.correlationId
      );
    }
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(trademarkReferenceId: string): CoreBehaviorResult<null> {
    this.#records.delete(trademarkReferenceId);
    return { ok: true, value: null };
  }
}

export class CoreTrademarkService {
  constructor(readonly deps: CoreTrademarkServiceDependencies) {}

  createTrademark(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly trademarkType: unknown;
    readonly trademarkStatus: unknown;
    readonly markRepresentationReference: string;
    readonly sourceReference: string;
    readonly jurisdictionReferenceId: string;
    readonly brandReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTrademarkGovernanceContext;
  }): CoreBehaviorResult<CoreTrademarkServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'trademark.create',
      permission: 'trademark:create',
      policyScope: 'trademark.write',
      target
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (
      ![
        'Draft',
        'Planned',
        'PendingFiling',
        'Filed',
        'ReviewRequired'
      ].includes(String(input.trademarkStatus))
    ) {
      return safe(
        'InvalidTrademarkStatus',
        'Initial Trademark status is invalid.',
        input.governance.correlationId
      );
    }
    const registered = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.publicReferenceRecord.referenceId,
      expectedObjectType: TRADEMARK_OBJECT_TYPE,
      expectedDomain: TRADEMARK_DOMAIN
    });
    if (
      !registered.ok ||
      target !== input.publicReferenceRecord.referenceId ||
      !referenceMatches(input.publicReferenceRecord, registered.value)
    ) {
      return safe(
        'InvalidTrademarkReference',
        'Trademark reference is invalid.',
        input.governance.correlationId
      );
    }
    const idempotent = this.deps.idempotencyRegistry.executeBehavior<
      {
        readonly objectRecord: CoreMvpObjectBaseRecord;
        readonly publicReferenceRecord: CoreReferenceRecord;
        readonly trademarkType: unknown;
        readonly trademarkStatus: unknown;
        readonly markRepresentationReference: string;
        readonly sourceReference: string;
        readonly jurisdictionReferenceId: string;
        readonly brandReferenceId: string | null;
      },
      CoreTrademarkServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'createTrademark'),
        operationName: 'createTrademark',
        request: {
          objectRecord: input.objectRecord,
          publicReferenceRecord: input.publicReferenceRecord,
          trademarkType: input.trademarkType,
          trademarkStatus: input.trademarkStatus,
          markRepresentationReference: input.markRepresentationReference,
          sourceReference: input.sourceReference,
          jurisdictionReferenceId: input.jurisdictionReferenceId,
          brandReferenceId: input.brandReferenceId ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target)) {
          return safe(
            'TrademarkAlreadyExists',
            'Trademark already exists.',
            input.governance.correlationId
          );
        }
        const record: CoreTrademarkServiceRecord = {
          objectRecord: input.objectRecord,
          trademarkType: input.trademarkType as CoreTrademarkType,
          trademarkStatus: input.trademarkStatus as CoreTrademarkStatus,
          markRepresentationReference: input.markRepresentationReference,
          sourceReference: input.sourceReference,
          jurisdictionReferenceId: input.jurisdictionReferenceId,
          brandReferenceId: input.brandReferenceId ?? null
        };
        const valid = validateTrademarkRecord(
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
        let inserted: CoreBehaviorResult<CoreTrademarkServiceRecord>;
        try {
          inserted = this.deps.store.insert(valid.value);
        } catch {
          return safe(
            'InternalError',
            'Trademark Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!inserted.ok) return inserted;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'createTrademark',
                target,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-created',
              action: CORE_EVENT_ACTIONS.created,
              trademarkReferenceId: target,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                trademarkReferenceId: target,
                trademarkType: valid.value.trademarkType,
                trademarkStatus: valid.value.trademarkStatus,
                jurisdictionReferenceId: valid.value.jurisdictionReferenceId,
                brandReferenceId: valid.value.brandReferenceId
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
              'Trademark create rollback failed.',
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

  getTrademark(input: {
    readonly trademarkReferenceId: string;
    readonly governance: CoreTrademarkGovernanceContext;
  }): CoreBehaviorResult<CoreTrademarkServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'trademark.read',
      permission: 'trademark:read',
      policyScope: 'trademark.read',
      target: input.trademarkReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateTrademarkReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.trademarkReferenceId
    );
    if (!reference.ok) return reference;
    const record = this.deps.store.get(input.trademarkReferenceId);
    if (!record || record.trademarkStatus === 'DeletedReferenceOnly') {
      return safe(
        'TrademarkNotFound',
        'Trademark was not found.',
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

  listTrademarks(input: {
    readonly filters?: {
      readonly trademarkType?: unknown;
      readonly trademarkStatus?: unknown;
      readonly publicReferenceId?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreTrademarkGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreTrademarkListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'trademark.list',
      permission: 'trademark:list',
      policyScope: 'trademark.list',
      target: CORE_TRADEMARK_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.trademarkType !== undefined &&
      !isTrademarkType(input.filters.trademarkType)
    ) {
      return safe(
        'InvalidTrademarkType',
        'Trademark type filter is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.filters?.trademarkStatus !== undefined &&
      !isTrademarkStatus(input.filters.trademarkStatus)
    ) {
      return safe(
        'InvalidTrademarkStatus',
        'Trademark status filter is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.filters?.publicReferenceId !== undefined &&
      (typeof input.filters.publicReferenceId !== 'string' ||
        !controlledReference.test(input.filters.publicReferenceId))
    ) {
      return safe(
        'InvalidTrademarkReference',
        'Trademark reference filter is invalid.',
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
          (input.filters?.trademarkType === undefined ||
            record.trademarkType === input.filters.trademarkType) &&
          (input.filters?.trademarkStatus === undefined ||
            record.trademarkStatus === input.filters.trademarkStatus) &&
          (input.filters?.publicReferenceId === undefined ||
            record.objectRecord.publicReferenceId ===
              input.filters.publicReferenceId)
      )
      .map((record): CoreTrademarkListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        trademarkType: record.trademarkType,
        trademarkStatus: record.trademarkStatus,
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
          'trademarkType',
          'trademarkStatus'
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

  validateTrademarkReference(input: {
    readonly trademarkReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreTrademarkGovernanceContext;
  }): CoreBehaviorResult<CoreTrademarkReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'trademark.validate_reference',
      permission: 'trademark:validate_reference',
      policyScope: 'trademark.reference',
      target: input.trademarkReferenceId
    });
    if (!governed.ok) return governed;
    const requester = validateRequestingService(
      String(input.requestingDomain),
      input.requestingService,
      this.deps.requestingServiceDirectory
    );
    if (!requester.ok) return requester;
    const reference = validateTrademarkReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.trademarkReferenceId
    );
    if (!reference.ok) {
      return {
        ok: true,
        value: {
          isValid: false,
          trademarkReferenceId: input.trademarkReferenceId,
          trademarkType: null,
          trademarkStatus: null,
          reasonCode: 'InvalidReference'
        }
      };
    }
    const record = this.deps.store.get(input.trademarkReferenceId);
    if (!record) {
      return {
        ok: true,
        value: {
          isValid: false,
          trademarkReferenceId: input.trademarkReferenceId,
          trademarkType: null,
          trademarkStatus: null,
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
          trademarkReferenceId: input.trademarkReferenceId,
          trademarkType: null,
          trademarkStatus: null,
          reasonCode: 'NotFound'
        }
      };
    }
    return {
      ok: true,
      value: {
        isValid: !['Archived', 'DeletedReferenceOnly'].includes(
          record.trademarkStatus
        ),
        trademarkReferenceId: input.trademarkReferenceId,
        trademarkType: record.trademarkType,
        trademarkStatus: record.trademarkStatus,
        reasonCode:
          record.trademarkStatus === 'Archived'
            ? 'Archived'
            : record.trademarkStatus === 'DeletedReferenceOnly'
              ? 'DeletedReferenceOnly'
              : 'Valid'
      }
    };
  }

  changeTrademarkStatus(input: {
    readonly trademarkReferenceId: string;
    readonly targetStatus: CoreTrademarkStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreTrademarkGovernanceContext;
  }): CoreBehaviorResult<CoreTrademarkServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'trademark.change_status',
      permission: 'trademark:change_status',
      policyScope: 'trademark.lifecycle',
      target: input.trademarkReferenceId
    });
    if (!governed.ok) return governed;
    const reference = validateTrademarkReferenceRecord(
      this.deps.relatedReferenceRegistry,
      input.trademarkReferenceId
    );
    if (!reference.ok) return reference;
    const existing = this.deps.store.get(input.trademarkReferenceId);
    if (!existing) {
      return safe(
        'TrademarkNotFound',
        'Trademark was not found.',
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
        readonly trademarkReferenceId: string;
        readonly targetStatus: CoreTrademarkStatus;
        readonly reasonReference: string | null;
      },
      CoreTrademarkServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'changeTrademarkStatus'
        ),
        operationName: 'changeTrademarkStatus',
        request: {
          trademarkReferenceId: input.trademarkReferenceId,
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const current = this.deps.store.get(input.trademarkReferenceId);
        if (!current) {
          return safe(
            'TrademarkNotFound',
            'Trademark was not found.',
            input.governance.correlationId
          );
        }
        const transition = `${current.trademarkStatus}->${input.targetStatus}`;
        if (!transitions.has(transition)) {
          return safe(
            'InvalidTrademarkTransition',
            'Trademark status transition is invalid.',
            input.governance.correlationId
          );
        }
        if (
          reasonRequiredStatuses.has(input.targetStatus) &&
          (!input.reasonReference || !opaque.test(input.reasonReference))
        ) {
          return safe(
            'TrademarkReasonReferenceRequired',
            'Trademark reason reference is required.',
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
        const updated: CoreTrademarkServiceRecord = {
          ...current,
          trademarkStatus: input.targetStatus,
          objectRecord: {
            ...current.objectRecord,
            status: CORE_TRADEMARK_STATUS_TO_OBJECT_STATUS[input.targetStatus],
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
            'TrademarkObjectMismatch',
            'Trademark immutable Object fields changed.',
            input.governance.correlationId
          );
        }
        const validated = validateTrademarkRecord(
          updated,
          reference.value,
          this.deps.relatedReferenceRegistry
        );
        if (!validated.ok) return validated;
        let replaced: CoreBehaviorResult<CoreTrademarkServiceRecord>;
        try {
          replaced = this.deps.store.replace(validated.value);
        } catch {
          return safe(
            'InternalError',
            'Trademark Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!replaced.ok) return replaced;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: this.deps.eventIdFactory(
                'changeTrademarkStatus',
                input.trademarkReferenceId,
                input.idempotencyKey ?? ''
              ),
              type: 'core-object-status-changed',
              action: CORE_EVENT_ACTIONS.statusChanged,
              trademarkReferenceId: input.trademarkReferenceId,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId: input.governance.auditContextReferenceId,
              payload: {
                trademarkReferenceId: input.trademarkReferenceId,
                previousStatus: current.trademarkStatus,
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
              'Trademark status rollback failed.',
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
