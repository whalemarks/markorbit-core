import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';
describe('CORE-TASK-057C Book 02 API closure', () => {
  it('closes all API requirements and direct-emission acceptance', () => {
    const api = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (entry) => entry.layer === 'api' && entry.category === 'must_build_now'
    );
    assert.equal(api.length, 18);
    assert.equal(
      api.every((entry) => entry.currentDisposition === 'meets_required_depth'),
      true
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
        (entry) => entry.id === 'must-build-api-validators-exist'
      )?.satisfied,
      true
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
        (entry) => entry.id === 'api-layer-does-not-emit-events-directly'
      )?.satisfied,
      true
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
