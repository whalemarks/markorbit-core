import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_POLICY_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-054 Policy Service contract metadata', () => {
  it('promotes contextual decisions without claiming Permission, authentication, approval execution, professional judgment, or legal-rule-engine ownership', () => {
    const policy = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'policy-evaluation-service'
    );
    assert.equal(policy?.implementationDepth, 'validated_skeleton');
    assert.equal(policy?.metadata?.implementationTask, 'CORE-TASK-054');
    assert.equal(policy?.metadata?.behaviorImplementationTask, 'CORE-TASK-054');
    assert.equal(policy?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      policy?.metadata?.implementedOperations,
      CORE_POLICY_IMPLEMENTED_OPERATIONS
    );
    assert.equal(
      policy?.sourcePath,
      'books/book-02-core-specification/core-specs/services/policy-service.md'
    );
    assert.ok(
      policy?.nonGoals.some((entry) =>
        entry.includes('Permission grant ownership')
      )
    );
    assert.ok(
      policy?.nonGoals.some((entry) => entry.includes('authentication'))
    );
    assert.ok(
      policy?.nonGoals.some((entry) => entry.includes('approval execution'))
    );
    assert.ok(
      policy?.nonGoals.some((entry) =>
        entry.includes('jurisdiction-specific legal rule engine')
      )
    );
    assert.ok(
      policy?.nonGoals.some((entry) =>
        entry.includes('autonomous AI policy override')
      )
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
