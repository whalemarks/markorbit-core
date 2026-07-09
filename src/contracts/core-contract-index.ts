import type { CoreContractDefinition } from './core-contract-definition.ts';
import { createCoreContractId } from './core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from './core-contract-status.ts';
import { CORE_CONTRACT_TYPES } from './core-contract-type.ts';
import { CORE_DOMAIN_CONTRACT_SKELETONS } from './domain/core-domain-contract-skeletons.ts';
import { CORE_OBJECT_CONTRACT_SKELETONS } from './object/core-object-contract-skeletons.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';

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
  ...CORE_OBJECT_CONTRACT_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.object,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId: contract.domainId, objectType: contract.objectType },
    version: 1,
    book: coreBook,
    source: 'CORE_OBJECT_CONTRACT_SKELETONS',
    createdAt: contract.createdAt
  }))
] as const satisfies readonly CoreContractDefinition[];
