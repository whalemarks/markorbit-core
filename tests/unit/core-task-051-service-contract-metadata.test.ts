import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-051 Organization Service contract metadata', () => {
  it('promotes Organization operating-context authority without claiming Identity, User, authorization, billing, authentication, or business-party ownership', () => {
    const organization = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'organization-service'
    );
    assert.equal(organization?.implementationDepth, 'validated_skeleton');
    assert.equal(organization?.metadata?.implementationTask, 'CORE-TASK-051');
    assert.equal(
      organization?.metadata?.behaviorImplementationTask,
      'CORE-TASK-051'
    );
    assert.equal(organization?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      organization?.metadata?.implementedOperations,
      CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS
    );
    assert.equal(
      organization?.sourcePath,
      'books/book-02-core-specification/core-specs/services/organization-service.md'
    );
    assert.ok(
      organization?.nonGoals.some((entry) => entry.includes('Permission grant'))
    );
    assert.ok(
      organization?.nonGoals.some((entry) => entry.includes('billing account'))
    );
    assert.ok(
      organization?.nonGoals.some((entry) => entry.includes('Customer record'))
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
