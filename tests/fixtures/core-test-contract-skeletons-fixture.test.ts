import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_TEST_CONTRACT_SKELETONS,
  FORBIDDEN_CORE_TEST_EXECUTABLE_FIELDS,
  validateCoreTestContractSkeletonsFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/contracts/core-test-contract-skeletons.fixture.json',
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

describe('core-test-contract-skeletons fixture', () => {
  it('matches the canonical 7-entry skeleton family exactly', () => {
    assert.deepEqual(
      fixture,
      JSON.parse(JSON.stringify(CORE_TEST_CONTRACT_SKELETONS))
    );
  });

  it('passes fixture validation', () => {
    assert.equal(validateCoreTestContractSkeletonsFixture(fixture).ok, true);
  });

  it('does not contain executable test fields', () => {
    const keys = new Set(collectKeys(fixture));
    for (const field of FORBIDDEN_CORE_TEST_EXECUTABLE_FIELDS)
      assert.equal(keys.has(field), false);
  });
});
