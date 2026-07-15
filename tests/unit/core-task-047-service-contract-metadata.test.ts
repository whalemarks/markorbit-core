import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_SERVICE_CONTRACT_SKELETONS,
  CORE_TASK_IMPLEMENTED_OPERATIONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-047 Task Service contract metadata', () => {
  it('promotes Task Service behavior without claiming project-management runtime', () => {
    const task = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'task-service'
    );
    assert.equal(task?.implementationDepth, 'validated_skeleton');
    assert.equal(task?.metadata?.implementationTask, 'CORE-TASK-047');
    assert.equal(task?.metadata?.behaviorImplementationTask, 'CORE-TASK-047');
    assert.equal(task?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      task?.metadata?.implementedOperations,
      CORE_TASK_IMPLEMENTED_OPERATIONS
    );
    assert.ok(
      task?.nonGoals.some((entry) => entry.includes('scheduling engine'))
    );
    assert.ok(task?.nonGoals.some((entry) => entry.includes('time tracking')));
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
