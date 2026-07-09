export const CORE_CONTRACT_TYPES = {
  domain: 'domain',
  object: 'object',
  service: 'service',
  api: 'api',
  event: 'event',
  workflow: 'workflow',
  task: 'task',
  validation: 'validation',
  permission: 'permission',
  policy: 'policy',
  ai_governance: 'ai_governance'
} as const;

export type CoreContractType = (typeof CORE_CONTRACT_TYPES)[keyof typeof CORE_CONTRACT_TYPES];
