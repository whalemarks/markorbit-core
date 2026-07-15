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
import type { CoreEventTraceRecord } from '../../behaviors/core-event-pagination-behavior.ts';
import {
  CORE_DOMAIN_REGISTRY,
  type CoreDomainId
} from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  CORE_EVENT_SOURCE_ACTOR_TYPES,
  createCoreEventId,
  createCoreEventType,
  type CoreEvent,
  type CoreEventAction,
  type CoreEventId,
  type CoreEventSourceActorType
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

export const CORE_EVENT_CATEGORIES = [
  'Domain',
  'Service',
  'Workflow',
  'Task',
  'Review',
  'Integration',
  'AI',
  'System',
  'Other'
] as const;
export type CoreEventCategory = (typeof CORE_EVENT_CATEGORIES)[number];

export const CORE_EVENT_SERVICE_STATUSES = [
  'Recorded',
  'Validated',
  'ReadyForDispatch',
  'Dispatched',
  'DispatchFailed',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreEventServiceStatus =
  (typeof CORE_EVENT_SERVICE_STATUSES)[number];

export const CORE_EVENT_IMPLEMENTED_OPERATIONS = [
  'recordEvent',
  'getEvent',
  'validateEventReference',
  'validateEventPayload',
  'updateEventStatus',
  'markEventDispatched',
  'markEventDispatchFailed',
  'linkEventConsumer',
  'archiveEvent'
] as const;

export const CORE_EVENT_MINIMUM_CAPABILITIES = [
  'record governed domain occurrences',
  'read safe event summaries',
  'validate event references',
  'validate payload contracts before recording',
  'controlled event status lifecycle',
  'dispatch success and failure trace',
  'downstream consumer reference linkage',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff without recursive bus behavior',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive',
  'cross-organization non-enumeration'
] as const;

const CONTRACT_ID = 'core-service-event-service-contract';
const EVENT_OBJECT_TYPE = 'event-record';
const EVENT_DOMAIN = 'event';
const EVENT_OBJECT_CONTRACT_ID = 'core-object-event-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const restrictedPayloadKey =
  /(password|secret|token|authorization|bearer|api[-_]?key)/i;
const domainIds = new Set<string>(
  CORE_DOMAIN_REGISTRY.map((entry) => entry.id)
);

const statusToObjectStatus: Record<CoreEventServiceStatus, CoreObjectStatus> = {
  Recorded: 'active',
  Validated: 'active',
  ReadyForDispatch: 'active',
  Dispatched: 'active',
  DispatchFailed: 'active',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Recorded->Validated',
  'Validated->ReadyForDispatch',
  'DispatchFailed->ReadyForDispatch',
  'Recorded->Archived',
  'Validated->Archived',
  'ReadyForDispatch->Archived',
  'Dispatched->Archived',
  'DispatchFailed->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreEventGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreEventPayloadContract {
  readonly referenceId: string;
  readonly eventType: string;
  readonly requiredFields: readonly string[];
  readonly allowedFields?: readonly string[];
}

export interface CoreEventServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly event: CoreEvent;
  readonly eventCategory: CoreEventCategory;
  readonly eventStatus: CoreEventServiceStatus;
  readonly sourceService: string;
  readonly payloadContractReferenceId: string;
  readonly organizationReferenceId: string;
  readonly consumerReferenceIds: readonly string[];
  readonly dispatchAttemptCount: number;
  readonly dispatchedAt: string | null;
  readonly dispatchReferenceId: string | null;
  readonly dispatchFailureReasonReferenceId: string | null;
}

export interface CoreEventSafeView {
  readonly eventReferenceId: string;
  readonly eventType: string;
  readonly eventCategory: CoreEventCategory;
  readonly eventStatus: CoreEventServiceStatus;
  readonly sourceDomain: CoreDomainId;
  readonly sourceService: string;
  readonly sourceObjectType: string | null;
  readonly occurredAt: string;
  readonly payloadContractReferenceId: string;
  readonly payloadPresent: boolean;
  readonly consumerCount: number;
  readonly dispatchAttemptCount: number;
  readonly dispatched: boolean;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreEventPayloadValidationResult {
  readonly isValid: boolean;
  readonly eventType: string;
  readonly payloadContractReferenceId: string;
  readonly missingRequiredFields: readonly string[];
  readonly unexpectedFields: readonly string[];
  readonly restrictedFields: readonly string[];
  readonly reasonCode:
    | 'Valid'
    | 'ContractNotFound'
    | 'EventTypeMismatch'
    | 'PayloadInvalid'
    | 'RequiredFieldMissing'
    | 'UnexpectedField'
    | 'RestrictedField';
}

export interface CoreEventReferenceValidationResult {
  readonly isValid: boolean;
  readonly eventReferenceId: string;
  readonly eventType: string | null;
  readonly eventStatus: CoreEventServiceStatus | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'Archived'
    | 'DeletedReferenceOnly'
    | 'DispatchFailed';
  readonly payloadValidated: boolean;
  readonly dispatched: boolean;
}

export interface CoreEventServiceStore {
  get(id: string): CoreEventServiceRecord | undefined;
  list(): readonly CoreEventServiceRecord[];
  insert(
    record: CoreEventServiceRecord
  ): CoreBehaviorResult<CoreEventServiceRecord>;
  replace(
    record: CoreEventServiceRecord
  ): CoreBehaviorResult<CoreEventServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreEventServiceDependencies {
  readonly store: CoreEventServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CoreEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly payloadContracts: readonly CoreEventPayloadContract[];
  readonly requestingServiceDirectory: readonly {
    readonly domainId: CoreDomainId;
    readonly serviceType: string;
  }[];
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    eventReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
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
  record: CoreEventServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function ensureGovernance(
  context: CoreEventGovernanceContext,
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
    context.audit.targetObjectType !== EVENT_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Event governance context is invalid.',
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
  governance: CoreEventGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  ) {
    return safe(
      'EventNotFound',
      'Reference',
      'Event was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreEventGovernanceContext,
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

function validatePayload(
  contracts: readonly CoreEventPayloadContract[],
  eventType: string,
  payloadContractReferenceId: string,
  payload: unknown
): CoreEventPayloadValidationResult {
  const contract = contracts.find(
    (entry) => entry.referenceId === payloadContractReferenceId
  );
  if (!contract) {
    return {
      isValid: false,
      eventType,
      payloadContractReferenceId,
      missingRequiredFields: [],
      unexpectedFields: [],
      restrictedFields: [],
      reasonCode: 'ContractNotFound'
    };
  }
  if (contract.eventType !== eventType) {
    return {
      isValid: false,
      eventType,
      payloadContractReferenceId,
      missingRequiredFields: [],
      unexpectedFields: [],
      restrictedFields: [],
      reasonCode: 'EventTypeMismatch'
    };
  }
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return {
      isValid: false,
      eventType,
      payloadContractReferenceId,
      missingRequiredFields: [],
      unexpectedFields: [],
      restrictedFields: [],
      reasonCode: 'PayloadInvalid'
    };
  }
  const keys = Object.keys(payload);
  const missingRequiredFields = contract.requiredFields.filter(
    (key) => !Object.hasOwn(payload, key)
  );
  const unexpectedFields = contract.allowedFields
    ? keys.filter((key) => !contract.allowedFields?.includes(key))
    : [];
  const restrictedFields = keys.filter((key) => restrictedPayloadKey.test(key));
  const reasonCode: CoreEventPayloadValidationResult['reasonCode'] =
    restrictedFields.length > 0
      ? 'RestrictedField'
      : missingRequiredFields.length > 0
        ? 'RequiredFieldMissing'
        : unexpectedFields.length > 0
          ? 'UnexpectedField'
          : 'Valid';
  return {
    isValid: reasonCode === 'Valid',
    eventType,
    payloadContractReferenceId,
    missingRequiredFields,
    unexpectedFields,
    restrictedFields,
    reasonCode
  };
}

function updatedObject(
  current: CoreEventServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status: CoreEventServiceStatus
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

function traceRecord(input: {
  readonly id: CoreEventId;
  readonly action: CoreEventAction;
  readonly eventType: string;
  readonly eventReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreEventGovernanceContext;
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
      domainId: EVENT_DOMAIN,
      object: {
        id: createCoreObjectId(input.eventReferenceId),
        type: createCoreObjectType(EVENT_OBJECT_TYPE),
        domainId: EVENT_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function safeView(record: CoreEventServiceRecord): CoreEventSafeView {
  return {
    eventReferenceId: record.objectRecord.publicReferenceId,
    eventType: record.event.type,
    eventCategory: record.eventCategory,
    eventStatus: record.eventStatus,
    sourceDomain: record.event.domainId,
    sourceService: record.sourceService,
    sourceObjectType: record.event.object?.type ?? null,
    occurredAt: record.event.occurredAt,
    payloadContractReferenceId: record.payloadContractReferenceId,
    payloadPresent: Boolean(record.event.payload),
    consumerCount: record.consumerReferenceIds.length,
    dispatchAttemptCount: record.dispatchAttemptCount,
    dispatched: record.eventStatus === 'Dispatched',
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CoreEventServiceRecord
): CoreBehaviorResult<CoreEventServiceRecord> {
  if (!included(CORE_EVENT_CATEGORIES, record.eventCategory))
    return safe(
      'InvalidEventCategory',
      'Validation',
      'Event category is invalid.'
    );
  if (!included(CORE_EVENT_SERVICE_STATUSES, record.eventStatus))
    return safe('InvalidEventStatus', 'State', 'Event status is invalid.');
  if (
    record.objectRecord.objectType !== EVENT_OBJECT_TYPE ||
    record.objectRecord.domainId !== EVENT_DOMAIN ||
    record.objectRecord.objectContractId !== EVENT_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !== statusToObjectStatus[record.eventStatus]
  )
    return safe(
      'EventObjectMismatch',
      'Validation',
      'Event Object foundation does not match.'
    );
  if (!opaque.test(record.payloadContractReferenceId))
    return safe(
      'InvalidEventPayloadContractReference',
      'Reference',
      'Event payload contract reference is invalid.'
    );
  if (!opaque.test(record.organizationReferenceId))
    return safe(
      'InvalidEventOrganizationReference',
      'Reference',
      'Event organization reference is invalid.'
    );
  if (
    !Number.isInteger(record.dispatchAttemptCount) ||
    record.dispatchAttemptCount < 0
  )
    return safe(
      'InvalidEventDispatchState',
      'State',
      'Event dispatch state is invalid.'
    );
  return { ok: true, value: immutable(record) };
}

export class CoreInMemoryEventServiceStore implements CoreEventServiceStore {
  readonly #records = new Map<string, CoreEventServiceRecord>();

  get(id: string): CoreEventServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreEventServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CoreEventServiceRecord
  ): CoreBehaviorResult<CoreEventServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe('EventAlreadyExists', 'Conflict', 'Event already exists.');
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreEventServiceRecord
  ): CoreBehaviorResult<CoreEventServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe('EventNotFound', 'Reference', 'Event was not found.');
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreEventService {
  constructor(readonly deps: CoreEventServiceDependencies) {}

  recordEvent(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly eventType: string;
    readonly eventCategory: unknown;
    readonly action: unknown;
    readonly sourceDomain: unknown;
    readonly sourceService: string;
    readonly sourceObjectType: string;
    readonly sourceObjectReferenceId: string;
    readonly sourceActorType: unknown;
    readonly actorReferenceId: string;
    readonly payload: CoreJsonObject;
    readonly payloadContractReferenceId: string;
    readonly occurredAt: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'event.record',
      permission: 'event:record',
      policyScope: 'event.write',
      target
    });
    if (!governed.ok) return governed;
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scoped.ok) return scoped;
    if (
      input.publicReferenceRecord.referenceId !== target ||
      input.publicReferenceRecord.objectType !== EVENT_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== EVENT_DOMAIN
    )
      return safe(
        'InvalidEventReference',
        'Reference',
        'Event reference is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_EVENT_CATEGORIES, input.eventCategory))
      return safe(
        'InvalidEventCategory',
        'Validation',
        'Event category is invalid.',
        input.governance.correlationId
      );
    if (
      !Object.values(CORE_EVENT_ACTIONS).includes(
        input.action as CoreEventAction
      )
    )
      return safe(
        'InvalidEventAction',
        'Validation',
        'Event action is invalid.',
        input.governance.correlationId
      );
    if (
      typeof input.sourceDomain !== 'string' ||
      !domainIds.has(input.sourceDomain)
    )
      return safe(
        'InvalidEventSource',
        'Validation',
        'Event source domain is invalid.',
        input.governance.correlationId
      );
    const sourceDomain = input.sourceDomain as CoreDomainId;
    if (
      !this.deps.requestingServiceDirectory.some(
        (entry) =>
          entry.domainId === sourceDomain &&
          entry.serviceType === input.sourceService
      )
    )
      return safe(
        'InvalidEventSource',
        'Validation',
        'Event source Service is invalid.',
        input.governance.correlationId
      );
    if (
      !included(
        Object.values(CORE_EVENT_SOURCE_ACTOR_TYPES),
        input.sourceActorType
      )
    )
      return safe(
        'InvalidEventActorContext',
        'Validation',
        'Event actor context is invalid.',
        input.governance.correlationId
      );
    const sourceReference = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.sourceObjectReferenceId,
      expectedObjectType: input.sourceObjectType,
      expectedDomain: sourceDomain
    });
    if (!sourceReference.ok)
      return safe(
        'InvalidEventSourceObjectReference',
        'Reference',
        'Event source Object reference is invalid.',
        input.governance.correlationId
      );
    const payloadValidation = validatePayload(
      this.deps.payloadContracts,
      input.eventType,
      input.payloadContractReferenceId,
      input.payload
    );
    if (!payloadValidation.isValid)
      return safe(
        'InvalidEventPayload',
        'Validation',
        'Event payload does not satisfy its contract.',
        input.governance.correlationId
      );
    if (
      !opaque.test(input.actorReferenceId) ||
      !opaque.test(input.occurredAt) ||
      !input.governance.authorizedOrganizationReferenceId
    )
      return safe(
        'InvalidEventRecord',
        'Validation',
        'Event record input is incomplete.',
        input.governance.correlationId
      );

    const organizationReferenceId =
      input.governance.authorizedOrganizationReferenceId;

    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(input.governance, 'recordEvent'),
        operationName: 'recordEvent',
        request: {
          target,
          eventType: input.eventType,
          eventCategory: input.eventCategory,
          action: input.action,
          sourceDomain,
          sourceService: input.sourceService,
          sourceObjectType: input.sourceObjectType,
          sourceObjectReferenceId: input.sourceObjectReferenceId,
          actorReferenceId: input.actorReferenceId,
          payload: input.payload,
          payloadContractReferenceId: input.payloadContractReferenceId,
          occurredAt: input.occurredAt
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe(
            'EventAlreadyExists',
            'Conflict',
            'Event already exists.'
          );
        let eventType;
        try {
          eventType = createCoreEventType(input.eventType);
        } catch {
          return safe(
            'InvalidEventType',
            'Validation',
            'Event type is invalid.',
            input.governance.correlationId
          );
        }
        const record: CoreEventServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: 'active'
          },
          event: {
            id: createCoreEventId(target),
            type: eventType,
            action: input.action as CoreEventAction,
            domainId: sourceDomain,
            object: {
              id: createCoreObjectId(input.sourceObjectReferenceId),
              type: createCoreObjectType(input.sourceObjectType),
              domainId: sourceDomain
            },
            source: {
              actorType: input.sourceActorType as CoreEventSourceActorType,
              actorId: input.actorReferenceId
            },
            occurredAt: input.occurredAt,
            correlationId: input.governance.correlationId,
            payload: input.payload,
            metadata: {
              sourceService: input.sourceService,
              payloadContractReferenceId: input.payloadContractReferenceId
            }
          },
          eventCategory: input.eventCategory as CoreEventCategory,
          eventStatus: 'Recorded',
          sourceService: input.sourceService,
          payloadContractReferenceId: input.payloadContractReferenceId,
          organizationReferenceId,
          consumerReferenceIds: [],
          dispatchAttemptCount: 0,
          dispatchedAt: null,
          dispatchReferenceId: null,
          dispatchFailureReasonReferenceId: null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const trace = this.deps.tracePort.append(
          traceRecord({
            id: this.deps.traceEventIdFactory(
              'recordEvent',
              target,
              input.idempotencyKey ?? ''
            ),
            action: CORE_EVENT_ACTIONS.created,
            eventType: 'event.recorded',
            eventReferenceId: target,
            occurredAt: this.deps.now(),
            governance: input.governance,
            payload: {
              eventReferenceId: target,
              eventType: input.eventType,
              status: 'Recorded',
              payloadValidated: true
            }
          })
        );
        if (!trace.ok) {
          this.deps.store.remove(target);
          return safe(
            'EventTraceFailed',
            'Event',
            'Event Service trace failed.',
            input.governance.correlationId
          );
        }
        return inserted;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }

  getEvent(input: {
    readonly eventReferenceId: string;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'event.get',
      permission: 'event:read',
      policyScope: 'event.read',
      target: input.eventReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.eventReferenceId);
    if (!record)
      return safe(
        'EventNotFound',
        'Reference',
        'Event was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      record.organizationReferenceId
    );
    return scoped.ok ? { ok: true, value: safeView(record) } : scoped;
  }

  validateEventPayload(input: {
    readonly eventReferenceId: string;
    readonly eventType: string;
    readonly payload: unknown;
    readonly payloadContractReferenceId: string;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventPayloadValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'event.validate_payload',
      permission: 'event:validate_payload',
      policyScope: 'event.validation',
      target: input.eventReferenceId
    });
    if (!governed.ok) return governed;
    return {
      ok: true,
      value: validatePayload(
        this.deps.payloadContracts,
        input.eventType,
        input.payloadContractReferenceId,
        input.payload
      )
    };
  }

  validateEventReference(input: {
    readonly eventReferenceId: string;
    readonly requestingDomain: string;
    readonly requestingService: string;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'event.validate_reference',
      permission: 'event:validate_reference',
      policyScope: 'event.reference',
      target: input.eventReferenceId
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
        'InvalidEventRequestingService',
        'Reference',
        'Requesting Service is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.eventReferenceId);
    if (
      !record ||
      !enforceOrganizationScope(
        input.governance,
        record.organizationReferenceId
      ).ok
    ) {
      return {
        ok: true,
        value: {
          isValid: false,
          eventReferenceId: input.eventReferenceId,
          eventType: null,
          eventStatus: null,
          reasonCode: 'NotFound',
          payloadValidated: false,
          dispatched: false
        }
      };
    }
    const reasonCode: CoreEventReferenceValidationResult['reasonCode'] =
      record.eventStatus === 'DeletedReferenceOnly'
        ? 'DeletedReferenceOnly'
        : record.eventStatus === 'Archived'
          ? 'Archived'
          : record.eventStatus === 'DispatchFailed'
            ? 'DispatchFailed'
            : 'Valid';
    return {
      ok: true,
      value: {
        isValid: reasonCode === 'Valid',
        eventReferenceId: input.eventReferenceId,
        eventType: record.event.type,
        eventStatus: record.eventStatus,
        reasonCode,
        payloadValidated: record.eventStatus !== 'Recorded',
        dispatched: record.eventStatus === 'Dispatched'
      }
    };
  }

  updateEventStatus(input: {
    readonly eventReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventServiceRecord> {
    const current = this.deps.store.get(input.eventReferenceId);
    if (!current)
      return safe('EventNotFound', 'Reference', 'Event was not found.');
    const governed = ensureGovernance(input.governance, {
      operation: 'event.update_status',
      permission: 'event:update_status',
      policyScope: 'event.lifecycle',
      target: input.eventReferenceId
    });
    if (!governed.ok) return governed;
    if (
      !included(CORE_EVENT_SERVICE_STATUSES, input.nextStatus) ||
      !lifecycleTransitions.has(`${current.eventStatus}->${input.nextStatus}`)
    )
      return safe(
        'InvalidEventTransition',
        'State',
        'Event status transition is not allowed.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReferenceId))
      return safe(
        'EventReasonReferenceRequired',
        'Validation',
        'Event reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate(
      input.eventReferenceId,
      'updateEventStatus',
      input.idempotencyKey,
      input.governance,
      {
        nextStatus: input.nextStatus,
        reasonReferenceId: input.reasonReferenceId
      },
      (record, now) => ({
        ...record,
        eventStatus: input.nextStatus as CoreEventServiceStatus,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          input.nextStatus as CoreEventServiceStatus
        )
      }),
      input.nextStatus === 'Archived'
        ? CORE_EVENT_ACTIONS.archived
        : CORE_EVENT_ACTIONS.statusChanged,
      'event.status_changed'
    );
  }

  markEventDispatched(input: {
    readonly eventReferenceId: string;
    readonly dispatchReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventServiceRecord> {
    const current = this.deps.store.get(input.eventReferenceId);
    if (!current)
      return safe('EventNotFound', 'Reference', 'Event was not found.');
    const governed = ensureGovernance(input.governance, {
      operation: 'event.mark_dispatched',
      permission: 'event:dispatch',
      policyScope: 'event.dispatch',
      target: input.eventReferenceId
    });
    if (!governed.ok) return governed;
    if (current.eventStatus !== 'ReadyForDispatch')
      return safe(
        'InvalidEventTransition',
        'State',
        'Event is not ready for dispatch.',
        input.governance.correlationId
      );
    if (!opaque.test(input.dispatchReferenceId))
      return safe(
        'InvalidEventDispatchReference',
        'Reference',
        'Event dispatch reference is invalid.',
        input.governance.correlationId
      );
    return this.mutate(
      input.eventReferenceId,
      'markEventDispatched',
      input.idempotencyKey,
      input.governance,
      { dispatchReferenceId: input.dispatchReferenceId },
      (record, now) => ({
        ...record,
        eventStatus: 'Dispatched',
        dispatchAttemptCount: record.dispatchAttemptCount + 1,
        dispatchedAt: now,
        dispatchReferenceId: input.dispatchReferenceId,
        dispatchFailureReasonReferenceId: null,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Dispatched'
        )
      }),
      CORE_EVENT_ACTIONS.completed,
      'event.dispatched'
    );
  }

  markEventDispatchFailed(input: {
    readonly eventReferenceId: string;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventServiceRecord> {
    const current = this.deps.store.get(input.eventReferenceId);
    if (!current)
      return safe('EventNotFound', 'Reference', 'Event was not found.');
    const governed = ensureGovernance(input.governance, {
      operation: 'event.mark_dispatch_failed',
      permission: 'event:dispatch',
      policyScope: 'event.dispatch',
      target: input.eventReferenceId
    });
    if (!governed.ok) return governed;
    if (current.eventStatus !== 'ReadyForDispatch')
      return safe(
        'InvalidEventTransition',
        'State',
        'Event is not ready for dispatch.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReferenceId))
      return safe(
        'EventReasonReferenceRequired',
        'Validation',
        'Event failure reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate(
      input.eventReferenceId,
      'markEventDispatchFailed',
      input.idempotencyKey,
      input.governance,
      { reasonReferenceId: input.reasonReferenceId },
      (record, now) => ({
        ...record,
        eventStatus: 'DispatchFailed',
        dispatchAttemptCount: record.dispatchAttemptCount + 1,
        dispatchFailureReasonReferenceId: input.reasonReferenceId,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'DispatchFailed'
        )
      }),
      CORE_EVENT_ACTIONS.failed,
      'event.dispatch_failed'
    );
  }

  linkEventConsumer(input: {
    readonly eventReferenceId: string;
    readonly consumerReferenceId: string;
    readonly consumerObjectType: string;
    readonly consumerDomain: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventServiceRecord> {
    const current = this.deps.store.get(input.eventReferenceId);
    if (!current)
      return safe('EventNotFound', 'Reference', 'Event was not found.');
    const governed = ensureGovernance(input.governance, {
      operation: 'event.link_consumer',
      permission: 'event:link_consumer',
      policyScope: 'event.relationship',
      target: input.eventReferenceId
    });
    if (!governed.ok) return governed;
    if (['Archived', 'DeletedReferenceOnly'].includes(current.eventStatus))
      return safe(
        'InvalidEventTransition',
        'State',
        'Archived Event relationships cannot change.',
        input.governance.correlationId
      );
    const resolved = this.deps.relatedReferenceRegistry.resolve({
      referenceId: input.consumerReferenceId,
      expectedObjectType: input.consumerObjectType,
      expectedDomain: input.consumerDomain
    });
    if (!resolved.ok)
      return safe(
        'InvalidEventConsumerReference',
        'Reference',
        'Event consumer reference is invalid.',
        input.governance.correlationId
      );
    if (current.consumerReferenceIds.includes(input.consumerReferenceId))
      return safe(
        'EventConsumerAlreadyLinked',
        'Conflict',
        'Event consumer is already linked.',
        input.governance.correlationId
      );
    return this.mutate(
      input.eventReferenceId,
      'linkEventConsumer',
      input.idempotencyKey,
      input.governance,
      { consumerReferenceId: input.consumerReferenceId },
      (record, now) => ({
        ...record,
        consumerReferenceIds: [
          ...record.consumerReferenceIds,
          input.consumerReferenceId
        ],
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          record.eventStatus
        )
      }),
      CORE_EVENT_ACTIONS.updated,
      'event.consumer_linked'
    );
  }

  archiveEvent(input: {
    readonly eventReferenceId: string;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEventGovernanceContext;
  }): CoreBehaviorResult<CoreEventServiceRecord> {
    const current = this.deps.store.get(input.eventReferenceId);
    if (!current)
      return safe('EventNotFound', 'Reference', 'Event was not found.');
    const governed = ensureGovernance(input.governance, {
      operation: 'event.archive',
      permission: 'event:archive',
      policyScope: 'event.lifecycle',
      target: input.eventReferenceId
    });
    if (!governed.ok) return governed;
    if (
      current.eventStatus === 'Archived' ||
      current.eventStatus === 'DeletedReferenceOnly'
    )
      return safe(
        'InvalidEventTransition',
        'State',
        'Event is already archived.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReferenceId))
      return safe(
        'EventReasonReferenceRequired',
        'Validation',
        'Event archive reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate(
      input.eventReferenceId,
      'archiveEvent',
      input.idempotencyKey,
      input.governance,
      { reasonReferenceId: input.reasonReferenceId },
      (record, now) => ({
        ...record,
        eventStatus: 'Archived',
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Archived'
        )
      }),
      CORE_EVENT_ACTIONS.archived,
      'event.archived'
    );
  }

  private mutate(
    eventReferenceId: string,
    operation: string,
    idempotencyKey: string | null | undefined,
    governance: CoreEventGovernanceContext,
    request: unknown,
    apply: (
      record: CoreEventServiceRecord,
      now: string
    ) => CoreEventServiceRecord,
    action: CoreEventAction,
    eventType: string
  ): CoreBehaviorResult<CoreEventServiceRecord> {
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
        const current = this.deps.store.get(eventReferenceId);
        if (!current)
          return safe(
            'EventNotFound',
            'Reference',
            'Event was not found.',
            governance.correlationId
          );
        const scoped = enforceOrganizationScope(
          governance,
          current.organizationReferenceId
        );
        if (!scoped.ok) return scoped;
        const next = apply(current, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const trace = this.deps.tracePort.append(
          traceRecord({
            id: this.deps.traceEventIdFactory(
              operation,
              eventReferenceId,
              idempotencyKey ?? ''
            ),
            action,
            eventType,
            eventReferenceId,
            occurredAt:
              valid.value.objectRecord.auditMetadata.updatedAt ??
              valid.value.objectRecord.auditMetadata.createdAt,
            governance,
            payload: {
              eventReferenceId,
              status: valid.value.eventStatus,
              dispatchAttemptCount: valid.value.dispatchAttemptCount,
              consumerCount: valid.value.consumerReferenceIds.length
            }
          })
        );
        if (!trace.ok) {
          this.deps.store.replace(current);
          return safe(
            'EventTraceFailed',
            'Event',
            'Event Service trace failed.',
            governance.correlationId
          );
        }
        return replaced;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }
}
