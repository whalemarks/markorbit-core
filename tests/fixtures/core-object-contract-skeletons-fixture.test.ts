import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_OBJECT_CONTRACT_SKELETONS } from '../../src/index.ts';

type FixtureEntry = Record<string, unknown> & { readonly id: string; readonly objectType: string; readonly domainId: string; readonly name: string };
const fixture = JSON.parse(await readFile(new URL('../../fixtures/contracts/core-object-contract-skeletons.fixture.json', import.meta.url), 'utf8')) as readonly FixtureEntry[];
const excludedConcepts = ['execution-context', 'execution-runtime', 'artifact', 'render-job', 'publish-package', 'distillery-output', 'workplace-item', 'lite-record', 'markreg-case', 'product-screen', 'workflow-runtime-instance', 'task-runtime-instance', 'ai-agent-session'];
const businessFields = ['filingDate', 'goods', 'services', 'clientInstruction', 'legalOpinion', 'evidenceFiles', 'providerFee', 'workflowState'];

describe('core-object-contract-skeletons fixture', () => {
  it('has exactly 12 entries', () => assert.equal(fixture.length, 12));
  it('fixture ids match CORE_OBJECT_CONTRACT_SKELETONS ids exactly', () => assert.deepEqual(fixture.map((c) => c.id), CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.id)));
  it('fixture objectTypes match CORE_OBJECT_CONTRACT_SKELETONS objectTypes exactly', () => assert.deepEqual(fixture.map((c) => c.objectType), CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.objectType)));
  it('fixture domainIds match CORE_OBJECT_CONTRACT_SKELETONS domainIds exactly', () => assert.deepEqual(fixture.map((c) => c.domainId), CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.domainId)));
  it('fixture names match CORE_OBJECT_CONTRACT_SKELETONS names exactly', () => assert.deepEqual(fixture.map((c) => c.name), CORE_OBJECT_CONTRACT_SKELETONS.map((c) => c.name)));
  it('fixture does not contain excluded object concepts', () => {
    const serialized = JSON.stringify(fixture).toLowerCase();
    for (const concept of excludedConcepts) assert.equal(serialized.includes(concept), false);
  });
  it('fixture does not contain business-specific object fields', () => {
    const serialized = JSON.stringify(fixture);
    for (const field of businessFields) assert.equal(serialized.includes(field), false);
  });
});
