import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-053 Book 02 Permission Service evidence', () => {
  it('records Permission Service as the owned explicit authorization authority', () => {
    const permission = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-permission-service'
    );
    assert.equal(permission?.currentDisposition, 'meets_required_depth');
    assert.equal(permission?.currentDepth, 'level_2_3');
    assert.deepEqual(permission?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/permission/core-permission-service.ts'
    ]);
    assert.deepEqual(permission?.testFiles, [
      'tests/unit/core-permission-service-governed-grant-foundation.test.ts'
    ]);
    assert.deepEqual(permission?.fixtureFiles, [
      'fixtures/services/core-permission-service-governed-grant-foundation.fixture.json'
    ]);
  });

  it('derives 95 / 2 / 19 and closes the final Must Build Service gap', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 95,
      partial_evidence: 2,
      validated_skeleton_only: 18,
      boundary_scaffold_only: 0,
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
