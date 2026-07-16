import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-038 Book 02 Service evidence', () => {
  it('preserves Customer, Brand, and Trademark Service evidence', () => {
    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (requirement) => requirement.layer === 'service'
    );
    const implemented = services.filter(
      (requirement) => requirement.currentDisposition === 'meets_required_depth'
    );
    assert.ok(
      [
        'must-service-customer-service',
        'must-service-brand-service',
        'must-service-trademark-service'
      ].every((id) => implemented.some((requirement) => requirement.id === id))
    );
    assert.ok(
      implemented.every(
        (requirement) => requirement.currentDepth === 'level_2_3'
      )
    );
  });

  it('preserves the historical Service evidence while reflecting final acceptance', () => {
    assert.ok(
      BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow.meets_required_depth >= 35
    );
    assert.ok(
      BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow.validated_skeleton_only <=
        54
    );
    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (entry) => entry.id === 'must-build-services-own-behavior'
    );
    assert.equal(criterion?.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      12
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
