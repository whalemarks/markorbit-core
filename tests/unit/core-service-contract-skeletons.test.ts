import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_SERVICE_CONTRACT_SKELETONS, EXCLUDED_CORE_SERVICE_CONCEPTS, validateCoreServiceContractSkeletons } from '../../src/index.ts';

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));

describe('Core Service Contract Skeletons', () => {
  it('has exactly 10 entries', () => assert.equal(CORE_SERVICE_CONTRACT_SKELETONS.length, 10));
  it('validator returns no errors', () => assert.deepEqual(validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS), []));
  it('all skeleton ids are unique', () => assert.equal(new Set(CORE_SERVICE_CONTRACT_SKELETONS.map((s) => s.id)).size, 10));
  it('all serviceTypes are unique', () => assert.equal(new Set(CORE_SERVICE_CONTRACT_SKELETONS.map((s) => s.serviceType)).size, 10));
  it('every domainId exists in CORE_DOMAIN_REGISTRY', () => CORE_SERVICE_CONTRACT_SKELETONS.forEach((s) => assert.equal(domainIds.has(s.domainId), true)));
  it('no excluded service concepts are present', () => {
    const payload = JSON.stringify(CORE_SERVICE_CONTRACT_SKELETONS);
    EXCLUDED_CORE_SERVICE_CONCEPTS.forEach((concept) => assert.equal(payload.includes(concept), false));
  });
  it('each skeleton has non-empty purpose', () => CORE_SERVICE_CONTRACT_SKELETONS.forEach((s) => assert.equal(s.purpose.length > 0, true)));
  it('each skeleton has owns array', () => CORE_SERVICE_CONTRACT_SKELETONS.forEach((s) => assert.equal(Array.isArray(s.owns), true)));
  it('each skeleton has nonGoals array', () => CORE_SERVICE_CONTRACT_SKELETONS.forEach((s) => assert.equal(Array.isArray(s.nonGoals), true)));
  it('serviceType values are kebab-case', () => CORE_SERVICE_CONTRACT_SKELETONS.forEach((s) => assert.match(s.serviceType, kebabCasePattern)));
});
