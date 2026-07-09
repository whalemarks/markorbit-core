import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_OBJECT_CONTRACT_SKELETONS, validateCoreObjectContractSkeletons } from '../../src/index.ts';

const requiredBaseFields = ['id', 'type', 'domainId', 'status', 'version', 'metadata'];
const excludedConcepts = ['execution-context', 'execution-runtime', 'artifact', 'render-job', 'publish-package', 'distillery-output', 'workplace-item', 'lite-record', 'markreg-case', 'product-screen', 'workflow-runtime-instance', 'task-runtime-instance', 'ai-agent-session'];

describe('CORE_OBJECT_CONTRACT_SKELETONS', () => {
  it('has exactly 12 entries', () => assert.equal(CORE_OBJECT_CONTRACT_SKELETONS.length, 12));
  it('validateCoreObjectContractSkeletons returns no errors', () => assert.deepEqual(validateCoreObjectContractSkeletons(CORE_OBJECT_CONTRACT_SKELETONS), []));
  it('all skeleton ids are unique', () => assert.equal(new Set(CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.id)).size, 12));
  it('all objectTypes are unique', () => assert.equal(new Set(CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.objectType)).size, 12));
  it('every domainId exists in CORE_DOMAIN_REGISTRY', () => {
    const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
    assert.ok(CORE_OBJECT_CONTRACT_SKELETONS.every((contract) => domainIds.has(contract.domainId)));
  });
  it('no excluded object concepts are present', () => {
    const serialized = JSON.stringify(CORE_OBJECT_CONTRACT_SKELETONS).toLowerCase();
    for (const concept of excludedConcepts) assert.equal(serialized.includes(concept), false);
  });
  it('each skeleton has non-empty purpose, owns, nonGoals, and required base fields', () => {
    for (const contract of CORE_OBJECT_CONTRACT_SKELETONS) {
      assert.ok(contract.purpose.length > 0);
      assert.ok(Array.isArray(contract.owns));
      assert.ok(Array.isArray(contract.nonGoals));
      for (const field of requiredBaseFields) assert.ok(contract.requiredBaseFields.includes(field));
    }
  });
});
