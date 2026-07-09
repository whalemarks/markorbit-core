import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_TASK_PRIORITIES, CORE_TASK_STATUSES } from '../../src/index.ts';

type CoreTaskBaseFixtureEntry = {
  readonly id?: string;
  readonly type?: string;
  readonly title?: string;
  readonly description?: string;
  readonly domainId?: string;
  readonly object?: unknown;
  readonly status?: string;
  readonly priority?: string;
  readonly assignee?: unknown;
  readonly requester?: unknown;
  readonly review?: unknown;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly dueAt?: string;
  readonly relatedEventIds?: unknown;
  readonly metadata?: unknown;
  readonly [key: string]: unknown;
};

const fixture = JSON.parse(
  await readFile(new URL('../../fixtures/tasks/core-task-base.fixture.json', import.meta.url), 'utf8')
) as readonly CoreTaskBaseFixtureEntry[];

const allowedBaseFields = new Set([
  'id',
  'type',
  'title',
  'description',
  'domainId',
  'object',
  'status',
  'priority',
  'assignee',
  'requester',
  'review',
  'createdAt',
  'updatedAt',
  'dueAt',
  'relatedEventIds',
  'metadata'
]);

describe('core-task-base fixture', () => {
  it('has exactly 3 tasks', () => {
    assert.equal(fixture.length, 3);
  });

  it('each task has id, type, title, domainId, status, priority, and createdAt', () => {
    for (const task of fixture) {
      assert.ok(task.id);
      assert.ok(task.type);
      assert.ok(task.title);
      assert.ok(task.domainId);
      assert.ok(task.status);
      assert.ok(task.priority);
      assert.ok(task.createdAt);
    }
  });

  it('each domainId exists in CORE_DOMAIN_REGISTRY', () => {
    const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));

    for (const task of fixture) {
      assert.ok(task.domainId && domainIds.has(task.domainId));
    }
  });

  it('each status is a valid CoreTaskStatus', () => {
    const statuses = new Set(Object.values(CORE_TASK_STATUSES));

    for (const task of fixture) {
      assert.ok(task.status && statuses.has(task.status));
    }
  });

  it('each priority is a valid CoreTaskPriority', () => {
    const priorities = new Set(Object.values(CORE_TASK_PRIORITIES));

    for (const task of fixture) {
      assert.ok(task.priority && priorities.has(task.priority));
    }
  });

  it('fixture does not define domain-specific task payload schemas', () => {
    for (const task of fixture) {
      assert.deepEqual(Object.keys(task).filter((field) => !allowedBaseFields.has(field)), []);
      assert.equal('payload' in task, false);
    }
  });
});
