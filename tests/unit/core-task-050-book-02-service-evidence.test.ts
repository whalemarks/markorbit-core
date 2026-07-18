import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-050 Book 02 Identity Service evidence', () => {
  it('records Identity Service as the owned stable actor-recognition authority', () => {
    const identity = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-identity-service'
    );
    assert.equal(identity?.currentDisposition, 'meets_required_depth');
    assert.equal(identity?.currentDepth, 'level_2_3');
    assert.deepEqual(identity?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/identity/core-identity-service.ts'
    ]);
    assert.deepEqual(identity?.testFiles, [
      'tests/unit/core-identity-service-authority-foundation.test.ts'
    ]);
    assert.deepEqual(identity?.fixtureFiles, [
      'fixtures/services/core-identity-service-authority-foundation.fixture.json'
    ]);
  });

  it('derives 89 / 3 / 19 and closes the final foundational authority Service gap', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 89,
      partial_evidence: 3,
      validated_skeleton_only: 18,
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
  });
});
