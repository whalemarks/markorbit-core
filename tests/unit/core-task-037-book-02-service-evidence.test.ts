import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-037 Book 02 Service evidence', () => {
  it('promotes only Customer and Brand Services to owned behavior depth', () => {
    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (requirement) => requirement.layer === 'service'
    );
    const implemented = services.filter(
      (requirement) => requirement.currentDisposition === 'meets_required_depth'
    );
    assert.deepEqual(
      implemented.map((requirement) => requirement.id),
      ['must-service-customer-service', 'must-service-brand-service']
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
      16
    );
  });

  it('derives 34 / 3 / 55 while keeping global Service acceptance unresolved', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 34,
      partial_evidence: 3,
      validated_skeleton_only: 55,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 18,
      fixture_only: 0,
      missing: 0
    });
    const serviceCriterion =
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
        (criterion) => criterion.id === 'must-build-services-own-behavior'
      );
    assert.equal(serviceCriterion?.satisfied, false);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance
        .acceptanceCriteriaSatisfied,
      11
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
