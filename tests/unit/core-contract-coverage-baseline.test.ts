import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_COVERAGE_BASELINE,
  CORE_CONTRACT_FAMILY_COVERAGE,
  CORE_DOMAIN_CONTRACT_COVERAGE,
  CORE_DOMAIN_REGISTRY,
  CORE_FIXTURE_MANIFEST,
  validateCoreContractCoverageBaseline
} from '../../src/index.ts';

describe('Core Contract Coverage Baseline', () => {
  it('passes canonical coverage validation', () => {
    assert.deepEqual(
      validateCoreContractCoverageBaseline(CORE_CONTRACT_COVERAGE_BASELINE),
      []
    );
  });

  it('covers all 106 indexed contracts across 10 structural families', () => {
    assert.equal(CORE_CONTRACT_FAMILY_COVERAGE.length, 10);
    assert.equal(
      CORE_CONTRACT_FAMILY_COVERAGE.reduce(
        (total, family) => total + family.indexedCount,
        0
      ),
      106
    );
    assert.equal(
      CORE_CONTRACT_COVERAGE_BASELINE.summary.indexedContractCount,
      106
    );
  });

  it('maps every Core Domain exactly once in registry order', () => {
    assert.deepEqual(
      CORE_DOMAIN_CONTRACT_COVERAGE.map((entry) => entry.domainId),
      CORE_DOMAIN_REGISTRY.map((domain) => domain.id)
    );
    assert.equal(CORE_DOMAIN_CONTRACT_COVERAGE.length, 26);
  });

  it('locks the Book 2 MVP split to 18 must-build and 8 stub domains', () => {
    assert.equal(
      CORE_DOMAIN_CONTRACT_COVERAGE.filter(
        (entry) => entry.requirement === 'must_build_now'
      ).length,
      18
    );
    assert.equal(
      CORE_DOMAIN_CONTRACT_COVERAGE.filter(
        (entry) => entry.requirement === 'stub_now'
      ).length,
      8
    );
  });

  it('reports current domain-layer coverage without overstating behavior', () => {
    assert.deepEqual(
      CORE_CONTRACT_COVERAGE_BASELINE.summary.layerDomainCounts,
      {
        domain: 26,
        object: 12,
        service: 10,
        api: 4,
        event: 4,
        workflow: 6
      }
    );
    assert.equal(
      CORE_CONTRACT_COVERAGE_BASELINE.summary.domainBehaviorTestedCount,
      0
    );
    assert.equal(
      CORE_CONTRACT_COVERAGE_BASELINE.assessmentBoundary
        .behaviorCoverageAssessed,
      false
    );
    assert.equal(
      CORE_CONTRACT_COVERAGE_BASELINE.assessmentBoundary
        .sourceAlignmentCoverageAssessed,
      false
    );
  });

  it('identifies one required-layer-complete domain and 52 missing slots', () => {
    const completeDomains = CORE_DOMAIN_CONTRACT_COVERAGE.filter(
      (entry) => entry.requiredLayerState === 'required_layers_present'
    );
    assert.deepEqual(
      completeDomains.map((entry) => entry.domainId),
      ['policy']
    );
    assert.equal(
      CORE_CONTRACT_COVERAGE_BASELINE.summary.missingRequiredLayerSlotCount,
      52
    );
  });

  it('references only required fixture manifest entries', () => {
    const requiredFixtureIds = new Set(
      CORE_FIXTURE_MANIFEST.filter((entry) => entry.required).map(
        (entry) => entry.id
      )
    );
    for (const family of CORE_CONTRACT_FAMILY_COVERAGE)
      for (const fixtureId of family.fixtureIds)
        assert.equal(requiredFixtureIds.has(fixtureId), true);
  });
});
