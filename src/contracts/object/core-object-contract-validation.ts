import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreObjectContract } from './core-object-contract.ts';

const requiredBaseFields = ['id', 'type', 'domainId', 'status', 'version', 'metadata'] as const;
const excludedObjectConcepts = [
  'execution-context',
  'execution-runtime',
  'artifact',
  'render-job',
  'publish-package',
  'distillery-output',
  'workplace-item',
  'lite-record',
  'markreg-case',
  'product-screen',
  'workflow-runtime-instance',
  'task-runtime-instance',
  'ai-agent-session'
] as const;
const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const existingObjectSkeletonCount = 12;
const canonicalObjectEntries = [
  ['identity-record', 'identity', 'Core Identity Object Contract Skeleton', 'identity.md', 'CORE-TASK-021'],
  ['permission-record', 'permission', 'Core Permission Object Contract Skeleton', 'permission.md', 'CORE-TASK-021'],
  ['customer-record', 'customer', 'Core Customer Object Contract Skeleton', 'customer.md', 'CORE-TASK-021'],
  ['order-record', 'order', 'Core Order Object Contract Skeleton', 'order.md', 'CORE-TASK-021'],
  ['workflow-contract-record', 'workflow-contract', 'Core Workflow Contract Object Contract Skeleton', 'workflow-contract.md', 'CORE-TASK-021'],
  ['task-record', 'task', 'Core Task Object Contract Skeleton', 'task.md', 'CORE-TASK-021'],
  ['event-record', 'event', 'Core Event Object Contract Skeleton', 'event.md', 'CORE-TASK-021'],
  ['opportunity-record', 'opportunity', 'Core Opportunity Object Contract Skeleton', 'opportunity.md', 'CORE-TASK-023'],
  ['notification-record', 'notification', 'Core Notification Object Contract Skeleton', 'notification.md', 'CORE-TASK-023'],
  ['partner-record', 'partner', 'Core Partner Object Contract Skeleton', 'partner.md', 'CORE-TASK-023'],
  ['agent-record', 'agent', 'Core Agent Object Contract Skeleton', 'agent.md', 'CORE-TASK-023'],
  ['service-provider-record', 'service-provider', 'Core Service Provider Object Contract Skeleton', 'service-provider.md', 'CORE-TASK-023'],
  ['service-network-record', 'service-network', 'Core Service Network Object Contract Skeleton', 'service-network.md', 'CORE-TASK-023'],
  ['routing-record', 'routing', 'Core Routing Object Contract Skeleton', 'routing.md', 'CORE-TASK-023']
] as const;
const canonicalObjectSourceRoot = 'books/book-02-core-specification/core-specs/objects/';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreObjectContractSkeletons(contracts: readonly CoreObjectContract[]): readonly string[] {
  if (!Array.isArray(contracts)) return ['Core object contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const objectTypes = new Set<string>();

  if (contracts.length !== 26) errors.push('Core object contract skeletons must contain exactly 26 entries.');

  contracts.forEach((contract, index) => {
    const path = `contracts[${index}]`;
    if (!isPlainObject(contract)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!contract.id) errors.push(`${path}.id is required.`);
    if (!contract.objectType) errors.push(`${path}.objectType is required.`);
    if (!contract.domainId) errors.push(`${path}.domainId is required.`);
    if (!contract.name) errors.push(`${path}.name is required.`);
    if (!contract.description) errors.push(`${path}.description is required.`);
    if (!contract.status) errors.push(`${path}.status is required.`);
    if (!contract.book) errors.push(`${path}.book is required.`);
    if (!contract.purpose) errors.push(`${path}.purpose is required.`);
    if (contract.base !== 'CoreObjectDefinition') errors.push(`${path}.base must equal CoreObjectDefinition.`);
    if (!Array.isArray(contract.requiredBaseFields)) errors.push(`${path}.requiredBaseFields must be an array.`);
    if (!Array.isArray(contract.owns)) errors.push(`${path}.owns must be an array.`);
    if (!Array.isArray(contract.nonGoals)) errors.push(`${path}.nonGoals must be an array.`);

    if (typeof contract.id === 'string') {
      if (ids.has(contract.id)) errors.push(`${path}.id must be unique.`);
      ids.add(contract.id);
    }
    if (typeof contract.objectType === 'string') {
      if (objectTypes.has(contract.objectType)) errors.push(`${path}.objectType must be unique.`);
      objectTypes.add(contract.objectType);
    }
    if (typeof contract.domainId === 'string' && !domainIds.has(contract.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (typeof contract.status === 'string' && !statuses.has(contract.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (contract.metadata !== undefined && !isPlainObject(contract.metadata)) errors.push(`${path}.metadata must be a plain object.`);

    const canonicalEntry = canonicalObjectEntries[index - existingObjectSkeletonCount];
    if (canonicalEntry !== undefined) {
      const implementationTask = canonicalEntry[4];
      if (contract.id !== `core-object-${canonicalEntry[0]}-contract`) errors.push(`${path}.id must match the locked ${implementationTask} target.`);
      if (contract.objectType !== canonicalEntry[0]) errors.push(`${path}.objectType must match the locked ${implementationTask} target.`);
      if (contract.domainId !== canonicalEntry[1]) errors.push(`${path}.domainId must match the locked ${implementationTask} target.`);
      if (contract.name !== canonicalEntry[2]) errors.push(`${path}.name must match the locked ${implementationTask} target.`);
      if (contract.sourcePath !== `${canonicalObjectSourceRoot}${canonicalEntry[3]}`) errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
      if (contract.implementationDepth !== 'validated_skeleton') errors.push(`${path}.implementationDepth must be validated_skeleton.`);
      if (!isPlainObject(contract.metadata)) {
        errors.push(`${path}.metadata must be present for canonical additions.`);
      } else {
        if (contract.metadata.specificationRepository !== 'whalemarks/markorbit-publication') errors.push(`${path}.metadata.specificationRepository must match the locked repository.`);
        if (contract.metadata.specificationCommit !== '3349ecb8955021a8714d023348f8b24f941eb98f') errors.push(`${path}.metadata.specificationCommit must match the locked commit.`);
        if (contract.metadata.specificationPath !== 'books/book-02-core-specification/') errors.push(`${path}.metadata.specificationPath must match the locked Book 2 path.`);
        if (contract.metadata.implementationTask !== implementationTask) errors.push(`${path}.metadata.implementationTask must be ${implementationTask}.`);
        if (implementationTask === 'CORE-TASK-023' && contract.metadata.mvpRequirement !== 'stub_now') errors.push(`${path}.metadata.mvpRequirement must be stub_now.`);
      }
    }

    if (Array.isArray(contract.requiredBaseFields)) {
      for (const field of requiredBaseFields) {
        if (!contract.requiredBaseFields.includes(field)) errors.push(`${path}.requiredBaseFields must include ${field}.`);
      }
    }

    const serialized = JSON.stringify(contract).toLowerCase();
    for (const concept of excludedObjectConcepts) {
      if (serialized.includes(concept)) errors.push(`${path} must not include excluded object concept ${concept}.`);
    }
  });

  return errors;
}
