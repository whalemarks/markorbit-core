import type { CoreDomainId } from '../domains/index.ts';
import type { CoreEventId } from '../events/index.ts';
import type { CoreObjectReference } from '../objects/index.ts';
import type { CoreTaskActor } from './core-task-actor.ts';
import type { CoreTaskId } from './core-task-id.ts';
import type { CoreTaskPriority } from './core-task-priority.ts';
import type { CoreTaskReviewRequirement } from './core-task-review.ts';
import type { CoreTaskStatus } from './core-task-status.ts';
import type { CoreTaskType } from './core-task-type.ts';

export interface CoreTask {
  readonly id: CoreTaskId;
  readonly type: CoreTaskType;
  readonly title: string;
  readonly description?: string;
  readonly domainId: CoreDomainId;
  readonly object?: CoreObjectReference;
  readonly status: CoreTaskStatus;
  readonly priority: CoreTaskPriority;
  readonly assignee?: CoreTaskActor;
  readonly requester?: CoreTaskActor;
  readonly review?: CoreTaskReviewRequirement;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly dueAt?: string;
  readonly relatedEventIds?: readonly CoreEventId[];
  readonly metadata?: Record<string, unknown>;
}
