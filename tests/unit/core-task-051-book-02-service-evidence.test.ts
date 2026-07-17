import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-051 Book 02 Organization Service evidence', () => {
  it('records Organization Service as the owned operating-context authority', () => {
    const organization = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'must-service-organization-service'
    );
    assert.equal(organization?.currentDisposition, 'meets_required_depth');
    assert.equal(organization?.currentDepth, 'level_2_3');
    assert.deepEqual(organization?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/organization/core-organization-service.ts'
    ]);
    assert.deepEqual(organization?.testFiles, [
      'tests/unit/core-organization-service-operating-context-foundation.test.ts'
    ]);
    assert.deepEqual(organization?.fixtureFiles, [
      'fixtures/services/core-organization-service-operating-context-foundation.fixture.json'
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
