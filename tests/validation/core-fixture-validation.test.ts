import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  validateCoreDomainRegistryFixture,
  validateCoreDomainContractSkeletonsFixture,
  validateCoreObjectContractSkeletonsFixture,
  validateCoreServiceContractSkeletonsFixture,
  validateCoreApiContractSkeletonsFixture,
  validateCoreEventBaseFixture,
  validateCoreObjectBaseFixture,
  validateCoreTaskBaseFixture,
  validateCoreWorkflowContractBaseFixture,
  validateCoreEventCatalogSkeletonsFixture,
  validateCoreWorkflowCatalogSkeletonsFixture,
  validateCorePermissionContractSkeletonsFixture,
  validateCorePolicyContractSkeletonsFixture,
  validateCoreAiGovernanceContractSkeletonsFixture,
  validateCoreCommonContractSkeletonsFixture,
  validateCoreTestContractSkeletonsFixture,
  validateCoreContractCoverageBaselineFixture,
  validateCoreContractGapInventoryFixture
} from '../../src/index.ts';

const readFixture = async (path: string): Promise<unknown> => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));

describe('core fixture validation', () => {
  it('returns ok true for existing fixtures', async () => {
    assert.equal(validateCoreDomainRegistryFixture(await readFixture('fixtures/domains/core-domain-registry.fixture.json')).ok, true);
    assert.equal(validateCoreObjectBaseFixture(await readFixture('fixtures/objects/core-object-base.fixture.json')).ok, true);
    assert.equal(validateCoreEventBaseFixture(await readFixture('fixtures/events/core-event-base.fixture.json')).ok, true);
    assert.equal(validateCoreTaskBaseFixture(await readFixture('fixtures/tasks/core-task-base.fixture.json')).ok, true);
    assert.equal(validateCoreWorkflowContractBaseFixture(await readFixture('fixtures/workflows/core-workflow-contract-base.fixture.json')).ok, true);
    assert.equal(validateCoreDomainContractSkeletonsFixture(await readFixture('fixtures/contracts/core-domain-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreObjectContractSkeletonsFixture(await readFixture('fixtures/contracts/core-object-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreServiceContractSkeletonsFixture(await readFixture('fixtures/contracts/core-service-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreApiContractSkeletonsFixture(await readFixture('fixtures/contracts/core-api-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreEventCatalogSkeletonsFixture(await readFixture('fixtures/contracts/core-event-catalog-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture(await readFixture('fixtures/contracts/core-workflow-catalog-skeletons.fixture.json')).ok, true);
    assert.equal(validateCorePermissionContractSkeletonsFixture(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCorePolicyContractSkeletonsFixture(await readFixture('fixtures/contracts/core-policy-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreAiGovernanceContractSkeletonsFixture(await readFixture('fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreCommonContractSkeletonsFixture(await readFixture('fixtures/contracts/core-common-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreTestContractSkeletonsFixture(await readFixture('fixtures/contracts/core-test-contract-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreContractCoverageBaselineFixture(await readFixture('fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json')).ok, true);
    assert.equal(validateCoreContractGapInventoryFixture(await readFixture('fixtures/contract-coverage/core-contract-gap-inventory.fixture.json')).ok, true);
  });

  it('each validator returns ok false for invalid non-array input', () => {
    for (const validator of [
      validateCoreDomainRegistryFixture,
      validateCoreDomainContractSkeletonsFixture,
      validateCoreObjectContractSkeletonsFixture,
      validateCoreServiceContractSkeletonsFixture,
  validateCoreApiContractSkeletonsFixture,
      validateCoreObjectBaseFixture,
      validateCoreEventBaseFixture,
      validateCoreTaskBaseFixture,
      validateCoreWorkflowContractBaseFixture,
      validateCoreEventCatalogSkeletonsFixture,
      validateCoreWorkflowCatalogSkeletonsFixture,
      validateCorePermissionContractSkeletonsFixture,
      validateCorePolicyContractSkeletonsFixture,
      validateCoreAiGovernanceContractSkeletonsFixture,
      validateCoreCommonContractSkeletonsFixture,
      validateCoreTestContractSkeletonsFixture
    ]) {
      assert.equal(validator({}).ok, false);
    }
  });

  it('domain skeleton validator rejects missing domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-domain-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].domainId;
    assert.equal(validateCoreDomainContractSkeletonsFixture(fixture).ok, false);
  });

  it('domain skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-domain-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCoreDomainContractSkeletonsFixture(fixture).ok, false);
  });

  it('domain skeleton validator rejects duplicate domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-domain-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].domainId = fixture[0].domainId;
    assert.equal(validateCoreDomainContractSkeletonsFixture(fixture).ok, false);
  });


  it('object skeleton validator rejects missing objectType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-object-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].objectType;
    assert.equal(validateCoreObjectContractSkeletonsFixture(fixture).ok, false);
  });

  it('object skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-object-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCoreObjectContractSkeletonsFixture(fixture).ok, false);
  });

  it('object skeleton validator rejects duplicate objectType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-object-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].objectType = fixture[0].objectType;
    assert.equal(validateCoreObjectContractSkeletonsFixture(fixture).ok, false);
  });

  it('object skeleton validator rejects changed canonical source path', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-object-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[12].sourcePath = 'wrong.md';
    assert.equal(validateCoreObjectContractSkeletonsFixture(fixture).ok, false);
  });



  it('service skeleton validator rejects missing serviceType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-service-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].serviceType;
    assert.equal(validateCoreServiceContractSkeletonsFixture(fixture).ok, false);
  });

  it('service skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-service-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCoreServiceContractSkeletonsFixture(fixture).ok, false);
  });

  it('service skeleton validator rejects duplicate serviceType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-service-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].serviceType = fixture[0].serviceType;
    assert.equal(validateCoreServiceContractSkeletonsFixture(fixture).ok, false);
  });

  it('service skeleton validator rejects changed canonical source commit', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-service-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    const metadata = fixture[10].metadata as Record<string, unknown>;
    metadata.specificationCommit = 'wrong';
    assert.equal(validateCoreServiceContractSkeletonsFixture(fixture).ok, false);
  });



  it('api skeleton validator rejects missing apiType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-api-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].apiType;
    assert.equal(validateCoreApiContractSkeletonsFixture(fixture).ok, false);
  });

  it('api skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-api-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCoreApiContractSkeletonsFixture(fixture).ok, false);
  });

  it('api skeleton validator rejects duplicate apiType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-api-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].apiType = fixture[0].apiType;
    assert.equal(validateCoreApiContractSkeletonsFixture(fixture).ok, false);
  });

  it('api skeleton validator rejects changed canonical source path', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-api-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[8].sourcePath = 'wrong.md';
    assert.equal(validateCoreApiContractSkeletonsFixture(fixture).ok, false);
  });

  it('object validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/objects/core-object-base.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCoreObjectBaseFixture(fixture).ok, false);
  });

  it('event validator rejects invalid event shape', async () => {
    const fixture = structuredClone(await readFixture('fixtures/events/core-event-base.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].id;
    assert.equal(validateCoreEventBaseFixture(fixture).ok, false);
  });

  it('task validator rejects invalid task shape', async () => {
    const fixture = structuredClone(await readFixture('fixtures/tasks/core-task-base.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].title;
    assert.equal(validateCoreTaskBaseFixture(fixture).ok, false);
  });

  it('workflow validator rejects invalid workflow contract shape', async () => {
    const fixture = structuredClone(await readFixture('fixtures/workflows/core-workflow-contract-base.fixture.json')) as Record<string, unknown>[];
    fixture[0].steps = [];
    assert.equal(validateCoreWorkflowContractBaseFixture(fixture).ok, false);
  });


  it('event catalog skeleton validator returns ok true for existing fixture', async () => {
    assert.equal(validateCoreEventCatalogSkeletonsFixture(await readFixture('fixtures/contracts/core-event-catalog-skeletons.fixture.json')).ok, true);
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture(await readFixture('fixtures/contracts/core-workflow-catalog-skeletons.fixture.json')).ok, true);
    assert.equal(validateCorePermissionContractSkeletonsFixture(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')).ok, true);
  });

  it('event catalog skeleton validator rejects invalid non-array input', () => {
    assert.equal(validateCoreEventCatalogSkeletonsFixture({}).ok, false);
  });

  it('event catalog skeleton validator rejects missing eventType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-event-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].eventType;
    assert.equal(validateCoreEventCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('event catalog skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-event-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCoreEventCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('event catalog skeleton validator rejects duplicate eventType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-event-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].eventType = fixture[0].eventType;
    assert.equal(validateCoreEventCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('event catalog skeleton validator rejects concrete payload schema keywords', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-event-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].payloadShape = ['jsonSchema properties required'];
    assert.equal(validateCoreEventCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('workflow catalog skeleton validator returns ok true for existing fixture', async () => {
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture(await readFixture('fixtures/contracts/core-workflow-catalog-skeletons.fixture.json')).ok, true);
    assert.equal(validateCorePermissionContractSkeletonsFixture(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')).ok, true);
  });

  it('workflow catalog skeleton validator rejects invalid non-array input', () => {
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture({}).ok, false);
  });

  it('workflow catalog skeleton validator rejects missing workflowType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-workflow-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].workflowType;
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('workflow catalog skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-workflow-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('workflow catalog skeleton validator rejects duplicate workflowType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-workflow-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].workflowType = fixture[0].workflowType;
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('workflow catalog skeleton validator rejects executable workflow/runtime keywords', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-workflow-catalog-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].stepTypes = ['transitionFunction runtimeState'];
    assert.equal(validateCoreWorkflowCatalogSkeletonsFixture(fixture).ok, false);
  });

  it('permission skeleton validator returns ok true for existing fixture', async () => {
    assert.equal(validateCorePermissionContractSkeletonsFixture(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')).ok, true);
  });

  it('permission skeleton validator rejects invalid non-array input', () => {
    assert.equal(validateCorePermissionContractSkeletonsFixture({}).ok, false);
  });

  it('permission skeleton validator rejects missing permissionType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].permissionType;
    assert.equal(validateCorePermissionContractSkeletonsFixture(fixture).ok, false);
  });

  it('permission skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCorePermissionContractSkeletonsFixture(fixture).ok, false);
  });

  it('permission skeleton validator rejects duplicate permissionType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].permissionType = fixture[0].permissionType;
    assert.equal(validateCorePermissionContractSkeletonsFixture(fixture).ok, false);
  });

  it('permission skeleton validator rejects bypass/runtime/engine/autonomous-agent permission keywords', async () => {
    for (const keyword of ['bypass-review-permission', 'execution-runtime-permission', 'workflow-engine-permission', 'autonomous-agent-permission']) {
      const fixture = structuredClone(await readFixture('fixtures/contracts/core-permission-contract-skeletons.fixture.json')) as Record<string, unknown>[];
      fixture[0].permissionType = keyword;
      assert.equal(validateCorePermissionContractSkeletonsFixture(fixture).ok, false);
    }
  });


  it('policy skeleton validator returns ok true for existing fixture', async () => {
    assert.equal(validateCorePolicyContractSkeletonsFixture(await readFixture('fixtures/contracts/core-policy-contract-skeletons.fixture.json')).ok, true);
  });

  it('policy skeleton validator rejects invalid non-array input', () => {
    assert.equal(validateCorePolicyContractSkeletonsFixture({}).ok, false);
  });

  it('policy skeleton validator rejects missing policyType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-policy-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].policyType;
    assert.equal(validateCorePolicyContractSkeletonsFixture(fixture).ok, false);
  });

  it('policy skeleton validator rejects unknown domainId', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-policy-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'unknown-domain';
    assert.equal(validateCorePolicyContractSkeletonsFixture(fixture).ok, false);
  });

  it('policy skeleton validator rejects duplicate policyType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-policy-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[1].policyType = fixture[0].policyType;
    assert.equal(validateCorePolicyContractSkeletonsFixture(fixture).ok, false);
  });

  it('policy skeleton validator rejects bypass/runtime/engine/autonomous-agent policy keywords', async () => {
    for (const keyword of ['bypass-review-policy', 'execution-runtime-policy', 'workflow-engine-policy', 'autonomous-agent-policy']) {
      const fixture = structuredClone(await readFixture('fixtures/contracts/core-policy-contract-skeletons.fixture.json')) as Record<string, unknown>[];
      fixture[0].policyType = keyword;
      assert.equal(validateCorePolicyContractSkeletonsFixture(fixture).ok, false);
    }
  });

  it('AI governance skeleton validator returns ok true for the locked fixture', async () => {
    assert.equal(validateCoreAiGovernanceContractSkeletonsFixture(await readFixture('fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json')).ok, true);
  });

  it('AI governance skeleton validator rejects a missing governanceType', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    delete fixture[0].governanceType;
    assert.equal(validateCoreAiGovernanceContractSkeletonsFixture(fixture).ok, false);
  });

  it('AI governance skeleton validator rejects a changed locked id', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].id = 'core-ai-governance-unlocked-contract';
    assert.equal(validateCoreAiGovernanceContractSkeletonsFixture(fixture).ok, false);
  });

  it('AI governance skeleton validator rejects a non-agent domain', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].domainId = 'policy';
    assert.equal(validateCoreAiGovernanceContractSkeletonsFixture(fixture).ok, false);
  });

  it('AI governance skeleton validator rejects protected-action authority', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].protectedAction = true;
    assert.equal(validateCoreAiGovernanceContractSkeletonsFixture(fixture).ok, false);
  });

  it('AI governance skeleton validator rejects executable fields', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].execute = 'not allowed';
    assert.equal(validateCoreAiGovernanceContractSkeletonsFixture(fixture).ok, false);
  });

  it('contract coverage baseline validator rejects non-object input', () => {
    assert.equal(validateCoreContractCoverageBaselineFixture([]).ok, false);
  });

  it('Common Contract fixture validator rejects a changed source path', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-common-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].sourcePath = 'wrong.md';
    assert.equal(validateCoreCommonContractSkeletonsFixture(fixture).ok, false);
  });

  it('Test Contract fixture validator rejects executable fields', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contracts/core-test-contract-skeletons.fixture.json')) as Record<string, unknown>[];
    fixture[0].assertions = ['not allowed'];
    assert.equal(validateCoreTestContractSkeletonsFixture(fixture).ok, false);
  });

  it('contract coverage baseline validator rejects stale summary counts', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json')) as Record<string, unknown>;
    const summary = fixture.summary as Record<string, unknown>;
    summary.indexedContractCount = 105;
    assert.equal(validateCoreContractCoverageBaselineFixture(fixture).ok, false);
  });

  it('contract gap inventory validator rejects non-object input', () => {
    assert.equal(validateCoreContractGapInventoryFixture([]).ok, false);
  });

  it('contract gap inventory validator rejects changed batch counts', async () => {
    const fixture = structuredClone(await readFixture('fixtures/contract-coverage/core-contract-gap-inventory.fixture.json')) as Record<string, unknown>;
    const batches = fixture.implementationBatches as Record<string, unknown>[];
    batches[0].targetCount = 16;
    assert.equal(validateCoreContractGapInventoryFixture(fixture).ok, false);
  });

});
