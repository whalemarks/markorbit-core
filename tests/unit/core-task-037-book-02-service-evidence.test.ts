import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

describe('CORE-TASK-037 Book 02 Service evidence', () => {
  it('retains Customer and Brand Services at owned behavior depth', () => {
    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (requirement) => requirement.layer === 'service'
    );
    for (const id of [
      'must-service-customer-service',
      'must-service-brand-service'
    ]) {
      const requirement = services.find((entry) => entry.id === id);
      assert.equal(requirement?.currentDisposition, 'meets_required_depth');
      assert.equal(requirement?.currentDepth, 'level_2_3');
    }
  });

  it('reflects final Service acceptance after all required Services own behavior', () => {
    const serviceCriterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (criterion) => criterion.id === 'must-build-services-own-behavior'
    );
    assert.equal(serviceCriterion?.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      15
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
