import { createCoreObjectType } from '../../objects/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreObjectContract } from './core-object-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const canonicalCreatedAt = '2026-07-11T00:00:00.000Z';
const specificationPath = 'books/book-02-core-specification/';
const objectSourceRoot = `${specificationPath}core-specs/objects/`;
const base = 'CoreMvpObjectBaseRecord';
const CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS = [
  'publicReferenceId',
  'objectType',
  'domainId',
  'objectContractId',
  'metadata',
  'auditMetadata'
] as const;
const CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS = [
  'status',
  'version',
  'visibility'
] as const;
const commonOwns = [
  'Public Object reference boundary.',
  'Object type and Domain mapping boundary.',
  'Core metadata and audit metadata boundary.',
  'Status, version, and Permission/Policy visibility applicability boundary.'
] as const;
const nonGoals = [
  'Full object schema fields or business-specific data fields.',
  'Service, API, workflow, runtime, database, repository, persistence, or product UI behavior.',
  'ID generation, ID uniqueness storage, Permission evaluation, or Policy evaluation.',
  'Book 03 execution runtime concepts or AI agent authority.'
] as const;

type ObjectRequirement = 'must_build_now' | 'stub_now';

const purposeFor = (domainId: string, requirement: ObjectRequirement) =>
  requirement === 'must_build_now'
    ? `Defines the canonical ${domainId} Core Object public-reference and base-validation boundary without implementing Domain business behavior.`
    : `Reserves the canonical ${domainId} Object boundary without claiming schema, persistence, lifecycle, validation, or runtime capability.`;

const objectSkeleton = (input: {
  readonly domainId: CoreObjectContract['domainId'];
  readonly objectType: string;
  readonly id: string;
  readonly name: string;
  readonly mvpRequirement: ObjectRequirement;
}): CoreObjectContract => ({
  id: createCoreContractId(input.id),
  objectType: createCoreObjectType(input.objectType),
  domainId: input.domainId,
  name: input.name,
  description: `Canonical metadata skeleton for the ${input.domainId} Core Object boundary.`,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose: purposeFor(input.domainId, input.mvpRequirement),
  base,
  owns:
    input.mvpRequirement === 'must_build_now'
      ? commonOwns
      : [
          `${input.domainId} structural object-reference boundary.`,
          ...commonOwns
        ],
  requiredBaseFields: CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS,
  optionalBaseFields: CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS,
  nonGoals:
    input.mvpRequirement === 'must_build_now'
      ? nonGoals
      : [
          ...nonGoals,
          'Operational availability, successful execution, production readiness, or implemented domain behavior.'
        ],
  sourcePath: `${objectSourceRoot}${input.domainId}.md`,
  implementationDepth: 'validated_skeleton',
  createdAt: canonicalCreatedAt,
  metadata: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath,
    implementationTask:
      input.mvpRequirement === 'must_build_now' ? 'CORE-TASK-035' : 'CORE-TASK-023',
    mvpRequirement: input.mvpRequirement
  }
});

export const CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS = [
  objectSkeleton({
    domainId: 'identity',
    objectType: 'identity-record',
    id: 'core-object-identity-record-contract',
    name: 'Core Identity Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'organization',
    objectType: 'organization-record',
    id: 'core-object-organization-record-contract',
    name: 'Organization Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'user',
    objectType: 'user-record',
    id: 'core-object-user-record-contract',
    name: 'User Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'permission',
    objectType: 'permission-record',
    id: 'core-object-permission-record-contract',
    name: 'Core Permission Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'policy',
    objectType: 'permission-policy-record',
    id: 'core-object-permission-policy-record-contract',
    name: 'Permission Policy Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'customer',
    objectType: 'customer-record',
    id: 'core-object-customer-record-contract',
    name: 'Core Customer Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'brand',
    objectType: 'brand-record',
    id: 'core-object-brand-record-contract',
    name: 'Brand Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'trademark',
    objectType: 'trademark-record',
    id: 'core-object-trademark-record-contract',
    name: 'Trademark Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'jurisdiction',
    objectType: 'jurisdiction-record',
    id: 'core-object-jurisdiction-record-contract',
    name: 'Jurisdiction Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'classification',
    objectType: 'classification-record',
    id: 'core-object-classification-record-contract',
    name: 'Classification Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'document',
    objectType: 'document-record',
    id: 'core-object-document-record-contract',
    name: 'Document Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'evidence',
    objectType: 'evidence-record',
    id: 'core-object-evidence-record-contract',
    name: 'Evidence Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'matter',
    objectType: 'matter-record',
    id: 'core-object-matter-record-contract',
    name: 'Matter Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'order',
    objectType: 'order-record',
    id: 'core-object-order-record-contract',
    name: 'Core Order Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'workflow-contract',
    objectType: 'workflow-contract-record',
    id: 'core-object-workflow-contract-record-contract',
    name: 'Core Workflow Contract Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'task',
    objectType: 'task-record',
    id: 'core-object-task-record-contract',
    name: 'Core Task Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'event',
    objectType: 'event-record',
    id: 'core-object-event-record-contract',
    name: 'Core Event Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  }),
  objectSkeleton({
    domainId: 'communication',
    objectType: 'communication-record',
    id: 'core-object-communication-record-contract',
    name: 'Communication Record Object Contract Skeleton',
    mvpRequirement: 'must_build_now'
  })
] as const satisfies readonly CoreObjectContract[];

export const CORE_STUB_OBJECT_CONTRACT_SKELETONS = [
  objectSkeleton({
    domainId: 'knowledge',
    objectType: 'knowledge-source-record',
    id: 'core-object-knowledge-source-record-contract',
    name: 'Knowledge Source Record Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  }),
  objectSkeleton({
    domainId: 'opportunity',
    objectType: 'opportunity-record',
    id: 'core-object-opportunity-record-contract',
    name: 'Core Opportunity Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  }),
  objectSkeleton({
    domainId: 'notification',
    objectType: 'notification-record',
    id: 'core-object-notification-record-contract',
    name: 'Core Notification Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  }),
  objectSkeleton({
    domainId: 'partner',
    objectType: 'partner-record',
    id: 'core-object-partner-record-contract',
    name: 'Core Partner Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  }),
  objectSkeleton({
    domainId: 'agent',
    objectType: 'agent-record',
    id: 'core-object-agent-record-contract',
    name: 'Core Agent Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  }),
  objectSkeleton({
    domainId: 'service-provider',
    objectType: 'service-provider-record',
    id: 'core-object-service-provider-record-contract',
    name: 'Core Service Provider Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  }),
  objectSkeleton({
    domainId: 'service-network',
    objectType: 'service-network-record',
    id: 'core-object-service-network-record-contract',
    name: 'Core Service Network Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  }),
  objectSkeleton({
    domainId: 'routing',
    objectType: 'routing-record',
    id: 'core-object-routing-record-contract',
    name: 'Core Routing Object Contract Skeleton',
    mvpRequirement: 'stub_now'
  })
] as const satisfies readonly CoreObjectContract[];

export const CORE_OBJECT_CONTRACT_SKELETONS = [
  ...CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS,
  ...CORE_STUB_OBJECT_CONTRACT_SKELETONS
] as const satisfies readonly CoreObjectContract[];
