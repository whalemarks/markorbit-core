import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_EVENT_ACTIONS,
  CORE_EVENT_SOURCE_ACTOR_TYPES,
  createCoreEventId,
  createCoreEventType
} from '../../src/index.ts';

const expectedActions = [
  'created',
  'updated',
  'deleted',
  'archived',
  'restored',
  'status_changed',
  'reviewed',
  'approved',
  'rejected',
  'requested',
  'failed',
  'retried',
  'completed',
  'blocked',
  'emitted'
];

const expectedActorTypes = ['user', 'system', 'service', 'integration', 'ai_assistant', 'agent'];

describe('Core Event base primitives', () => {
  it('createCoreEventId accepts valid ids', () => {
    assert.equal(createCoreEventId('event-001'), 'event-001');
  });

  it('createCoreEventId rejects empty values', () => {
    assert.throws(() => createCoreEventId(''));
  });

  it('createCoreEventId rejects values with spaces', () => {
    assert.throws(() => createCoreEventId('event 001'));
  });

  it('createCoreEventType accepts kebab-case values', () => {
    assert.equal(createCoreEventType('object-created'), 'object-created');
  });

  it('createCoreEventType rejects empty values', () => {
    assert.throws(() => createCoreEventType(''));
  });

  it('createCoreEventType rejects values with spaces', () => {
    assert.throws(() => createCoreEventType('object created'));
  });

  it('createCoreEventType rejects non-kebab-case values', () => {
    assert.throws(() => createCoreEventType('ObjectCreated'));
    assert.throws(() => createCoreEventType('object_created'));
  });

  it('CoreEventAction contains exactly the generic actions', () => {
    assert.deepEqual(Object.values(CORE_EVENT_ACTIONS), expectedActions);
  });

  it('CoreEventSource actorType contains exactly the allowed source actor types', () => {
    assert.deepEqual(Object.values(CORE_EVENT_SOURCE_ACTOR_TYPES), expectedActorTypes);
  });
});
