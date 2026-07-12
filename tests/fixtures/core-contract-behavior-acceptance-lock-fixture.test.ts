import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK } from '../../src/behavior-coverage/index.ts';
import { validateCoreContractBehaviorAcceptanceLockFixture } from '../../src/validation/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/behavior-coverage/core-contract-behavior-acceptance-lock.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
);

describe('Core contract behavior acceptance lock fixture', () => {
  it('matches the canonical lock and validates', () => {
    assert.deepEqual(fixture, CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK);
    assert.equal(
      validateCoreContractBehaviorAcceptanceLockFixture(fixture).ok,
      true
    );
  });
  it('rejects drift and runtime readiness claims', () => {
    assert.equal(
      validateCoreContractBehaviorAcceptanceLockFixture({
        ...fixture,
        nonGoals: []
      }).ok,
      false
    );
    assert.equal(JSON.stringify(fixture).includes('production_ready'), true);
    assert.equal(JSON.stringify(fixture).includes('runtime_complete'), false);
  });
});
