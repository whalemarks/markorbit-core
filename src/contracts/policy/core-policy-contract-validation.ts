import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CorePolicyContract } from './core-policy-contract.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const EXCLUDED_CORE_POLICY_CONCEPTS = [
  'execution-runtime-policy',
  'execution-context-policy',
  'workflow-engine-policy',
  'task-runtime-policy',
  'event-bus-policy',
  'api-server-policy',
  'database-root-policy',
  'product-ui-policy',
  'artifact-render-policy',
  'publish-automation-policy',
  'distillery-runtime-policy',
  'ai-agent-approval-policy',
  'autonomous-agent-policy',
  'bypass-review-policy',
  'bypass-permission-policy'
] as const;

const forbiddenPolicyTypeParts = ['bypass', 'runtime', 'engine', 'database-root', 'autonomous-agent', 'ai-agent-approval'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCorePolicyContractSkeletons(entries: readonly CorePolicyContract[]): readonly string[] {
  if (!Array.isArray(entries)) return ['Core policy contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const policyTypes = new Set<string>();

  if (entries.length !== 8) errors.push('Core policy contract skeletons must contain exactly 8 entries.');

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!entry.id) errors.push(`${path}.id is required.`);
    if (!entry.policyType) errors.push(`${path}.policyType is required.`);
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
    if (typeof entry.policyType === 'string') {
      if (!kebabCasePattern.test(entry.policyType)) errors.push(`${path}.policyType must be kebab-case.`);
      if (policyTypes.has(entry.policyType)) errors.push(`${path}.policyType must be unique.`);
      policyTypes.add(entry.policyType);
      for (const part of forbiddenPolicyTypeParts) {
        if (entry.policyType.includes(part)) errors.push(`${path}.policyType must not contain ${part}.`);
      }
    }
    if (typeof entry.domainId === 'string' && !domainIds.has(entry.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (typeof entry.status === 'string' && !statuses.has(entry.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (entry.metadata !== undefined && !isPlainObject(entry.metadata)) errors.push(`${path}.metadata must be a plain object.`);

    const serialized = JSON.stringify(entry).toLowerCase();
    for (const concept of EXCLUDED_CORE_POLICY_CONCEPTS) {
      if (serialized.includes(concept)) errors.push(`${path} must not include excluded policy concept ${concept}.`);
    }
  });

  return errors;
}
