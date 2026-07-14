import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/index.ts';

describe('CORE-TASK-039 Jurisdiction Service contract metadata', () => {
  it('locks the promoted canonical behavior metadata', () => {
    const jurisdiction = CORE_SERVICE_CONTRACT_SKELETONS[5];
    assert.equal(
      jurisdiction?.id,
      'core-service-jurisdiction-service-contract'
    );
    assert.equal(jurisdiction?.serviceType, 'jurisdiction-service');
    assert.equal(jurisdiction?.domainId, 'jurisdiction');
    assert.equal(jurisdiction?.metadata?.implementationTask, 'CORE-TASK-039');
    assert.equal(
      jurisdiction?.metadata?.behaviorImplementationTask,
      'CORE-TASK-039'
    );
    assert.equal(jurisdiction?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(jurisdiction?.metadata?.implementedOperations, [
      'createJurisdiction',
      'getJurisdiction',
      'listJurisdictions',
      'validateJurisdictionReference',
      'resolveJurisdictionByCode',
      'changeJurisdictionStatus'
    ]);
    assert.equal(
      CORE_SERVICE_CONTRACT_SKELETONS.some(
        (entry) =>
          entry.id === 'core-service-jurisdiction-reference-service-contract'
      ),
      false
    );
  });
});
