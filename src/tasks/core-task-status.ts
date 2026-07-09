export const CORE_TASK_STATUSES = {
  draft: 'draft',
  open: 'open',
  inProgress: 'in_progress',
  waiting: 'waiting',
  blocked: 'blocked',
  reviewRequired: 'review_required',
  approved: 'approved',
  rejected: 'rejected',
  completed: 'completed',
  cancelled: 'cancelled',
  failed: 'failed',
  archived: 'archived'
} as const;

export type CoreTaskStatus = (typeof CORE_TASK_STATUSES)[keyof typeof CORE_TASK_STATUSES];
