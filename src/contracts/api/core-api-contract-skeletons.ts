import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreApiContract } from './core-api-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
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

export const CORE_API_CONTRACT_SKELETONS = [
  apiSkeleton('core-domain-registry-api', 'Core Domain Registry API Contract Skeleton', 'Skeleton exposure boundary for Core domain registry references.', 'Establishes a contract-level API boundary for discovering Core domains without defining routes or handlers.', ['Core domain registry API contract boundary.'], undefined, ['Core domain registry contract references'], ['Core domain registry exposure references']),
  apiSkeleton('core-object-reference-api', 'Core Object Reference API Contract Skeleton', 'Skeleton exposure boundary for Core object reference contracts.', 'Establishes a contract-level API boundary for Core object references without concrete DTO schemas.', ['Core object reference API contract boundary.'], undefined, ['Core object contract references'], ['Core object exposure references']),
  apiSkeleton('core-event-reference-api', 'Core Event Reference API Contract Skeleton', 'Skeleton exposure boundary for Core event reference contracts.', 'Establishes a contract-level API boundary for Core event references without event runtime behavior.', ['Core event reference API contract boundary.'], 'event', ['Core event contract references'], ['Core event exposure references']),
  apiSkeleton('core-task-reference-api', 'Core Task Reference API Contract Skeleton', 'Skeleton exposure boundary for Core task reference contracts.', 'Establishes a contract-level API boundary for Core task references without task runtime behavior.', ['Core task reference API contract boundary.'], 'task', ['Core task contract references'], ['Core task exposure references']),
  apiSkeleton('core-workflow-contract-reference-api', 'Core Workflow Contract Reference API Contract Skeleton', 'Skeleton exposure boundary for Core workflow contract references.', 'Establishes a contract-level API boundary for workflow contract references without workflow engine behavior.', ['Core workflow contract reference API contract boundary.'], 'workflow-contract', ['Core workflow contract references'], ['Core workflow contract exposure references']),
  apiSkeleton('core-contract-index-api', 'Core Contract Index API Contract Skeleton', 'Skeleton exposure boundary for the Core contract index.', 'Establishes a contract-level API boundary for the Core Contract Index without implementing an API server.', ['Core contract index API contract boundary.'], undefined, ['Core contract index references'], ['Core contract index exposure references']),
  apiSkeleton('core-validation-api', 'Core Validation API Contract Skeleton', 'Skeleton exposure boundary for Core validation references.', 'Establishes a contract-level API boundary for validation references without service logic or database access.', ['Core validation API contract boundary.'], 'policy', ['Core validation contract references'], ['Core validation exposure references']),
  apiSkeleton('core-health-api', 'Core Health API Contract Skeleton', 'Skeleton exposure boundary for Core health metadata.', 'Establishes a contract-level API boundary for health metadata without runtime monitoring implementation.', ['Core health API contract boundary.'], undefined, ['Core contract health references'], ['Core health exposure references'])
] as const satisfies readonly CoreApiContract[];
