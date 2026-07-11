import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreServiceContract } from './core-service-contract.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const existingServiceSkeletonCount = 10;
const canonicalServiceEntries = [
  ['organization-service', 'organization', 'Core Organization Service Contract Skeleton', 'organization-service.md'],
  ['user-service', 'user', 'Core User Service Contract Skeleton', 'user-service.md'],
  ['brand-service', 'brand', 'Core Brand Service Contract Skeleton', 'brand-service.md'],
  ['customer-service', 'customer', 'Core Customer Service Contract Skeleton', 'customer-service.md'],
  ['matter-service', 'matter', 'Core Matter Service Contract Skeleton', 'matter-service.md'],
  ['order-service', 'order', 'Core Order Service Contract Skeleton', 'order-service.md'],
  ['workflow-contract-service', 'workflow-contract', 'Core Workflow Contract Service Contract Skeleton', 'workflow-contract-service.md'],
  ['task-service', 'task', 'Core Task Service Contract Skeleton', 'task-service.md'],
  ['event-service', 'event', 'Core Event Service Contract Skeleton', 'event-service.md']
] as const;
const canonicalServiceSourceRoot = 'books/book-02-core-specification/core-specs/services/';

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

  if (contracts.length !== 19) errors.push('Core service contract skeletons must contain exactly 19 entries.');

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

    const canonicalEntry = canonicalServiceEntries[index - existingServiceSkeletonCount];
    if (canonicalEntry !== undefined) {
      if (contract.id !== `core-service-${canonicalEntry[0]}-contract`) errors.push(`${path}.id must match the locked CORE-TASK-021 target.`);
      if (contract.serviceType !== canonicalEntry[0]) errors.push(`${path}.serviceType must match the locked CORE-TASK-021 target.`);
      if (contract.domainId !== canonicalEntry[1]) errors.push(`${path}.domainId must match the locked CORE-TASK-021 target.`);
      if (contract.name !== canonicalEntry[2]) errors.push(`${path}.name must match the locked CORE-TASK-021 target.`);
      if (contract.sourcePath !== `${canonicalServiceSourceRoot}${canonicalEntry[3]}`) errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
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

    const serialized = JSON.stringify(contract).toLowerCase();
    for (const concept of EXCLUDED_CORE_SERVICE_CONCEPTS) {
      if (serialized.includes(concept)) errors.push(`${path} must not include excluded service concept ${concept}.`);
    }
  });

  return errors;
}
