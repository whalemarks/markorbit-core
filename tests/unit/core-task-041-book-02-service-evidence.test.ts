import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

const implementedServiceIds = [
  'must-service-customer-service',
  'must-service-brand-service',
  'must-service-trademark-service',
  'must-service-jurisdiction-service',
  'must-service-classification-service',
  'must-service-document-service'
];

describe('CORE-TASK-041 Book 02 Service evidence', () => {
  it('promotes Customer through Document in dependency order', () => {
    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (requirement) => requirement.layer === 'service'
    );
    const implemented = services.filter(
      (requirement) => requirement.currentDisposition === 'meets_required_depth'
    );
    assert.deepEqual(
      implemented.map((requirement) => requirement.id),
      implementedServiceIds
    );
    assert.ok(
      implemented.every(
        (requirement) => requirement.currentDepth === 'level_2_3'
      )
    );
    assert.equal(
      services.filter(
        (requirement) =>
          requirement.currentDisposition === 'validated_skeleton_only'
      ).length,
      12
    );
  });

  it('derives 38 / 3 / 51 and leaves global Service acceptance unresolved', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 38,
      partial_evidence: 3,
      validated_skeleton_only: 51,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 18,
      fixture_only: 0,
      missing: 0
    });
    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (entry) => entry.id === 'must-build-services-own-behavior'
    );
    assert.equal(criterion?.satisfied, false);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      11
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
