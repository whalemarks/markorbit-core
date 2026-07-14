import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreServiceContract } from './core-service-contract.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const existingServiceSkeletonCount = 10;
const canonicalServiceEntries = [
  ['organization-service', 'organization', 'Core Organization Service Contract Skeleton', 'organization-service.md', 'CORE-TASK-021'],
  ['user-service', 'user', 'Core User Service Contract Skeleton', 'user-service.md', 'CORE-TASK-021'],
  ['brand-service', 'brand', 'Core Brand Service Contract Skeleton', 'brand-service.md', 'CORE-TASK-021'],
  ['customer-service', 'customer', 'Core Customer Service Contract Skeleton', 'customer-service.md', 'CORE-TASK-021'],
  ['matter-service', 'matter', 'Core Matter Service Contract Skeleton', 'matter-service.md', 'CORE-TASK-021'],
  ['order-service', 'order', 'Core Order Service Contract Skeleton', 'order-service.md', 'CORE-TASK-021'],
  ['workflow-contract-service', 'workflow-contract', 'Core Workflow Contract Service Contract Skeleton', 'workflow-contract-service.md', 'CORE-TASK-021'],
  ['task-service', 'task', 'Core Task Service Contract Skeleton', 'task-service.md', 'CORE-TASK-021'],
  ['event-service', 'event', 'Core Event Service Contract Skeleton', 'event-service.md', 'CORE-TASK-021'],
  ['trademark-service', 'trademark', 'Core Trademark Service Contract Skeleton', 'trademark-service.md', 'CORE-TASK-038'],
  ['opportunity-service', 'opportunity', 'Core Opportunity Service Contract Skeleton', 'opportunity-service.md', 'CORE-TASK-023'],
  ['notification-service', 'notification', 'Core Notification Service Contract Skeleton', 'notification-service.md', 'CORE-TASK-023'],
  ['partner-service', 'partner', 'Core Partner Service Contract Skeleton', 'partner-service.md', 'CORE-TASK-023'],
  ['agent-service', 'agent', 'Core Agent Service Contract Skeleton', 'agent-service.md', 'CORE-TASK-023'],
  ['service-provider-service', 'service-provider', 'Core Service Provider Service Contract Skeleton', 'service-provider-service.md', 'CORE-TASK-023'],
  ['service-network-service', 'service-network', 'Core Service Network Service Contract Skeleton', 'service-network-service.md', 'CORE-TASK-023'],
  ['routing-service', 'routing', 'Core Routing Service Contract Skeleton', 'routing-service.md', 'CORE-TASK-023']
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

  if (contracts.length !== 27) errors.push('Core service contract skeletons must contain exactly 27 entries.');

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
      const implementationTask = canonicalEntry[4];
      if (contract.id !== `core-service-${canonicalEntry[0]}-contract`) errors.push(`${path}.id must match the locked ${implementationTask} target.`);
      if (contract.serviceType !== canonicalEntry[0]) errors.push(`${path}.serviceType must match the locked ${implementationTask} target.`);
      if (contract.domainId !== canonicalEntry[1]) errors.push(`${path}.domainId must match the locked ${implementationTask} target.`);
      if (contract.name !== canonicalEntry[2]) errors.push(`${path}.name must match the locked ${implementationTask} target.`);
      if (contract.sourcePath !== `${canonicalServiceSourceRoot}${canonicalEntry[3]}`) errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
      if (contract.implementationDepth !== 'validated_skeleton') errors.push(`${path}.implementationDepth must be validated_skeleton.`);
      if (!isPlainObject(contract.metadata)) {
        errors.push(`${path}.metadata must be present for canonical additions.`);
      } else {
        if (contract.metadata.specificationRepository !== 'whalemarks/markorbit-publication') errors.push(`${path}.metadata.specificationRepository must match the locked repository.`);
        if (contract.metadata.specificationCommit !== '3349ecb8955021a8714d023348f8b24f941eb98f') errors.push(`${path}.metadata.specificationCommit must match the locked commit.`);
        if (contract.metadata.specificationPath !== 'books/book-02-core-specification/') errors.push(`${path}.metadata.specificationPath must match the locked Book 2 path.`);
        if (contract.metadata.implementationTask !== implementationTask) errors.push(`${path}.metadata.implementationTask must be ${implementationTask}.`);
        if (implementationTask === 'CORE-TASK-023' && contract.metadata.mvpRequirement !== 'stub_now') errors.push(`${path}.metadata.mvpRequirement must be stub_now.`);
        const behaviorLock =
          canonicalEntry[0] === 'customer-service'
            ? {
                task: 'CORE-TASK-036',
                operations: [
                  'createCustomer',
                  'getCustomer',
                  'listCustomers',
                  'validateCustomerReference',
                  'changeCustomerStatus'
                ]
              }
            : canonicalEntry[0] === 'brand-service'
              ? {
                  task: 'CORE-TASK-037',
                  operations: [
                    'createBrand',
                    'getBrand',
                    'listBrands',
                    'validateBrandReference',
                    'changeBrandStatus'
                  ]
                }
              : canonicalEntry[0] === 'trademark-service'
                ? {
                    task: 'CORE-TASK-038',
                    operations: [
                      'createTrademark',
                      'getTrademark',
                      'listTrademarks',
                      'validateTrademarkReference',
                      'changeTrademarkStatus'
                    ]
                  }
                : undefined;
        if (behaviorLock) {
          if (contract.metadata.behaviorImplementationTask !== behaviorLock.task)
            errors.push(
              `${path}.metadata.behaviorImplementationTask must be ${behaviorLock.task}.`
            );
          if (contract.metadata.behaviorDepth !== 'level_2_3')
            errors.push(`${path}.metadata.behaviorDepth must be level_2_3.`);
          if (
            JSON.stringify(contract.metadata.implementedOperations) !==
            JSON.stringify(behaviorLock.operations)
          )
            errors.push(
              `${path}.metadata.implementedOperations must match the locked Service operations.`
            );
        } else {
          if ('behaviorImplementationTask' in contract.metadata)
            errors.push(
              `${path}.metadata.behaviorImplementationTask must be absent for Services without behavior evidence.`
            );
          if ('behaviorDepth' in contract.metadata)
            errors.push(
              `${path}.metadata.behaviorDepth must be absent for Services without behavior evidence.`
            );
          if ('implementedOperations' in contract.metadata)
            errors.push(
              `${path}.metadata.implementedOperations must be absent for Services without behavior evidence.`
            );
        }
      }
    }

    const serialized = JSON.stringify(contract).toLowerCase();
    for (const concept of EXCLUDED_CORE_SERVICE_CONCEPTS) {
      if (serialized.includes(concept)) errors.push(`${path} must not include excluded service concept ${concept}.`);
    }
  });

  return errors;
}
