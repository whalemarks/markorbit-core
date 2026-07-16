import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_SERVICE_CONTRACT_SKELETONS,
  CORE_USER_IMPLEMENTED_OPERATIONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-052 User Service contract metadata', () => {
  it('promotes governed account-participant authority without claiming Identity, Organization, authorization, authentication, or business-contact ownership', () => {
    const user = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'user-service'
    );
    assert.equal(user?.implementationDepth, 'validated_skeleton');
    assert.equal(user?.metadata?.implementationTask, 'CORE-TASK-052');
    assert.equal(user?.metadata?.behaviorImplementationTask, 'CORE-TASK-052');
    assert.equal(user?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      user?.metadata?.implementedOperations,
      CORE_USER_IMPLEMENTED_OPERATIONS
    );
    assert.equal(
      user?.sourcePath,
      'books/book-02-core-specification/core-specs/services/user-service.md'
    );
    assert.ok(user?.nonGoals.some((entry) => entry.includes('Authentication')));
    assert.ok(
      user?.nonGoals.some((entry) => entry.includes('Permission grant'))
    );
    assert.ok(
      user?.nonGoals.some((entry) => entry.includes('Customer record'))
    );
    assert.ok(
      user?.nonGoals.some((entry) => entry.includes('Identity ownership'))
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
