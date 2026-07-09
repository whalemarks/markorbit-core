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
  'event-bus-created',
  'event-stream-appended',
  'event-sourced-aggregate-updated',
  'execution-runtime-started',
  'execution-context-created',
  'workflow-runtime-advanced',
  'task-runtime-completed',
  'ai-agent-emitted-event',
  'autonomous-agent-approved',
  'product-ui-event',
  'artifact-rendered',
  'publish-automated',
  'distillery-output-published',
  'trademark-application',
    'matter-lifecycle',
  'communication-runtime',
  'execution-context',
  'execution-runtime',
  'artifact',
  'render',
  'publish',
  'distillery',
  'workplace',
  'workflow-runtime-instance',
  'task-runtime-instance',
  'ai-agent-session',
  'event-bus-service',
  'workflow-engine-service',
  'api-server-service',
  'database-service',
  'autonomous-agent-service',
  'trademark-filing-api',
  'execution-runtime-api',
  'workflow-engine-api',
  'event-bus-api',
  'product-ui-api',
  'artifact-render-api',
  'publish-automation-api',
  'ai-agent-execution-api'
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

  it('CORE_CONTRACT_INDEX has exactly 74 entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.length, 74);
  });


  it('includes the original 6 foundation entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => !contract.source).length, 6);
  });

  it('includes exactly 26 domain contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_DOMAIN_CONTRACT_SKELETONS').length, 26);
  });

  it('includes exactly 12 object contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_OBJECT_CONTRACT_SKELETONS').length, 12);
  });

  it('includes exactly 10 service contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_SERVICE_CONTRACT_SKELETONS').length, 10);
  });



  it('includes exactly 8 API contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_API_CONTRACT_SKELETONS').length, 8);
  });



  it('includes exactly 12 event catalog entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_EVENT_CATALOG_SKELETONS').length, 12);
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
