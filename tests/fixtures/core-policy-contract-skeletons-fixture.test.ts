import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_POLICY_CONTRACT_SKELETONS, EXCLUDED_CORE_POLICY_CONCEPTS } from '../../src/index.ts';

type CorePolicyContractSkeletonFixtureEntry = {
  readonly id: string;
  readonly policyType: string;
  readonly name: string;
};

const fixture = JSON.parse(await readFile(new URL('../../fixtures/contracts/core-policy-contract-skeletons.fixture.json', import.meta.url), 'utf8')) as readonly CorePolicyContractSkeletonFixtureEntry[];
const forbiddenExecutableFields = ['evaluate', 'decide', 'checkPolicy', 'policyEngine'];
const forbiddenRuleEngineFields = ['rule', 'rules', 'ruleEngine', 'conditions'];
const forbiddenRuntimeEnforcementFields = ['middleware', 'guard', 'runtimeState', 'executionContext', 'enforcement'];

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => collectKeys(entry));
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]);
}

describe('core-policy-contract-skeletons fixture', () => {
  it('fixture has exactly 8 entries', () => {
    assert.equal(fixture.length, 8);
  });

  it('fixture ids match CORE_POLICY_CONTRACT_SKELETONS ids exactly', () => {
    assert.deepEqual(fixture.map((entry) => entry.id), CORE_POLICY_CONTRACT_SKELETONS.map((entry) => entry.id));
  });

  it('fixture policyTypes match CORE_POLICY_CONTRACT_SKELETONS policyTypes exactly', () => {
    assert.deepEqual(fixture.map((entry) => entry.policyType), CORE_POLICY_CONTRACT_SKELETONS.map((entry) => entry.policyType));
  });

  it('fixture names match CORE_POLICY_CONTRACT_SKELETONS names exactly', () => {
    assert.deepEqual(fixture.map((entry) => entry.name), CORE_POLICY_CONTRACT_SKELETONS.map((entry) => entry.name));
  });

  it('fixture does not contain excluded policy concepts', () => {
    const serialized = JSON.stringify(fixture).toLowerCase();
    for (const concept of EXCLUDED_CORE_POLICY_CONCEPTS) assert.equal(serialized.includes(concept), false);
  });

  it('fixture does not contain executable policy logic', () => {
    const serialized = JSON.stringify(fixture);
    for (const field of forbiddenExecutableFields) assert.equal(serialized.includes(field), false);
  });

  it('fixture does not contain rule engine fields', () => {
    const keys = collectKeys(fixture);
    for (const field of forbiddenRuleEngineFields) assert.equal(keys.includes(field), false);
  });

  it('fixture does not contain runtime enforcement fields', () => {
    const keys = collectKeys(fixture);
    for (const field of forbiddenRuntimeEnforcementFields) assert.equal(keys.includes(field), false);
  });
});
