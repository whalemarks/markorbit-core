import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

const task040ServiceIds = [
  'must-service-customer-service',
  'must-service-brand-service',
  'must-service-trademark-service',
  'must-service-jurisdiction-service',
  'must-service-classification-service'
];

describe('CORE-TASK-040 Book 02 Service evidence', () => {
  it('preserves Customer through Classification after later Service batches', () => {
    const implemented = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (requirement) =>
        requirement.layer === 'service' &&
        requirement.currentDisposition === 'meets_required_depth'
    );
    for (const id of task040ServiceIds) {
      const requirement = implemented.find((entry) => entry.id === id);
      assert.equal(requirement?.currentDepth, 'level_2_3');
    }
    assert.deepEqual(
      implemented
        .map((entry) => entry.id)
        .filter((id) => task040ServiceIds.includes(id)),
      task040ServiceIds
    );
  });

  it('reflects final Service acceptance after every Must Build Service owns behavior', () => {
    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (entry) => entry.id === 'must-build-services-own-behavior'
    );
    assert.equal(criterion?.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      14
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
