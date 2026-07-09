import type { CoreTaskActor } from './core-task-actor.ts';

export const CORE_TASK_REVIEW_OUTCOMES = {
  approved: 'approved',
  rejected: 'rejected',
  revisionRequested: 'revision_requested'
} as const;

export type CoreTaskReviewOutcome = (typeof CORE_TASK_REVIEW_OUTCOMES)[keyof typeof CORE_TASK_REVIEW_OUTCOMES];

export interface CoreTaskReviewRequirement {
  readonly required: boolean;
  readonly reviewer?: CoreTaskActor;
  readonly reason?: string;
  readonly requestedAt?: string;
  readonly reviewedAt?: string;
  readonly outcome?: CoreTaskReviewOutcome;
}
