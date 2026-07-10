import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_AI_GOVERNANCE_CONTRACT_SKELETONS,
  EXCLUDED_CORE_AI_GOVERNANCE_CONCEPTS,
  FORBIDDEN_CORE_AI_GOVERNANCE_EXECUTABLE_FIELDS,
  validateCoreAiGovernanceContractSkeletonsFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as readonly Record<string, unknown>[];

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => collectKeys(entry));
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested)
  ]);
}

describe('core-ai-governance-contract-skeletons fixture', () => {
  it('has exactly 8 entries', () => {
    assert.equal(fixture.length, 8);
  });

  it('matches the inventory-locked skeletons exactly', () => {
    const jsonSkeletons = JSON.parse(
      JSON.stringify(CORE_AI_GOVERNANCE_CONTRACT_SKELETONS)
    ) as readonly Record<string, unknown>[];
    assert.deepEqual(fixture, jsonSkeletons);
  });

  it('passes fixture validation', () => {
    assert.equal(
      validateCoreAiGovernanceContractSkeletonsFixture(fixture).ok,
      true
    );
  });

  it('does not include excluded AI governance concepts', () => {
    const serialized = JSON.stringify(fixture).toLowerCase();
    for (const concept of EXCLUDED_CORE_AI_GOVERNANCE_CONCEPTS)
      assert.equal(serialized.includes(concept), false);
  });

  it('does not include executable or decision fields', () => {
    const keys = new Set(collectKeys(fixture));
    for (const field of FORBIDDEN_CORE_AI_GOVERNANCE_EXECUTABLE_FIELDS)
      assert.equal(keys.has(field), false);
  });

  it('does not grant protected actions', () => {
    assert.ok(fixture.every((entry) => entry.protectedAction === false));
  });
});
