import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_PERMISSION_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-053 Permission Service contract metadata', () => {
  it('promotes governed explicit grants without claiming Identity, User, Organization, authentication, Policy, approval, or product authorization ownership', () => {
    const permission = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'permission-evaluation-service'
    );
    assert.equal(permission?.implementationDepth, 'validated_skeleton');
    assert.equal(permission?.metadata?.implementationTask, 'CORE-TASK-053');
    assert.equal(
      permission?.metadata?.behaviorImplementationTask,
      'CORE-TASK-053'
    );
    assert.equal(permission?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      permission?.metadata?.implementedOperations,
      CORE_PERMISSION_IMPLEMENTED_OPERATIONS
    );
    assert.equal(
      permission?.sourcePath,
      'books/book-02-core-specification/core-specs/services/permission-service.md'
    );
    assert.ok(
      permission?.nonGoals.some((entry) =>
        entry.includes('Identity, User, or Organization ownership')
      )
    );
    assert.ok(
      permission?.nonGoals.some((entry) =>
        entry.includes('credential authentication')
      )
    );
    assert.ok(
      permission?.nonGoals.some((entry) =>
        entry.includes('final Policy evaluation')
      )
    );
    assert.ok(
      permission?.nonGoals.some((entry) =>
        entry.includes('autonomous AI permission grant')
      )
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
