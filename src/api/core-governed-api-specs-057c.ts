import type {
  CoreGovernedApiBoundarySpec,
  CoreGovernedApiOperationSpec
} from './core-governed-api-boundary.ts';

const op = (
  apiOperation: string,
  serviceOperation: string,
  domain: string,
  duplicateSensitive: boolean,
  requiredPayloadFields: readonly string[],
  allowedPayloadFields: readonly string[],
  referenceFields: readonly string[] = [],
  objectFields: readonly string[] = [],
  arrayFields: readonly string[] = [],
  booleanFields: readonly string[] = []
): CoreGovernedApiOperationSpec => ({
  apiOperation,
  serviceOperation,
  governanceOperation: `${domain}.${apiOperation.replaceAll('-', '_')}`,
  operationCategory:
    apiOperation === 'get' || apiOperation === 'list'
      ? 'Read'
      : apiOperation.startsWith('validate')
        ? 'Validate'
        : apiOperation.startsWith('link')
          ? 'Link'
          : apiOperation === 'create' || apiOperation === 'record'
            ? 'Create'
            : apiOperation === 'archive'
              ? 'Archive'
              : 'Update',
  duplicateSensitive,
  requiredPermissionKey: `${domain}:${apiOperation === 'get' || apiOperation === 'list' || apiOperation.startsWith('validate') ? 'read' : 'update'}`,
  requiredPolicyScope: `${domain}.${apiOperation === 'get' || apiOperation === 'list' ? 'read' : 'write'}`,
  requiredPayloadFields,
  allowedPayloadFields,
  referenceFields,
  objectFields,
  arrayFields,
  booleanFields
});

const crud = (
  domain: string,
  prefix: string
): readonly CoreGovernedApiOperationSpec[] => [
  op(
    'create',
    `create${prefix}`,
    domain,
    true,
    ['objectRecord', 'publicReferenceRecord', 'sourceReference'],
    [
      'objectRecord',
      'publicReferenceRecord',
      'sourceReference',
      'metadata',
      'aiInitiated',
      'agentContractReferenceId'
    ],
    ['sourceReference', 'agentContractReferenceId'],
    ['objectRecord', 'publicReferenceRecord', 'metadata'],
    [],
    ['aiInitiated']
  ),
  op(
    'get',
    `get${prefix}`,
    domain,
    false,
    [`${domain}ReferenceId`],
    [`${domain}ReferenceId`],
    [`${domain}ReferenceId`]
  ),
  op(
    'list',
    `list${prefix}s`,
    domain,
    false,
    [],
    ['organizationReferenceId', 'status', 'limit', 'cursor'],
    ['organizationReferenceId', 'cursor']
  ),
  op(
    'update',
    `update${prefix}`,
    domain,
    true,
    [`${domain}ReferenceId`],
    [`${domain}ReferenceId`, 'metadata', 'reasonReference'],
    [`${domain}ReferenceId`, 'reasonReference'],
    ['metadata']
  ),
  op(
    'validate-reference',
    `validate${prefix}Reference`,
    domain,
    false,
    [`${domain}ReferenceId`, 'requestingDomain', 'requestingService'],
    [`${domain}ReferenceId`, 'requestingDomain', 'requestingService'],
    [`${domain}ReferenceId`]
  )
];

const link = (domain: string, prefix: string, target: string, plural = false) =>
  op(
    `link-${target.replaceAll('_', '-')}`,
    `link${prefix}${target
      .split('_')
      .map((part) => part[0]!.toUpperCase() + part.slice(1))
      .join('')}`,
    domain,
    true,
    [
      `${domain}ReferenceId`,
      plural ? `${target}ReferenceIds` : `${target}ReferenceId`
    ],
    [
      `${domain}ReferenceId`,
      plural ? `${target}ReferenceIds` : `${target}ReferenceId`
    ],
    [`${domain}ReferenceId`, ...(plural ? [] : [`${target}ReferenceId`])],
    [],
    plural ? [`${target}ReferenceIds`] : []
  );

const matterOperations = [
  ...crud('matter', 'Matter'),
  op(
    'change-status',
    'changeMatterStatus',
    'matter',
    true,
    ['matterReferenceId', 'nextStatus', 'reasonReference'],
    ['matterReferenceId', 'nextStatus', 'reasonReference'],
    ['matterReferenceId', 'reasonReference']
  ),
  link('matter', 'Matter', 'order'),
  link('matter', 'Matter', 'customer'),
  link('matter', 'Matter', 'brand'),
  link('matter', 'Matter', 'trademark'),
  link('matter', 'Matter', 'workflow_contract'),
  link('matter', 'Matter', 'task'),
  link('matter', 'Matter', 'document'),
  link('matter', 'Matter', 'evidence')
] as const;

const orderOperations = [
  ...crud('order', 'Order'),
  op(
    'change-status',
    'changeOrderStatus',
    'order',
    true,
    ['orderReferenceId', 'nextStatus', 'reasonReference'],
    ['orderReferenceId', 'nextStatus', 'reasonReference'],
    ['orderReferenceId', 'reasonReference']
  ),
  link('order', 'Order', 'customer'),
  link('order', 'Order', 'opportunity'),
  link('order', 'Order', 'brand'),
  link('order', 'Order', 'trademark'),
  link('order', 'Order', 'matter'),
  op(
    'validate-readiness',
    'validateOrderReadiness',
    'order',
    false,
    ['orderReferenceId'],
    ['orderReferenceId'],
    ['orderReferenceId']
  ),
  op(
    'accept',
    'acceptOrder',
    'order',
    true,
    ['orderReferenceId', 'reasonReference'],
    ['orderReferenceId', 'reasonReference'],
    ['orderReferenceId', 'reasonReference']
  ),
  op(
    'cancel',
    'cancelOrder',
    'order',
    true,
    ['orderReferenceId', 'reasonReference'],
    ['orderReferenceId', 'reasonReference'],
    ['orderReferenceId', 'reasonReference']
  )
] as const;

const workflowOperations = [
  op(
    'create',
    'createWorkflowContract',
    'workflow-contract',
    true,
    ['objectRecord', 'publicReferenceRecord', 'sourceReference'],
    ['objectRecord', 'publicReferenceRecord', 'sourceReference', 'metadata'],
    ['sourceReference'],
    ['objectRecord', 'publicReferenceRecord', 'metadata']
  ),
  op(
    'get',
    'getWorkflowContract',
    'workflow-contract',
    false,
    ['workflowContractReferenceId'],
    ['workflowContractReferenceId'],
    ['workflowContractReferenceId']
  ),
  op(
    'update',
    'updateWorkflowContract',
    'workflow-contract',
    true,
    ['workflowContractReferenceId'],
    ['workflowContractReferenceId', 'metadata', 'reasonReference'],
    ['workflowContractReferenceId', 'reasonReference'],
    ['metadata']
  ),
  op(
    'change-status',
    'changeWorkflowContractStatus',
    'workflow-contract',
    true,
    ['workflowContractReferenceId', 'nextStatus', 'reasonReference'],
    ['workflowContractReferenceId', 'nextStatus', 'reasonReference'],
    ['workflowContractReferenceId', 'reasonReference']
  ),
  op(
    'define-state',
    'defineWorkflowState',
    'workflow-contract',
    true,
    ['workflowContractReferenceId', 'stateRecord'],
    ['workflowContractReferenceId', 'stateRecord'],
    ['workflowContractReferenceId'],
    ['stateRecord']
  ),
  op(
    'define-transition',
    'defineWorkflowTransition',
    'workflow-contract',
    true,
    ['workflowContractReferenceId', 'transitionRecord'],
    ['workflowContractReferenceId', 'transitionRecord'],
    ['workflowContractReferenceId'],
    ['transitionRecord']
  ),
  op(
    'define-guard',
    'defineWorkflowGuard',
    'workflow-contract',
    true,
    ['workflowContractReferenceId', 'guardRecord'],
    ['workflowContractReferenceId', 'guardRecord'],
    ['workflowContractReferenceId'],
    ['guardRecord']
  ),
  op(
    'validate-transition',
    'validateWorkflowTransition',
    'workflow-contract',
    false,
    ['workflowContractReferenceId', 'fromState', 'toState'],
    ['workflowContractReferenceId', 'fromState', 'toState', 'context'],
    ['workflowContractReferenceId'],
    ['context']
  ),
  op(
    'validate-applicability',
    'validateWorkflowApplicability',
    'workflow-contract',
    false,
    ['workflowContractReferenceId', 'targetReferenceId'],
    ['workflowContractReferenceId', 'targetReferenceId', 'context'],
    ['workflowContractReferenceId', 'targetReferenceId'],
    ['context']
  ),
  op(
    'validate-reference',
    'validateWorkflowContractReference',
    'workflow-contract',
    false,
    ['workflowContractReferenceId', 'requestingDomain', 'requestingService'],
    ['workflowContractReferenceId', 'requestingDomain', 'requestingService'],
    ['workflowContractReferenceId']
  ),
  op(
    'archive',
    'archiveWorkflowContract',
    'workflow-contract',
    true,
    ['workflowContractReferenceId', 'reasonReference'],
    ['workflowContractReferenceId', 'reasonReference'],
    ['workflowContractReferenceId', 'reasonReference']
  )
] as const;

const taskOperations = [
  ...crud('task', 'Task'),
  op(
    'change-status',
    'changeTaskStatus',
    'task',
    true,
    ['taskReferenceId', 'nextStatus', 'reasonReference'],
    ['taskReferenceId', 'nextStatus', 'reasonReference'],
    ['taskReferenceId', 'reasonReference']
  ),
  op(
    'assign',
    'assignTask',
    'task',
    true,
    ['taskReferenceId', 'assigneeReferenceId', 'assigneeType'],
    [
      'taskReferenceId',
      'assigneeReferenceId',
      'assigneeType',
      'reasonReference'
    ],
    ['taskReferenceId', 'assigneeReferenceId', 'reasonReference']
  ),
  op(
    'reassign',
    'reassignTask',
    'task',
    true,
    [
      'taskReferenceId',
      'assigneeReferenceId',
      'assigneeType',
      'reasonReference'
    ],
    [
      'taskReferenceId',
      'assigneeReferenceId',
      'assigneeType',
      'reasonReference'
    ],
    ['taskReferenceId', 'assigneeReferenceId', 'reasonReference']
  ),
  op(
    'unassign',
    'unassignTask',
    'task',
    true,
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference']
  ),
  link('task', 'Task', 'matter'),
  link('task', 'Task', 'workflow_contract'),
  link('task', 'Task', 'dependency'),
  op(
    'complete',
    'completeTask',
    'task',
    true,
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference', 'completionRecord'],
    ['taskReferenceId', 'reasonReference'],
    ['completionRecord']
  ),
  op(
    'cancel',
    'cancelTask',
    'task',
    true,
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference']
  ),
  op(
    'reopen',
    'reopenTask',
    'task',
    true,
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference']
  ),
  op(
    'archive',
    'archiveTask',
    'task',
    true,
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference'],
    ['taskReferenceId', 'reasonReference']
  )
] as const;

const eventOperations = [
  op(
    'record',
    'recordEvent',
    'event',
    true,
    [
      'objectRecord',
      'publicReferenceRecord',
      'eventType',
      'sourceService',
      'subjectReferenceId',
      'payload'
    ],
    [
      'objectRecord',
      'publicReferenceRecord',
      'eventType',
      'sourceService',
      'subjectReferenceId',
      'correlationId',
      'causationEventReferenceId',
      'payload',
      'schemaVersion'
    ],
    ['subjectReferenceId', 'causationEventReferenceId'],
    ['objectRecord', 'publicReferenceRecord', 'payload']
  ),
  op(
    'get',
    'getEvent',
    'event',
    false,
    ['eventReferenceId'],
    ['eventReferenceId'],
    ['eventReferenceId']
  ),
  op(
    'validate-reference',
    'validateEventReference',
    'event',
    false,
    ['eventReferenceId', 'requestingDomain', 'requestingService'],
    ['eventReferenceId', 'requestingDomain', 'requestingService'],
    ['eventReferenceId']
  ),
  op(
    'validate-payload',
    'validateEventPayload',
    'event',
    false,
    ['eventType', 'payload', 'schemaVersion'],
    ['eventType', 'payload', 'schemaVersion'],
    [],
    ['payload']
  ),
  op(
    'update-status',
    'updateEventStatus',
    'event',
    true,
    ['eventReferenceId', 'nextStatus', 'reasonReference'],
    ['eventReferenceId', 'nextStatus', 'reasonReference'],
    ['eventReferenceId', 'reasonReference']
  ),
  op(
    'mark-dispatched',
    'markEventDispatched',
    'event',
    true,
    ['eventReferenceId', 'dispatchReferenceId'],
    ['eventReferenceId', 'dispatchReferenceId'],
    ['eventReferenceId', 'dispatchReferenceId']
  ),
  op(
    'mark-dispatch-failed',
    'markEventDispatchFailed',
    'event',
    true,
    ['eventReferenceId', 'reasonReference'],
    ['eventReferenceId', 'reasonReference'],
    ['eventReferenceId', 'reasonReference']
  ),
  op(
    'link-consumer',
    'linkEventConsumer',
    'event',
    true,
    ['eventReferenceId', 'consumerReferenceId'],
    ['eventReferenceId', 'consumerReferenceId'],
    ['eventReferenceId', 'consumerReferenceId']
  ),
  op(
    'archive',
    'archiveEvent',
    'event',
    true,
    ['eventReferenceId', 'reasonReference'],
    ['eventReferenceId', 'reasonReference'],
    ['eventReferenceId', 'reasonReference']
  )
] as const;

const communicationOperations = [
  ...crud('communication', 'Communication'),
  op(
    'change-status',
    'changeCommunicationStatus',
    'communication',
    true,
    ['communicationReferenceId', 'nextStatus', 'reasonReference'],
    ['communicationReferenceId', 'nextStatus', 'reasonReference'],
    ['communicationReferenceId', 'reasonReference']
  ),
  link('communication', 'Communication', 'participant'),
  link('communication', 'Communication', 'matter'),
  link('communication', 'Communication', 'customer'),
  link('communication', 'Communication', 'agent'),
  link('communication', 'Communication', 'attachment'),
  link('communication', 'Communication', 'document'),
  op(
    'record-sent',
    'recordCommunicationSent',
    'communication',
    true,
    ['communicationReferenceId', 'deliveryReferenceId'],
    ['communicationReferenceId', 'deliveryReferenceId', 'reviewReferenceId'],
    ['communicationReferenceId', 'deliveryReferenceId', 'reviewReferenceId']
  ),
  op(
    'record-received',
    'recordCommunicationReceived',
    'communication',
    true,
    ['communicationReferenceId', 'sourceReference'],
    ['communicationReferenceId', 'sourceReference'],
    ['communicationReferenceId', 'sourceReference']
  ),
  op(
    'archive',
    'archiveCommunication',
    'communication',
    true,
    ['communicationReferenceId', 'reasonReference'],
    ['communicationReferenceId', 'reasonReference'],
    ['communicationReferenceId', 'reasonReference']
  )
] as const;

const specs = [
  ['matter', 'core-service-matter-service-contract', matterOperations],
  ['order', 'core-service-order-service-contract', orderOperations],
  [
    'workflow-contract',
    'core-service-workflow-contract-service-contract',
    workflowOperations
  ],
  ['task', 'core-service-task-service-contract', taskOperations],
  ['event', 'core-service-event-service-contract', eventOperations],
  [
    'communication',
    'core-service-communication-service-contract',
    communicationOperations
  ]
] as const;

export const CORE_TASK_057C_API_BOUNDARY_SPECS = specs.map(
  ([domainId, serviceContractId, operations]) => ({
    domainId,
    apiType: `${domainId}-api`,
    apiContractId: `core-api-${domainId}-api-contract`,
    serviceContractId,
    sourcePath: `books/book-02-core-specification/core-specs/contracts/api/${domainId}-api-contract.md`,
    implementationTask: 'CORE-TASK-057C',
    directDomainMutation: false,
    directEventEmission: false,
    operations
  })
) as readonly CoreGovernedApiBoundarySpec[];
