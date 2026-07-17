import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-052 Book 02 User Service evidence', () => {
  it('records User Service as the owned account-participant authority', () => {
    const user = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-user-service'
    );
    assert.equal(user?.currentDisposition, 'meets_required_depth');
    assert.equal(user?.currentDepth, 'level_2_3');
    assert.deepEqual(user?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/user/core-user-service.ts'
    ]);
    assert.deepEqual(user?.testFiles, [
      'tests/unit/core-user-service-account-participant-foundation.test.ts'
    ]);
    assert.deepEqual(user?.fixtureFiles, [
      'fixtures/services/core-user-service-account-participant-foundation.fixture.json'
    ]);
  });

  it('derives 73 / 3 / 34 and closes the final Must Build Service gap', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 73,
      partial_evidence: 3,
      validated_skeleton_only: 34,
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
