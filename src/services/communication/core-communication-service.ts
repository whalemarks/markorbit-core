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
  type CoreEventAction,
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

export const CORE_COMMUNICATION_TYPES = [
  'Email',
  'Chat',
  'CallNote',
  'MeetingNote',
  'SystemMessage',
  'PortalMessage',
  'AgentMessage',
  'CustomerMessage',
  'OfficialCommunication',
  'InternalNote',
  'Other',
  'Unknown'
] as const;
export type CoreCommunicationType = (typeof CORE_COMMUNICATION_TYPES)[number];

export const CORE_COMMUNICATION_STATUSES = [
  'Draft',
  'ReviewRequired',
  'ReadyToSend',
  'Sent',
  'Received',
  'Failed',
  'Bounced',
  'Replied',
  'Closed',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreCommunicationStatus =
  (typeof CORE_COMMUNICATION_STATUSES)[number];

export const CORE_COMMUNICATION_DIRECTIONS = [
  'Inbound',
  'Outbound',
  'Internal',
  'SystemGenerated',
  'Unknown'
] as const;
export type CoreCommunicationDirection =
  (typeof CORE_COMMUNICATION_DIRECTIONS)[number];

export const CORE_COMMUNICATION_CHANNELS = [
  'Email',
  'Phone',
  'WhatsApp',
  'WeChat',
  'Portal',
  'Slack',
  'Feishu',
  'OfficialPortal',
  'ManualRecord',
  'System',
  'Unknown'
] as const;
export type CoreCommunicationChannel =
  (typeof CORE_COMMUNICATION_CHANNELS)[number];

export const CORE_COMMUNICATION_PARTICIPANT_ROLES = [
  'Sender',
  'Recipient',
  'Cc',
  'Bcc',
  'Participant',
  'Observer',
  'Owner',
  'Reviewer',
  'Unknown'
] as const;
export type CoreCommunicationParticipantRole =
  (typeof CORE_COMMUNICATION_PARTICIPANT_ROLES)[number];

export const CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS = [
  'createCommunication',
  'getCommunication',
  'listCommunications',
  'updateCommunication',
  'changeCommunicationStatus',
  'linkCommunicationParticipant',
  'linkCommunicationMatter',
  'linkCommunicationCustomer',
  'linkCommunicationAgent',
  'linkCommunicationAttachment',
  'linkCommunicationDocument',
  'recordCommunicationSent',
  'recordCommunicationReceived',
  'validateCommunicationReference',
  'archiveCommunication'
] as const;

export const CORE_COMMUNICATION_MINIMUM_CAPABILITIES = [
  'create governed communication records',
  'read and list safe communication summaries',
  'governed communication metadata update',
  'controlled communication lifecycle',
  'participant reference linkage without contact-detail exposure',
  'matter, customer, and agent reference linkage',
  'attachment reference linkage without automatic Document conversion',
  'registered Document reference linkage without storage behavior',
  'sent and received status recording without external gateway delivery',
  'communication reference validation',
  'permission check hook',
  'policy check hook',
  'human review preservation for external communication',
  'AI draft source preservation and automatic-send prevention',
  'safe error return',
  'event trace handoff',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive',
  'cross-organization non-enumeration'
] as const;

export const CORE_COMMUNICATION_COLLECTION_TARGET = 'communication:collection';
const CONTRACT_ID = 'core-service-communication-service-contract';
const COMMUNICATION_OBJECT_TYPE = 'communication-record';
const COMMUNICATION_DOMAIN = 'communication';
const COMMUNICATION_OBJECT_CONTRACT_ID =
  'core-object-communication-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreCommunicationStatus, CoreObjectStatus> =
  {
    Draft: 'draft',
    ReviewRequired: 'draft',
    ReadyToSend: 'active',
    Sent: 'active',
    Received: 'active',
    Failed: 'inactive',
    Bounced: 'inactive',
    Replied: 'active',
    Closed: 'inactive',
    Archived: 'archived',
    DeletedReferenceOnly: 'deleted'
  };

const lifecycleTransitions = new Set([
  'Draft->ReviewRequired',
  'Draft->ReadyToSend',
  'Draft->Sent',
  'ReviewRequired->ReadyToSend',
  'ReadyToSend->Sent',
  'ReadyToSend->Failed',
  'Sent->Bounced',
  'Sent->Replied',
  'Sent->Closed',
  'Sent->Archived',
  'Received->Replied',
  'Received->Closed',
  'Received->Archived',
  'Failed->ReadyToSend',
  'Failed->Archived',
  'Bounced->ReadyToSend',
  'Bounced->Archived',
  'Replied->Closed',
  'Replied->Archived',
  'Closed->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreCommunicationGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreCommunicationParticipantLink {
  readonly participantReferenceId: string;
  readonly participantRole: CoreCommunicationParticipantRole;
}

export interface CoreCommunicationDeliveryState {
  readonly channel: CoreCommunicationChannel;
  readonly deliveryContextReference: string;
  readonly recordedAt: string;
  readonly externalDeliveryPerformed: false;
}

export interface CoreCommunicationServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly communicationType: CoreCommunicationType;
  readonly communicationStatus: CoreCommunicationStatus;
  readonly direction: CoreCommunicationDirection;
  readonly channel: CoreCommunicationChannel;
  readonly subjectReference: string | null;
  readonly messageReference: string | null;
  readonly contentReference: string | null;
  readonly sourceReference: string;
  readonly confidentialityLevel: string | null;
  readonly participants: readonly CoreCommunicationParticipantLink[];
  readonly matterReferenceId: string | null;
  readonly customerReferenceId: string | null;
  readonly agentReferenceId: string | null;
  readonly attachmentReferences: readonly string[];
  readonly documentReferenceIds: readonly string[];
  readonly deliveryState: CoreCommunicationDeliveryState | null;
  readonly aiDraft: boolean;
  readonly aiSourceReference: string | null;
}

export interface CoreCommunicationSafeView {
  readonly [key: string]: unknown;
  readonly communicationReferenceId: string;
  readonly communicationType: CoreCommunicationType;
  readonly communicationStatus: CoreCommunicationStatus;
  readonly direction: CoreCommunicationDirection;
  readonly channel: CoreCommunicationChannel;
  readonly participantCount: number;
  readonly matterLinked: boolean;
  readonly customerLinked: boolean;
  readonly agentLinked: boolean;
  readonly attachmentCount: number;
  readonly documentCount: number;
  readonly deliveryRecorded: boolean;
  readonly aiDraft: boolean;
  readonly restrictedFieldsOmitted: true;
}

export interface CoreCommunicationReferenceValidationResult {
  readonly isValid: boolean;
  readonly communicationReferenceId: string;
  readonly communicationType: CoreCommunicationType | null;
  readonly status: CoreCommunicationStatus | null;
  readonly direction: CoreCommunicationDirection | null;
  readonly channel: CoreCommunicationChannel | null;
  readonly participantHint: number | null;
  readonly confidentialityHint: boolean | null;
  readonly policyHint: 'Allowed' | 'Restricted' | null;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'ReviewRequired'
    | 'Failed'
    | 'Archived'
    | 'DeletedReferenceOnly'
    | 'ConfidentialityRestricted'
    | 'PolicyRestricted';
}

export interface CoreCommunicationServiceStore {
  get(id: string): CoreCommunicationServiceRecord | undefined;
  list(): readonly CoreCommunicationServiceRecord[];
  insert(
    record: CoreCommunicationServiceRecord
  ): CoreBehaviorResult<CoreCommunicationServiceRecord>;
  replace(
    record: CoreCommunicationServiceRecord
  ): CoreBehaviorResult<CoreCommunicationServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreCommunicationTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreCommunicationServiceDependencies {
  readonly store: CoreCommunicationServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly tracePort: CoreCommunicationTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly now: () => string;
  readonly traceEventIdFactory: (
    operation: string,
    communicationReferenceId: string,
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
  record: CoreCommunicationServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function ensureGovernance(
  context: CoreCommunicationGovernanceContext,
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
    context.audit.targetObjectType !== COMMUNICATION_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Communication governance context is invalid.',
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
  governance: CoreCommunicationGovernanceContext,
  organizationReferenceId: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    organizationReferenceId &&
    governance.authorizedOrganizationReferenceId !== organizationReferenceId
  ) {
    return safe(
      'CommunicationNotFound',
      'Reference',
      'Communication was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreCommunicationGovernanceContext,
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

function updatedObject(
  current: CoreCommunicationServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status = current.communicationStatus
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
  readonly communicationReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreCommunicationGovernanceContext;
  readonly payload: CoreJsonObject;
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
      domainId: COMMUNICATION_DOMAIN,
      object: {
        id: createCoreObjectId(input.communicationReferenceId),
        type: createCoreObjectType(COMMUNICATION_OBJECT_TYPE),
        domainId: COMMUNICATION_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function safeView(
  record: CoreCommunicationServiceRecord
): CoreCommunicationSafeView {
  return {
    communicationReferenceId: record.objectRecord.publicReferenceId,
    communicationType: record.communicationType,
    communicationStatus: record.communicationStatus,
    direction: record.direction,
    channel: record.channel,
    participantCount: record.participants.length,
    matterLinked: Boolean(record.matterReferenceId),
    customerLinked: Boolean(record.customerReferenceId),
    agentLinked: Boolean(record.agentReferenceId),
    attachmentCount: record.attachmentReferences.length,
    documentCount: record.documentReferenceIds.length,
    deliveryRecorded: Boolean(record.deliveryState),
    aiDraft: record.aiDraft,
    restrictedFieldsOmitted: true
  };
}

function validateRecord(
  record: CoreCommunicationServiceRecord
): CoreBehaviorResult<CoreCommunicationServiceRecord> {
  if (!included(CORE_COMMUNICATION_TYPES, record.communicationType))
    return safe(
      'InvalidCommunicationType',
      'Validation',
      'Communication type is invalid.'
    );
  if (!included(CORE_COMMUNICATION_STATUSES, record.communicationStatus))
    return safe(
      'InvalidCommunicationStatus',
      'State',
      'Communication status is invalid.'
    );
  if (!included(CORE_COMMUNICATION_DIRECTIONS, record.direction))
    return safe(
      'InvalidCommunicationDirection',
      'Validation',
      'Communication direction is invalid.'
    );
  if (!included(CORE_COMMUNICATION_CHANNELS, record.channel))
    return safe(
      'InvalidCommunicationChannel',
      'Validation',
      'Communication channel is invalid.'
    );
  if (record.participants.length === 0)
    return safe(
      'ParticipantReferenceRequired',
      'Validation',
      'Communication participant reference is required.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'CommunicationSourceReferenceRequired',
      'Validation',
      'Communication source reference is required.'
    );
  if (
    record.objectRecord.objectType !== COMMUNICATION_OBJECT_TYPE ||
    record.objectRecord.domainId !== COMMUNICATION_DOMAIN ||
    record.objectRecord.objectContractId !== COMMUNICATION_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !==
      statusToObjectStatus[record.communicationStatus]
  ) {
    return safe(
      'CommunicationObjectMismatch',
      'Validation',
      'Communication Object contract is inconsistent.'
    );
  }
  if (
    record.aiDraft &&
    ['Sent', 'Received'].includes(record.communicationStatus)
  )
    return safe(
      'OutboundReviewRequired',
      'HumanReview',
      'AI-drafted Communication cannot be treated as delivered automatically.'
    );
  return { ok: true, value: immutable(record) };
}

export class CoreInMemoryCommunicationServiceStore implements CoreCommunicationServiceStore {
  readonly #records = new Map<string, CoreCommunicationServiceRecord>();

  get(id: string): CoreCommunicationServiceRecord | undefined {
    const value = this.#records.get(id);
    return value ? immutable(value) : undefined;
  }

  list(): readonly CoreCommunicationServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CoreCommunicationServiceRecord
  ): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe(
        'CommunicationAlreadyExists',
        'Conflict',
        'Communication already exists.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  replace(
    record: CoreCommunicationServiceRecord
  ): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe(
        'CommunicationNotFound',
        'Reference',
        'Communication was not found.'
      );
    this.#records.set(id, immutable(record));
    return { ok: true, value: immutable(record) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreCommunicationService {
  constructor(readonly deps: CoreCommunicationServiceDependencies) {}

  createCommunication(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly communicationType: unknown;
    readonly status?: unknown;
    readonly direction: unknown;
    readonly channel: unknown;
    readonly participantReferences: readonly CoreCommunicationParticipantLink[];
    readonly subjectReference?: string | null;
    readonly messageReference?: string | null;
    readonly contentReference?: string | null;
    readonly sourceReference: string;
    readonly confidentialityLevel?: string | null;
    readonly aiDraft?: boolean;
    readonly aiSourceReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'communication.create',
      permission: 'communication:create',
      policyScope: 'communication.write',
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
      input.publicReferenceRecord.objectType !== COMMUNICATION_OBJECT_TYPE ||
      input.publicReferenceRecord.referenceDomain !== COMMUNICATION_DOMAIN
    )
      return safe(
        'InvalidCommunicationReference',
        'Reference',
        'Communication reference is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_COMMUNICATION_TYPES, input.communicationType))
      return safe(
        'InvalidCommunicationType',
        'Validation',
        'Communication type is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_COMMUNICATION_DIRECTIONS, input.direction))
      return safe(
        'InvalidCommunicationDirection',
        'Validation',
        'Communication direction is invalid.',
        input.governance.correlationId
      );
    if (!included(CORE_COMMUNICATION_CHANNELS, input.channel))
      return safe(
        'ChannelReferenceRequired',
        'Validation',
        'Communication channel reference is required.',
        input.governance.correlationId
      );
    if (input.participantReferences.length === 0)
      return safe(
        'ParticipantReferenceRequired',
        'Validation',
        'Communication participant reference is required.',
        input.governance.correlationId
      );
    for (const participant of input.participantReferences) {
      if (
        !opaque.test(participant.participantReferenceId) ||
        !included(
          CORE_COMMUNICATION_PARTICIPANT_ROLES,
          participant.participantRole
        )
      )
        return safe(
          'InvalidParticipantReference',
          'Reference',
          'Communication participant reference is invalid.',
          input.governance.correlationId
        );
    }
    if (!opaque.test(input.sourceReference))
      return safe(
        'CommunicationSourceReferenceRequired',
        'Validation',
        'Communication source reference is required.',
        input.governance.correlationId
      );
    const status = input.status ?? 'Draft';
    if (
      !included(CORE_COMMUNICATION_STATUSES, status) ||
      !['Draft', 'ReviewRequired', 'Received'].includes(status)
    )
      return safe(
        'InvalidCommunicationStatus',
        'State',
        'Communication creation status is invalid.',
        input.governance.correlationId
      );
    if (
      input.aiDraft &&
      !['Draft', 'ReviewRequired'].includes(status as string)
    )
      return safe(
        'OutboundReviewRequired',
        'HumanReview',
        'AI-drafted Communication must remain in review-governed state.',
        input.governance.correlationId
      );
    if (input.aiDraft && !opaque.test(input.aiSourceReference ?? ''))
      return safe(
        'CommunicationAISourceRequired',
        'Agent',
        'AI source reference is required for an AI-drafted Communication.',
        input.governance.correlationId
      );
    if (!input.governance.authorizedOrganizationReferenceId)
      return safe(
        'InvalidCommunicationRecord',
        'Validation',
        'Communication organization scope is required.',
        input.governance.correlationId
      );

    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'createCommunication'
        ),
        operationName: 'createCommunication',
        request: {
          target,
          communicationType: input.communicationType,
          status,
          direction: input.direction,
          channel: input.channel,
          participantReferences: input.participantReferences,
          subjectReference: input.subjectReference ?? null,
          messageReference: input.messageReference ?? null,
          contentReference: input.contentReference ?? null,
          sourceReference: input.sourceReference,
          confidentialityLevel: input.confidentialityLevel ?? null,
          aiDraft: input.aiDraft ?? false,
          aiSourceReference: input.aiSourceReference ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe(
            'CommunicationAlreadyExists',
            'Conflict',
            'Communication already exists.'
          );
        const record: CoreCommunicationServiceRecord = {
          objectRecord: {
            ...input.objectRecord,
            status: statusToObjectStatus[status as CoreCommunicationStatus]
          },
          communicationType: input.communicationType as CoreCommunicationType,
          communicationStatus: status as CoreCommunicationStatus,
          direction: input.direction as CoreCommunicationDirection,
          channel: input.channel as CoreCommunicationChannel,
          subjectReference: input.subjectReference ?? null,
          messageReference: input.messageReference ?? null,
          contentReference: input.contentReference ?? null,
          sourceReference: input.sourceReference,
          confidentialityLevel: input.confidentialityLevel ?? null,
          participants: immutable(input.participantReferences),
          matterReferenceId: null,
          customerReferenceId: null,
          agentReferenceId: null,
          attachmentReferences: [],
          documentReferenceIds: [],
          deliveryState: null,
          aiDraft: input.aiDraft ?? false,
          aiSourceReference: input.aiSourceReference ?? null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const traced = this.appendTrace({
          operation: 'createCommunication',
          target,
          idempotencyKey: input.idempotencyKey ?? '',
          action: CORE_EVENT_ACTIONS.created,
          eventType: 'communication.created',
          governance: input.governance,
          payload: {
            communicationReferenceId: target,
            communicationType: record.communicationType,
            status: record.communicationStatus,
            direction: record.direction,
            channel: record.channel,
            participantCount: record.participants.length,
            aiDraft: record.aiDraft,
            restrictedContentOmitted: true
          }
        });
        if (!traced.ok) {
          this.deps.store.remove(target);
          return traced;
        }
        return inserted;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }

  getCommunication(input: {
    readonly communicationReferenceId: string;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationSafeView> {
    const governed = ensureGovernance(input.governance, {
      operation: 'communication.get',
      permission: 'communication:read',
      policyScope: 'communication.read',
      target: input.communicationReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.communicationReferenceId);
    if (!record)
      return safe(
        'CommunicationNotFound',
        'Reference',
        'Communication was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scoped.ok ? { ok: true, value: safeView(record) } : scoped;
  }

  listCommunications(input: {
    readonly governance: CoreCommunicationGovernanceContext;
    readonly status?: CoreCommunicationStatus;
    readonly direction?: CoreCommunicationDirection;
    readonly channel?: CoreCommunicationChannel;
    readonly cursor?: string | null;
    readonly limit?: number;
  }): CoreBehaviorResult<CorePaginatedResult<CoreCommunicationSafeView>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'communication.list',
      permission: 'communication:read',
      policyScope: 'communication.read',
      target: CORE_COMMUNICATION_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    const items = this.deps.store
      .list()
      .filter(
        (record) =>
          (!input.governance.authorizedOrganizationReferenceId ||
            organizationScopeOf(record) ===
              input.governance.authorizedOrganizationReferenceId) &&
          (!input.status || record.communicationStatus === input.status) &&
          (!input.direction || record.direction === input.direction) &&
          (!input.channel || record.channel === input.channel)
      )
      .map(safeView);
    return paginateCoreItems(
      items,
      { cursor: input.cursor ?? undefined, limit: input.limit ?? 20 },
      {
        permissionAllowed: true,
        policyAllowed: true,
        actorReferenceId: input.governance.permission.actorReferenceId,
        allowedSortFields: [
          'communicationReferenceId',
          'communicationStatus',
          'direction',
          'channel'
        ],
        totalCountAllowed: true,
        correlationId: input.governance.correlationId
      },
      {
        queryKey: JSON.stringify({
          status: input.status ?? null,
          direction: input.direction ?? null,
          channel: input.channel ?? null
        }),
        cursorSecret: 'core-communication-service-cursor-v1',
        visible: () => true
      }
    );
  }

  updateCommunication(input: {
    readonly communicationReferenceId: string;
    readonly subjectReference?: string | null;
    readonly messageReference?: string | null;
    readonly contentReference?: string | null;
    readonly confidentialityLevel?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    return this.mutate({
      operationName: 'updateCommunication',
      governanceOperation: 'communication.update',
      permission: 'communication:update',
      policyScope: 'communication.write',
      communicationReferenceId: input.communicationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        subjectReference: input.subjectReference ?? null,
        messageReference: input.messageReference ?? null,
        contentReference: input.contentReference ?? null,
        confidentialityLevel: input.confidentialityLevel ?? null
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'communication.updated',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(
          current.communicationStatus
        )
          ? safe(
              'InvalidCommunicationTransition',
              'State',
              'Archived Communication cannot be updated.',
              input.governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId
        ),
        subjectReference:
          input.subjectReference === undefined
            ? current.subjectReference
            : input.subjectReference,
        messageReference:
          input.messageReference === undefined
            ? current.messageReference
            : input.messageReference,
        contentReference:
          input.contentReference === undefined
            ? current.contentReference
            : input.contentReference,
        confidentialityLevel:
          input.confidentialityLevel === undefined
            ? current.confidentialityLevel
            : input.confidentialityLevel
      }),
      payload: () => ({
        communicationReferenceId: input.communicationReferenceId,
        restrictedContentOmitted: true
      })
    });
  }

  changeCommunicationStatus(input: {
    readonly communicationReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    if (!included(CORE_COMMUNICATION_STATUSES, input.nextStatus))
      return safe(
        'InvalidCommunicationStatus',
        'State',
        'Communication status is invalid.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'changeCommunicationStatus',
      governanceOperation: 'communication.status.change',
      permission: 'communication:status',
      policyScope: 'communication.status',
      communicationReferenceId: input.communicationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        nextStatus: input.nextStatus,
        reasonReference: input.reasonReference ?? null
      },
      action: CORE_EVENT_ACTIONS.statusChanged,
      eventType: 'communication.status.changed',
      before: (current) => {
        if (
          !lifecycleTransitions.has(
            `${current.communicationStatus}->${input.nextStatus}`
          )
        )
          return safe(
            'InvalidCommunicationTransition',
            'State',
            'Communication status transition is not allowed.',
            input.governance.correlationId
          );
        if (
          current.aiDraft &&
          ['ReadyToSend', 'Sent'].includes(input.nextStatus as string) &&
          input.governance.review.reviewDecision !== 'Approved'
        )
          return safe(
            'OutboundReviewRequired',
            'HumanReview',
            'AI-drafted Communication requires approved human review.',
            input.governance.correlationId
          );
        return { ok: true, value: null };
      },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          input.nextStatus as CoreCommunicationStatus
        ),
        communicationStatus: input.nextStatus as CoreCommunicationStatus,
        aiDraft:
          current.aiDraft &&
          ['ReadyToSend', 'Sent'].includes(input.nextStatus as string)
            ? false
            : current.aiDraft
      }),
      payload: (next, previous) => ({
        communicationReferenceId: input.communicationReferenceId,
        previousStatus: previous.communicationStatus,
        nextStatus: next.communicationStatus,
        reasonReferencePresent: Boolean(input.reasonReference)
      })
    });
  }

  linkCommunicationParticipant(input: {
    readonly communicationReferenceId: string;
    readonly participantReference: string;
    readonly participantRole: unknown;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    if (
      !opaque.test(input.participantReference) ||
      !included(CORE_COMMUNICATION_PARTICIPANT_ROLES, input.participantRole)
    )
      return safe(
        'InvalidParticipantReference',
        'Reference',
        'Communication participant reference is invalid.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'linkCommunicationParticipant',
      governanceOperation: 'communication.participant.link',
      permission: 'communication:link',
      policyScope: 'communication.relationship',
      communicationReferenceId: input.communicationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        participantReference: input.participantReference,
        participantRole: input.participantRole
      },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: 'communication.participant.linked',
      before: (current) =>
        current.participants.some(
          (participant) =>
            participant.participantReferenceId === input.participantReference &&
            participant.participantRole === input.participantRole
        )
          ? safe(
              'CommunicationRelationshipAlreadyLinked',
              'Conflict',
              'Communication participant is already linked.',
              input.governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId
        ),
        participants: [
          ...current.participants,
          {
            participantReferenceId: input.participantReference,
            participantRole:
              input.participantRole as CoreCommunicationParticipantRole
          }
        ]
      }),
      payload: (next) => ({
        communicationReferenceId: input.communicationReferenceId,
        participantRole:
          input.participantRole as CoreCommunicationParticipantRole,
        participantCount: next.participants.length,
        participantDetailsOmitted: true
      })
    });
  }

  linkCommunicationMatter(input: {
    readonly communicationReferenceId: string;
    readonly matterReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }) {
    return this.linkSingle(
      'linkCommunicationMatter',
      'communication.matter.link',
      input.communicationReferenceId,
      input.matterReferenceId,
      'matter-record',
      'matter',
      'matterReferenceId',
      'communication.matter.linked',
      input.idempotencyKey,
      input.governance
    );
  }

  linkCommunicationCustomer(input: {
    readonly communicationReferenceId: string;
    readonly customerReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }) {
    return this.linkSingle(
      'linkCommunicationCustomer',
      'communication.customer.link',
      input.communicationReferenceId,
      input.customerReferenceId,
      'customer-record',
      'customer',
      'customerReferenceId',
      'communication.customer.linked',
      input.idempotencyKey,
      input.governance
    );
  }

  linkCommunicationAgent(input: {
    readonly communicationReferenceId: string;
    readonly agentReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }) {
    return this.linkSingle(
      'linkCommunicationAgent',
      'communication.agent.link',
      input.communicationReferenceId,
      input.agentReferenceId,
      'agent-record',
      'agent',
      'agentReferenceId',
      'communication.agent.linked',
      input.idempotencyKey,
      input.governance
    );
  }

  linkCommunicationAttachment(input: {
    readonly communicationReferenceId: string;
    readonly attachmentReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    if (!opaque.test(input.attachmentReference))
      return safe(
        'AttachmentReferenceInvalid',
        'Reference',
        'Communication attachment reference is invalid.',
        input.governance.correlationId
      );
    return this.linkListReference({
      operationName: 'linkCommunicationAttachment',
      governanceOperation: 'communication.attachment.link',
      communicationReferenceId: input.communicationReferenceId,
      referenceId: input.attachmentReference,
      field: 'attachmentReferences',
      eventType: 'communication.attachment.linked',
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      payloadKey: 'attachmentCount'
    });
  }

  linkCommunicationDocument(input: {
    readonly communicationReferenceId: string;
    readonly documentReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    const related = this.resolveRelated(
      input.documentReferenceId,
      'document-record',
      'document',
      input.governance
    );
    if (!related.ok) return related;
    return this.linkListReference({
      operationName: 'linkCommunicationDocument',
      governanceOperation: 'communication.document.link',
      communicationReferenceId: input.communicationReferenceId,
      referenceId: input.documentReferenceId,
      field: 'documentReferenceIds',
      eventType: 'communication.document.linked',
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      payloadKey: 'documentCount'
    });
  }

  recordCommunicationSent(input: {
    readonly communicationReferenceId: string;
    readonly channel: unknown;
    readonly deliveryContextReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    if (!included(CORE_COMMUNICATION_CHANNELS, input.channel))
      return safe(
        'ChannelReferenceRequired',
        'Validation',
        'Communication channel reference is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.deliveryContextReference))
      return safe(
        'DeliveryContextRequired',
        'Validation',
        'Communication delivery context is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'recordCommunicationSent',
      governanceOperation: 'communication.sent.record',
      permission: 'communication:send-record',
      policyScope: 'communication.outbound',
      communicationReferenceId: input.communicationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        channel: input.channel,
        deliveryContextReference: input.deliveryContextReference
      },
      action: CORE_EVENT_ACTIONS.emitted,
      eventType: 'communication.sent',
      before: (current) => {
        if (current.direction !== 'Outbound')
          return safe(
            'InvalidCommunicationDirection',
            'State',
            'Only outbound Communication can record sent status.',
            input.governance.correlationId
          );
        if (
          !['Draft', 'ReviewRequired', 'ReadyToSend'].includes(
            current.communicationStatus
          )
        )
          return safe(
            'InvalidCommunicationTransition',
            'State',
            'Communication cannot record sent status from its current state.',
            input.governance.correlationId
          );
        if (current.aiDraft)
          return safe(
            'OutboundReviewRequired',
            'HumanReview',
            'AI-drafted Communication requires governed approval before sent status can be recorded.',
            input.governance.correlationId
          );
        return { ok: true, value: null };
      },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          'Sent'
        ),
        communicationStatus: 'Sent',
        channel: input.channel as CoreCommunicationChannel,
        deliveryState: {
          channel: input.channel as CoreCommunicationChannel,
          deliveryContextReference: input.deliveryContextReference,
          recordedAt: now,
          externalDeliveryPerformed: false
        }
      }),
      payload: (next) => ({
        communicationReferenceId: input.communicationReferenceId,
        status: next.communicationStatus,
        channel: next.channel,
        externalDeliveryPerformed: false,
        restrictedContentOmitted: true
      })
    });
  }

  recordCommunicationReceived(input: {
    readonly communicationReferenceId: string;
    readonly channel: unknown;
    readonly deliveryContextReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    if (!included(CORE_COMMUNICATION_CHANNELS, input.channel))
      return safe(
        'ChannelReferenceRequired',
        'Validation',
        'Communication channel reference is required.',
        input.governance.correlationId
      );
    if (!opaque.test(input.deliveryContextReference))
      return safe(
        'DeliveryContextRequired',
        'Validation',
        'Communication delivery context is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'recordCommunicationReceived',
      governanceOperation: 'communication.received.record',
      permission: 'communication:receive-record',
      policyScope: 'communication.inbound',
      communicationReferenceId: input.communicationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: {
        channel: input.channel,
        deliveryContextReference: input.deliveryContextReference
      },
      action: CORE_EVENT_ACTIONS.created,
      eventType: 'communication.received',
      before: (current) =>
        current.direction !== 'Inbound'
          ? safe(
              'InvalidCommunicationDirection',
              'State',
              'Only inbound Communication can record received status.',
              input.governance.correlationId
            )
          : ['Archived', 'DeletedReferenceOnly'].includes(
                current.communicationStatus
              )
            ? safe(
                'InvalidCommunicationTransition',
                'State',
                'Archived Communication cannot record received status.',
                input.governance.correlationId
              )
            : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          'Received'
        ),
        communicationStatus: 'Received',
        channel: input.channel as CoreCommunicationChannel,
        deliveryState: {
          channel: input.channel as CoreCommunicationChannel,
          deliveryContextReference: input.deliveryContextReference,
          recordedAt: now,
          externalDeliveryPerformed: false
        }
      }),
      payload: (next) => ({
        communicationReferenceId: input.communicationReferenceId,
        status: next.communicationStatus,
        channel: next.channel,
        externalDeliveryPerformed: false,
        restrictedContentOmitted: true
      })
    });
  }

  validateCommunicationReference(input: {
    readonly communicationReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationReferenceValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'communication.reference.validate',
      permission: 'communication:read',
      policyScope: 'communication.reference',
      target: input.communicationReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.requestingService))
      return safe(
        'InvalidCommunicationRequestingService',
        'Validation',
        'Requesting service reference is invalid.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.communicationReferenceId);
    if (!record)
      return {
        ok: true,
        value: {
          isValid: false,
          communicationReferenceId: input.communicationReferenceId,
          communicationType: null,
          status: null,
          direction: null,
          channel: null,
          participantHint: null,
          confidentialityHint: null,
          policyHint: null,
          reasonCode: 'NotFound'
        }
      };
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scoped.ok)
      return {
        ok: true,
        value: {
          isValid: false,
          communicationReferenceId: input.communicationReferenceId,
          communicationType: null,
          status: null,
          direction: null,
          channel: null,
          participantHint: null,
          confidentialityHint: null,
          policyHint: null,
          reasonCode: 'NotFound'
        }
      };
    const reasonCode =
      record.communicationStatus === 'ReviewRequired'
        ? 'ReviewRequired'
        : record.communicationStatus === 'Failed' ||
            record.communicationStatus === 'Bounced'
          ? 'Failed'
          : record.communicationStatus === 'Archived'
            ? 'Archived'
            : record.communicationStatus === 'DeletedReferenceOnly'
              ? 'DeletedReferenceOnly'
              : 'Valid';
    return {
      ok: true,
      value: {
        isValid: reasonCode === 'Valid',
        communicationReferenceId: input.communicationReferenceId,
        communicationType: record.communicationType,
        status: record.communicationStatus,
        direction: record.direction,
        channel: record.channel,
        participantHint: record.participants.length,
        confidentialityHint: Boolean(record.confidentialityLevel),
        policyHint: 'Allowed',
        reasonCode
      }
    };
  }

  archiveCommunication(input: {
    readonly communicationReferenceId: string;
    readonly reasonReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    if (!opaque.test(input.reasonReference))
      return safe(
        'CommunicationReasonReferenceRequired',
        'Validation',
        'Communication archive reason reference is required.',
        input.governance.correlationId
      );
    return this.mutate({
      operationName: 'archiveCommunication',
      governanceOperation: 'communication.archive',
      permission: 'communication:archive',
      policyScope: 'communication.status',
      communicationReferenceId: input.communicationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: { reasonReference: input.reasonReference },
      action: CORE_EVENT_ACTIONS.archived,
      eventType: 'communication.archived',
      before: (current) =>
        ['Archived', 'DeletedReferenceOnly'].includes(
          current.communicationStatus
        )
          ? safe(
              'InvalidCommunicationTransition',
              'State',
              'Communication is already archived.',
              input.governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId,
          'Archived'
        ),
        communicationStatus: 'Archived'
      }),
      payload: () => ({
        communicationReferenceId: input.communicationReferenceId,
        status: 'Archived',
        reasonReferencePresent: true
      })
    });
  }

  private linkSingle(
    operationName: string,
    governanceOperation: string,
    communicationReferenceId: string,
    relatedReferenceId: string,
    expectedType: string,
    expectedDomain: CoreDomainId,
    field: 'matterReferenceId' | 'customerReferenceId' | 'agentReferenceId',
    eventType: string,
    idempotencyKey: string | null | undefined,
    governance: CoreCommunicationGovernanceContext
  ): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    const related = this.resolveRelated(
      relatedReferenceId,
      expectedType,
      expectedDomain,
      governance
    );
    if (!related.ok) return related;
    return this.mutate({
      operationName,
      governanceOperation,
      permission: 'communication:link',
      policyScope: 'communication.relationship',
      communicationReferenceId,
      idempotencyKey,
      governance,
      request: { relatedReferenceId },
      action: CORE_EVENT_ACTIONS.updated,
      eventType,
      before: (current) =>
        current[field]
          ? safe(
              'CommunicationRelationshipAlreadyLinked',
              'Conflict',
              'Communication relationship is already linked.',
              governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          governance.permission.actorReferenceId
        ),
        [field]: relatedReferenceId
      }),
      payload: () => ({
        communicationReferenceId,
        relationshipType: field,
        relationshipPresent: true
      })
    });
  }

  private linkListReference(input: {
    readonly operationName: string;
    readonly governanceOperation: string;
    readonly communicationReferenceId: string;
    readonly referenceId: string;
    readonly field: 'attachmentReferences' | 'documentReferenceIds';
    readonly eventType: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
    readonly payloadKey: 'attachmentCount' | 'documentCount';
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    return this.mutate({
      operationName: input.operationName,
      governanceOperation: input.governanceOperation,
      permission: 'communication:link',
      policyScope: 'communication.relationship',
      communicationReferenceId: input.communicationReferenceId,
      idempotencyKey: input.idempotencyKey,
      governance: input.governance,
      request: { referenceId: input.referenceId },
      action: CORE_EVENT_ACTIONS.updated,
      eventType: input.eventType,
      before: (current) =>
        current[input.field].includes(input.referenceId)
          ? safe(
              'CommunicationRelationshipAlreadyLinked',
              'Conflict',
              'Communication relationship is already linked.',
              input.governance.correlationId
            )
          : { ok: true, value: null },
      apply: (current, now) => ({
        ...current,
        objectRecord: updatedObject(
          current,
          now,
          input.governance.permission.actorReferenceId
        ),
        [input.field]: [...current[input.field], input.referenceId]
      }),
      payload: (next) => ({
        communicationReferenceId: input.communicationReferenceId,
        [input.payloadKey]: next[input.field].length,
        automaticDocumentConversion: false,
        automaticEvidenceConversion: false,
        restrictedContentOmitted: true
      })
    });
  }

  private resolveRelated(
    referenceId: string,
    expectedObjectType: string,
    expectedDomain: CoreDomainId,
    governance: CoreCommunicationGovernanceContext
  ): CoreBehaviorResult<null> {
    const result = this.deps.relatedReferenceRegistry.resolve({
      referenceId,
      expectedObjectType,
      expectedDomain
    });
    return result.ok
      ? { ok: true, value: null }
      : safe(
          'InvalidCommunicationRelationshipReference',
          'Reference',
          'Related Communication reference is invalid.',
          governance.correlationId
        );
  }

  private appendTrace(input: {
    readonly operation: string;
    readonly target: string;
    readonly idempotencyKey: string;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly governance: CoreCommunicationGovernanceContext;
    readonly payload: CoreJsonObject;
  }): CoreBehaviorResult<CoreEventTraceRecord> {
    const trace = this.deps.tracePort.append(
      traceRecord({
        id: this.deps.traceEventIdFactory(
          input.operation,
          input.target,
          input.idempotencyKey
        ),
        action: input.action,
        eventType: input.eventType,
        communicationReferenceId: input.target,
        occurredAt: this.deps.now(),
        governance: input.governance,
        payload: input.payload
      })
    );
    return trace.ok
      ? trace
      : safe(
          'CommunicationTraceFailed',
          'Event',
          'Communication Event trace handoff failed.',
          input.governance.correlationId
        );
  }

  private mutate(input: {
    readonly operationName: string;
    readonly governanceOperation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly communicationReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreCommunicationGovernanceContext;
    readonly request: CoreJsonObject;
    readonly action: CoreEventAction;
    readonly eventType: string;
    readonly before?: (
      current: CoreCommunicationServiceRecord
    ) => CoreBehaviorResult<null>;
    readonly apply: (
      current: CoreCommunicationServiceRecord,
      now: string
    ) => CoreCommunicationServiceRecord;
    readonly payload: (
      next: CoreCommunicationServiceRecord,
      previous: CoreCommunicationServiceRecord
    ) => CoreJsonObject;
  }): CoreBehaviorResult<CoreCommunicationServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: input.governanceOperation,
      permission: input.permission,
      policyScope: input.policyScope,
      target: input.communicationReferenceId
    });
    if (!governed.ok) return governed;
    const current = this.deps.store.get(input.communicationReferenceId);
    if (!current)
      return safe(
        'CommunicationNotFound',
        'Reference',
        'Communication was not found.',
        input.governance.correlationId
      );
    const scoped = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(current)
    );
    if (!scoped.ok) return scoped;
    const precondition = input.before?.(current);
    if (precondition && !precondition.ok) return precondition;
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          input.operationName
        ),
        operationName: input.operationName,
        request: {
          communicationReferenceId: input.communicationReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const latest = this.deps.store.get(input.communicationReferenceId);
        if (!latest)
          return safe(
            'CommunicationNotFound',
            'Reference',
            'Communication was not found.'
          );
        const before = immutable(latest);
        const next = input.apply(latest, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const traced = this.appendTrace({
          operation: input.operationName,
          target: input.communicationReferenceId,
          idempotencyKey: input.idempotencyKey ?? '',
          action: input.action,
          eventType: input.eventType,
          governance: input.governance,
          payload: input.payload(valid.value, before)
        });
        if (!traced.ok) {
          this.deps.store.replace(before);
          return traced;
        }
        return replaced;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }
}
