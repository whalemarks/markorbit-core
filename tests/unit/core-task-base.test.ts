import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_TASK_ACTOR_TYPES,
  CORE_TASK_PRIORITIES,
  CORE_TASK_REVIEW_OUTCOMES,
  CORE_TASK_STATUSES,
  createCoreTaskId,
  createCoreTaskType
} from '../../src/index.ts';

const expectedStatuses = [
  'draft',
  'open',
  'in_progress',
  'waiting',
  'blocked',
  'review_required',
  'approved',
  'rejected',
  'completed',
  'cancelled',
  'failed',
  'archived'
];

const expectedPriorities = ['low', 'normal', 'high', 'urgent'];
const expectedActorTypes = ['user', 'team', 'organization', 'system', 'service', 'integration', 'ai_assistant', 'agent'];
const expectedReviewOutcomes = ['approved', 'rejected', 'revision_requested'];

describe('Core Task base primitives', () => {
  it('createCoreTaskId accepts valid ids', () => {
    assert.equal(createCoreTaskId('task-001'), 'task-001');
  });

  it('createCoreTaskId rejects empty values', () => {
    assert.throws(() => createCoreTaskId(''));
  });

  it('createCoreTaskId rejects values with spaces', () => {
    assert.throws(() => createCoreTaskId('task 001'));
  });

  it('createCoreTaskType accepts kebab-case values', () => {
    assert.equal(createCoreTaskType('prepare-record'), 'prepare-record');
  });

  it('createCoreTaskType rejects empty values', () => {
    assert.throws(() => createCoreTaskType(''));
  });

  it('createCoreTaskType rejects values with spaces', () => {
    assert.throws(() => createCoreTaskType('prepare record'));
  });

  it('createCoreTaskType rejects non-kebab-case values', () => {
    assert.throws(() => createCoreTaskType('PrepareRecord'));
    assert.throws(() => createCoreTaskType('prepare_record'));
  });

  it('CoreTaskStatus contains exactly the listed statuses', () => {
    assert.deepEqual(Object.values(CORE_TASK_STATUSES), expectedStatuses);
  });

  it('CoreTaskPriority contains exactly low, normal, high, urgent', () => {
    assert.deepEqual(Object.values(CORE_TASK_PRIORITIES), expectedPriorities);
  });

  it('CoreTaskActor actorType contains exactly the listed actor types', () => {
    assert.deepEqual(Object.values(CORE_TASK_ACTOR_TYPES), expectedActorTypes);
  });

  it('CoreTaskReviewOutcome contains exactly approved, rejected, revision_requested', () => {
    assert.deepEqual(Object.values(CORE_TASK_REVIEW_OUTCOMES), expectedReviewOutcomes);
  });
});
