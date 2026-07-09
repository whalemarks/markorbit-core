export const CORE_TASK_PRIORITIES = {
  low: 'low',
  normal: 'normal',
  high: 'high',
  urgent: 'urgent'
} as const;

export type CoreTaskPriority = (typeof CORE_TASK_PRIORITIES)[keyof typeof CORE_TASK_PRIORITIES];
