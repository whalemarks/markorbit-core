import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreServiceContract } from './core-service-contract.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const EXCLUDED_CORE_SERVICE_CONCEPTS = [
  'execution-runtime-service',
  'execution-context-service',
  'workflow-engine-service',
  'task-runtime-service',
  'event-bus-service',
  'api-server-service',
  'database-service',
  'product-ui-service',
  'artifact-render-service',
  'publish-automation-service',
  'distillery-runtime-service',
  'ai-agent-execution-service',
  'autonomous-agent-service'
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreServiceContractSkeletons(contracts: readonly CoreServiceContract[]): readonly string[] {
  if (!Array.isArray(contracts)) return ['Core service contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const serviceTypes = new Set<string>();

  if (contracts.length !== 10) errors.push('Core service contract skeletons must contain exactly 10 entries.');

  contracts.forEach((contract, index) => {
    const path = `contracts[${index}]`;
    if (!isPlainObject(contract)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!contract.id) errors.push(`${path}.id is required.`);
    if (!contract.serviceType) errors.push(`${path}.serviceType is required.`);
    if (!contract.domainId) errors.push(`${path}.domainId is required.`);
    if (!contract.name) errors.push(`${path}.name is required.`);
    if (!contract.description) errors.push(`${path}.description is required.`);
    if (!contract.status) errors.push(`${path}.status is required.`);
    if (!contract.book) errors.push(`${path}.book is required.`);
    if (!contract.purpose) errors.push(`${path}.purpose is required.`);
    if (!Array.isArray(contract.owns)) errors.push(`${path}.owns must be an array.`);
    if (!Array.isArray(contract.nonGoals)) errors.push(`${path}.nonGoals must be an array.`);

    if (typeof contract.id === 'string') {
      if (ids.has(contract.id)) errors.push(`${path}.id must be unique.`);
      ids.add(contract.id);
    }
    if (typeof contract.serviceType === 'string') {
      if (!kebabCasePattern.test(contract.serviceType)) errors.push(`${path}.serviceType must be kebab-case.`);
      if (serviceTypes.has(contract.serviceType)) errors.push(`${path}.serviceType must be unique.`);
      serviceTypes.add(contract.serviceType);
    }
    if (typeof contract.domainId === 'string' && !domainIds.has(contract.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (typeof contract.status === 'string' && !statuses.has(contract.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (contract.metadata !== undefined && !isPlainObject(contract.metadata)) errors.push(`${path}.metadata must be a plain object.`);

    const serialized = JSON.stringify(contract).toLowerCase();
    for (const concept of EXCLUDED_CORE_SERVICE_CONCEPTS) {
      if (serialized.includes(concept)) errors.push(`${path} must not include excluded service concept ${concept}.`);
    }
  });

  return errors;
}
