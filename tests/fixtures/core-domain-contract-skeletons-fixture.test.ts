import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_CONTRACT_SKELETONS } from '../../src/index.ts';

type Entry = { readonly id: string; readonly domainId: string; readonly name: string };
const fixture = JSON.parse(await readFile(new URL('../../fixtures/contracts/core-domain-contract-skeletons.fixture.json', import.meta.url), 'utf8')) as readonly Entry[];
const excluded = ['capability', 'business-responsibility', 'artifact', 'render', 'publish', 'distillery', 'execution-context', 'execution-runtime', 'workplace', 'lite', 'markreg', 'product', 'integration'];

describe('core-domain-contract-skeletons fixture', () => {
  it('has exactly 26 entries', () => assert.equal(fixture.length, 26));
  it('fixture ids match CORE_DOMAIN_CONTRACT_SKELETONS ids exactly', () => assert.deepEqual(fixture.map((c) => c.id), CORE_DOMAIN_CONTRACT_SKELETONS.map((c) => c.id)));
  it('fixture domainIds match CORE_DOMAIN_CONTRACT_SKELETONS domainIds exactly', () => assert.deepEqual(fixture.map((c) => c.domainId), CORE_DOMAIN_CONTRACT_SKELETONS.map((c) => c.domainId)));
  it('fixture names match CORE_DOMAIN_CONTRACT_SKELETONS names exactly', () => assert.deepEqual(fixture.map((c) => c.name), CORE_DOMAIN_CONTRACT_SKELETONS.map((c) => c.name)));
  it('fixture does not contain excluded concepts', () => {
    const ids = fixture.map((c) => c.domainId);
    for (const id of excluded) assert.equal(ids.includes(id), false);
  });
});
