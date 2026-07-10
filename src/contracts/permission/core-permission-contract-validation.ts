import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CorePermissionContract } from './core-permission-contract.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const EXCLUDED_CORE_PERMISSION_CONCEPTS = [
  'execution-runtime-permission',
  'execution-context-permission',
  'workflow-engine-permission',
  'task-runtime-permission',
  'event-bus-permission',
  'api-server-permission',
  'database-root-permission',
  'product-ui-permission',
  'artifact-render-permission',
  'publish-automation-permission',
  'distillery-runtime-permission',
  'ai-agent-approval-permission',
  'autonomous-agent-permission',
  'bypass-review-permission',
  'bypass-policy-permission'
] as const;

const forbiddenPermissionTypeParts = ['bypass', 'runtime', 'engine', 'database-root', 'autonomous-agent', 'ai-agent-approval'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCorePermissionContractSkeletons(entries: readonly CorePermissionContract[]): readonly string[] {
  if (!Array.isArray(entries)) return ['Core permission contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const permissionTypes = new Set<string>();

  if (entries.length !== 8) errors.push('Core permission contract skeletons must contain exactly 8 entries.');

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!entry.id) errors.push(`${path}.id is required.`);
    if (!entry.permissionType) errors.push(`${path}.permissionType is required.`);
    if (!entry.domainId) errors.push(`${path}.domainId is required.`);
    if (!entry.name) errors.push(`${path}.name is required.`);
    if (!entry.description) errors.push(`${path}.description is required.`);
    if (!entry.status) errors.push(`${path}.status is required.`);
    if (!entry.book) errors.push(`${path}.book is required.`);
    if (!entry.purpose) errors.push(`${path}.purpose is required.`);
    if (!Array.isArray(entry.owns)) errors.push(`${path}.owns must be an array.`);
    if (!Array.isArray(entry.nonGoals)) errors.push(`${path}.nonGoals must be an array.`);

    if (typeof entry.id === 'string') {
      if (ids.has(entry.id)) errors.push(`${path}.id must be unique.`);
      ids.add(entry.id);
    }
    if (typeof entry.permissionType === 'string') {
      if (!kebabCasePattern.test(entry.permissionType)) errors.push(`${path}.permissionType must be kebab-case.`);
      if (permissionTypes.has(entry.permissionType)) errors.push(`${path}.permissionType must be unique.`);
      permissionTypes.add(entry.permissionType);
      for (const part of forbiddenPermissionTypeParts) {
        if (entry.permissionType.includes(part)) errors.push(`${path}.permissionType must not contain ${part}.`);
      }
    }
    if (typeof entry.domainId === 'string' && !domainIds.has(entry.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (typeof entry.status === 'string' && !statuses.has(entry.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (entry.metadata !== undefined && !isPlainObject(entry.metadata)) errors.push(`${path}.metadata must be a plain object.`);

    const serialized = JSON.stringify(entry).toLowerCase();
    for (const concept of EXCLUDED_CORE_PERMISSION_CONCEPTS) {
      if (serialized.includes(concept)) errors.push(`${path} must not include excluded permission concept ${concept}.`);
    }
  });

  return errors;
}
