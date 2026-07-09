import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_EVENT_ACTIONS, CORE_EVENT_CATALOG_SKELETONS, validateCoreEventCatalogSkeletons } from '../../src/index.ts';

const excludedConcepts = [
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
  'distillery-output-published'
];

describe('Core Event Catalog Skeletons', () => {
  it('has exactly 12 entries', () => assert.equal(CORE_EVENT_CATALOG_SKELETONS.length, 12));
  it('validates without errors', () => assert.deepEqual(validateCoreEventCatalogSkeletons(CORE_EVENT_CATALOG_SKELETONS), []));
  it('all skeleton ids are unique', () => assert.equal(new Set(CORE_EVENT_CATALOG_SKELETONS.map((entry) => entry.id)).size, 12));
  it('all eventTypes are unique', () => assert.equal(new Set(CORE_EVENT_CATALOG_SKELETONS.map((entry) => entry.eventType)).size, 12));
  it('every domainId exists in CORE_DOMAIN_REGISTRY', () => {
    const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
    for (const entry of CORE_EVENT_CATALOG_SKELETONS) assert.equal(domainIds.has(entry.domainId), true);
  });
  it('every action is valid CoreEventAction', () => {
    const actions = new Set(Object.values(CORE_EVENT_ACTIONS));
    for (const entry of CORE_EVENT_CATALOG_SKELETONS) assert.equal(actions.has(entry.action), true);
  });
  it('no excluded event concepts are present', () => {
    const serialized = JSON.stringify(CORE_EVENT_CATALOG_SKELETONS);
    for (const concept of excludedConcepts) assert.equal(serialized.includes(concept), false);
  });
  it('each skeleton has non-empty purpose', () => {
    for (const entry of CORE_EVENT_CATALOG_SKELETONS) assert.equal(entry.purpose.length > 0, true);
  });
  it('each skeleton has owns array', () => {
    for (const entry of CORE_EVENT_CATALOG_SKELETONS) assert.equal(Array.isArray(entry.owns), true);
  });
  it('each skeleton has nonGoals array', () => {
    for (const entry of CORE_EVENT_CATALOG_SKELETONS) assert.equal(Array.isArray(entry.nonGoals), true);
  });
  it('eventType values are kebab-case', () => {
    for (const entry of CORE_EVENT_CATALOG_SKELETONS) assert.match(entry.eventType, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
