import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-049 Book 02 Communication Service evidence', () => {
  it('records Communication Service as governed message and conversation lifecycle authority', () => {
    const communication = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-communication-service'
    );
    assert.equal(communication?.currentDisposition, 'meets_required_depth');
    assert.equal(communication?.currentDepth, 'level_2_3');
    assert.deepEqual(communication?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/communication/core-communication-service.ts'
    ]);
    assert.deepEqual(communication?.testFiles, [
      'tests/unit/core-communication-service-governed-communication.test.ts'
    ]);
    assert.deepEqual(communication?.fixtureFiles, [
      'fixtures/services/core-communication-service-governed-communication-foundation.fixture.json'
    ]);
  });

  it('derives 73 / 3 / 34 and closes the final foundational authority Service gap', () => {
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
