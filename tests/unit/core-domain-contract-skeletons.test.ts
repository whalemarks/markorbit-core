import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_CONTRACT_SKELETONS, CORE_DOMAIN_REGISTRY, validateCoreDomainContractSkeletons } from '../../src/index.ts';

const excluded = ['capability', 'business-responsibility', 'artifact', 'render', 'publish', 'distillery', 'execution-context', 'execution-runtime', 'workplace', 'lite', 'markreg', 'product', 'integration'];

describe('Core Domain Contract Skeletons', () => {
  it('has exactly 26 entries', () => assert.equal(CORE_DOMAIN_CONTRACT_SKELETONS.length, 26));
  it('validates without errors', () => assert.deepEqual(validateCoreDomainContractSkeletons(CORE_DOMAIN_CONTRACT_SKELETONS), []));
  it('all skeleton ids are unique', () => {
    const ids = CORE_DOMAIN_CONTRACT_SKELETONS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });
  it('all domainIds are unique', () => {
    const ids = CORE_DOMAIN_CONTRACT_SKELETONS.map((c) => c.domainId);
    assert.equal(new Set(ids).size, ids.length);
  });
  it('every CORE_DOMAIN_REGISTRY domain has one skeleton', () => {
    assert.deepEqual(CORE_DOMAIN_CONTRACT_SKELETONS.map((c) => c.domainId), CORE_DOMAIN_REGISTRY.map((d) => d.id));
  });
  it('no excluded concepts are present', () => {
    const ids = CORE_DOMAIN_CONTRACT_SKELETONS.map((c) => c.domainId);
    for (const id of excluded) assert.equal(ids.includes(id), false);
  });
  it('each skeleton has non-empty purpose, owns array, and nonGoals array', () => {
    for (const c of CORE_DOMAIN_CONTRACT_SKELETONS) {
      assert.equal(c.purpose.length > 0, true);
      assert.equal(Array.isArray(c.owns), true);
      assert.equal(Array.isArray(c.nonGoals), true);
    }
  });
});
