import {
  CORE_API_CONTRACT_SKELETONS,
  CORE_CONTRACT_INDEX,
  CORE_OBJECT_CONTRACT_SKELETONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  CORE_WORKFLOW_CATALOG_SKELETONS
} from '../contracts/index.ts';
import { CORE_DOMAIN_REGISTRY, type CoreDomainId } from '../domains/index.ts';
import {
  CORE_DOMAIN_CONTRACT_COVERAGE,
  type CoreMvpCoverageRequirement
} from './core-contract-coverage-baseline.ts';

export type CoreDomainGapLayer = 'object' | 'service' | 'api';
export type CoreCanonicalContractLayer = 'common' | 'workflow' | 'test';
export type CoreGapDisposition =
  | 'map_existing_skeleton'
  | 'add_canonical_skeleton';

export interface CoreDomainContractTarget {
  readonly domainId: CoreDomainId;
  readonly requirement: CoreMvpCoverageRequirement;
  readonly layer: CoreDomainGapLayer;
  readonly sourcePath: string;
  readonly targetContractId: string;
  readonly targetName: string;
  readonly disposition: CoreGapDisposition;
  readonly existingContractIds: readonly string[];
  readonly implementationBatch: string | null;
  readonly targetDepth: 'validated_skeleton';
}

export interface CoreCanonicalLayerTarget {
  readonly layer: CoreCanonicalContractLayer;
  readonly sourcePath: string;
  readonly targetContractId: string;
  readonly targetName: string;
  readonly disposition: 'add_canonical_skeleton';
  readonly implementationBatch: string;
  readonly targetDepth: 'validated_skeleton';
}

export interface CoreGapImplementationBatch {
  readonly id: string;
  readonly name: string;
  readonly targetCount: number;
  readonly layers: readonly (CoreDomainGapLayer | CoreCanonicalContractLayer)[];
  readonly boundary: string;
}

type DomainMappedContract = {
  readonly id: string;
  readonly domainId?: CoreDomainId;
};

function idsByDomain(
  entries: readonly DomainMappedContract[]
): ReadonlyMap<CoreDomainId, readonly string[]> {
  const result = new Map<CoreDomainId, string[]>();
  for (const domain of CORE_DOMAIN_REGISTRY) result.set(domain.id, []);
  for (const entry of entries) {
    if (entry.domainId !== undefined)
      result.get(entry.domainId)?.push(entry.id);
  }
  return result;
}

const existingIdsByLayer = {
  object: idsByDomain(CORE_OBJECT_CONTRACT_SKELETONS),
  service: idsByDomain(CORE_SERVICE_CONTRACT_SKELETONS),
  api: new Map<CoreDomainId, readonly string[]>()
} as const satisfies Readonly<
  Record<CoreDomainGapLayer, ReadonlyMap<CoreDomainId, readonly string[]>>
>;

const requirementByDomain = new Map(
  CORE_DOMAIN_CONTRACT_COVERAGE.map((entry) => [
    entry.domainId,
    entry.requirement
  ])
);

function title(value: string): string {
  return value
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function sourcePath(domainId: CoreDomainId, layer: CoreDomainGapLayer): string {
  const root = 'books/book-02-core-specification/core-specs';
  if (layer === 'object') return `${root}/objects/${domainId}.md`;
  if (layer === 'service') return `${root}/services/${domainId}-service.md`;
  return `${root}/contracts/api/${domainId}-api-contract.md`;
}

function newTargetId(
  domainId: CoreDomainId,
  layer: CoreDomainGapLayer
): string {
  if (layer === 'object') return `core-object-${domainId}-record-contract`;
  if (layer === 'service') return `core-service-${domainId}-service-contract`;
  return `core-api-${domainId}-api-contract`;
}

function targetName(domainId: CoreDomainId, layer: CoreDomainGapLayer): string {
  const domainName = title(domainId);
  if (layer === 'object') return `Core ${domainName} Object Contract Skeleton`;
  if (layer === 'service')
    return `Core ${domainName} Service Contract Skeleton`;
  return `Core ${domainName} API Contract Skeleton`;
}

function implementationBatch(
  requirement: CoreMvpCoverageRequirement,
  layer: CoreDomainGapLayer,
  hasExistingMapping: boolean
): string | null {
  if (hasExistingMapping) return null;
  if (requirement === 'stub_now') return 'CORE-TASK-023';
  if (layer === 'api') return 'CORE-TASK-022';
  return 'CORE-TASK-021';
}

export const CORE_DOMAIN_CONTRACT_TARGETS = CORE_DOMAIN_REGISTRY.flatMap(
  (domain): readonly CoreDomainContractTarget[] => {
    const requirement = requirementByDomain.get(domain.id);
    if (requirement === undefined)
      throw new Error(`Missing MVP requirement for ${domain.id}.`);

    return (['object', 'service', 'api'] as const).map((layer) => {
      const existingContractIds =
        existingIdsByLayer[layer].get(domain.id) ?? [];
      const hasExistingMapping = existingContractIds.length > 0;
      return {
        domainId: domain.id,
        requirement,
        layer,
        sourcePath: sourcePath(domain.id, layer),
        targetContractId: hasExistingMapping
          ? existingContractIds[0]
          : newTargetId(domain.id, layer),
        targetName: targetName(domain.id, layer),
        disposition: hasExistingMapping
          ? 'map_existing_skeleton'
          : 'add_canonical_skeleton',
        existingContractIds,
        implementationBatch: implementationBatch(
          requirement,
          layer,
          hasExistingMapping
        ),
        targetDepth: 'validated_skeleton'
      };
    });
  }
) as readonly CoreDomainContractTarget[];

const commonTargets = [
  ['references', 'References'],
  ['errors', 'Errors'],
  ['pagination', 'Pagination'],
  ['audit-context', 'Audit Context'],
  ['ai-context', 'AI Context'],
  ['human-review', 'Human Review'],
  ['permission-context', 'Permission Context'],
  ['policy-context', 'Policy Context'],
  ['idempotency', 'Idempotency'],
  ['versioning', 'Versioning']
] as const;

const workflowTargets = [
  ['customer-intake-workflow', 'Customer Intake Workflow'],
  ['trademark-application-workflow', 'Trademark Application Workflow'],
  ['office-action-response-workflow', 'Office Action Response Workflow'],
  ['provider-routing-workflow', 'Provider Routing Workflow'],
  ['communication-review-workflow', 'Communication Review Workflow'],
  ['renewal-workflow', 'Renewal Workflow'],
  ['assignment-workflow', 'Assignment Workflow'],
  ['evidence-review-workflow', 'Evidence Review Workflow']
] as const;

const testTargets = [
  ['common-contract-tests', 'Common Contract Test'],
  ['api-contract-tests', 'API Contract Test'],
  ['workflow-contract-tests', 'Workflow Contract Test'],
  ['agent-boundary-tests', 'Agent Boundary Test'],
  ['permission-policy-tests', 'Permission Policy Test'],
  ['idempotency-event-tests', 'Idempotency Event Test'],
  ['error-versioning-tests', 'Error Versioning Test']
] as const;

export const CORE_CANONICAL_LAYER_TARGETS = [
  ...commonTargets.map(
    ([slug, name]): CoreCanonicalLayerTarget => ({
      layer: 'common',
      sourcePath: `books/book-02-core-specification/core-specs/contracts/common/${slug}.md`,
      targetContractId: `core-common-${slug}-contract`,
      targetName: `Core ${name} Contract Skeleton`,
      disposition: 'add_canonical_skeleton',
      implementationBatch: 'CORE-TASK-020',
      targetDepth: 'validated_skeleton'
    })
  ),
  ...workflowTargets.map(
    ([slug, name]): CoreCanonicalLayerTarget => ({
      layer: 'workflow',
      sourcePath: `books/book-02-core-specification/core-specs/contracts/workflows/${slug}-contract.md`,
      targetContractId: `core-workflow-${slug}-contract`,
      targetName: `Core ${name} Contract Skeleton`,
      disposition: 'add_canonical_skeleton',
      implementationBatch: 'CORE-TASK-024',
      targetDepth: 'validated_skeleton'
    })
  ),
  ...testTargets.map(
    ([slug, name]): CoreCanonicalLayerTarget => ({
      layer: 'test',
      sourcePath: `books/book-02-core-specification/core-specs/contracts/tests/${slug}.md`,
      targetContractId: `core-test-${slug}-contract`,
      targetName: `Core ${name} Skeleton`,
      disposition: 'add_canonical_skeleton',
      implementationBatch: 'CORE-TASK-020',
      targetDepth: 'validated_skeleton'
    })
  )
] as const satisfies readonly CoreCanonicalLayerTarget[];

const newDomainTargets = CORE_DOMAIN_CONTRACT_TARGETS.filter(
  (target) => target.disposition === 'add_canonical_skeleton'
);

function batchTargetCount(batchId: string): number {
  return (
    newDomainTargets.filter((target) => target.implementationBatch === batchId)
      .length +
    CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.implementationBatch === batchId
    ).length
  );
}

export const CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES = [
  {
    id: 'CORE-TASK-020',
    name: 'Common and Test Contract Foundations',
    targetCount: batchTargetCount('CORE-TASK-020'),
    layers: ['common', 'test'],
    boundary:
      'Add canonical metadata-only Common and Test Contract skeleton families and their contract types.'
  },
  {
    id: 'CORE-TASK-021',
    name: 'Must-Build Object and Service Gaps',
    targetCount: batchTargetCount('CORE-TASK-021'),
    layers: ['object', 'service'],
    boundary:
      'Add only missing validated skeletons for Must Build Now Domains; preserve existing mapped skeletons.'
  },
  {
    id: 'CORE-TASK-022',
    name: 'Must-Build Canonical Domain APIs',
    targetCount: batchTargetCount('CORE-TASK-022'),
    layers: ['api'],
    boundary:
      'Add 18 canonical Domain API skeletons without routes, handlers, service execution, or DTO implementation.'
  },
  {
    id: 'CORE-TASK-023',
    name: 'Stub Domain Contract Gaps',
    targetCount: batchTargetCount('CORE-TASK-023'),
    layers: ['object', 'service', 'api'],
    boundary:
      'Add safe validated skeletons for the 8 Stub Now Domains without pretending to implement runtime behavior.'
  },
  {
    id: 'CORE-TASK-024',
    name: 'Canonical Workflow Contracts',
    targetCount: batchTargetCount('CORE-TASK-024'),
    layers: ['workflow'],
    boundary:
      'Add the 8 canonical Book 2 Workflow Contract skeletons without a workflow engine or execution runtime.'
  }
] as const satisfies readonly CoreGapImplementationBatch[];

export const CORE_CONTRACT_GAP_INVENTORY = {
  id: 'core-book2-contract-gap-inventory-v0-1',
  version: '0.1.0',
  createdAt: '2026-07-10T00:00:00.000Z',
  scope: 'inventory_lock_only',
  authority: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath: 'books/book-02-core-specification/',
    contractIndex:
      'books/book-02-core-specification/core-specs/contracts/index.md',
    contractManifest:
      'books/book-02-core-specification/core-specs/contracts/MANIFEST.md',
    traceability: 'books/book-02-core-specification/core-specs/TRACEABILITY.md',
    mvpCut:
      'books/book-02-core-specification/core-specs/implementation/mvp-cut-v0.1.md'
  },
  requiredContractTypeAdditions: ['common', 'test'],
  domainTargets: CORE_DOMAIN_CONTRACT_TARGETS,
  canonicalLayerTargets: CORE_CANONICAL_LAYER_TARGETS,
  retainedNoncanonicalScaffolds: [
    {
      family: 'api',
      contractIds: CORE_API_CONTRACT_SKELETONS.map((entry) => entry.id),
      disposition: 'retain_during_canonical_expansion',
      satisfiesCanonicalTargets: false,
      reason:
        'Phase 2 global/reference API skeletons are not the 26 canonical Book 2 Domain API Contracts.'
    },
    {
      family: 'workflow',
      contractIds: CORE_WORKFLOW_CATALOG_SKELETONS.map((entry) => entry.id),
      disposition: 'retain_during_canonical_expansion',
      satisfiesCanonicalTargets: false,
      reason:
        'Phase 2 generic workflow catalog skeletons are not the 8 canonical Book 2 Workflow Contracts.'
    }
  ],
  implementationBatches: CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES,
  summary: {
    currentIndexedContractCount: CORE_CONTRACT_INDEX.length,
    domainTargetCount: CORE_DOMAIN_CONTRACT_TARGETS.length,
    mappedExistingDomainTargetCount: CORE_DOMAIN_CONTRACT_TARGETS.filter(
      (target) => target.disposition === 'map_existing_skeleton'
    ).length,
    newDomainTargetCount: newDomainTargets.length,
    newObjectTargetCount: newDomainTargets.filter(
      (target) => target.layer === 'object'
    ).length,
    newServiceTargetCount: newDomainTargets.filter(
      (target) => target.layer === 'service'
    ).length,
    newApiTargetCount: newDomainTargets.filter(
      (target) => target.layer === 'api'
    ).length,
    newCommonTargetCount: CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.layer === 'common'
    ).length,
    newWorkflowTargetCount: CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.layer === 'workflow'
    ).length,
    newTestTargetCount: CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.layer === 'test'
    ).length,
    totalNewCanonicalTargetCount:
      newDomainTargets.length + CORE_CANONICAL_LAYER_TARGETS.length,
    projectedIndexedContractCount:
      CORE_CONTRACT_INDEX.length +
      newDomainTargets.length +
      CORE_CANONICAL_LAYER_TARGETS.length,
    implementationBatchCount: CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES.length,
    currentIndexChangedByThisTask: false
  }
} as const;
