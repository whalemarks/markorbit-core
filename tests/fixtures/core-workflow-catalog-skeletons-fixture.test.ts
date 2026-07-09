import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_WORKFLOW_CATALOG_SKELETONS, EXCLUDED_WORKFLOW_CONCEPTS } from '../../src/index.ts';

type Entry = { readonly id: string; readonly workflowType: string; readonly name: string };
const fixture = JSON.parse(await readFile(new URL('../../fixtures/contracts/core-workflow-catalog-skeletons.fixture.json', import.meta.url), 'utf8')) as readonly Entry[];
const engineFields = ['engine', 'workflowEngine'];
const runtimeFields = ['runtimeState', 'executionState', 'executionContext', 'executionRuntime', 'currentStep', 'runningInstance', 'instanceId'];
const transitionFields = ['transitionFunction', 'handler', 'executor'];

function fixtureHasKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some((item) => fixtureHasKey(item, key));
  if (typeof value !== 'object' || value === null) return false;
  return Object.keys(value).includes(key) || Object.values(value).some((item) => fixtureHasKey(item, key));
}

describe('core-workflow-catalog-skeletons fixture', () => {
  it('has exactly 8 entries', () => assert.equal(fixture.length, 8));
  it('fixture ids match CORE_WORKFLOW_CATALOG_SKELETONS ids exactly', () => assert.deepEqual(fixture.map((entry) => entry.id), CORE_WORKFLOW_CATALOG_SKELETONS.map((entry) => entry.id)));
  it('fixture workflowTypes match CORE_WORKFLOW_CATALOG_SKELETONS workflowTypes exactly', () => assert.deepEqual(fixture.map((entry) => entry.workflowType), CORE_WORKFLOW_CATALOG_SKELETONS.map((entry) => entry.workflowType)));
  it('fixture names match CORE_WORKFLOW_CATALOG_SKELETONS names exactly', () => assert.deepEqual(fixture.map((entry) => entry.name), CORE_WORKFLOW_CATALOG_SKELETONS.map((entry) => entry.name)));
  it('fixture does not contain excluded workflow concepts', () => { const serialized = JSON.stringify(fixture); for (const concept of EXCLUDED_WORKFLOW_CONCEPTS) assert.equal(serialized.includes(concept), false); });
  it('fixture does not contain workflow engine fields', () => { for (const field of engineFields) assert.equal(fixtureHasKey(fixture, field), false); });
  it('fixture does not contain runtime instance fields', () => { for (const field of runtimeFields) assert.equal(fixtureHasKey(fixture, field), false); });
  it('fixture does not contain executable transition definitions', () => { for (const field of transitionFields) assert.equal(fixtureHasKey(fixture, field), false); });
});
