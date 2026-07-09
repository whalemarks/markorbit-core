export const CORE_EVENT_ACTIONS = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  archived: 'archived',
  restored: 'restored',
  statusChanged: 'status_changed',
  reviewed: 'reviewed',
  approved: 'approved',
  rejected: 'rejected',
  requested: 'requested',
  failed: 'failed',
  retried: 'retried',
  completed: 'completed',
  blocked: 'blocked',
  emitted: 'emitted'
} as const;

export type CoreEventAction = (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
