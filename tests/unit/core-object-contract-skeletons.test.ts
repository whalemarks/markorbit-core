import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_CONTRACT_TARGETS, CORE_DOMAIN_REGISTRY, CORE_MVP_OBJECT_BASE_RECORD_FIELDS, CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS, CORE_OBJECT_CONTRACT_SKELETONS, CORE_STUB_OBJECT_CONTRACT_SKELETONS, validateCoreObjectContractSkeletons } from '../../src/index.ts';

const requiredBaseFields = CORE_MVP_OBJECT_BASE_RECORD_FIELDS;
const excludedConcepts = ['execution-context', 'execution-runtime', 'artifact', 'render-job', 'publish-package', 'distillery-output', 'workplace-item', 'lite-record', 'markreg-case', 'product-screen', 'workflow-runtime-instance', 'task-runtime-instance', 'ai-agent-session'];

describe('CORE_OBJECT_CONTRACT_SKELETONS', () => {
  it('has exactly 26 entries', () => assert.equal(CORE_OBJECT_CONTRACT_SKELETONS.length, 26));
  it('validateCoreObjectContractSkeletons returns no errors', () => assert.deepEqual(validateCoreObjectContractSkeletons(CORE_OBJECT_CONTRACT_SKELETONS), []));
  it('all skeleton ids are unique', () => assert.equal(new Set(CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.id)).size, 26));
  it('all objectTypes are unique', () => assert.equal(new Set(CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.objectType)).size, 26));
  it('every domainId exists in CORE_DOMAIN_REGISTRY', () => {
    const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
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
      const baseFields = [...(contract.requiredBaseFields ?? []), ...(contract.optionalBaseFields ?? [])];
      for (const field of requiredBaseFields) assert.ok(baseFields.includes(field));
    }
  });
  it('canonicalizes exactly 18 Must Build Object skeletons', () => {
    assert.equal(CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS.length, 18);
    assert.deepEqual(
      CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS.map((entry) => entry.domainId),
      [
        'identity',
        'organization',
        'user',
        'permission',
        'policy',
        'customer',
        'brand',
        'trademark',
        'jurisdiction',
        'classification',
        'document',
        'evidence',
        'matter',
        'order',
        'workflow-contract',
        'task',
        'event',
        'communication'
      ]
    );
    assert.ok(
      CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS.every(
        (entry) =>
          entry.metadata?.implementationTask === 'CORE-TASK-035' &&
          entry.metadata.mvpRequirement === 'must_build_now'
      )
    );
  });
  it('retains the legacy CORE-TASK-021 Object targets by exact target identity', () => {
    const targets = CORE_DOMAIN_CONTRACT_TARGETS.filter((target) => target.implementationBatch === 'CORE-TASK-021' && target.layer === 'object');
    const byId = new Map<string, (typeof CORE_OBJECT_CONTRACT_SKELETONS)[number]>(
      CORE_OBJECT_CONTRACT_SKELETONS.map((entry) => [entry.id, entry])
    );
    assert.deepEqual(
      targets.map((target) => byId.get(target.targetContractId)?.id),
      targets.map((target) => target.targetContractId)
    );
    assert.deepEqual(
      targets.map((target) => byId.get(target.targetContractId)?.sourcePath),
      targets.map((target) => target.sourcePath)
    );
  });
  it('adds exactly the 8 safe CORE-TASK-023 Object stubs', () => {
    const additions = CORE_STUB_OBJECT_CONTRACT_SKELETONS;
    assert.equal(additions.length, 8);
    assert.deepEqual(additions.map((entry) => entry.domainId), [
      'knowledge',
      'opportunity',
      'notification',
      'partner',
      'agent',
      'service-provider',
      'service-network',
      'routing'
    ]);
    assert.ok(additions.every((entry) => entry.metadata?.implementationTask === 'CORE-TASK-023' && entry.metadata.mvpRequirement === 'stub_now'));
  });
});
