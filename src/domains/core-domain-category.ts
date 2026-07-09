export const CORE_DOMAIN_CATEGORIES = {
  foundation: 'foundation',
  professional: 'professional',
  businessExecution: 'business_execution',
  collaborationNetwork: 'collaboration_network'
} as const;

export type CoreDomainCategory =
  (typeof CORE_DOMAIN_CATEGORIES)[keyof typeof CORE_DOMAIN_CATEGORIES];
