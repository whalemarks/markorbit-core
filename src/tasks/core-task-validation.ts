import type { CoreTaskActor } from './core-task-actor.ts';
import { CORE_TASK_REVIEW_OUTCOMES } from './core-task-review.ts';
import type { CoreTask } from './core-task.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function validateActor(actor: CoreTaskActor, fieldName: string, errors: string[]): void {
  if (!actor.actorType) errors.push(`CoreTask.${fieldName}.actorType is required when ${fieldName} is present.`);
  if (!actor.actorId) errors.push(`CoreTask.${fieldName}.actorId is required when ${fieldName} is present.`);
}

export function validateCoreTask(task: CoreTask): readonly string[] {
  const errors: string[] = [];

  if (!task.id) errors.push('CoreTask.id is required.');
  if (!task.type) errors.push('CoreTask.type is required.');
  if (!task.title) errors.push('CoreTask.title is required.');
  if (!task.domainId) errors.push('CoreTask.domainId is required.');
  if (!task.status) errors.push('CoreTask.status is required.');
  if (!task.priority) errors.push('CoreTask.priority is required.');
  if (!task.createdAt) errors.push('CoreTask.createdAt is required.');

  if (task.object) {
    if (!task.object.id) errors.push('CoreTask.object.id is required when object is present.');
    if (!task.object.type) errors.push('CoreTask.object.type is required when object is present.');
    if (!task.object.domainId) errors.push('CoreTask.object.domainId is required when object is present.');
  }

  if (task.assignee) validateActor(task.assignee, 'assignee', errors);
  if (task.requester) validateActor(task.requester, 'requester', errors);

  if (
    task.review?.required === true &&
    task.review.outcome !== undefined &&
    !Object.values(CORE_TASK_REVIEW_OUTCOMES).includes(task.review.outcome)
  ) {
    errors.push('CoreTask.review.outcome must be a valid CoreTaskReviewOutcome when review is required.');
  }

  if (task.metadata !== undefined && !isPlainObject(task.metadata)) {
    errors.push('CoreTask.metadata must be a plain object when present.');
  }

  if (task.relatedEventIds !== undefined && !Array.isArray(task.relatedEventIds)) {
    errors.push('CoreTask.relatedEventIds must be an array when present.');
  }

  return errors;
}
