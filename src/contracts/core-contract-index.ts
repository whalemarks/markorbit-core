import type { CoreContractDefinition } from './core-contract-definition.ts';
import { createCoreContractId } from './core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from './core-contract-status.ts';
import { CORE_CONTRACT_TYPES } from './core-contract-type.ts';
import { CORE_DOMAIN_CONTRACT_SKELETONS } from './domain/core-domain-contract-skeletons.ts';
import { CORE_OBJECT_CONTRACT_SKELETONS } from './object/core-object-contract-skeletons.ts';
import { CORE_API_CONTRACT_SKELETONS } from './api/core-api-contract-skeletons.ts';
import { CORE_SERVICE_CONTRACT_SKELETONS } from './service/core-service-contract-skeletons.ts';
import { CORE_EVENT_CATALOG_SKELETONS } from './event/core-event-catalog-skeletons.ts';
import { CORE_WORKFLOW_CATALOG_SKELETONS } from './workflow/core-workflow-catalog-skeletons.ts';
import { CORE_PERMISSION_CONTRACT_SKELETONS } from './permission/core-permission-contract-skeletons.ts';
import { CORE_POLICY_CONTRACT_SKELETONS } from './policy/core-policy-contract-skeletons.ts';

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
  })),
  ...CORE_API_CONTRACT_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.api,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: contract.domainId === undefined ? {} : { domainId: contract.domainId },
    version: 1,
    book: coreBook,
    source: 'CORE_API_CONTRACT_SKELETONS',
    createdAt: contract.createdAt
  })),
  ...CORE_EVENT_CATALOG_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.event,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId: contract.domainId, eventType: contract.eventType },
    version: 1,
    book: coreBook,
    source: 'CORE_EVENT_CATALOG_SKELETONS',
    createdAt: contract.createdAt
  })),
  ...CORE_WORKFLOW_CATALOG_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.workflow,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId: contract.domainId, workflowContractType: contract.workflowType },
    version: 1,
    book: coreBook,
    source: 'CORE_WORKFLOW_CATALOG_SKELETONS',
    createdAt: contract.createdAt
  })),
  ...CORE_PERMISSION_CONTRACT_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.permission,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId: contract.domainId },
    version: 1,
    book: coreBook,
    source: 'CORE_PERMISSION_CONTRACT_SKELETONS',
    createdAt: contract.createdAt
  })),
  ...CORE_POLICY_CONTRACT_SKELETONS.map((contract) => ({
    id: contract.id,
    type: CORE_CONTRACT_TYPES.policy,
    name: contract.name,
    description: contract.description,
    status: CORE_CONTRACT_STATUSES.active,
    scope: { domainId: contract.domainId },
    version: 1,
    book: coreBook,
    source: 'CORE_POLICY_CONTRACT_SKELETONS',
    createdAt: contract.createdAt
  }))
] as const satisfies readonly CoreContractDefinition[];
