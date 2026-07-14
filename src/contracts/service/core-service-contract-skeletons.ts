import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreServiceContract } from './core-service-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const canonicalCreatedAt = '2026-07-11T00:00:00.000Z';
const specificationPath = 'books/book-02-core-specification/';
const serviceSourceRoot = `${specificationPath}core-specs/services/`;
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

const canonicalServiceSkeleton = (
  serviceType: string,
  domainId: CoreDomainId,
  name: string,
  sourceFile: string,
  purpose: string,
  owns: readonly string[],
  consumes: readonly string[],
  produces: readonly string[],
  specificNonGoals: readonly string[],
  implementationTask: 'CORE-TASK-021' | 'CORE-TASK-038' = 'CORE-TASK-021'
): CoreServiceContract => ({
  ...serviceSkeleton(
    serviceType,
    domainId,
    name,
    `Canonical metadata skeleton for the ${domainId} Core Service boundary.`,
    purpose,
    owns,
    consumes,
    produces
  ),
  nonGoals: [...nonGoals, ...specificNonGoals],
  sourcePath: `${serviceSourceRoot}${sourceFile}`,
  implementationDepth: 'validated_skeleton',
  createdAt: canonicalCreatedAt,
  metadata: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath,
    implementationTask,
    ...(serviceType === 'customer-service'
      ? {
          behaviorImplementationTask: 'CORE-TASK-036',
          behaviorDepth: 'level_2_3',
          implementedOperations: [
            'createCustomer',
            'getCustomer',
            'listCustomers',
            'validateCustomerReference',
            'changeCustomerStatus'
          ]
        }
      : serviceType === 'brand-service'
        ? {
            behaviorImplementationTask: 'CORE-TASK-037',
            behaviorDepth: 'level_2_3',
            implementedOperations: [
              'createBrand',
              'getBrand',
              'listBrands',
              'validateBrandReference',
              'changeBrandStatus'
            ]
          }
        : serviceType === 'trademark-service'
          ? {
              behaviorImplementationTask: 'CORE-TASK-038',
              behaviorDepth: 'level_2_3',
              implementedOperations: [
                'createTrademark',
                'getTrademark',
                'listTrademarks',
                'validateTrademarkReference',
                'changeTrademarkStatus'
              ]
            }
          : {})
  }
});

const stubServiceTargets = [
  ['opportunity', 'Opportunity'],
  ['notification', 'Notification'],
  ['partner', 'Partner'],
  ['agent', 'Agent'],
  ['service-provider', 'Service Provider'],
  ['service-network', 'Service Network'],
  ['routing', 'Routing']
] as const satisfies readonly (readonly [CoreDomainId, string])[];

const stubServiceSkeleton = (
  domainId: CoreDomainId,
  domainName: string
): CoreServiceContract => ({
  ...serviceSkeleton(
    `${domainId}-service`,
    domainId,
    `Core ${domainName} Service Contract Skeleton`,
    `Safe metadata-only stub for the ${domainName} Core Service boundary.`,
    `Reserves the canonical ${domainName} service ownership boundary without claiming methods, coordination, mutation, execution, or runtime availability.`,
    [`${domainName} structural service ownership and reference boundary.`],
    [`${domainName} Domain and Object contract references.`],
    [`${domainName} structural service-boundary references.`]
  ),
  nonGoals: [
    ...nonGoals,
    'Operational availability, fake success, production readiness, or implemented service behavior.'
  ],
  sourcePath: `${serviceSourceRoot}${domainId}-service.md`,
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

export const CORE_SERVICE_CONTRACT_SKELETONS = [
  serviceSkeleton('identity-resolution-service', 'identity', 'Identity Resolution Service Contract Skeleton', 'Skeleton contract boundary for identity resolution service responsibilities.', 'Establishes a service contract placeholder for identity ownership boundaries without resolving identities in executable form.', ['Identity resolution service contract boundary.'], ['identity domain references'], ['identity boundary references']),
  serviceSkeleton('permission-evaluation-service', 'permission', 'Permission Evaluation Service Contract Skeleton', 'Skeleton contract boundary for permission evaluation service responsibilities.', 'Establishes a service contract placeholder for permission ownership boundaries without implementing permission decisions.', ['Permission evaluation service contract boundary.'], ['permission domain references', 'identity boundary references'], ['permission evaluation references']),
  serviceSkeleton('policy-evaluation-service', 'policy', 'Policy Evaluation Service Contract Skeleton', 'Skeleton contract boundary for policy evaluation service responsibilities.', 'Establishes a service contract placeholder for policy ownership boundaries without implementing policy execution.', ['Policy evaluation service contract boundary.'], ['policy domain references'], ['policy evaluation references']),
  serviceSkeleton('knowledge-reference-service', 'knowledge', 'Knowledge Reference Service Contract Skeleton', 'Skeleton contract boundary for knowledge reference service responsibilities.', 'Establishes a service contract placeholder for knowledge reference boundaries without implementing retrieval behavior.', ['Knowledge reference service contract boundary.'], ['knowledge domain references'], ['knowledge reference outputs']),
  canonicalServiceSkeleton(
    'trademark-service',
    'trademark',
    'Core Trademark Service Contract Skeleton',
    'trademark-service.md',
    'Defines the Trademark service ownership boundary for legal and procedural protection records without implementing filing, prosecution, registry synchronization, deadline calculation, fee calculation, similarity scoring, or legal conclusions.',
    ['Trademark service ownership, validation, lifecycle, relationship-reference, and reference boundary.'],
    ['trademark, brand, jurisdiction, classification, document, evidence, and matter references'],
    ['trademark boundary references'],
    ['Official registry synchronization, filing execution, prosecution workflow, deadline engine, fee engine, registrability scoring, similarity search, or legal opinion automation.'],
    'CORE-TASK-038'
  ),
  serviceSkeleton('jurisdiction-reference-service', 'jurisdiction', 'Jurisdiction Reference Service Contract Skeleton', 'Skeleton contract boundary for jurisdiction reference service responsibilities.', 'Establishes a service contract placeholder for jurisdiction references without implementing legal lookup behavior.', ['Jurisdiction reference service contract boundary.'], ['jurisdiction domain references'], ['jurisdiction reference outputs']),
  serviceSkeleton('classification-reference-service', 'classification', 'Classification Reference Service Contract Skeleton', 'Skeleton contract boundary for classification reference service responsibilities.', 'Establishes a service contract placeholder for classification references without implementing classification behavior.', ['Classification reference service contract boundary.'], ['classification domain references'], ['classification reference outputs']),
  serviceSkeleton('document-reference-service', 'document', 'Document Reference Service Contract Skeleton', 'Skeleton contract boundary for document reference service responsibilities.', 'Establishes a service contract placeholder for document references without document storage or rendering behavior.', ['Document reference service contract boundary.'], ['document domain references'], ['document reference outputs']),
  serviceSkeleton('evidence-reference-service', 'evidence', 'Evidence Reference Service Contract Skeleton', 'Skeleton contract boundary for evidence reference service responsibilities.', 'Establishes a service contract placeholder for evidence references without evidence processing behavior.', ['Evidence reference service contract boundary.'], ['evidence domain references'], ['evidence reference outputs']),
  serviceSkeleton('communication-reference-service', 'communication', 'Communication Reference Service Contract Skeleton', 'Skeleton contract boundary for communication reference service responsibilities.', 'Establishes a service contract placeholder for communication references without communication runtime behavior.', ['Communication reference service contract boundary.'], ['communication domain references'], ['communication reference outputs']),
  canonicalServiceSkeleton(
    'organization-service',
    'organization',
    'Core Organization Service Contract Skeleton',
    'organization-service.md',
    'Defines the Organization service ownership boundary for governed operating-context records without implementing creation, mutation, linkage, membership, permission, policy, or tenant behavior.',
    ['Organization service ownership, validation, linkage, and reference boundary.'],
    ['organization references', 'identity and user references'],
    ['organization boundary references'],
    ['Organization mutation, tenant runtime, membership administration, permission evaluation, policy enforcement, or billing accounts.']
  ),
  canonicalServiceSkeleton(
    'user-service',
    'user',
    'Core User Service Contract Skeleton',
    'user-service.md',
    'Defines the User service ownership boundary for account-participant records without implementing accounts, authentication, lifecycle mutation, identity resolution, or membership behavior.',
    ['User service ownership, validation, identity-linkage, organization-linkage, and reference boundary.'],
    ['user, identity, and organization references'],
    ['user boundary references'],
    ['Account runtime, authentication, credential handling, user mutation, membership administration, or permission grants.']
  ),
  canonicalServiceSkeleton(
    'brand-service',
    'brand',
    'Core Brand Service Contract Skeleton',
    'brand-service.md',
    'Defines the Brand service ownership boundary for commercial-identity records without implementing intake, naming, trademark linkage mutation, recommendation, or product behavior.',
    ['Brand service ownership, validation, relationship, and reference boundary.'],
    ['brand, customer, and trademark references'],
    ['brand boundary references'],
    ['Brand intake execution, naming generation, trademark filing, AI recommendations, record mutation, or product catalog behavior.']
  ),
  canonicalServiceSkeleton(
    'customer-service',
    'customer',
    'Core Customer Service Contract Skeleton',
    'customer-service.md',
    'Defines the Customer service ownership boundary for demand-side commercial-party records without implementing intake, CRM, billing, order creation, or relationship mutation.',
    ['Customer service ownership, validation, linkage, and reference boundary.'],
    ['customer, organization, brand, and opportunity references'],
    ['customer boundary references'],
    ['Customer intake execution, CRM automation, billing accounts, order creation, relationship mutation, or contact management.']
  ),
  canonicalServiceSkeleton(
    'matter-service',
    'matter',
    'Core Matter Service Contract Skeleton',
    'matter-service.md',
    'Defines the Matter service ownership boundary for professional-execution containers without implementing case work, workflow application, task creation, status mutation, or professional decisions.',
    ['Matter service ownership, validation, linkage, lifecycle-reference, and boundary coordination.'],
    ['matter, order, workflow, task, document, and evidence references'],
    ['matter boundary references'],
    ['Professional execution, case decisions, workflow apply, task creation, status mutation, filing, or Product UI case cards.']
  ),
  canonicalServiceSkeleton(
    'order-service',
    'order',
    'Core Order Service Contract Skeleton',
    'order-service.md',
    'Defines the Order service ownership boundary for commercial service requests without implementing conversion, pricing, payment, invoicing, matter creation, or workflow execution.',
    ['Order service ownership, validation, linkage, conversion-boundary, and reference coordination.'],
    ['order, customer, opportunity, brand, trademark, and matter references'],
    ['order boundary references'],
    ['Order mutation, pricing engine, payment, invoicing, checkout, matter creation, workflow execution, or professional work.']
  ),
  canonicalServiceSkeleton(
    'workflow-contract-service',
    'workflow-contract',
    'Core Workflow Contract Service Contract Skeleton',
    'workflow-contract-service.md',
    'Defines the Workflow Contract service ownership boundary for governed execution structures without implementing creation, transition validation, apply, task creation, event emission, or workflow runtime.',
    ['Workflow Contract service ownership, definition validation, reference, and governance boundary.'],
    ['workflow contract, matter, task, event, permission, and policy references'],
    ['workflow contract boundary references'],
    ['Workflow engine, running instances, transition execution, direct mutation, task creation, event emission, or review decisions.']
  ),
  canonicalServiceSkeleton(
    'task-service',
    'task',
    'Core Task Service Contract Skeleton',
    'task-service.md',
    'Defines the Task service ownership boundary for actionable work units without implementing creation, assignment, scheduling, completion, review, status mutation, or event emission.',
    ['Task service ownership, validation, assignment-reference, scheduling-reference, and lifecycle boundary.'],
    ['task, matter, workflow, user, permission, policy, and event references'],
    ['task boundary references'],
    ['Task execution, assignment automation, scheduling engine, completion, review approval, status mutation, notification, or event emission.']
  ),
  canonicalServiceSkeleton(
    'event-service',
    'event',
    'Core Event Service Contract Skeleton',
    'event-service.md',
    'Defines the Event service ownership boundary for meaningful-occurrence records without implementing recording, dispatch, publication, consumption, persistence, or integration triggers.',
    ['Event service ownership, validation, source, visibility, reference, and trace boundary.'],
    ['event, source-domain, source-object, actor, correlation, and causation references'],
    ['event boundary references'],
    ['Event recording, dispatch, bus, sourcing, subscription, persistence, trigger execution, audit logging, or product activity feeds.']
  ),
  ...stubServiceTargets.map(([domainId, domainName]) =>
    stubServiceSkeleton(domainId, domainName)
  )
] as const satisfies readonly CoreServiceContract[];
