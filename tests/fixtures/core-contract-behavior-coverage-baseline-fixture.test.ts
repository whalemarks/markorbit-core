import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE,
  validateCoreContractBehaviorCoverageBaselineFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/behavior-coverage/core-contract-behavior-coverage-baseline.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as unknown;

describe('core-contract-behavior-coverage-baseline fixture', () => {
  it('matches the canonical behavior assessment exactly', () => {
    assert.deepEqual(fixture, CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE);
  });

  it('passes required fixture validation', () => {
    assert.equal(
      validateCoreContractBehaviorCoverageBaselineFixture(fixture).ok,
      true
    );
  });
});
