import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-046 Book 02 Event Service evidence', () => {
  it('records Event Service as an owned Must Build behavior boundary', () => {
    const event = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-event-service'
    );
    assert.equal(event?.currentDisposition, 'meets_required_depth');
    assert.equal(event?.currentDepth, 'level_2_3');
    assert.deepEqual(event?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/event/core-event-service.ts'
    ]);
    assert.deepEqual(event?.testFiles, [
      'tests/unit/core-event-service-governed-occurrence.test.ts'
    ]);
    assert.deepEqual(event?.fixtureFiles, [
      'fixtures/services/core-event-service-governed-occurrence-foundation.fixture.json'
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
