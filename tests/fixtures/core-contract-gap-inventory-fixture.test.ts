import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_GAP_INVENTORY,
  validateCoreContractGapInventoryFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/contract-coverage/core-contract-gap-inventory.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as unknown;

describe('core-contract-gap-inventory fixture', () => {
  it('matches the canonical generated inventory exactly', () => {
    assert.deepEqual(fixture, CORE_CONTRACT_GAP_INVENTORY);
  });

  it('passes required fixture validation', () => {
    assert.equal(validateCoreContractGapInventoryFixture(fixture).ok, true);
  });

  it('remains inventory-only and does not change the index', () => {
    const inventory = fixture as typeof CORE_CONTRACT_GAP_INVENTORY;
    assert.equal(inventory.scope, 'inventory_lock_only');
    assert.equal(inventory.summary.currentIndexChangedByThisTask, false);
    assert.equal(inventory.summary.totalNewCanonicalTargetCount, 81);
  });
});
