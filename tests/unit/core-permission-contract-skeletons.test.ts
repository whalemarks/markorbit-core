import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_PERMISSION_CONTRACT_SKELETONS, EXCLUDED_CORE_PERMISSION_CONCEPTS, validateCorePermissionContractSkeletons } from '../../src/index.ts';

const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('Core Permission Contract Skeletons', () => {
  it('has exactly 8 entries', () => {
    assert.equal(CORE_PERMISSION_CONTRACT_SKELETONS.length, 8);
  });

  it('validateCorePermissionContractSkeletons returns no errors', () => {
    assert.deepEqual(validateCorePermissionContractSkeletons(CORE_PERMISSION_CONTRACT_SKELETONS), []);
  });

  it('all skeleton ids are unique', () => {
    const ids = CORE_PERMISSION_CONTRACT_SKELETONS.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('all permissionTypes are unique', () => {
    const permissionTypes = CORE_PERMISSION_CONTRACT_SKELETONS.map((entry) => entry.permissionType);
    assert.equal(new Set(permissionTypes).size, permissionTypes.length);
  });

  it('every domainId exists in CORE_DOMAIN_REGISTRY', () => {
    assert.ok(CORE_PERMISSION_CONTRACT_SKELETONS.every((entry) => domainIds.has(entry.domainId)));
  });

  it('no excluded permission concepts are present', () => {
    const serialized = JSON.stringify(CORE_PERMISSION_CONTRACT_SKELETONS).toLowerCase();
    for (const concept of EXCLUDED_CORE_PERMISSION_CONCEPTS) assert.equal(serialized.includes(concept), false);
  });

  it('each skeleton has non-empty purpose', () => {
    assert.ok(CORE_PERMISSION_CONTRACT_SKELETONS.every((entry) => entry.purpose.trim().length > 0));
  });

  it('each skeleton has owns array', () => {
    assert.ok(CORE_PERMISSION_CONTRACT_SKELETONS.every((entry) => Array.isArray(entry.owns)));
  });

  it('each skeleton has nonGoals array', () => {
    assert.ok(CORE_PERMISSION_CONTRACT_SKELETONS.every((entry) => Array.isArray(entry.nonGoals)));
  });

  it('permissionType values are kebab-case', () => {
    assert.ok(CORE_PERMISSION_CONTRACT_SKELETONS.every((entry) => kebabCasePattern.test(entry.permissionType)));
  });
});
