import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-047 Book 02 Task Service evidence', () => {
  it('records Task Service as an owned Must Build behavior boundary', () => {
    const task = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-task-service'
    );
    assert.equal(task?.currentDisposition, 'meets_required_depth');
    assert.equal(task?.currentDepth, 'level_2_3');
    assert.deepEqual(task?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/task/core-task-service.ts'
    ]);
    assert.deepEqual(task?.testFiles, [
      'tests/unit/core-task-service-actionable-work.test.ts'
    ]);
    assert.deepEqual(task?.fixtureFiles, [
      'fixtures/services/core-task-service-actionable-work-foundation.fixture.json'
    ]);
  });

  it('derives 86 / 3 / 21 and closes the final foundational authority Service gap', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 86,
      partial_evidence: 3,
      validated_skeleton_only: 21,
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
