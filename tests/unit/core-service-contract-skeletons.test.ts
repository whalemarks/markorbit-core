import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_CONTRACT_TARGETS, CORE_DOMAIN_REGISTRY, CORE_SERVICE_CONTRACT_SKELETONS, EXCLUDED_CORE_SERVICE_CONCEPTS, validateCoreServiceContractSkeletons } from '../../src/index.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('CORE_SERVICE_CONTRACT_SKELETONS', () => {
  it('has exactly 27 entries', () => assert.equal(CORE_SERVICE_CONTRACT_SKELETONS.length, 27));
  it('validateCoreServiceContractSkeletons returns no errors', () => assert.deepEqual(validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS), []));
  it('all skeleton ids are unique', () => assert.equal(new Set(CORE_SERVICE_CONTRACT_SKELETONS.map((contract) => contract.id)).size, CORE_SERVICE_CONTRACT_SKELETONS.length));
  it('all serviceTypes are unique', () => assert.equal(new Set(CORE_SERVICE_CONTRACT_SKELETONS.map((contract) => contract.serviceType)).size, CORE_SERVICE_CONTRACT_SKELETONS.length));
  it('every domainId exists in CORE_DOMAIN_REGISTRY', () => assert.ok(CORE_SERVICE_CONTRACT_SKELETONS.every((contract) => domainIds.has(contract.domainId))));
  it('no excluded service concepts are present', () => {
    const serialized = JSON.stringify(CORE_SERVICE_CONTRACT_SKELETONS).toLowerCase();
    for (const concept of EXCLUDED_CORE_SERVICE_CONCEPTS) assert.equal(serialized.includes(concept), false);
  });
  it('each skeleton has non-empty purpose', () => assert.ok(CORE_SERVICE_CONTRACT_SKELETONS.every((contract) => contract.purpose.length > 0)));
  it('each skeleton has owns array', () => assert.ok(CORE_SERVICE_CONTRACT_SKELETONS.every((contract) => Array.isArray(contract.owns))));
  it('each skeleton has nonGoals array', () => assert.ok(CORE_SERVICE_CONTRACT_SKELETONS.every((contract) => Array.isArray(contract.nonGoals))));
  it('serviceType values are kebab-case', () => assert.ok(CORE_SERVICE_CONTRACT_SKELETONS.every((contract) => kebabCasePattern.test(contract.serviceType))));
  it('adds exactly the 9 locked CORE-TASK-021 Service targets', () => {
    const targets = CORE_DOMAIN_CONTRACT_TARGETS.filter((target) => target.implementationBatch === 'CORE-TASK-021' && target.layer === 'service');
    const additions = CORE_SERVICE_CONTRACT_SKELETONS.slice(10, 19);
    assert.deepEqual(additions.map((entry) => entry.id), targets.map((target) => target.targetContractId));
    assert.deepEqual(additions.map((entry) => entry.name), targets.map((target) => target.targetName));
    assert.deepEqual(additions.map((entry) => entry.sourcePath), targets.map((target) => target.sourcePath));
    assert.ok(additions.every((entry) => entry.metadata?.implementationTask === 'CORE-TASK-021'));
  });
  it('adds the CORE-TASK-038 Trademark Service contract at index 19', () => {
    const trademark = CORE_SERVICE_CONTRACT_SKELETONS[19];
    assert.equal(trademark?.id, 'core-service-trademark-service-contract');
    assert.equal(trademark?.metadata?.behaviorImplementationTask, 'CORE-TASK-038');
    assert.deepEqual(trademark?.metadata?.implementedOperations, [
      'createTrademark',
      'getTrademark',
      'listTrademarks',
      'validateTrademarkReference',
      'changeTrademarkStatus'
    ]);
  });
  it('adds exactly the 7 safe CORE-TASK-023 Service stubs', () => {
    const targets = CORE_DOMAIN_CONTRACT_TARGETS.filter((target) => target.implementationBatch === 'CORE-TASK-023' && target.layer === 'service');
    const additions = CORE_SERVICE_CONTRACT_SKELETONS.slice(20);
    assert.deepEqual(additions.map((entry) => entry.id), targets.map((target) => target.targetContractId));
    assert.deepEqual(additions.map((entry) => entry.name), targets.map((target) => target.targetName));
    assert.deepEqual(additions.map((entry) => entry.sourcePath), targets.map((target) => target.sourcePath));
    assert.ok(additions.every((entry) => entry.metadata?.implementationTask === 'CORE-TASK-023' && entry.metadata.mvpRequirement === 'stub_now'));
  });
});
