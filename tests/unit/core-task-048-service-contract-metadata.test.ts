import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_SERVICE_CONTRACT_SKELETONS,
  CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-048 Workflow Contract Service contract metadata', () => {
  it('promotes governed execution-structure behavior without claiming workflow runtime', () => {
    const workflow = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'workflow-contract-service'
    );
    assert.equal(workflow?.implementationDepth, 'validated_skeleton');
    assert.equal(workflow?.metadata?.implementationTask, 'CORE-TASK-048');
    assert.equal(
      workflow?.metadata?.behaviorImplementationTask,
      'CORE-TASK-048'
    );
    assert.equal(workflow?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      workflow?.metadata?.implementedOperations,
      CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS
    );
    assert.ok(
      workflow?.nonGoals.some((entry) => entry.includes('running instances'))
    );
    assert.ok(
      workflow?.nonGoals.some((entry) =>
        entry.includes('automatic transition execution')
      )
    );
    assert.ok(
      workflow?.nonGoals.some((entry) => entry.includes('task creation'))
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
