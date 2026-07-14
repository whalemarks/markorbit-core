import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-045 Opportunity Service contract metadata', () => {
  it('promotes partial Opportunity behavior without claiming CRM or production depth', () => {
    const opportunity = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'opportunity-service'
    );
    assert.equal(opportunity?.implementationDepth, 'validated_skeleton');
    assert.equal(opportunity?.metadata?.implementationTask, 'CORE-TASK-023');
    assert.equal(
      opportunity?.metadata?.behaviorImplementationTask,
      'CORE-TASK-045'
    );
    assert.equal(opportunity?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(
      opportunity?.metadata?.implementedOperations,
      CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS
    );
    assert.ok(
      opportunity?.nonGoals.some((entry) => entry.includes('Full CRM'))
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
