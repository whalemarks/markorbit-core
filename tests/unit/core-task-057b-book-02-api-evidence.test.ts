import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';
const ids = [
  'must-api-customer-api-contract',
  'must-api-brand-api-contract',
  'must-api-trademark-api-contract',
  'must-api-jurisdiction-api-contract',
  'must-api-classification-api-contract',
  'must-api-document-api-contract',
  'must-api-evidence-api-contract'
];
describe('CORE-TASK-057B Book 02 API evidence', () => {
  it('promotes seven APIs as part of completed all-API coverage', () => {
    const requirements = ids.map((id) =>
      BOOK_02_MVP_GAP_BASELINE.requirements.find((entry) => entry.id === id)
    );
    assert.equal(
      requirements.every(
        (entry) => entry?.currentDisposition === 'meets_required_depth'
      ),
      true
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow.meets_required_depth,
      86
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow.validated_skeleton_only,
      21
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
