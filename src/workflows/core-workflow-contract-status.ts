export const CORE_WORKFLOW_CONTRACT_STATUSES = {
  draft: 'draft',
  active: 'active',
  inactive: 'inactive',
  deprecated: 'deprecated',
  archived: 'archived'
} as const;

export type CoreWorkflowContractStatus =
  (typeof CORE_WORKFLOW_CONTRACT_STATUSES)[keyof typeof CORE_WORKFLOW_CONTRACT_STATUSES];
