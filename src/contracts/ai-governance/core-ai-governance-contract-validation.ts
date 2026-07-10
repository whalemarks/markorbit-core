import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreAiGovernanceContract } from './core-ai-governance-contract.ts';

const domainIds = new Set<string>(
  CORE_DOMAIN_REGISTRY.map((domain) => domain.id)
);
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const lockedEntries = [
  ['core-ai-governance-ai-agent-contract', 'ai-agent'],
  ['core-ai-governance-agent-contract', 'agent-contract'],
  ['core-ai-governance-ai-capability-contract', 'ai-capability'],
  ['core-ai-governance-ai-output-contract', 'ai-output'],
  ['core-ai-governance-ai-recommendation-contract', 'ai-recommendation'],
  ['core-ai-governance-ai-audit-record-contract', 'ai-audit-record'],
  ['core-ai-governance-structured-context-contract', 'structured-context'],
  [
    'core-ai-governance-human-review-requirement-contract',
    'human-review-requirement'
  ]
] as const;

export const EXCLUDED_CORE_AI_GOVERNANCE_CONCEPTS = [
  'core-ai-governance-ai-agent-identity-contract',
  'core-ai-governance-review-record-contract',
  'core-ai-governance-ai-context-contract',
  'core-ai-governance-agent-registry-contract',
  'core-ai-governance-ai-risk-level-contract',
  'core-ai-governance-ai-event-contract',
  'core-ai-governance-ai-permission-contract',
  'core-ai-governance-ai-policy-contract',
  'core-ai-governance-specialized-agent-contract',
  'core-ai-governance-production-ai-runtime-contract',
  'core-ai-governance-autonomous-execution-contract'
] as const;

export const FORBIDDEN_CORE_AI_GOVERNANCE_EXECUTABLE_FIELDS = [
  'execute',
  'run',
  'handler',
  'prompt',
  'model',
  'approve',
  'send',
  'submit',
  'mutate',
  'runtimeState',
  'executionContext',
  'permissionDecision',
  'policyDecision',
  'reviewDecision'
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)
  );
}

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => collectKeys(entry));
  if (!isPlainObject(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested)
  ]);
}

export function validateCoreAiGovernanceContractSkeletons(
  entries: readonly CoreAiGovernanceContract[]
): readonly string[] {
  if (!Array.isArray(entries))
    return ['Core AI governance contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const governanceTypes = new Set<string>();

  if (entries.length !== lockedEntries.length) {
    errors.push(
      `Core AI governance contract skeletons must contain exactly ${lockedEntries.length} entries.`
    );
  }

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    const lockedEntry = lockedEntries[index];
    if (lockedEntry !== undefined) {
      if (entry.id !== lockedEntry[0])
        errors.push(`${path}.id must match the locked source inventory.`);
      if (entry.governanceType !== lockedEntry[1])
        errors.push(
          `${path}.governanceType must match the locked source inventory.`
        );
    }

    if (!entry.id) errors.push(`${path}.id is required.`);
    if (!entry.governanceType)
      errors.push(`${path}.governanceType is required.`);
    if (!entry.domainId) errors.push(`${path}.domainId is required.`);
    if (!entry.name) errors.push(`${path}.name is required.`);
    if (!entry.description) errors.push(`${path}.description is required.`);
    if (!entry.status) errors.push(`${path}.status is required.`);
    if (!entry.book) errors.push(`${path}.book is required.`);
    if (!isNonEmptyStringArray(entry.sourceReferences))
      errors.push(`${path}.sourceReferences must be a non-empty string array.`);
    if (!entry.purpose) errors.push(`${path}.purpose is required.`);
    if (!isNonEmptyStringArray(entry.appliesTo))
      errors.push(`${path}.appliesTo must be a non-empty string array.`);
    if (!isNonEmptyStringArray(entry.owns))
      errors.push(`${path}.owns must be a non-empty string array.`);
    if (!isNonEmptyStringArray(entry.nonGoals))
      errors.push(`${path}.nonGoals must be a non-empty string array.`);
    if (!entry.createdAt) errors.push(`${path}.createdAt is required.`);

    if (typeof entry.id === 'string') {
      if (ids.has(entry.id)) errors.push(`${path}.id must be unique.`);
      ids.add(entry.id);
    }

    if (typeof entry.governanceType === 'string') {
      if (!kebabCasePattern.test(entry.governanceType))
        errors.push(`${path}.governanceType must be kebab-case.`);
      if (governanceTypes.has(entry.governanceType))
        errors.push(`${path}.governanceType must be unique.`);
      governanceTypes.add(entry.governanceType);
    }

    if (typeof entry.domainId === 'string' && !domainIds.has(entry.domainId))
      errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (entry.domainId !== 'agent')
      errors.push(`${path}.domainId must match the locked agent domain.`);
    if (typeof entry.status === 'string' && !statuses.has(entry.status))
      errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (entry.protectedAction !== false)
      errors.push(`${path}.protectedAction must be false.`);
    if (
      entry.requiresHumanReview !== undefined &&
      typeof entry.requiresHumanReview !== 'boolean'
    )
      errors.push(
        `${path}.requiresHumanReview must be a boolean when present.`
      );

    if (!isPlainObject(entry.metadata)) {
      errors.push(`${path}.metadata must be a plain object.`);
    } else {
      if (
        entry.metadata.specificationRepository !==
        'whalemarks/markorbit-publication'
      )
        errors.push(
          `${path}.metadata.specificationRepository must reference the locked publication repository.`
        );
      if (
        entry.metadata.specificationPath !== 'books/book-02-core-specification/'
      )
        errors.push(
          `${path}.metadata.specificationPath must reference the locked Book 2 path.`
        );
      if (
        entry.metadata.sourceInventory !==
        'docs/architecture/core-ai-governance-contract-inventory.md'
      )
        errors.push(
          `${path}.metadata.sourceInventory must reference the locked source inventory.`
        );
    }

    const serialized = JSON.stringify(entry).toLowerCase();
    for (const concept of EXCLUDED_CORE_AI_GOVERNANCE_CONCEPTS) {
      if (serialized.includes(concept))
        errors.push(
          `${path} must not include excluded AI governance concept ${concept}.`
        );
    }

    const keys = new Set(collectKeys(entry));
    for (const field of FORBIDDEN_CORE_AI_GOVERNANCE_EXECUTABLE_FIELDS) {
      if (keys.has(field))
        errors.push(`${path} must not include executable field ${field}.`);
    }
  });

  return errors;
}
