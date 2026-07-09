import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreApiContract } from './core-api-contract.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const EXCLUDED_CORE_API_CONCEPTS = [
  'trademark-filing-api',
  'matter-lifecycle-api',
  'communication-runtime-api',
  'execution-runtime-api',
  'execution-context-api',
  'workflow-engine-api',
  'task-runtime-api',
  'event-bus-api',
  'database-api',
  'product-ui-api',
  'artifact-render-api',
  'publish-automation-api',
  'distillery-api',
  'ai-agent-execution-api',
  'autonomous-agent-api'
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreApiContractSkeletons(contracts: readonly CoreApiContract[]): readonly string[] {
  if (!Array.isArray(contracts)) return ['Core API contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const apiTypes = new Set<string>();

  if (contracts.length !== 8) errors.push('Core API contract skeletons must contain exactly 8 entries.');

  contracts.forEach((contract, index) => {
    const path = `contracts[${index}]`;
    if (!isPlainObject(contract)) { errors.push(`${path} must be a plain object.`); return; }
    if (!contract.id) errors.push(`${path}.id is required.`);
    if (!contract.apiType) errors.push(`${path}.apiType is required.`);
    if (!contract.name) errors.push(`${path}.name is required.`);
    if (!contract.description) errors.push(`${path}.description is required.`);
    if (!contract.status) errors.push(`${path}.status is required.`);
    if (!contract.book) errors.push(`${path}.book is required.`);
    if (!contract.purpose) errors.push(`${path}.purpose is required.`);
    if (!Array.isArray(contract.owns)) errors.push(`${path}.owns must be an array.`);
    if (!Array.isArray(contract.nonGoals)) errors.push(`${path}.nonGoals must be an array.`);
    if (typeof contract.id === 'string') { if (ids.has(contract.id)) errors.push(`${path}.id must be unique.`); ids.add(contract.id); }
    if (typeof contract.apiType === 'string') {
      if (!kebabCasePattern.test(contract.apiType)) errors.push(`${path}.apiType must be kebab-case.`);
      if (apiTypes.has(contract.apiType)) errors.push(`${path}.apiType must be unique.`);
      apiTypes.add(contract.apiType);
    }
    if (typeof contract.domainId === 'string' && !domainIds.has(contract.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (typeof contract.status === 'string' && !statuses.has(contract.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (contract.metadata !== undefined && !isPlainObject(contract.metadata)) errors.push(`${path}.metadata must be a plain object.`);
    const serialized = JSON.stringify(contract).toLowerCase();
    for (const concept of EXCLUDED_CORE_API_CONCEPTS) if (serialized.includes(concept)) errors.push(`${path} must not include excluded API concept ${concept}.`);
  });
  return errors;
}
