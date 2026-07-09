import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreServiceContract } from './core-service-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const nonGoals = [
  'Executable service method definitions or service implementations.',
  'API routes, database access, workflow runtime, or Book 03 execution behavior.',
  'Product UI behavior, concrete business logic, or AI agent authority.'
] as const;
const allowedOperations = ['reference lookup category', 'boundary evaluation category', 'contract-owned coordination category'] as const;

const serviceSkeleton = (serviceType: string, domainId: CoreDomainId, name: string, description: string, purpose: string, owns: readonly string[], consumes?: readonly string[], produces?: readonly string[]): CoreServiceContract => ({
  id: createCoreContractId(`core-service-${serviceType}-contract`),
  serviceType,
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

export const CORE_SERVICE_CONTRACT_SKELETONS = [
  serviceSkeleton('identity-resolution-service', 'identity', 'Identity Resolution Service Contract Skeleton', 'Skeleton contract boundary for identity resolution service responsibilities.', 'Establishes a service contract placeholder for identity ownership boundaries without resolving identities in executable form.', ['Identity resolution service contract boundary.'], ['identity domain references'], ['identity boundary references']),
  serviceSkeleton('permission-evaluation-service', 'permission', 'Permission Evaluation Service Contract Skeleton', 'Skeleton contract boundary for permission evaluation service responsibilities.', 'Establishes a service contract placeholder for permission ownership boundaries without implementing permission decisions.', ['Permission evaluation service contract boundary.'], ['permission domain references', 'identity boundary references'], ['permission evaluation references']),
  serviceSkeleton('policy-evaluation-service', 'policy', 'Policy Evaluation Service Contract Skeleton', 'Skeleton contract boundary for policy evaluation service responsibilities.', 'Establishes a service contract placeholder for policy ownership boundaries without implementing policy execution.', ['Policy evaluation service contract boundary.'], ['policy domain references'], ['policy evaluation references']),
  serviceSkeleton('knowledge-reference-service', 'knowledge', 'Knowledge Reference Service Contract Skeleton', 'Skeleton contract boundary for knowledge reference service responsibilities.', 'Establishes a service contract placeholder for knowledge reference boundaries without implementing retrieval behavior.', ['Knowledge reference service contract boundary.'], ['knowledge domain references'], ['knowledge reference outputs']),
  serviceSkeleton('trademark-reference-service', 'trademark', 'Trademark Reference Service Contract Skeleton', 'Skeleton contract boundary for trademark reference service responsibilities.', 'Establishes a service contract placeholder for trademark references without trademark-specific service behavior.', ['Trademark reference service contract boundary.'], ['trademark domain references'], ['trademark reference outputs']),
  serviceSkeleton('jurisdiction-reference-service', 'jurisdiction', 'Jurisdiction Reference Service Contract Skeleton', 'Skeleton contract boundary for jurisdiction reference service responsibilities.', 'Establishes a service contract placeholder for jurisdiction references without implementing legal lookup behavior.', ['Jurisdiction reference service contract boundary.'], ['jurisdiction domain references'], ['jurisdiction reference outputs']),
  serviceSkeleton('classification-reference-service', 'classification', 'Classification Reference Service Contract Skeleton', 'Skeleton contract boundary for classification reference service responsibilities.', 'Establishes a service contract placeholder for classification references without implementing classification behavior.', ['Classification reference service contract boundary.'], ['classification domain references'], ['classification reference outputs']),
  serviceSkeleton('document-reference-service', 'document', 'Document Reference Service Contract Skeleton', 'Skeleton contract boundary for document reference service responsibilities.', 'Establishes a service contract placeholder for document references without document storage or rendering behavior.', ['Document reference service contract boundary.'], ['document domain references'], ['document reference outputs']),
  serviceSkeleton('evidence-reference-service', 'evidence', 'Evidence Reference Service Contract Skeleton', 'Skeleton contract boundary for evidence reference service responsibilities.', 'Establishes a service contract placeholder for evidence references without evidence processing behavior.', ['Evidence reference service contract boundary.'], ['evidence domain references'], ['evidence reference outputs']),
  serviceSkeleton('communication-reference-service', 'communication', 'Communication Reference Service Contract Skeleton', 'Skeleton contract boundary for communication reference service responsibilities.', 'Establishes a service contract placeholder for communication references without communication runtime behavior.', ['Communication reference service contract boundary.'], ['communication domain references'], ['communication reference outputs'])
] as const satisfies readonly CoreServiceContract[];
