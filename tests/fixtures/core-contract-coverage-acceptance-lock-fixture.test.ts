import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK,
  validateCoreContractCoverageAcceptanceLockFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/contract-coverage/core-contract-coverage-acceptance-lock.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as unknown;

describe('core-contract-coverage-acceptance-lock fixture', () => {
  it('matches the canonical acceptance lock exactly', () => {
    assert.deepEqual(fixture, CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK);
  });

  it('passes required fixture validation', () => {
    assert.equal(
      validateCoreContractCoverageAcceptanceLockFixture(fixture).ok,
      true
    );
  });
});
