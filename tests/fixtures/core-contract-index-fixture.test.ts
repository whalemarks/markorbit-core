import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_CONTRACT_INDEX } from '../../src/index.ts';

type CoreContractIndexFixtureEntry = {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly status: string;
  readonly book: string;
};

const fixture = JSON.parse(
  await readFile(new URL('../../fixtures/contracts/core-contract-index.fixture.json', import.meta.url), 'utf8')
) as readonly CoreContractIndexFixtureEntry[];

const concreteBusinessIds = ['trademark-application', 'matter-lifecycle', 'communication-runtime'];
const book03RuntimeIds = ['execution-context', 'execution-runtime'];
const productUiIds = ['product', 'artifact', 'render', 'publish', 'distillery', 'workplace'];

describe('core-contract-index fixture', () => {
  it('has exactly 98 entries', () => {
    assert.equal(fixture.length, 98);
  });

  it('fixture ids match CORE_CONTRACT_INDEX ids exactly', () => {
    assert.deepEqual(
      fixture.map((contract) => contract.id),
      CORE_CONTRACT_INDEX.map((contract) => contract.id)
    );
  });

  it('fixture names match CORE_CONTRACT_INDEX names exactly', () => {
    assert.deepEqual(
      fixture.map((contract) => contract.name),
      CORE_CONTRACT_INDEX.map((contract) => contract.name)
    );
  });

  it('fixture types match CORE_CONTRACT_INDEX types exactly', () => {
    assert.deepEqual(
      fixture.map((contract) => contract.type),
      CORE_CONTRACT_INDEX.map((contract) => contract.type)
    );
  });

  it('fixture statuses match CORE_CONTRACT_INDEX statuses exactly', () => {
    assert.deepEqual(
      fixture.map((contract) => contract.status),
      CORE_CONTRACT_INDEX.map((contract) => contract.status)
    );
  });

  it('fixture does not contain concrete business contracts', () => {
    const ids = fixture.map((contract) => contract.id);
    for (const forbiddenId of concreteBusinessIds) assert.equal(ids.includes(forbiddenId), false);
  });

  it('fixture does not contain Book 03 execution runtime contracts', () => {
    const ids = fixture.map((contract) => contract.id);
    for (const forbiddenId of book03RuntimeIds) assert.equal(ids.includes(forbiddenId), false);
  });

  it('fixture does not contain product UI contracts', () => {
    const ids = fixture.map((contract) => contract.id);
    for (const forbiddenId of productUiIds) assert.equal(ids.includes(forbiddenId), false);
  });
});
