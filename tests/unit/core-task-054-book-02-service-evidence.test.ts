import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-054 Book 02 Policy Service evidence', () => {
  it('records Policy Service as the owned contextual-decision authority', () => {
    const policy = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-policy-service'
    );
    assert.equal(policy?.currentDisposition, 'meets_required_depth');
    assert.equal(policy?.currentDepth, 'level_2_3');
    assert.deepEqual(policy?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/policy/core-policy-service.ts'
    ]);
    assert.deepEqual(policy?.testFiles, [
      'tests/unit/core-policy-service-contextual-decision-foundation.test.ts'
    ]);
    assert.deepEqual(policy?.fixtureFiles, [
      'fixtures/services/core-policy-service-contextual-decision-foundation.fixture.json'
    ]);
  });

  it('derives 68 / 3 / 39, closes all Must Build Service gaps, and keeps Book 02 incomplete', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 68,
      partial_evidence: 3,
      validated_skeleton_only: 39,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 0,
      fixture_only: 0,
      missing: 0
    });
    const unresolvedServiceIds = BOOK_02_MVP_GAP_BASELINE.requirements
      .filter(
        (requirement) =>
          requirement.layer === 'service' &&
          requirement.currentDisposition === 'validated_skeleton_only'
      )
      .map((requirement) => requirement.id);
    assert.deepEqual(unresolvedServiceIds, []);
    const serviceCriterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (criterion) => criterion.id === 'must-build-services-own-behavior'
    );
    assert.equal(serviceCriterion?.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
