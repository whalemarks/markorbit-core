import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_API_CONTRACT_SKELETONS, CORE_DOMAIN_CONTRACT_TARGETS, CORE_DOMAIN_REGISTRY, EXCLUDED_CORE_API_CONCEPTS, validateCoreApiContractSkeletons } from '../../src/index.ts';

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));

describe('Core API Contract Skeletons', () => {
  it('has exactly 34 entries', () => {
    assert.equal(CORE_API_CONTRACT_SKELETONS.length, 34);
  });

  it('validates without errors', () => {
    assert.deepEqual(validateCoreApiContractSkeletons(CORE_API_CONTRACT_SKELETONS), []);
  });

  it('all skeleton ids are unique', () => {
    const ids = CORE_API_CONTRACT_SKELETONS.map((contract) => contract.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('all apiTypes are unique', () => {
    const apiTypes = CORE_API_CONTRACT_SKELETONS.map((contract) => contract.apiType);
    assert.equal(new Set(apiTypes).size, apiTypes.length);
  });

  it('any present domainId exists in CORE_DOMAIN_REGISTRY', () => {
    for (const contract of CORE_API_CONTRACT_SKELETONS) {
      if (contract.domainId !== undefined) assert.equal(domainIds.has(contract.domainId), true);
    }
  });

  it('no excluded API concepts are present', () => {
    const serialized = JSON.stringify(CORE_API_CONTRACT_SKELETONS).toLowerCase();
    for (const concept of EXCLUDED_CORE_API_CONCEPTS) assert.equal(serialized.includes(concept), false);
  });

  it('each skeleton has purpose, owns, and nonGoals', () => {
    for (const contract of CORE_API_CONTRACT_SKELETONS) {
      assert.equal(contract.purpose.length > 0, true);
      assert.equal(Array.isArray(contract.owns), true);
      assert.equal(Array.isArray(contract.nonGoals), true);
    }
  });

  it('apiType values are kebab-case', () => {
    for (const contract of CORE_API_CONTRACT_SKELETONS) assert.match(contract.apiType, kebabCasePattern);
  });
  it('adds exactly the 18 locked CORE-TASK-022 API targets', () => {
    const additions = CORE_API_CONTRACT_SKELETONS.slice(8, 26);
    const targets = CORE_DOMAIN_CONTRACT_TARGETS.filter(
      (target) => target.implementationBatch === 'CORE-TASK-022'
    );
    assert.equal(additions.length, 18);
    assert.deepEqual(
      additions.map((entry) => entry.id),
      targets.map((target) => target.targetContractId)
    );
    assert.deepEqual(
      additions.map((entry) => entry.name),
      targets.map((target) => target.targetName)
    );
    assert.deepEqual(
      additions.map((entry) => entry.sourcePath),
      targets.map((target) => target.sourcePath)
    );
    for (const entry of additions) {
      assert.equal(entry.implementationDepth, 'validated_skeleton');
      assert.equal(
        entry.metadata?.specificationRepository,
        'whalemarks/markorbit-publication'
      );
      assert.equal(
        entry.metadata?.specificationCommit,
        '3349ecb8955021a8714d023348f8b24f941eb98f'
      );
      assert.equal(entry.metadata?.implementationTask, 'CORE-TASK-022');
    }
  });

  it('adds exactly the 8 safe CORE-TASK-023 API stubs', () => {
    const additions = CORE_API_CONTRACT_SKELETONS.slice(26);
    const targets = CORE_DOMAIN_CONTRACT_TARGETS.filter(
      (target) => target.implementationBatch === 'CORE-TASK-023' && target.layer === 'api'
    );
    assert.deepEqual(additions.map((entry) => entry.id), targets.map((target) => target.targetContractId));
    assert.deepEqual(additions.map((entry) => entry.name), targets.map((target) => target.targetName));
    assert.deepEqual(additions.map((entry) => entry.sourcePath), targets.map((target) => target.sourcePath));
    assert.ok(additions.every((entry) => entry.metadata?.implementationTask === 'CORE-TASK-023' && entry.metadata.mvpRequirement === 'stub_now'));
  });

});
