import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-038 Book 02 Service evidence', () => {
  it('promotes exactly Customer, Brand, and Trademark Services', () => {
    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (requirement) => requirement.layer === 'service'
    );
    const implemented = services.filter(
      (requirement) => requirement.currentDisposition === 'meets_required_depth'
    );
    assert.deepEqual(
      implemented.map((requirement) => requirement.id),
      [
        'must-service-customer-service',
        'must-service-brand-service',
        'must-service-trademark-service'
      ]
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
      15
    );
  });

  it('derives 35 / 3 / 54 and leaves global Service acceptance unresolved', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 35,
      partial_evidence: 3,
      validated_skeleton_only: 54,
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
