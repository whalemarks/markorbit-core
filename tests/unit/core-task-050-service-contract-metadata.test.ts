import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_IDENTITY_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-050 Identity Service contract metadata', () => {
  it('promotes Identity authority without claiming authentication or authorization', () => {
    const identity = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'identity-resolution-service'
    );
    assert.equal(identity?.implementationDepth, 'validated_skeleton');
    assert.equal(identity?.metadata?.implementationTask, 'CORE-TASK-050');
    assert.equal(
      identity?.metadata?.behaviorImplementationTask,
      'CORE-TASK-050'
    );
    assert.equal(identity?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      identity?.metadata?.implementedOperations,
      CORE_IDENTITY_IMPLEMENTED_OPERATIONS
    );
    assert.equal(
      identity?.sourcePath,
      'books/book-02-core-specification/core-specs/services/identity-service.md'
    );
    assert.ok(
      identity?.nonGoals.some((entry) =>
        entry.includes('Authentication provider')
      )
    );
    assert.ok(
      identity?.nonGoals.some((entry) => entry.includes('Permission grant'))
    );
    assert.ok(
      identity?.nonGoals.some((entry) =>
        entry.includes('Organization membership')
      )
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
