import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateCoreEvent, type CoreEvent } from '../../src/index.ts';

const validEvent = {
  id: 'event-001',
  type: 'object-created',
  action: 'created',
  domainId: 'trademark',
  source: {
    actorType: 'user',
    actorId: 'user-001'
  },
  occurredAt: '2026-07-09T00:00:00Z',
  payload: {},
  metadata: {}
} as CoreEvent;

describe('validateCoreEvent', () => {
  it('returns no errors for a valid event', () => {
    assert.deepEqual(validateCoreEvent(validEvent), []);
  });

  it('returns errors for missing id', () => {
    assert.ok(validateCoreEvent({ ...validEvent, id: '' } as unknown as CoreEvent).some((error) => error.includes('id')));
  });

  it('returns errors for missing type', () => {
    assert.ok(validateCoreEvent({ ...validEvent, type: '' } as unknown as CoreEvent).some((error) => error.includes('type')));
  });

  it('returns errors for missing action', () => {
    assert.ok(validateCoreEvent({ ...validEvent, action: '' } as unknown as CoreEvent).some((error) => error.includes('action')));
  });

  it('returns errors for missing domainId', () => {
    assert.ok(validateCoreEvent({ ...validEvent, domainId: '' } as unknown as CoreEvent).some((error) => error.includes('domainId')));
  });

  it('returns errors for missing source', () => {
    assert.ok(validateCoreEvent({ ...validEvent, source: undefined } as unknown as CoreEvent).some((error) => error.includes('source')));
  });

  it('returns errors for missing occurredAt', () => {
    assert.ok(validateCoreEvent({ ...validEvent, occurredAt: '' }).some((error) => error.includes('occurredAt')));
  });

  it('returns errors if payload is not a plain object', () => {
    assert.ok(validateCoreEvent({ ...validEvent, payload: [] as unknown as Record<string, unknown> }).some((error) => error.includes('payload')));
  });

  it('returns errors if metadata is not a plain object', () => {
    assert.ok(validateCoreEvent({ ...validEvent, metadata: 'invalid' as unknown as Record<string, unknown> }).some((error) => error.includes('metadata')));
  });
});
