export const CORE_OBJECT_STATUSES = {
  draft: 'draft',
  active: 'active',
  inactive: 'inactive',
  archived: 'archived',
  deleted: 'deleted'
} as const;

export type CoreObjectStatus = (typeof CORE_OBJECT_STATUSES)[keyof typeof CORE_OBJECT_STATUSES];
