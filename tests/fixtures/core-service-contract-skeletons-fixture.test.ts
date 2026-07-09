import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_SERVICE_CONTRACT_SKELETONS, EXCLUDED_CORE_SERVICE_CONCEPTS } from '../../src/index.ts';

type FixtureEntry = Record<string, unknown> & { readonly id: string; readonly serviceType: string; readonly domainId: string; readonly name: string };
const fixture = JSON.parse(await readFile(new URL('../../fixtures/contracts/core-service-contract-skeletons.fixture.json', import.meta.url), 'utf8')) as readonly FixtureEntry[];
const executableMethodFields = ['methods', 'method', 'handler', 'function', 'execute', 'implementation', 'resolver'];

describe('core-service-contract-skeletons fixture', () => {
  it('fixture has exactly 10 entries', () => assert.equal(fixture.length, 10));
  it('fixture ids match CORE_SERVICE_CONTRACT_SKELETONS ids exactly', () => assert.deepEqual(fixture.map((c) => c.id), CORE_SERVICE_CONTRACT_SKELETONS.map((c) => c.id)));
  it('fixture serviceTypes match CORE_SERVICE_CONTRACT_SKELETONS serviceTypes exactly', () => assert.deepEqual(fixture.map((c) => c.serviceType), CORE_SERVICE_CONTRACT_SKELETONS.map((c) => c.serviceType)));
  it('fixture domainIds match CORE_SERVICE_CONTRACT_SKELETONS domainIds exactly', () => assert.deepEqual(fixture.map((c) => c.domainId), CORE_SERVICE_CONTRACT_SKELETONS.map((c) => c.domainId)));
  it('fixture names match CORE_SERVICE_CONTRACT_SKELETONS names exactly', () => assert.deepEqual(fixture.map((c) => c.name), CORE_SERVICE_CONTRACT_SKELETONS.map((c) => c.name)));
  it('fixture does not contain excluded service concepts', () => {
    const serialized = JSON.stringify(fixture).toLowerCase();
    for (const concept of EXCLUDED_CORE_SERVICE_CONCEPTS) assert.equal(serialized.includes(concept), false);
  });
  it('fixture does not contain executable method definitions', () => {
    const serialized = JSON.stringify(fixture).toLowerCase();
    for (const field of executableMethodFields) assert.equal(serialized.includes(`"${field}"`), false);
  });
});
