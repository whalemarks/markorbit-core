import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_API_CONTRACT_SKELETONS, EXCLUDED_CORE_API_CONCEPTS } from '../../src/index.ts';

const readFixture = async (): Promise<Record<string, unknown>[]> => JSON.parse(await readFile(new URL('../../fixtures/contracts/core-api-contract-skeletons.fixture.json', import.meta.url), 'utf8')) as Record<string, unknown>[];

describe('core API contract skeletons fixture', () => {
  it('matches CORE_API_CONTRACT_SKELETONS identity fields', async () => {
    const fixture = await readFixture();
    assert.equal(fixture.length, 8);
    assert.deepEqual(fixture.map((entry) => entry.id), CORE_API_CONTRACT_SKELETONS.map((entry) => entry.id));
    assert.deepEqual(fixture.map((entry) => entry.apiType), CORE_API_CONTRACT_SKELETONS.map((entry) => entry.apiType));
    assert.deepEqual(fixture.map((entry) => entry.name), CORE_API_CONTRACT_SKELETONS.map((entry) => entry.name));
  });

  it('does not contain excluded API concepts, route handlers, or DTO schemas', async () => {
    const serialized = JSON.stringify(await readFixture()).toLowerCase();
    for (const concept of EXCLUDED_CORE_API_CONCEPTS) assert.equal(serialized.includes(concept), false);
    for (const forbidden of ['routehandler', 'route handler', 'requestdto', 'responsedto', 'request schema', 'response schema']) assert.equal(serialized.includes(forbidden), false);
  });
});
