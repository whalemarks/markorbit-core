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

  if (contracts.length !== 12) errors.push('Core object contract skeletons must contain exactly 12 entries.');

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
