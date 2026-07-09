import { CORE_DOMAIN_CATEGORIES } from './core-domain-category.ts';
import type { CoreDomainDefinition } from './core-domain.ts';

export const CORE_DOMAIN_BOOK = 'Book 02 — MarkOrbit Core Specification';
export const CORE_DOMAIN_STATUS = 'active';

export const CORE_DOMAIN_REGISTRY = [
  {
    id: 'identity',
    name: 'Identity',
    category: CORE_DOMAIN_CATEGORIES.foundation,
    description: 'Defines identity records and identity anchors for Core participants and entities.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'organization',
    name: 'Organization',
    category: CORE_DOMAIN_CATEGORIES.foundation,
    description: 'Defines organizations that participate in Core relationships and operating structures.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'user',
    name: 'User',
    category: CORE_DOMAIN_CATEGORIES.foundation,
    description: 'Defines human users that interact with Core records, permissions, and responsibilities.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'permission',
    name: 'Permission',
    category: CORE_DOMAIN_CATEGORIES.foundation,
    description: 'Defines permission records used to express allowed access and actions across Core.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'policy',
    name: 'Policy',
    category: CORE_DOMAIN_CATEGORIES.foundation,
    description: 'Defines policy records that constrain Core behavior, access, and governance.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    category: CORE_DOMAIN_CATEGORIES.foundation,
    description: 'Defines knowledge references and structured informational assets used by Core.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'brand',
    name: 'Brand',
    category: CORE_DOMAIN_CATEGORIES.professional,
    description: 'Defines brand records and canonical brand information managed within Core.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'trademark',
    name: 'Trademark',
    category: CORE_DOMAIN_CATEGORIES.professional,
    description: 'Defines trademark records as professional Core data without implementing trademark workflows.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'jurisdiction',
    name: 'Jurisdiction',
    category: CORE_DOMAIN_CATEGORIES.professional,
    description: 'Defines jurisdiction records for legal, regional, and administrative context.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'classification',
    name: 'Classification',
    category: CORE_DOMAIN_CATEGORIES.professional,
    description: 'Defines classification records used to organize professional Core concepts and references.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'document',
    name: 'Document',
    category: CORE_DOMAIN_CATEGORIES.professional,
    description: 'Defines document records and document metadata held by Core.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'evidence',
    name: 'Evidence',
    category: CORE_DOMAIN_CATEGORIES.professional,
    description: 'Defines evidence records and supporting proof references represented in Core.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'customer',
    name: 'Customer',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines customer records involved in Core business execution relationships.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'matter',
    name: 'Matter',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines matter records that group business execution context and related Core records.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'order',
    name: 'Order',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines order records for requested business execution outcomes without implementing fulfillment logic.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'opportunity',
    name: 'Opportunity',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines opportunity records for potential business execution relationships and outcomes.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'workflow-contract',
    name: 'Workflow Contract',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines workflow contract records as Core definitions without implementing a workflow engine.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'task',
    name: 'Task',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines task records used to represent units of work in Core without adding execution logic.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'event',
    name: 'Event',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines event records used to describe notable Core occurrences.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'notification',
    name: 'Notification',
    category: CORE_DOMAIN_CATEGORIES.businessExecution,
    description: 'Defines notification records for Core communication signals without implementing delivery services.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'partner',
    name: 'Partner',
    category: CORE_DOMAIN_CATEGORIES.collaborationNetwork,
    description: 'Defines partner records that participate in the Core collaboration network.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'agent',
    name: 'Agent',
    category: CORE_DOMAIN_CATEGORIES.collaborationNetwork,
    description: 'Defines agent records as network participants without introducing AI authority.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'service-provider',
    name: 'Service Provider',
    category: CORE_DOMAIN_CATEGORIES.collaborationNetwork,
    description: 'Defines service provider records that can participate in Core service relationships.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'service-network',
    name: 'Service Network',
    category: CORE_DOMAIN_CATEGORIES.collaborationNetwork,
    description: 'Defines service network records for organized collaboration among providers and participants.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'routing',
    name: 'Routing',
    category: CORE_DOMAIN_CATEGORIES.collaborationNetwork,
    description: 'Defines routing records for collaboration-network direction without implementing routing services.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  },
  {
    id: 'communication',
    name: 'Communication',
    category: CORE_DOMAIN_CATEGORIES.collaborationNetwork,
    description: 'Defines communication records for collaboration-network exchanges without implementing messaging services.',
    book: CORE_DOMAIN_BOOK,
    status: CORE_DOMAIN_STATUS
  }
] as const satisfies readonly CoreDomainDefinition[];
