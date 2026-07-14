import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_ORDER_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-044 Order Service contract metadata', () => {
  it('promotes Order Service behavior without overclaiming production depth', () => {
    const order = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'order-service'
    );
    assert.equal(order?.implementationDepth, 'validated_skeleton');
    assert.equal(order?.metadata?.implementationTask, 'CORE-TASK-044');
    assert.equal(order?.metadata?.behaviorImplementationTask, 'CORE-TASK-044');
    assert.equal(order?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      order?.metadata?.implementedOperations,
      CORE_ORDER_IMPLEMENTED_OPERATIONS
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
