export const CORE_CONTRACT_STATUSES = {
  draft: 'draft',
  active: 'active',
  deprecated: 'deprecated',
  archived: 'archived'
} as const;

export type CoreContractStatus = (typeof CORE_CONTRACT_STATUSES)[keyof typeof CORE_CONTRACT_STATUSES];
