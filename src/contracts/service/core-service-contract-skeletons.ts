import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreServiceContract } from './core-service-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const standardNonGoals = [
  'Executable service functions or implementations.',
  'API routes, database access, workflow runtime, or Book 03 execution behavior.',
  'Product UI, business-specific behavior, or AI agent authority.'
] as const;

const service = (serviceType: string, domainId: string, label: string, purpose: string): CoreServiceContract => ({
  id: createCoreContractId(`core-service-${serviceType}-contract`),
  serviceType,
  domainId: domainId as CoreServiceContract['domainId'],
  name: `${label} Service Contract Skeleton`,
  description: `Skeleton contract boundary for the ${label} Core service.`,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  owns: [`${label} service contract placeholder and ownership boundary.`],
  consumes: [`${domainId} domain contract boundary.`],
  produces: [`${label} service contract references.`],
  allowedOperations: ['Reference lookup categories.', 'Boundary evaluation categories.', 'Contract metadata categories.'],
  nonGoals: standardNonGoals,
  createdAt
});

export const CORE_SERVICE_CONTRACT_SKELETONS = [
  service('identity-resolution-service', 'identity', 'Identity Resolution', 'Defines the placeholder boundary for resolving Core identity references without implementing identity lookup logic.'),
  service('permission-evaluation-service', 'permission', 'Permission Evaluation', 'Defines the placeholder boundary for permission evaluation references without implementing authorization logic.'),
  service('policy-evaluation-service', 'policy', 'Policy Evaluation', 'Defines the placeholder boundary for policy evaluation references without implementing policy decision logic.'),
  service('knowledge-reference-service', 'knowledge', 'Knowledge Reference', 'Defines the placeholder boundary for knowledge references without implementing knowledge retrieval logic.'),
  service('trademark-reference-service', 'trademark', 'Trademark Reference', 'Defines the placeholder boundary for trademark references without implementing trademark-specific service behavior.'),
  service('jurisdiction-reference-service', 'jurisdiction', 'Jurisdiction Reference', 'Defines the placeholder boundary for jurisdiction references without implementing jurisdiction rules.'),
  service('classification-reference-service', 'classification', 'Classification Reference', 'Defines the placeholder boundary for classification references without implementing classification decisions.'),
  service('document-reference-service', 'document', 'Document Reference', 'Defines the placeholder boundary for document references without implementing document storage or rendering.'),
  service('evidence-reference-service', 'evidence', 'Evidence Reference', 'Defines the placeholder boundary for evidence references without implementing evidence workflows.'),
  service('communication-reference-service', 'communication', 'Communication Reference', 'Defines the placeholder boundary for communication references without implementing communication runtime behavior.')
] as const satisfies readonly CoreServiceContract[];
