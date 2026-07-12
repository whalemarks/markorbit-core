import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY,
  validateCoreContractBehaviorGapInventoryFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/behavior-coverage/core-contract-behavior-gap-inventory.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as unknown;

describe('core-contract-behavior-gap-inventory fixture', () => {
  it('matches the canonical behavior gap lock exactly', () => {
    assert.deepEqual(fixture, CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY);
  });

  it('passes required fixture validation', () => {
    assert.equal(
      validateCoreContractBehaviorGapInventoryFixture(fixture).ok,
      true
    );
  });
});
