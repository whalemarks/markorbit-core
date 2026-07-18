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
      implemented
        .map((requirement) => requirement.id)
        .filter((id) => implementedServiceIds.includes(id)),
      implementedServiceIds
    );
    assert.ok(
      implemented.every(
        (requirement) => requirement.currentDepth === 'level_2_3'
      )
    );
  });

  it('reflects final Service acceptance after later Service batches', () => {
    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (entry) => entry.id === 'must-build-services-own-behavior'
    );
    assert.equal(criterion?.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      17
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
