import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_EVENT_ACTIONS, CORE_EVENT_SOURCE_ACTOR_TYPES } from '../../src/index.ts';

type CoreEventBaseFixtureEntry = {
  readonly id?: string;
  readonly type?: string;
  readonly action?: string;
  readonly domainId?: string;
  readonly source?: {
    readonly actorType?: string;
    readonly actorId?: string;
    readonly actorLabel?: string;
  };
  readonly occurredAt?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly payload?: unknown;
  readonly metadata?: unknown;
  readonly [key: string]: unknown;
};

const fixture = JSON.parse(
  await readFile(new URL('../../fixtures/events/core-event-base.fixture.json', import.meta.url), 'utf8')
) as readonly CoreEventBaseFixtureEntry[];

const allowedBaseFields = new Set([
  'id',
  'type',
  'action',
  'domainId',
  'object',
  'source',
  'occurredAt',
  'correlationId',
  'causationId',
  'payload',
  'metadata'
]);

describe('core-event-base fixture', () => {
  it('has exactly 3 events', () => {
    assert.equal(fixture.length, 3);
  });

  it('each event has id, type, action, domainId, source, and occurredAt', () => {
    for (const event of fixture) {
      assert.ok(event.id);
      assert.ok(event.type);
      assert.ok(event.action);
      assert.ok(event.domainId);
      assert.ok(event.source);
      assert.ok(event.occurredAt);
    }
  });

  it('each domainId exists in CORE_DOMAIN_REGISTRY', () => {
    const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));

    for (const event of fixture) {
      assert.ok(event.domainId && domainIds.has(event.domainId));
    }
  });

  it('each action is a valid CoreEventAction', () => {
    const actions = new Set(Object.values(CORE_EVENT_ACTIONS));

    for (const event of fixture) {
      assert.ok(event.action && actions.has(event.action));
    }
  });

  it('each source.actorType is a valid CoreEventSource actorType', () => {
    const actorTypes = new Set(Object.values(CORE_EVENT_SOURCE_ACTOR_TYPES));

    for (const event of fixture) {
      assert.ok(event.source?.actorType && actorTypes.has(event.source.actorType));
    }
  });

  it('fixture does not define domain-specific event payload schemas', () => {
    for (const event of fixture) {
      assert.deepEqual(Object.keys(event).filter((field) => !allowedBaseFields.has(field)), []);
      assert.ok(event.payload === undefined || (typeof event.payload === 'object' && event.payload !== null && !Array.isArray(event.payload)));
    }
  });
});
