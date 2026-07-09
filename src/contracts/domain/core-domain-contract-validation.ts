import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import type { CoreDomainContract } from './core-domain-contract.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';

const validStatuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const registryDomainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const excludedDomainIds = new Set<string>([
  'capability',
  'business-responsibility',
  'artifact',
  'render',
  'publish',
  'distillery',
  'execution-context',
  'execution-runtime',
  'workplace',
  'lite',
  'markreg',
  'product',
  'integration'
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreDomainContractSkeletons(contracts: readonly CoreDomainContract[]): readonly string[] {
  if (!Array.isArray(contracts)) return ['Core domain contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const domainIds = new Set<string>();

  if (contracts.length !== CORE_DOMAIN_REGISTRY.length) {
    errors.push(`Core domain contract skeletons must contain exactly ${CORE_DOMAIN_REGISTRY.length} entries.`);
  }

  contracts.forEach((contract, index) => {
    const path = `contracts[${index}]`;
    if (!isPlainObject(contract)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!contract.id) errors.push(`${path}.id is required.`);
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

    if (typeof contract.domainId === 'string') {
      if (domainIds.has(contract.domainId)) errors.push(`${path}.domainId must be unique.`);
      domainIds.add(contract.domainId);
      if (!registryDomainIds.has(contract.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
      if (excludedDomainIds.has(contract.domainId)) errors.push(`${path}.domainId must not be an excluded concept.`);
    }

    if (typeof contract.status === 'string' && !validStatuses.has(contract.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (contract.metadata !== undefined && !isPlainObject(contract.metadata)) errors.push(`${path}.metadata must be a plain object.`);
  });

  for (const domain of CORE_DOMAIN_REGISTRY) {
    if (!domainIds.has(domain.id)) errors.push(`CORE_DOMAIN_REGISTRY domain ${domain.id} must have exactly one skeleton.`);
  }

  return errors;
}
