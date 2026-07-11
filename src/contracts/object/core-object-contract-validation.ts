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
  ['identity-record', 'identity', 'Core Identity Object Contract Skeleton', 'identity.md'],
  ['permission-record', 'permission', 'Core Permission Object Contract Skeleton', 'permission.md'],
  ['customer-record', 'customer', 'Core Customer Object Contract Skeleton', 'customer.md'],
  ['order-record', 'order', 'Core Order Object Contract Skeleton', 'order.md'],
  ['workflow-contract-record', 'workflow-contract', 'Core Workflow Contract Object Contract Skeleton', 'workflow-contract.md'],
  ['task-record', 'task', 'Core Task Object Contract Skeleton', 'task.md'],
  ['event-record', 'event', 'Core Event Object Contract Skeleton', 'event.md']
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

  if (contracts.length !== 19) errors.push('Core object contract skeletons must contain exactly 19 entries.');

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
      if (contract.id !== `core-object-${canonicalEntry[0]}-contract`) errors.push(`${path}.id must match the locked CORE-TASK-021 target.`);
      if (contract.objectType !== canonicalEntry[0]) errors.push(`${path}.objectType must match the locked CORE-TASK-021 target.`);
      if (contract.domainId !== canonicalEntry[1]) errors.push(`${path}.domainId must match the locked CORE-TASK-021 target.`);
      if (contract.name !== canonicalEntry[2]) errors.push(`${path}.name must match the locked CORE-TASK-021 target.`);
      if (contract.sourcePath !== `${canonicalObjectSourceRoot}${canonicalEntry[3]}`) errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
      if (contract.implementationDepth !== 'validated_skeleton') errors.push(`${path}.implementationDepth must be validated_skeleton.`);
      if (!isPlainObject(contract.metadata)) {
        errors.push(`${path}.metadata must be present for canonical additions.`);
      } else {
        if (contract.metadata.specificationRepository !== 'whalemarks/markorbit-publication') errors.push(`${path}.metadata.specificationRepository must match the locked repository.`);
        if (contract.metadata.specificationCommit !== '3349ecb8955021a8714d023348f8b24f941eb98f') errors.push(`${path}.metadata.specificationCommit must match the locked commit.`);
        if (contract.metadata.specificationPath !== 'books/book-02-core-specification/') errors.push(`${path}.metadata.specificationPath must match the locked Book 2 path.`);
        if (contract.metadata.implementationTask !== 'CORE-TASK-021') errors.push(`${path}.metadata.implementationTask must be CORE-TASK-021.`);
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
