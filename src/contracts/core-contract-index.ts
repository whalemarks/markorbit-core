import type { CoreContractDefinition } from './core-contract-definition.ts';
import { createCoreContractId } from './core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from './core-contract-status.ts';
import { CORE_CONTRACT_TYPES } from './core-contract-type.ts';
import { CORE_DOMAIN_CONTRACT_SKELETONS } from './domain/core-domain-contract-skeletons.ts';
import { CORE_SERVICE_CONTRACT_SKELETONS } from './service/core-service-contract-skeletons.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';

const objectContractSkeletonEntries = [
  ['core-object-identity-reference-contract', 'Identity Reference Object Contract Skeleton', 'Skeleton index entry for identity reference Core objects.', 'identity'],
  ['core-object-organization-reference-contract', 'Organization Reference Object Contract Skeleton', 'Skeleton index entry for organization reference Core objects.', 'organization'],
  ['core-object-user-reference-contract', 'User Reference Object Contract Skeleton', 'Skeleton index entry for user reference Core objects.', 'user'],
  ['core-object-permission-reference-contract', 'Permission Reference Object Contract Skeleton', 'Skeleton index entry for permission reference Core objects.', 'permission'],
  ['core-object-policy-reference-contract', 'Policy Reference Object Contract Skeleton', 'Skeleton index entry for policy reference Core objects.', 'policy'],
  ['core-object-knowledge-reference-contract', 'Knowledge Reference Object Contract Skeleton', 'Skeleton index entry for knowledge reference Core objects.', 'knowledge'],
  ['core-object-trademark-reference-contract', 'Trademark Reference Object Contract Skeleton', 'Skeleton index entry for trademark reference Core objects.', 'trademark'],
  ['core-object-jurisdiction-reference-contract', 'Jurisdiction Reference Object Contract Skeleton', 'Skeleton index entry for jurisdiction reference Core objects.', 'jurisdiction'],
  ['core-object-classification-reference-contract', 'Classification Reference Object Contract Skeleton', 'Skeleton index entry for classification reference Core objects.', 'classification'],
  ['core-object-document-reference-contract', 'Document Reference Object Contract Skeleton', 'Skeleton index entry for document reference Core objects.', 'document'],
  ['core-object-evidence-reference-contract', 'Evidence Reference Object Contract Skeleton', 'Skeleton index entry for evidence reference Core objects.', 'evidence'],
  ['core-object-communication-reference-contract', 'Communication Reference Object Contract Skeleton', 'Skeleton index entry for communication reference Core objects.', 'communication']
] as const;

export const CORE_CONTRACT_INDEX = [
  {
    id: createCoreContractId('core-domain-registry-contract'),
    type: CORE_CONTRACT_TYPES.domain,
    name: 'Core Domain Registry Contract',
    description: 'Index entry for the Core Domain Registry foundation primitive.',
    status: CORE_CONTRACT_STATUSES.active,
    scope: { notes: 'domain-level registry / all baseline domains' },
    version: 1,
    book: coreBook,
    createdAt
  },
  {
    id: createCoreContractId('core-object-base-contract'),
    type: CORE_CONTRACT_TYPES.object,
    name: 'Core Object Base Contract',
    description: 'Index entry for the Core Object Base foundation primitive.',
    status: CORE_CONTRACT_STATUSES.active,
    scope: { notes: 'object base primitives' },
    version: 1,
    book: coreBook,
    createdAt
  },
  {
    id: createCoreContractId('core-event-primitive-contract'),
    type: CORE_CONTRACT_TYPES.event,
    name: 'Core Event Primitive Contract',
    description: 'Index entry for the Core Event Primitive foundation primitive.',
    status: CORE_CONTRACT_STATUSES.active,
    scope: { notes: 'event primitive' },
    version: 1,
    book: coreBook,
    createdAt
  },
  {
    id: createCoreContractId('core-task-primitive-contract'),
    type: CORE_CONTRACT_TYPES.task,
    name: 'Core Task Primitive Contract',
    description: 'Index entry for the Core Task Primitive foundation primitive.',
    status: CORE_CONTRACT_STATUSES.active,
    scope: { notes: 'task primitive' },
    version: 1,
    book: coreBook,
    createdAt
  },
  {
    id: createCoreContractId('core-workflow-contract-primitive-contract'),
    type: CORE_CONTRACT_TYPES.workflow,
    name: 'Core Workflow Contract Primitive Contract',
    description: 'Index entry for the Core Workflow Contract Primitive foundation primitive.',
    status: CORE_CONTRACT_STATUSES.active,
    scope: { notes: 'workflow contract primitive' },
    version: 1,
    book: coreBook,
    createdAt
  },
  {
    id: createCoreContractId('core-validation-fixture-system-contract'),
    type: CORE_CONTRACT_TYPES.validation,
    name: 'Core Validation Fixture System Contract',
    description: 'Index entry for the Core Validation Fixture System foundation primitive.',
    status: CORE_CONTRACT_STATUSES.active,
    scope: { notes: 'validation fixture system' },
    version: 1,
    book: coreBook,
    createdAt
  },
  ...objectContractSkeletonEntries.map(([id, name, description, domainId]) => ({
    id: createCoreContractId(id),
    type: CORE_CONTRACT_TYPES.object,
    name,
    description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId },
    version: 1,
    book: coreBook,
    source: 'CORE_OBJECT_CONTRACT_SKELETONS',
    createdAt
  })),
  ...CORE_DOMAIN_CONTRACT_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.domain,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId: contract.domainId },
    version: 1,
    book: coreBook,
    source: 'CORE_DOMAIN_CONTRACT_SKELETONS',
    createdAt: contract.createdAt
  })),
  ...CORE_SERVICE_CONTRACT_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.service,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId: contract.domainId },
    version: 1,
    book: coreBook,
    source: 'CORE_SERVICE_CONTRACT_SKELETONS',
    createdAt: contract.createdAt
  }))
] as const satisfies readonly CoreContractDefinition[];
