import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_INDEX,
  CORE_CONTRACT_STATUSES,
  CORE_CONTRACT_TYPES,
  createCoreContractId
} from '../../src/index.ts';

const expectedTypes = ['domain', 'object', 'service', 'api', 'event', 'workflow', 'task', 'validation', 'permission', 'policy', 'ai_governance', 'common', 'test'];
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
  'trademark-filing-workflow',
  'trademark-application-workflow',
  'matter-lifecycle-workflow',
  'communication-runtime-workflow',
  'execution-runtime-workflow',
  'execution-context-workflow',
  'workflow-engine-runtime',
  'task-runtime-workflow',
  'event-bus-workflow',
  'artifact-render-workflow',
  'publish-automation-workflow',
  'distillery-runtime-workflow',
  'ai-agent-execution-workflow',
  'autonomous-agent-workflow',
  'workplace-workflow',
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
  'ai-agent-execution-api',
  'execution-runtime-permission',
  'execution-context-permission',
  'workflow-engine-permission',
  'task-runtime-permission',
  'event-bus-permission',
  'api-server-permission',
  'database-root-permission',
  'product-ui-permission',
  'artifact-render-permission',
  'publish-automation-permission',
  'distillery-runtime-permission',
  'ai-agent-approval-permission',
  'autonomous-agent-permission',
  'bypass-review-permission',
  'bypass-policy-permission',
  'execution-runtime-policy',
  'execution-context-policy',
  'workflow-engine-policy',
  'task-runtime-policy',
  'event-bus-policy',
  'api-server-policy',
  'database-root-policy',
  'product-ui-policy',
  'artifact-render-policy',
  'publish-automation-policy',
  'distillery-runtime-policy',
  'ai-agent-approval-policy',
  'autonomous-agent-policy',
  'bypass-review-policy',
  'bypass-permission-policy'
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

  it('CORE_CONTRACT_INDEX has exactly 157 entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.length, 157);
  });


  it('includes the original 6 foundation entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => !contract.source).length, 6);
  });

  it('includes exactly 26 domain contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_DOMAIN_CONTRACT_SKELETONS').length, 26);
  });

  it('includes exactly 19 object contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_OBJECT_CONTRACT_SKELETONS').length, 19);
  });

  it('includes exactly 19 service contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_SERVICE_CONTRACT_SKELETONS').length, 19);
  });



  it('includes exactly 26 API contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_API_CONTRACT_SKELETONS').length, 26);
  });



  it('includes exactly 12 event catalog entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_EVENT_CATALOG_SKELETONS').length, 12);
  });

  it('includes exactly 8 workflow catalog entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_WORKFLOW_CATALOG_SKELETONS').length, 8);
  });

  it('includes exactly 8 permission contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_PERMISSION_CONTRACT_SKELETONS').length, 8);
  });

  it('includes exactly 8 policy contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_POLICY_CONTRACT_SKELETONS').length, 8);
  });

  it('includes exactly 8 AI governance contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_AI_GOVERNANCE_CONTRACT_SKELETONS').length, 8);
  });

  it('includes exactly 10 Common Contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_COMMON_CONTRACT_SKELETONS').length, 10);
  });

  it('includes exactly 7 Test Contract entries', () => {
    assert.equal(CORE_CONTRACT_INDEX.filter((contract) => contract.source === 'CORE_TEST_CONTRACT_SKELETONS').length, 7);
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
