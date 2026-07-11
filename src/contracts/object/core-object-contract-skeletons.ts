import { createCoreObjectType } from '../../objects/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreObjectContract } from './core-object-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const canonicalCreatedAt = '2026-07-11T00:00:00.000Z';
const specificationPath = 'books/book-02-core-specification/';
const objectSourceRoot = `${specificationPath}core-specs/objects/`;
const base = 'CoreObjectDefinition';
const requiredBaseFields = ['id', 'type', 'domainId', 'status', 'version', 'metadata'] as const;
const nonGoals = [
  'Full object schema fields or business-specific data fields.',
  'Service, API, workflow, runtime, database, or product UI behavior.',
  'Book 03 execution runtime concepts or AI agent authority.'
] as const;

const objectSkeleton = (objectType: string, domainId: CoreObjectContract['domainId'], name: string, description: string, purpose: string): CoreObjectContract => ({
  id: createCoreContractId(`core-object-${objectType}-contract`),
  objectType: createCoreObjectType(objectType),
  domainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  base,
  owns: [`Skeleton contract boundary for ${name}.`],
  requiredBaseFields,
  nonGoals,
  createdAt
});

const canonicalObjectSkeleton = (
  objectType: string,
  domainId: CoreObjectContract['domainId'],
  name: string,
  sourceFile: string,
  purpose: string,
  owns: readonly string[],
  specificNonGoals: readonly string[]
): CoreObjectContract => ({
  ...objectSkeleton(
    objectType,
    domainId,
    name,
    `Canonical metadata skeleton for the ${domainId} Core Object boundary.`,
    purpose
  ),
  owns,
  nonGoals: [...nonGoals, ...specificNonGoals],
  sourcePath: `${objectSourceRoot}${sourceFile}`,
  implementationDepth: 'validated_skeleton',
  createdAt: canonicalCreatedAt,
  metadata: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath,
    implementationTask: 'CORE-TASK-021'
  }
});

const stubObjectTargets = [
  ['opportunity', 'Opportunity'],
  ['notification', 'Notification'],
  ['partner', 'Partner'],
  ['agent', 'Agent'],
  ['service-provider', 'Service Provider'],
  ['service-network', 'Service Network'],
  ['routing', 'Routing']
] as const satisfies readonly (readonly [CoreObjectContract['domainId'], string])[];

const stubObjectSkeleton = (
  domainId: CoreObjectContract['domainId'],
  domainName: string
): CoreObjectContract => ({
  ...objectSkeleton(
    `${domainId}-record`,
    domainId,
    `Core ${domainName} Object Contract Skeleton`,
    `Safe metadata-only stub for the ${domainName} Core Object boundary.`,
    `Reserves the canonical ${domainName} object boundary without claiming schema, persistence, lifecycle, validation, or runtime capability.`
  ),
  owns: [`${domainName} structural object-reference boundary.`],
  nonGoals: [
    ...nonGoals,
    'Operational availability, successful execution, production readiness, or implemented domain behavior.'
  ],
  sourcePath: `${objectSourceRoot}${domainId}.md`,
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

export const CORE_OBJECT_CONTRACT_SKELETONS = [
  objectSkeleton('user-record', 'user', 'User Record Object Contract Skeleton', 'Skeleton contract boundary for User Record Core objects.', 'Establishes the object contract placeholder for user records using only CoreObjectDefinition base fields.'),
  objectSkeleton('organization-record', 'organization', 'Organization Record Object Contract Skeleton', 'Skeleton contract boundary for Organization Record Core objects.', 'Establishes the object contract placeholder for organization records using only CoreObjectDefinition base fields.'),
  objectSkeleton('permission-policy-record', 'policy', 'Permission Policy Record Object Contract Skeleton', 'Skeleton contract boundary for Permission Policy Record Core objects.', 'Establishes the object contract placeholder for permission policy records using only CoreObjectDefinition base fields.'),
  objectSkeleton('knowledge-source-record', 'knowledge', 'Knowledge Source Record Object Contract Skeleton', 'Skeleton contract boundary for Knowledge Source Record Core objects.', 'Establishes the object contract placeholder for knowledge source records using only CoreObjectDefinition base fields.'),
  objectSkeleton('brand-record', 'brand', 'Brand Record Object Contract Skeleton', 'Skeleton contract boundary for Brand Record Core objects.', 'Establishes the object contract placeholder for brand records using only CoreObjectDefinition base fields.'),
  objectSkeleton('trademark-record', 'trademark', 'Trademark Record Object Contract Skeleton', 'Skeleton contract boundary for Trademark Record Core objects.', 'Establishes the object contract placeholder for trademark records using only CoreObjectDefinition base fields.'),
  objectSkeleton('jurisdiction-record', 'jurisdiction', 'Jurisdiction Record Object Contract Skeleton', 'Skeleton contract boundary for Jurisdiction Record Core objects.', 'Establishes the object contract placeholder for jurisdiction records using only CoreObjectDefinition base fields.'),
  objectSkeleton('classification-record', 'classification', 'Classification Record Object Contract Skeleton', 'Skeleton contract boundary for Classification Record Core objects.', 'Establishes the object contract placeholder for classification records using only CoreObjectDefinition base fields.'),
  objectSkeleton('document-record', 'document', 'Document Record Object Contract Skeleton', 'Skeleton contract boundary for Document Record Core objects.', 'Establishes the object contract placeholder for document records using only CoreObjectDefinition base fields.'),
  objectSkeleton('evidence-record', 'evidence', 'Evidence Record Object Contract Skeleton', 'Skeleton contract boundary for Evidence Record Core objects.', 'Establishes the object contract placeholder for evidence records using only CoreObjectDefinition base fields.'),
  objectSkeleton('matter-record', 'matter', 'Matter Record Object Contract Skeleton', 'Skeleton contract boundary for Matter Record Core objects.', 'Establishes the object contract placeholder for matter records using only CoreObjectDefinition base fields.'),
  objectSkeleton('communication-record', 'communication', 'Communication Record Object Contract Skeleton', 'Skeleton contract boundary for Communication Record Core objects.', 'Establishes the object contract placeholder for communication records using only CoreObjectDefinition base fields.'),
  canonicalObjectSkeleton(
    'identity-record',
    'identity',
    'Core Identity Object Contract Skeleton',
    'identity.md',
    'Defines the Core-recognized actor-reference object boundary without implementing identity resolution, authentication, permission, role, membership, or account lifecycle behavior.',
    ['Identity actor-reference object contract boundary.'],
    ['Authentication, account lifecycle, permission grants, role assignment, or organization membership.']
  ),
  canonicalObjectSkeleton(
    'permission-record',
    'permission',
    'Core Permission Object Contract Skeleton',
    'permission.md',
    'Defines the controlled-action authorization-rule object boundary without evaluating permissions, enforcing access, or granting authority.',
    ['Permission rule, controlled action, actor, and scope object boundary.'],
    ['Permission evaluation, authorization middleware, role administration, policy enforcement, or protected-action execution.']
  ),
  canonicalObjectSkeleton(
    'customer-record',
    'customer',
    'Core Customer Object Contract Skeleton',
    'customer.md',
    'Defines the demand-side commercial-party object boundary without implementing intake, billing, order processing, relationship management, or product behavior.',
    ['Customer commercial-party and relationship-reference object boundary.'],
    ['Customer intake execution, billing accounts, CRM automation, order creation, or organization identity.']
  ),
  canonicalObjectSkeleton(
    'order-record',
    'order',
    'Core Order Object Contract Skeleton',
    'order.md',
    'Defines the commercial service-request object boundary without implementing payment, invoicing, pricing, professional execution, checkout, or matter lifecycle behavior.',
    ['Order commercial service-request and related-reference object boundary.'],
    ['Payment, invoice, pricing engine, checkout, matter execution, task work, or workflow execution.']
  ),
  canonicalObjectSkeleton(
    'workflow-contract-record',
    'workflow-contract',
    'Core Workflow Contract Object Contract Skeleton',
    'workflow-contract.md',
    'Defines the governed workflow-structure object boundary without implementing transitions, guards, task creation, event emission, automation, or a workflow engine.',
    ['Workflow Contract definition, state, transition, guard, responsibility, and reference boundary.'],
    ['Workflow runtime, transition execution, running instances, direct mutation, task creation, or event emission.']
  ),
  canonicalObjectSkeleton(
    'task-record',
    'task',
    'Core Task Object Contract Skeleton',
    'task.md',
    'Defines the actionable work-unit object boundary without implementing assignment, scheduling, completion, review, notification, or professional decisions.',
    ['Task work-unit, assignee, status, priority, due-reference, and trace boundary.'],
    ['Task execution, assignment automation, scheduling engine, completion decisions, review approval, or notification delivery.']
  ),
  canonicalObjectSkeleton(
    'event-record',
    'event',
    'Core Event Object Contract Skeleton',
    'event.md',
    'Defines the meaningful-occurrence record boundary without implementing event emission, dispatch, consumption, persistence, sourcing, or workflow logic.',
    ['Event occurrence, source, subject, actor, correlation, causation, and trace boundary.'],
    ['Event bus, event sourcing, dispatch, subscription, persistence, workflow execution, or implementation logging.']
  ),
  ...stubObjectTargets.map(([domainId, domainName]) =>
    stubObjectSkeleton(domainId, domainName)
  )
] as const satisfies readonly CoreObjectContract[];
