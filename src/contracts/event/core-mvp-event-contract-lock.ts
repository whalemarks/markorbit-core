import type { CoreDomainId } from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  createCoreEventType,
  type CoreEventAction,
  type CoreEventType
} from '../../events/index.ts';
import {
  createCoreContractId,
  type CoreContractId
} from '../core-contract-id.ts';

export const CORE_MVP_EVENT_TYPES = [
  'customer-created',
  'brand-created',
  'trademark-created',
  'matter-created',
  'order-created',
  'document-created',
  'document-attached',
  'evidence-created',
  'task-created',
  'task-updated',
  'task-completed',
  'communication-created',
  'communication-reviewed',
  'communication-sent',
  'workflow-contract-previewed',
  'workflow-contract-applied',
  'permission-evaluated',
  'policy-evaluated'
] as const;
export type CoreMvpEventType = (typeof CORE_MVP_EVENT_TYPES)[number];

export const CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS = [
  'event_reference_id',
  'event_type',
  'source_service',
  'subject_reference_id',
  'correlation_id',
  'causation_event_reference_id where applicable',
  'created_at',
  'visibility policy hook',
  'safe payload',
  'schema_version'
] as const;

export const CORE_MVP_EVENT_RESOLUTION_KINDS = [
  'canonical',
  'validated_alias'
] as const;
export type CoreMvpEventResolutionKind =
  (typeof CORE_MVP_EVENT_RESOLUTION_KINDS)[number];

export const CORE_MVP_EVENT_AUTHORITY_KINDS = [
  'event_spec',
  'mvp_requirement_and_service_trace',
  'validated_alias'
] as const;
export type CoreMvpEventAuthorityKind =
  (typeof CORE_MVP_EVENT_AUTHORITY_KINDS)[number];

export interface CoreMvpEventContractLockEntry {
  readonly id: CoreContractId;
  readonly requirementId: `must-event-${CoreMvpEventType}`;
  readonly eventType: CoreEventType;
  readonly domainId: CoreDomainId;
  readonly name: string;
  readonly action: CoreEventAction;
  readonly subjectObjectType: string;
  readonly sourceServiceContractId: CoreContractId;
  readonly sourceOperation: string;
  readonly sourceSpecPath: string;
  readonly sourceSpecId: string | null;
  readonly payloadContractPath: string | null;
  readonly authorityKind: CoreMvpEventAuthorityKind;
  readonly implementationEvidenceFiles: readonly string[];
  readonly resolution: {
    readonly kind: CoreMvpEventResolutionKind;
    readonly aliasTargetEventType: CoreEventType | null;
    readonly aliasTargetContractId: CoreContractId | null;
    readonly compatibilityBasis: readonly string[];
  };
  readonly requiredTraceFields: typeof CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS;
  readonly schemaVersion: '0.1.0';
  readonly boundaries: {
    readonly traceOnly: true;
    readonly commandTriggerAllowed: false;
    readonly directApiEmissionAllowed: false;
    readonly directWorkflowEmissionAllowed: false;
    readonly directAgentEmissionAllowed: false;
    readonly owningServiceTraceHandoffRequired: true;
    readonly eventBusImplemented: false;
  };
  readonly implementationTask: 'CORE-TASK-056';
  readonly createdAt: '2026-07-16T00:00:00.000Z';
}

interface LockInput {
  readonly eventType: CoreMvpEventType;
  readonly domainId: CoreDomainId;
  readonly name: string;
  readonly action: CoreEventAction;
  readonly subjectObjectType: string;
  readonly sourceServiceType: string;
  readonly sourceOperation: string;
  readonly sourceSpecId?: string;
  readonly payloadContractFile?: string;
  readonly authorityKind?: CoreMvpEventAuthorityKind;
  readonly implementationEvidenceFiles?: readonly string[];
  readonly aliasTargetEventType?: string;
  readonly compatibilityBasis?: readonly string[];
}

const eventSpecRoot = 'books/book-02-core-specification/core-specs/events';
const payloadContractRoot =
  'books/book-02-core-specification/core-specs/contracts/events';
const createdAt = '2026-07-16T00:00:00.000Z' as const;

const lock = (input: LockInput): CoreMvpEventContractLockEntry => {
  const aliasTargetEventType = input.aliasTargetEventType
    ? createCoreEventType(input.aliasTargetEventType)
    : null;
  const resolutionKind: CoreMvpEventResolutionKind = aliasTargetEventType
    ? 'validated_alias'
    : 'canonical';
  return {
    id: createCoreContractId(`core-mvp-event-${input.eventType}-contract`),
    requirementId: `must-event-${input.eventType}`,
    eventType: createCoreEventType(input.eventType),
    domainId: input.domainId,
    name: input.name,
    action: input.action,
    subjectObjectType: input.subjectObjectType,
    sourceServiceContractId: createCoreContractId(
      `core-service-${input.sourceServiceType}-contract`
    ),
    sourceOperation: input.sourceOperation,
    sourceSpecPath: `${eventSpecRoot}/${input.eventType}.md`,
    sourceSpecId: input.sourceSpecId ?? null,
    payloadContractPath: input.payloadContractFile
      ? `${payloadContractRoot}/${input.payloadContractFile}`
      : null,
    authorityKind:
      input.authorityKind ??
      (aliasTargetEventType ? 'validated_alias' : 'event_spec'),
    implementationEvidenceFiles: input.implementationEvidenceFiles ?? [],
    resolution: {
      kind: resolutionKind,
      aliasTargetEventType,
      aliasTargetContractId: aliasTargetEventType
        ? createCoreContractId(
            `core-event-${String(aliasTargetEventType)}-contract`
          )
        : null,
      compatibilityBasis: input.compatibilityBasis ?? [
        'Exact Book 02 Event specification is the canonical authority.'
      ]
    },
    requiredTraceFields: CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS,
    schemaVersion: '0.1.0',
    boundaries: {
      traceOnly: true,
      commandTriggerAllowed: false,
      directApiEmissionAllowed: false,
      directWorkflowEmissionAllowed: false,
      directAgentEmissionAllowed: false,
      owningServiceTraceHandoffRequired: true,
      eventBusImplemented: false
    },
    implementationTask: 'CORE-TASK-056',
    createdAt
  };
};

export const CORE_MVP_EVENT_CONTRACT_LOCKS = [
  lock({
    eventType: 'customer-created',
    domainId: 'customer',
    name: 'CustomerCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'customer-record',
    sourceServiceType: 'customer-service',
    sourceOperation: 'createCustomer',
    sourceSpecId: 'B02-EVT-CUSTOMER-CREATED',
    payloadContractFile: 'customer-created-payload.md'
  }),
  lock({
    eventType: 'brand-created',
    domainId: 'brand',
    name: 'BrandCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'brand-record',
    sourceServiceType: 'brand-service',
    sourceOperation: 'createBrand',
    sourceSpecId: 'B02-EVT-BRAND-CREATED',
    payloadContractFile: 'brand-created-payload.md'
  }),
  lock({
    eventType: 'trademark-created',
    domainId: 'trademark',
    name: 'TrademarkCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'trademark-record',
    sourceServiceType: 'trademark-service',
    sourceOperation: 'createTrademark',
    sourceSpecId: 'B02-EVT-TRADEMARK-CREATED',
    payloadContractFile: 'trademark-created-payload.md'
  }),
  lock({
    eventType: 'matter-created',
    domainId: 'matter',
    name: 'MatterCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'matter-record',
    sourceServiceType: 'matter-service',
    sourceOperation: 'createMatter',
    sourceSpecId: 'B02-EVT-MATTER-CREATED',
    payloadContractFile: 'matter-created-payload.md'
  }),
  lock({
    eventType: 'order-created',
    domainId: 'order',
    name: 'OrderCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'order-record',
    sourceServiceType: 'order-service',
    sourceOperation: 'createOrder',
    sourceSpecId: 'B02-EVT-ORDER-CREATED',
    payloadContractFile: 'order-created-payload.md'
  }),
  lock({
    eventType: 'document-created',
    domainId: 'document',
    name: 'DocumentCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'document-record',
    sourceServiceType: 'document-service',
    sourceOperation: 'createDocument',
    sourceSpecId: 'B02-EVT-DOCUMENT-CREATED',
    payloadContractFile: 'document-created-payload.md'
  }),
  lock({
    eventType: 'document-attached',
    domainId: 'document',
    name: 'DocumentAttached Validated MVP Event Alias',
    action: CORE_EVENT_ACTIONS.updated,
    subjectObjectType: 'document-record',
    sourceServiceType: 'document-service',
    sourceOperation: 'linkDocumentFile',
    authorityKind: 'validated_alias',
    implementationEvidenceFiles: [
      'src/services/document/core-document-service.ts'
    ],
    aliasTargetEventType: 'core-object-updated',
    compatibilityBasis: [
      'Book 02 MVP requires a deterministic DocumentAttached reference.',
      'Document Service owns file-reference linkage and records the resulting governed object update.',
      'The alias narrows the generic update to Document attachment trace only and cannot execute attachment behavior.'
    ]
  }),
  lock({
    eventType: 'evidence-created',
    domainId: 'evidence',
    name: 'EvidenceCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'evidence-record',
    sourceServiceType: 'evidence-service',
    sourceOperation: 'createEvidence',
    sourceSpecId: 'B02-EVT-EVIDENCE-CREATED',
    payloadContractFile: 'evidence-created-payload.md'
  }),
  lock({
    eventType: 'task-created',
    domainId: 'task',
    name: 'TaskCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'task-record',
    sourceServiceType: 'task-service',
    sourceOperation: 'createTask',
    sourceSpecId: 'B02-EVT-TASK-CREATED',
    payloadContractFile: 'task-created-payload.md'
  }),
  lock({
    eventType: 'task-updated',
    domainId: 'task',
    name: 'TaskUpdated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.updated,
    subjectObjectType: 'task-record',
    sourceServiceType: 'task-service',
    sourceOperation: 'updateTask',
    authorityKind: 'mvp_requirement_and_service_trace',
    implementationEvidenceFiles: ['src/services/task/core-task-service.ts'],
    compatibilityBasis: [
      'The locked MVP cut requires TaskUpdated.',
      'Task Service emits the exact task-updated trace through the governed trace port.'
    ]
  }),
  lock({
    eventType: 'task-completed',
    domainId: 'task',
    name: 'TaskCompleted Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.completed,
    subjectObjectType: 'task-record',
    sourceServiceType: 'task-service',
    sourceOperation: 'completeTask',
    authorityKind: 'mvp_requirement_and_service_trace',
    implementationEvidenceFiles: ['src/services/task/core-task-service.ts'],
    compatibilityBasis: [
      'The locked MVP cut requires TaskCompleted.',
      'Task Service emits the exact task-completed trace only after governed completion validation.'
    ]
  }),
  lock({
    eventType: 'communication-created',
    domainId: 'communication',
    name: 'CommunicationCreated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.created,
    subjectObjectType: 'communication-record',
    sourceServiceType: 'communication-reference-service',
    sourceOperation: 'createCommunication',
    sourceSpecId: 'B02-EVT-COMMUNICATION-CREATED',
    payloadContractFile: 'communication-created-payload.md'
  }),
  lock({
    eventType: 'communication-reviewed',
    domainId: 'communication',
    name: 'CommunicationReviewed Validated MVP Event Alias',
    action: CORE_EVENT_ACTIONS.reviewed,
    subjectObjectType: 'communication-record',
    sourceServiceType: 'communication-reference-service',
    sourceOperation: 'changeCommunicationStatus',
    authorityKind: 'validated_alias',
    implementationEvidenceFiles: [
      'src/services/communication/core-communication-service.ts'
    ],
    aliasTargetEventType: 'core-communication-approved',
    compatibilityBasis: [
      'Book 02 MVP requires an explicit CommunicationReviewed reference.',
      'The existing catalog approval event is the closest governed review-completion boundary.',
      'The alias preserves reviewed semantics and does not imply delivery, execution or autonomous approval.'
    ]
  }),
  lock({
    eventType: 'communication-sent',
    domainId: 'communication',
    name: 'CommunicationSent Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.emitted,
    subjectObjectType: 'communication-record',
    sourceServiceType: 'communication-reference-service',
    sourceOperation: 'recordCommunicationSent',
    authorityKind: 'mvp_requirement_and_service_trace',
    implementationEvidenceFiles: [
      'src/services/communication/core-communication-service.ts'
    ],
    compatibilityBasis: [
      'The locked MVP cut requires CommunicationSent.',
      'Communication Service records the exact communication-sent trace without performing external gateway delivery.'
    ]
  }),
  lock({
    eventType: 'workflow-contract-previewed',
    domainId: 'workflow-contract',
    name: 'WorkflowContractPreviewed Validated MVP Event Alias',
    action: CORE_EVENT_ACTIONS.emitted,
    subjectObjectType: 'workflow-contract-record',
    sourceServiceType: 'workflow-contract-service',
    sourceOperation: 'previewWorkflowContract',
    authorityKind: 'validated_alias',
    aliasTargetEventType: 'core-workflow-contract-registered',
    compatibilityBasis: [
      'Book 02 MVP requires a deterministic preview reference before bounded Workflow implementation.',
      'The generic registered-contract catalog entry supplies the stable Workflow Contract subject boundary.',
      'The alias is trace-only and does not claim preview/apply runtime completion.'
    ]
  }),
  lock({
    eventType: 'workflow-contract-applied',
    domainId: 'workflow-contract',
    name: 'WorkflowContractApplied Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.completed,
    subjectObjectType: 'workflow-contract-application',
    sourceServiceType: 'workflow-contract-service',
    sourceOperation: 'applyWorkflowContract',
    sourceSpecId: 'B02-EVT-WORKFLOW-CONTRACT-APPLIED',
    payloadContractFile: 'workflow-contract-applied-payload.md'
  }),
  lock({
    eventType: 'permission-evaluated',
    domainId: 'permission',
    name: 'PermissionEvaluated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.emitted,
    subjectObjectType: 'permission-evaluation',
    sourceServiceType: 'permission-evaluation-service',
    sourceOperation: 'evaluatePermission',
    sourceSpecId: 'B02-EVT-PERMISSION-EVALUATED',
    payloadContractFile: 'permission-evaluated-payload.md'
  }),
  lock({
    eventType: 'policy-evaluated',
    domainId: 'policy',
    name: 'PolicyEvaluated Exact MVP Event Contract',
    action: CORE_EVENT_ACTIONS.emitted,
    subjectObjectType: 'policy-evaluation',
    sourceServiceType: 'policy-evaluation-service',
    sourceOperation: 'evaluatePolicy',
    sourceSpecId: 'B02-EVT-POLICY-EVALUATED',
    payloadContractFile: 'policy-evaluated-payload.md'
  })
] as const satisfies readonly CoreMvpEventContractLockEntry[];

export type CoreMvpEventReferenceUse =
  | 'trace_reference'
  | 'command_trigger'
  | 'api_direct_emit'
  | 'workflow_direct_emit'
  | 'agent_direct_emit';

export interface CoreMvpEventReferenceUseDecision {
  readonly eventType: CoreMvpEventType;
  readonly intendedUse: CoreMvpEventReferenceUse;
  readonly allowed: boolean;
  readonly reasonCode:
    | 'TraceReferenceAllowed'
    | 'EventReferenceIsNotCommand'
    | 'ApiMustDelegateToOwningService'
    | 'WorkflowMustDelegateToOwningService'
    | 'AgentMustDelegateToOwningService';
}

export function findCoreMvpEventContractLock(
  eventType: string
): CoreMvpEventContractLockEntry | undefined {
  return CORE_MVP_EVENT_CONTRACT_LOCKS.find(
    (entry) => entry.eventType === eventType
  );
}

export function evaluateCoreMvpEventReferenceUse(
  eventType: CoreMvpEventType,
  intendedUse: CoreMvpEventReferenceUse
): CoreMvpEventReferenceUseDecision {
  if (intendedUse === 'trace_reference')
    return {
      eventType,
      intendedUse,
      allowed: true,
      reasonCode: 'TraceReferenceAllowed'
    };
  const reasonCode =
    intendedUse === 'command_trigger'
      ? 'EventReferenceIsNotCommand'
      : intendedUse === 'api_direct_emit'
        ? 'ApiMustDelegateToOwningService'
        : intendedUse === 'workflow_direct_emit'
          ? 'WorkflowMustDelegateToOwningService'
          : 'AgentMustDelegateToOwningService';
  return { eventType, intendedUse, allowed: false, reasonCode };
}
