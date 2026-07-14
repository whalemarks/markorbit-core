import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_MATTER_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS
} from '../../src/index.ts';

describe('CORE-TASK-043B Matter Service contract metadata', () => {
  it('locks Matter behavior evidence to the implemented operation set', () => {
    const contract = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (entry) => entry.serviceType === 'matter-service'
    );
    assert.ok(contract);
    assert.equal(contract.metadata?.implementationTask, 'CORE-TASK-043');
    assert.equal(
      contract.metadata?.behaviorImplementationTask,
      'CORE-TASK-043B'
    );
    assert.equal(contract.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      contract.metadata?.implementedOperations,
      CORE_MATTER_IMPLEMENTED_OPERATIONS
    );
  });
});
