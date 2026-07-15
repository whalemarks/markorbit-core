import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-045 Book 02 Opportunity Service evidence', () => {
  it('records Phase 4 partial behavior while retaining the locked stub-now disposition', () => {
    const opportunity = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (requirement) => requirement.id === 'stub-service-opportunity-service'
    );
    assert.equal(opportunity?.currentDisposition, 'boundary_scaffold_only');
    assert.equal(opportunity?.currentDepth, 'level_2_3');
    assert.deepEqual(opportunity?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/opportunity/core-opportunity-service.ts'
    ]);
    assert.deepEqual(opportunity?.testFiles, [
      'tests/unit/core-opportunity-service-potential-demand.test.ts'
    ]);
    assert.deepEqual(opportunity?.fixtureFiles, [
      'fixtures/services/core-opportunity-service-potential-demand-foundation.fixture.json'
    ]);
  });

  it("preserves Opportunity's stub classification after Event Service promotion", () => {
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
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.stubNow.productionDepthViolations,
      0
    );
  });
});
