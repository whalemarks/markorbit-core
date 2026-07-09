import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_EVENT_CATALOG_SKELETONS } from '../../src/index.ts';

type Entry = { readonly id: string; readonly eventType: string; readonly name: string; readonly action: string };
const fixture = JSON.parse(await readFile(new URL('../../fixtures/contracts/core-event-catalog-skeletons.fixture.json', import.meta.url), 'utf8')) as readonly Entry[];
const excludedConcepts = ['event-bus-created', 'event-stream-appended', 'event-sourced-aggregate-updated', 'execution-runtime-started', 'execution-context-created', 'workflow-runtime-advanced', 'task-runtime-completed', 'ai-agent-emitted-event', 'autonomous-agent-approved', 'product-ui-event', 'artifact-rendered', 'publish-automated', 'distillery-output-published'];
const eventBusFields = ['eventBus', 'busName', 'subscriber', 'publisher'];
const eventSourcingFields = ['eventStream', 'streamName', 'aggregateId', 'aggregateVersion'];
const schemaKeywords = ['required', 'properties', 'jsonSchema', 'zodSchema'];

describe('core-event-catalog-skeletons fixture', () => {
  it('has exactly 12 entries', () => assert.equal(fixture.length, 12));
  it('fixture ids match CORE_EVENT_CATALOG_SKELETONS ids exactly', () => assert.deepEqual(fixture.map((entry) => entry.id), CORE_EVENT_CATALOG_SKELETONS.map((entry) => entry.id)));
  it('fixture eventTypes match CORE_EVENT_CATALOG_SKELETONS eventTypes exactly', () => assert.deepEqual(fixture.map((entry) => entry.eventType), CORE_EVENT_CATALOG_SKELETONS.map((entry) => entry.eventType)));
  it('fixture names match CORE_EVENT_CATALOG_SKELETONS names exactly', () => assert.deepEqual(fixture.map((entry) => entry.name), CORE_EVENT_CATALOG_SKELETONS.map((entry) => entry.name)));
  it('fixture actions match CORE_EVENT_CATALOG_SKELETONS actions exactly', () => assert.deepEqual(fixture.map((entry) => entry.action), CORE_EVENT_CATALOG_SKELETONS.map((entry) => entry.action)));
  it('fixture does not contain excluded event concepts', () => { const serialized = JSON.stringify(fixture); for (const concept of excludedConcepts) assert.equal(serialized.includes(concept), false); });
  it('fixture does not contain event bus fields', () => { const serialized = JSON.stringify(fixture); for (const field of eventBusFields) assert.equal(serialized.includes(field), false); });
  it('fixture does not contain event sourcing fields', () => { const serialized = JSON.stringify(fixture); for (const field of eventSourcingFields) assert.equal(serialized.includes(field), false); });
  it('fixture does not contain concrete payload schemas', () => { const serialized = JSON.stringify(fixture); for (const keyword of schemaKeywords) assert.equal(serialized.includes(keyword), false); });
});
