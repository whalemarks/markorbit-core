import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-048 Book 02 Workflow Contract Service evidence', () => {
  it('records Workflow Contract Service as the owned execution-structure authority', () => {
    const workflow = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) =>
        requirement.id === 'must-service-workflow-contract-service'
    );
    assert.equal(workflow?.currentDisposition, 'meets_required_depth');
    assert.equal(workflow?.currentDepth, 'level_2_3');
    assert.deepEqual(workflow?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/workflow-contract/core-workflow-contract-service.ts'
    ]);
    assert.deepEqual(workflow?.testFiles, [
      'tests/unit/core-workflow-contract-service-execution-structure.test.ts'
    ]);
    assert.deepEqual(workflow?.fixtureFiles, [
      'fixtures/services/core-workflow-contract-service-execution-structure-foundation.fixture.json'
    ]);
  });

  it('derives 44 / 3 / 45 while leaving Communication Service unresolved', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 44,
      partial_evidence: 3,
      validated_skeleton_only: 45,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 18,
      fixture_only: 0,
      missing: 0
    });
    const unresolvedServiceIds = BOOK_02_MVP_GAP_BASELINE.requirements
      .filter(
        (requirement) =>
          requirement.layer === 'service' &&
          requirement.currentDisposition === 'validated_skeleton_only' &&
          requirement.id === 'must-service-communication-service'
      )
      .map((requirement) => requirement.id);
    assert.deepEqual(unresolvedServiceIds, [
      'must-service-communication-service'
    ]);
  });
});
