import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_WORKFLOW_CONTRACT_STATUSES } from '../../src/index.ts';

type CoreWorkflowContractBaseFixtureEntry = {
  readonly id?: string;
  readonly type?: string;
  readonly name?: string;
  readonly description?: string;
  readonly domainId?: string;
  readonly object?: unknown;
  readonly status?: string;
  readonly version?: number;
  readonly steps?: readonly unknown[];
  readonly transitions?: readonly unknown[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly metadata?: unknown;
  readonly [key: string]: unknown;
};

const fixture = JSON.parse(
  await readFile(new URL('../../fixtures/workflows/core-workflow-contract-base.fixture.json', import.meta.url), 'utf8')
) as readonly CoreWorkflowContractBaseFixtureEntry[];

const allowedBaseFields = new Set([
  'id',
  'type',
  'name',
  'description',
  'domainId',
  'object',
  'status',
  'version',
  'steps',
  'transitions',
  'createdAt',
  'updatedAt',
  'metadata'
]);

const runtimeStateFields = new Set([
  'runtimeState',
  'executionState',
  'currentStepId',
  'completedStepIds',
  'activeStepId',
  'startedAt',
  'completedAt'
]);

describe('core-workflow-contract-base fixture', () => {
  it('has exactly 2 workflow contracts', () => {
    assert.equal(fixture.length, 2);
  });

  it('each contract has id, type, name, domainId, status, version, steps, and createdAt', () => {
    for (const contract of fixture) {
      assert.ok(contract.id);
      assert.ok(contract.type);
      assert.ok(contract.name);
      assert.ok(contract.domainId);
      assert.ok(contract.status);
      assert.ok(contract.version);
      assert.ok(contract.steps);
      assert.ok(contract.createdAt);
    }
  });

  it('each domainId exists in CORE_DOMAIN_REGISTRY', () => {
    const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));

    for (const contract of fixture) {
      assert.ok(contract.domainId && domainIds.has(contract.domainId));
    }
  });

  it('each status is a valid CoreWorkflowContractStatus', () => {
    const statuses = new Set<string>(Object.values(CORE_WORKFLOW_CONTRACT_STATUSES));

    for (const contract of fixture) {
      assert.ok(contract.status && statuses.has(contract.status));
    }
  });

  it('each contract has at least one step', () => {
    for (const contract of fixture) {
      assert.ok(Array.isArray(contract.steps));
      assert.ok(contract.steps.length > 0);
    }
  });

  it('fixture does not define domain-specific workflow payload schemas', () => {
    for (const contract of fixture) {
      assert.deepEqual(Object.keys(contract).filter((field) => !allowedBaseFields.has(field)), []);
      assert.equal('payload' in contract, false);
      assert.equal('schema' in contract, false);
      assert.equal('payloadSchema' in contract, false);
    }
  });

  it('fixture does not define runtime execution state', () => {
    for (const contract of fixture) {
      assert.deepEqual(Object.keys(contract).filter((field) => runtimeStateFields.has(field)), []);
    }
  });
});
