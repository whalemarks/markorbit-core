import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-049 Communication Service contract metadata', () => {
  it('promotes governed communication behavior without claiming external delivery', () => {
    const communication = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'communication-reference-service'
    );
    assert.equal(communication?.implementationDepth, 'validated_skeleton');
    assert.equal(communication?.metadata?.implementationTask, 'CORE-TASK-049');
    assert.equal(
      communication?.metadata?.behaviorImplementationTask,
      'CORE-TASK-049'
    );
    assert.equal(communication?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      communication?.metadata?.implementedOperations,
      CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS
    );
    assert.equal(
      communication?.sourcePath,
      'books/book-02-core-specification/core-specs/services/communication-service.md'
    );
    assert.ok(
      communication?.nonGoals.some((entry) =>
        entry.includes('External email or chat gateway delivery')
      )
    );
    assert.ok(
      communication?.nonGoals.some((entry) =>
        entry.includes('automatic Document conversion')
      )
    );
    assert.ok(
      communication?.nonGoals.some((entry) =>
        entry.includes('autonomous AI sending')
      )
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
