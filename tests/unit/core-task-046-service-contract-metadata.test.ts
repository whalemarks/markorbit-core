import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_EVENT_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-046 Event Service contract metadata', () => {
  it('promotes Event Service behavior without claiming event-bus runtime', () => {
    const event = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'event-service'
    );
    assert.equal(event?.implementationDepth, 'validated_skeleton');
    assert.equal(event?.metadata?.implementationTask, 'CORE-TASK-046');
    assert.equal(event?.metadata?.behaviorImplementationTask, 'CORE-TASK-046');
    assert.equal(event?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      event?.metadata?.implementedOperations,
      CORE_EVENT_IMPLEMENTED_OPERATIONS
    );
    assert.ok(
      event?.nonGoals.some((entry) => entry.toLowerCase().includes('event bus'))
    );
    assert.ok(
      event?.nonGoals.some((entry) => entry.includes('event sourcing'))
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
