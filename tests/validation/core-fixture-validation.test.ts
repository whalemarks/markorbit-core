import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  validateCoreDomainRegistryFixture,
  validateCoreDomainContractSkeletonsFixture,
  validateCoreEventBaseFixture,
  validateCoreObjectBaseFixture,
  validateCoreTaskBaseFixture,
  validateCoreWorkflowContractBaseFixture,
  validateCoreServiceContractSkeletonsFixture
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
    assert.equal(validateCoreServiceContractSkeletonsFixture(await readFixture('fixtures/contracts/core-service-contract-skeletons.fixture.json')).ok, true);
  });

  it('each validator returns ok false for invalid non-array input', () => {
    for (const validator of [
      validateCoreDomainRegistryFixture,
      validateCoreDomainContractSkeletonsFixture,
      validateCoreServiceContractSkeletonsFixture,
      validateCoreObjectBaseFixture,
      validateCoreEventBaseFixture,
      validateCoreTaskBaseFixture,
      validateCoreWorkflowContractBaseFixture
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
});
