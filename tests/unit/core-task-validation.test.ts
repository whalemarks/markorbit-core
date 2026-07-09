import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CoreTask } from '../../src/index.ts';
import { validateCoreTask } from '../../src/index.ts';

const validTask = {
  id: 'task-001',
  type: 'prepare-record',
  title: 'Prepare record',
  domainId: 'matter',
  status: 'open',
  priority: 'normal',
  createdAt: '2026-01-01T00:00:00.000Z'
} as CoreTask;

function taskWith(overrides: Record<string, unknown>): CoreTask {
  return { ...validTask, ...overrides } as CoreTask;
}

describe('validateCoreTask', () => {
  it('returns no errors for a valid task', () => {
    assert.deepEqual(validateCoreTask(validTask), []);
  });

  it('returns errors for missing id', () => assert.ok(validateCoreTask(taskWith({ id: undefined })).some((error) => error.includes('id'))));
  it('returns errors for missing type', () => assert.ok(validateCoreTask(taskWith({ type: undefined })).some((error) => error.includes('type'))));
  it('returns errors for missing title', () => assert.ok(validateCoreTask(taskWith({ title: undefined })).some((error) => error.includes('title'))));
  it('returns errors for missing domainId', () => assert.ok(validateCoreTask(taskWith({ domainId: undefined })).some((error) => error.includes('domainId'))));
  it('returns errors for missing status', () => assert.ok(validateCoreTask(taskWith({ status: undefined })).some((error) => error.includes('status'))));
  it('returns errors for missing priority', () => assert.ok(validateCoreTask(taskWith({ priority: undefined })).some((error) => error.includes('priority'))));
  it('returns errors for missing createdAt', () => assert.ok(validateCoreTask(taskWith({ createdAt: undefined })).some((error) => error.includes('createdAt'))));

  it('returns errors if metadata is not a plain object', () => {
    assert.ok(validateCoreTask(taskWith({ metadata: [] })).some((error) => error.includes('metadata')));
  });

  it('returns errors if relatedEventIds is not an array', () => {
    assert.ok(validateCoreTask(taskWith({ relatedEventIds: 'event-001' })).some((error) => error.includes('relatedEventIds')));
  });

  it('returns errors if assignee is missing actorType or actorId', () => {
    const errors = validateCoreTask(taskWith({ assignee: { actorType: '', actorId: '' } }));

    assert.ok(errors.some((error) => error.includes('assignee.actorType')));
    assert.ok(errors.some((error) => error.includes('assignee.actorId')));
  });
});
