import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_AI_GOVERNANCE_CONTRACT_SKELETONS,
  CORE_CONTRACT_STATUSES,
  CORE_DOMAIN_REGISTRY,
  EXCLUDED_CORE_AI_GOVERNANCE_CONCEPTS,
  FORBIDDEN_CORE_AI_GOVERNANCE_EXECUTABLE_FIELDS,
  validateCoreAiGovernanceContractSkeletons
} from '../../src/index.ts';

const expectedIds = [
  'core-ai-governance-ai-agent-contract',
  'core-ai-governance-agent-contract',
  'core-ai-governance-ai-capability-contract',
  'core-ai-governance-ai-output-contract',
  'core-ai-governance-ai-recommendation-contract',
  'core-ai-governance-ai-audit-record-contract',
  'core-ai-governance-structured-context-contract',
  'core-ai-governance-human-review-requirement-contract'
] as const;

const executableKeys = new Set<string>(FORBIDDEN_CORE_AI_GOVERNANCE_EXECUTABLE_FIELDS);

describe('Core AI Governance Contract Skeletons', () => {
  it('has exactly the 8 inventory-locked ids', () => {
    assert.deepEqual(
      CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.map((entry) => entry.id),
      expectedIds
    );
  });

  it('passes AI governance contract validation', () => {
    assert.deepEqual(
      validateCoreAiGovernanceContractSkeletons(
        CORE_AI_GOVERNANCE_CONTRACT_SKELETONS
      ),
      []
    );
  });

  it('has unique ids, governanceTypes, and names', () => {
    const ids = CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.map((entry) => entry.id);
    const governanceTypes = CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.map(
      (entry) => entry.governanceType
    );
    const names = CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.map(
      (entry) => entry.name
    );

    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(governanceTypes).size, governanceTypes.length);
    assert.equal(new Set(names).size, names.length);
  });

  it('maps every skeleton to the existing agent domain', () => {
    assert.ok(CORE_DOMAIN_REGISTRY.some((domain) => domain.id === 'agent'));
    assert.ok(
      CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.every(
        (entry) => entry.domainId === 'agent'
      )
    );
  });

  it('uses stable Book 02 source metadata', () => {
    assert.ok(
      CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.every(
        (entry) =>
          entry.book === 'Book 02 — MarkOrbit Core Specification' &&
          entry.status === CORE_CONTRACT_STATUSES.active &&
          entry.createdAt === '2026-07-10T00:00:00.000Z' &&
          entry.metadata?.specificationRepository ===
            'whalemarks/markorbit-publication' &&
          entry.metadata?.specificationPath ===
            'books/book-02-core-specification/' &&
          entry.metadata?.sourceInventory ===
            'docs/architecture/core-ai-governance-contract-inventory.md'
      )
    );
  });

  it('has textual source references, appliesTo, owns, and nonGoals', () => {
    assert.ok(
      CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.every(
        (entry) =>
          entry.sourceReferences.length > 0 &&
          entry.sourceReferences.every(
            (reference) => reference.trim().length > 0
          ) &&
          entry.appliesTo !== undefined &&
          entry.appliesTo.length === 1 &&
          entry.appliesTo.every((scope) => scope.trim().length > 0) &&
          entry.owns.length > 0 &&
          entry.nonGoals.length > 0
      )
    );
  });

  it('does not expose executable fields or grant protected actions', () => {
    for (const entry of CORE_AI_GOVERNANCE_CONTRACT_SKELETONS) {
      for (const key of Object.keys(entry))
        assert.equal(executableKeys.has(key), false);
      assert.equal(entry.protectedAction, false);
    }
  });

  it('does not include excluded AI governance concepts', () => {
    const serialized = JSON.stringify(
      CORE_AI_GOVERNANCE_CONTRACT_SKELETONS
    ).toLowerCase();
    for (const concept of EXCLUDED_CORE_AI_GOVERNANCE_CONCEPTS)
      assert.equal(serialized.includes(concept), false);
  });
});
