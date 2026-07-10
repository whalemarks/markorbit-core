import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_COVERAGE_BASELINE,
  validateCoreContractCoverageBaselineFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as unknown;

describe('core-contract-coverage-baseline fixture', () => {
  it('matches the canonical generated baseline exactly', () => {
    assert.deepEqual(fixture, CORE_CONTRACT_COVERAGE_BASELINE);
  });

  it('passes required fixture validation', () => {
    assert.equal(validateCoreContractCoverageBaselineFixture(fixture).ok, true);
  });

  it('remains structural-only and does not claim runtime readiness', () => {
    const baseline = fixture as typeof CORE_CONTRACT_COVERAGE_BASELINE;
    assert.equal(baseline.scope, 'contract_structure_only');
    assert.equal(baseline.assessmentBoundary.runtimeCoverageAssessed, false);
    assert.equal(
      baseline.assessmentBoundary.productionReadinessAssessed,
      false
    );
  });
});
