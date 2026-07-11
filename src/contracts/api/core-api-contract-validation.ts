import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreApiContract } from './core-api-contract.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const existingApiSkeletonCount = 8;
const canonicalApiEntries = [
  ['identity', 'Identity', 'CORE-TASK-022'],
  ['organization', 'Organization', 'CORE-TASK-022'],
  ['user', 'User', 'CORE-TASK-022'],
  ['permission', 'Permission', 'CORE-TASK-022'],
  ['policy', 'Policy', 'CORE-TASK-022'],
  ['brand', 'Brand', 'CORE-TASK-022'],
  ['trademark', 'Trademark', 'CORE-TASK-022'],
  ['jurisdiction', 'Jurisdiction', 'CORE-TASK-022'],
  ['classification', 'Classification', 'CORE-TASK-022'],
  ['document', 'Document', 'CORE-TASK-022'],
  ['evidence', 'Evidence', 'CORE-TASK-022'],
  ['customer', 'Customer', 'CORE-TASK-022'],
  ['matter', 'Matter', 'CORE-TASK-022'],
  ['order', 'Order', 'CORE-TASK-022'],
  ['workflow-contract', 'Workflow Contract', 'CORE-TASK-022'],
  ['task', 'Task', 'CORE-TASK-022'],
  ['event', 'Event', 'CORE-TASK-022'],
  ['communication', 'Communication', 'CORE-TASK-022'],
  ['knowledge', 'Knowledge', 'CORE-TASK-023'],
  ['opportunity', 'Opportunity', 'CORE-TASK-023'],
  ['notification', 'Notification', 'CORE-TASK-023'],
  ['partner', 'Partner', 'CORE-TASK-023'],
  ['agent', 'Agent', 'CORE-TASK-023'],
  ['service-provider', 'Service Provider', 'CORE-TASK-023'],
  ['service-network', 'Service Network', 'CORE-TASK-023'],
  ['routing', 'Routing', 'CORE-TASK-023']
] as const;
const canonicalApiSourceRoot =
  'books/book-02-core-specification/core-specs/contracts/api/';

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

  if (contracts.length !== 34) errors.push('Core API contract skeletons must contain exactly 34 entries.');

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
    const canonicalEntry = canonicalApiEntries[index - existingApiSkeletonCount];
    if (canonicalEntry !== undefined) {
      const [domainId, domainName, implementationTask] = canonicalEntry;
      if (contract.id !== `core-api-${domainId}-api-contract`) errors.push(`${path}.id must match the locked ${implementationTask} target.`);
      if (contract.apiType !== `${domainId}-api`) errors.push(`${path}.apiType must match the locked ${implementationTask} target.`);
      if (contract.domainId !== domainId) errors.push(`${path}.domainId must match the locked ${implementationTask} target.`);
      if (contract.name !== `Core ${domainName} API Contract Skeleton`) errors.push(`${path}.name must match the locked ${implementationTask} target.`);
      if (contract.sourcePath !== `${canonicalApiSourceRoot}${domainId}-api-contract.md`) errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
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
    const serialized = JSON.stringify(contract).toLowerCase();
    for (const concept of EXCLUDED_CORE_API_CONCEPTS) if (serialized.includes(concept)) errors.push(`${path} must not include excluded API concept ${concept}.`);
  });
  return errors;
}
