import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreApiContract } from './core-api-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const canonicalCreatedAt = '2026-07-11T00:00:00.000Z';
const specificationPath = 'books/book-02-core-specification/';
const apiSourceRoot = `${specificationPath}core-specs/contracts/api/`;
const nonGoals = [
  'Executable API server routes, handlers, middleware, or HTTP framework behavior.',
  'Request or response DTO schemas, database access, service implementation, or business logic.',
  'Book 03 execution runtime behavior, Product UI behavior, or AI agent authority.'
] as const;
const allowedOperations = ['contract reference category', 'catalog read category', 'validation boundary category'] as const;

const apiSkeleton = (apiType: string, name: string, description: string, purpose: string, owns: readonly string[], domainId?: CoreDomainId, consumes?: readonly string[], produces?: readonly string[]): CoreApiContract => ({
  id: createCoreContractId(`core-api-${apiType}-contract`),
  apiType,
  domainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  owns,
  consumes,
  produces,
  allowedOperations,
  nonGoals,
  createdAt
});

const canonicalApiTargets = [
  ['identity', 'Identity'],
  ['organization', 'Organization'],
  ['user', 'User'],
  ['permission', 'Permission'],
  ['policy', 'Policy'],
  ['brand', 'Brand'],
  ['trademark', 'Trademark'],
  ['jurisdiction', 'Jurisdiction'],
  ['classification', 'Classification'],
  ['document', 'Document'],
  ['evidence', 'Evidence'],
  ['customer', 'Customer'],
  ['matter', 'Matter'],
  ['order', 'Order'],
  ['workflow-contract', 'Workflow Contract'],
  ['task', 'Task'],
  ['event', 'Event'],
  ['communication', 'Communication']
] as const satisfies readonly (readonly [CoreDomainId, string])[];

const canonicalApiSkeleton = (
  domainId: CoreDomainId,
  domainName: string
): CoreApiContract => ({
  ...apiSkeleton(
    `${domainId}-api`,
    `Core ${domainName} API Contract Skeleton`,
    `Canonical metadata skeleton for the ${domainName} API boundary.`,
    `Defines the governed request and safe-response contract boundary for ${domainName} operations without implementing routes, handlers, service behavior, mutation, or DTO schemas.`,
    [`${domainName} API contract boundary and owning-service delegation reference.`],
    domainId,
    [
      `${domainName} Domain, Object, and Service contract references.`,
      'Common contract context references.'
    ],
    [`Governed ${domainName} API response-boundary references.`]
  ),
  sourcePath: `${apiSourceRoot}${domainId}-api-contract.md`,
  implementationDepth: 'validated_skeleton',
  createdAt: canonicalCreatedAt,
  metadata: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath,
    implementationTask: 'CORE-TASK-022'
  }
});

const stubApiTargets = [
  ['knowledge', 'Knowledge'],
  ['opportunity', 'Opportunity'],
  ['notification', 'Notification'],
  ['partner', 'Partner'],
  ['agent', 'Agent'],
  ['service-provider', 'Service Provider'],
  ['service-network', 'Service Network'],
  ['routing', 'Routing']
] as const satisfies readonly (readonly [CoreDomainId, string])[];

const stubApiSkeleton = (
  domainId: CoreDomainId,
  domainName: string
): CoreApiContract => ({
  ...apiSkeleton(
    `${domainId}-api`,
    `Core ${domainName} API Contract Skeleton`,
    `Safe metadata-only stub for the ${domainName} API boundary.`,
    `Reserves the canonical ${domainName} request and safe-response boundary without claiming endpoints, handlers, DTOs, service execution, or API availability.`,
    [`${domainName} structural API and owning-service delegation boundary.`],
    domainId,
    [`${domainName} Domain, Object, and Service contract references.`],
    [`${domainName} structural API response-boundary references.`]
  ),
  nonGoals: [
    ...nonGoals,
    'Operational availability, fake success, production readiness, or implemented API behavior.'
  ],
  sourcePath: `${apiSourceRoot}${domainId}-api-contract.md`,
  implementationDepth: 'validated_skeleton',
  createdAt: canonicalCreatedAt,
  metadata: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath,
    implementationTask: 'CORE-TASK-023',
    mvpRequirement: 'stub_now'
  }
});

export const CORE_API_CONTRACT_SKELETONS = [
  apiSkeleton('core-domain-registry-api', 'Core Domain Registry API Contract Skeleton', 'Skeleton exposure boundary for Core domain registry references.', 'Establishes a contract-level API boundary for discovering Core domains without defining routes or handlers.', ['Core domain registry API contract boundary.'], undefined, ['Core domain registry contract references'], ['Core domain registry exposure references']),
  apiSkeleton('core-object-reference-api', 'Core Object Reference API Contract Skeleton', 'Skeleton exposure boundary for Core object reference contracts.', 'Establishes a contract-level API boundary for Core object references without concrete DTO schemas.', ['Core object reference API contract boundary.'], undefined, ['Core object contract references'], ['Core object exposure references']),
  apiSkeleton('core-event-reference-api', 'Core Event Reference API Contract Skeleton', 'Skeleton exposure boundary for Core event reference contracts.', 'Establishes a contract-level API boundary for Core event references without event runtime behavior.', ['Core event reference API contract boundary.'], 'event', ['Core event contract references'], ['Core event exposure references']),
  apiSkeleton('core-task-reference-api', 'Core Task Reference API Contract Skeleton', 'Skeleton exposure boundary for Core task reference contracts.', 'Establishes a contract-level API boundary for Core task references without task runtime behavior.', ['Core task reference API contract boundary.'], 'task', ['Core task contract references'], ['Core task exposure references']),
  apiSkeleton('core-workflow-contract-reference-api', 'Core Workflow Contract Reference API Contract Skeleton', 'Skeleton exposure boundary for Core workflow contract references.', 'Establishes a contract-level API boundary for workflow contract references without workflow engine behavior.', ['Core workflow contract reference API contract boundary.'], 'workflow-contract', ['Core workflow contract references'], ['Core workflow contract exposure references']),
  apiSkeleton('core-contract-index-api', 'Core Contract Index API Contract Skeleton', 'Skeleton exposure boundary for the Core contract index.', 'Establishes a contract-level API boundary for the Core Contract Index without implementing an API server.', ['Core contract index API contract boundary.'], undefined, ['Core contract index references'], ['Core contract index exposure references']),
  apiSkeleton('core-validation-api', 'Core Validation API Contract Skeleton', 'Skeleton exposure boundary for Core validation references.', 'Establishes a contract-level API boundary for validation references without service logic or database access.', ['Core validation API contract boundary.'], 'policy', ['Core validation contract references'], ['Core validation exposure references']),
  apiSkeleton('core-health-api', 'Core Health API Contract Skeleton', 'Skeleton exposure boundary for Core health metadata.', 'Establishes a contract-level API boundary for health metadata without runtime monitoring implementation.', ['Core health API contract boundary.'], undefined, ['Core contract health references'], ['Core health exposure references']),
  ...canonicalApiTargets.map(([domainId, domainName]) =>
    canonicalApiSkeleton(domainId, domainName)
  ),
  ...stubApiTargets.map(([domainId, domainName]) =>
    stubApiSkeleton(domainId, domainName)
  )
] as const satisfies readonly CoreApiContract[];
