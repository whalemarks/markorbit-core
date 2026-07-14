import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/index.ts';

describe('CORE-TASK-038 Trademark Service contract metadata', () => {
  it('locks the canonical behavior metadata without changing the reference-only contract', () => {
    const trademark = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (entry) => entry.id === 'core-service-trademark-service-contract'
    );
    assert.equal(trademark?.serviceType, 'trademark-service');
    assert.equal(trademark?.domainId, 'trademark');
    assert.equal(
      trademark?.metadata?.behaviorImplementationTask,
      'CORE-TASK-038'
    );
    assert.equal(trademark?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(trademark?.metadata?.implementedOperations, [
      'createTrademark',
      'getTrademark',
      'listTrademarks',
      'validateTrademarkReference',
      'changeTrademarkStatus'
    ]);
    const referenceOnly = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (entry) =>
        entry.id === 'core-service-trademark-reference-service-contract'
    );
    assert.equal(
      referenceOnly?.metadata?.behaviorImplementationTask,
      undefined
    );
  });
});
