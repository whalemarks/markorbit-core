import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_MVP_EVENT_CONTRACT_LOCKS,
  validateCoreMvpEventContractLockFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/contracts/core-mvp-event-contract-lock.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as unknown;

describe('core MVP Event contract lock fixture', () => {
  it('matches the deterministic 18-entry source lock', () => {
    assert.deepEqual(fixture, CORE_MVP_EVENT_CONTRACT_LOCKS);
    assert.equal(validateCoreMvpEventContractLockFixture(fixture).ok, true);
  });

  it('fails when an Event reference becomes command-capable', () => {
    const mutated = structuredClone(fixture) as Array<Record<string, unknown>>;
    const boundaries = mutated[0].boundaries as Record<string, unknown>;
    boundaries.commandTriggerAllowed = true;
    assert.equal(validateCoreMvpEventContractLockFixture(mutated).ok, false);
  });
});
