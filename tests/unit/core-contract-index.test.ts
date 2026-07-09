import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_INDEX,
  CORE_CONTRACT_STATUSES,
  CORE_CONTRACT_TYPES,
  createCoreContractId
} from '../../src/index.ts';

const expectedTypes = ['domain', 'object', 'service', 'api', 'event', 'workflow', 'task', 'validation', 'permission', 'policy', 'ai_governance'];
const expectedStatuses = ['draft', 'active', 'deprecated', 'archived'];
const forbiddenContractIds = [
  'trademark-application',
  'trademark-record',
  'matter-lifecycle',
  'communication-runtime',
  'execution-context',
  'execution-runtime',
  'artifact',
  'render',
  'publish',
  'distillery',
  'workplace'
];

describe('Core Contract Index', () => {
  it('createCoreContractId accepts valid kebab-case ids', () => {
    assert.equal(createCoreContractId('core-domain-registry-contract'), 'core-domain-registry-contract');
  });

  it('createCoreContractId rejects empty values', () => {
    assert.throws(() => createCoreContractId(''));
  });

  it('createCoreContractId rejects values with spaces', () => {
    assert.throws(() => createCoreContractId('core contract'));
  });

  it('createCoreContractId rejects non-kebab-case values', () => {
    assert.throws(() => createCoreContractId('CoreContract'));
    assert.throws(() => createCoreContractId('core_contract'));
  });

  it('CoreContractType contains exactly the required contract types', () => {
    assert.deepEqual(Object.values(CORE_CONTRACT_TYPES), expectedTypes);
  });

  it('CoreContractStatus contains exactly draft, active, deprecated, archived', () => {
    assert.deepEqual(Object.values(CORE_CONTRACT_STATUSES), expectedStatuses);
  });

  it('CORE_CONTRACT_INDEX has exactly 6 entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.length, 6);
  });

  it('all ids are unique', () => {
    const ids = CORE_CONTRACT_INDEX.map((contract) => contract.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('all names are unique', () => {
    const names = CORE_CONTRACT_INDEX.map((contract) => contract.name);
    assert.equal(new Set(names).size, names.length);
  });

  it('no concrete business contract ids are present', () => {
    const ids = CORE_CONTRACT_INDEX.map((contract) => contract.id);
    for (const forbiddenId of forbiddenContractIds) {
      assert.equal(ids.includes(forbiddenId), false);
    }
  });
});
