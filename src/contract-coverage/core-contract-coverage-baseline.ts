import {
  CORE_AI_GOVERNANCE_CONTRACT_SKELETONS,
  CORE_API_CONTRACT_SKELETONS,
  CORE_CONTRACT_INDEX,
  CORE_DOMAIN_CONTRACT_SKELETONS,
  CORE_EVENT_CATALOG_SKELETONS,
  CORE_OBJECT_CONTRACT_SKELETONS,
  CORE_PERMISSION_CONTRACT_SKELETONS,
  CORE_POLICY_CONTRACT_SKELETONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  CORE_WORKFLOW_CATALOG_SKELETONS
} from '../contracts/index.ts';
import { CORE_DOMAIN_REGISTRY, type CoreDomainId } from '../domains/index.ts';

export const CORE_CONTRACT_COVERAGE_LAYERS = [
  'domain',
  'object',
  'service',
  'api',
  'event',
  'workflow'
] as const;

export type CoreContractCoverageLayer =
  (typeof CORE_CONTRACT_COVERAGE_LAYERS)[number];

export const CORE_REQUIRED_CONTRACT_COVERAGE_LAYERS = [
  'domain',
  'object',
  'service',
  'api'
] as const satisfies readonly CoreContractCoverageLayer[];

export type CoreMvpCoverageRequirement = 'must_build_now' | 'stub_now';
export type CoreLayerCoverageStatus = 'validated_skeleton' | 'missing';
export type CoreRequiredLayerCoverageState =
  | 'required_layers_present'
  | 'partial';

export interface CoreLayerCoverage {
  readonly status: CoreLayerCoverageStatus;
  readonly contractIds: readonly string[];
}

export interface CoreDomainContractCoverage {
  readonly domainId: CoreDomainId;
  readonly requirement: CoreMvpCoverageRequirement;
  readonly layers: Readonly<
    Record<CoreContractCoverageLayer, CoreLayerCoverage>
  >;
  readonly testCoverage: 'collection_validation_only';
  readonly missingRequiredLayers: readonly CoreContractCoverageLayer[];
  readonly requiredLayerState: CoreRequiredLayerCoverageState;
}

export interface CoreContractFamilyCoverage {
  readonly family:
    | 'foundation'
    | 'domain'
    | 'object'
    | 'service'
    | 'api'
    | 'event'
    | 'workflow'
    | 'permission'
    | 'policy'
    | 'ai_governance';
  readonly source?: string;
  readonly indexedCount: number;
  readonly fixtureIds: readonly string[];
  readonly fixtureCoverage: 'required';
  readonly validatorCoverage: 'present';
  readonly testCoverage: 'collection';
}

const mustBuildNowDomainIds = new Set<CoreDomainId>([
  'identity',
  'organization',
  'user',
  'permission',
  'policy',
  'customer',
  'brand',
  'trademark',
  'jurisdiction',
  'classification',
  'document',
  'evidence',
  'matter',
  'order',
  'workflow-contract',
  'task',
  'event',
  'communication'
]);

type DomainMappedContract = {
  readonly id: string;
  readonly domainId?: CoreDomainId;
};

function contractIdsByDomain(
  entries: readonly DomainMappedContract[]
): ReadonlyMap<CoreDomainId, readonly string[]> {
  const result = new Map<CoreDomainId, string[]>();
  for (const domain of CORE_DOMAIN_REGISTRY) result.set(domain.id, []);

  for (const entry of entries) {
    if (entry.domainId === undefined) continue;
    result.get(entry.domainId)?.push(entry.id);
  }

  return result;
}

const contractsByLayer = {
  domain: contractIdsByDomain(CORE_DOMAIN_CONTRACT_SKELETONS),
  object: contractIdsByDomain(CORE_OBJECT_CONTRACT_SKELETONS),
  service: contractIdsByDomain(CORE_SERVICE_CONTRACT_SKELETONS),
  api: contractIdsByDomain(CORE_API_CONTRACT_SKELETONS),
  event: contractIdsByDomain(CORE_EVENT_CATALOG_SKELETONS),
  workflow: contractIdsByDomain(CORE_WORKFLOW_CATALOG_SKELETONS)
} as const satisfies Readonly<
  Record<
    CoreContractCoverageLayer,
    ReadonlyMap<CoreDomainId, readonly string[]>
  >
>;

function domainCoverage(domainId: CoreDomainId): CoreDomainContractCoverage {
  const layers = Object.fromEntries(
    CORE_CONTRACT_COVERAGE_LAYERS.map((layer) => {
      const contractIds = contractsByLayer[layer].get(domainId) ?? [];
      return [
        layer,
        {
          status: contractIds.length > 0 ? 'validated_skeleton' : 'missing',
          contractIds
        }
      ];
    })
  ) as unknown as Readonly<
    Record<CoreContractCoverageLayer, CoreLayerCoverage>
  >;

  const missingRequiredLayers = CORE_REQUIRED_CONTRACT_COVERAGE_LAYERS.filter(
    (layer) => layers[layer].status === 'missing'
  );

  return {
    domainId,
    requirement: mustBuildNowDomainIds.has(domainId)
      ? 'must_build_now'
      : 'stub_now',
    layers,
    testCoverage: 'collection_validation_only',
    missingRequiredLayers,
    requiredLayerState:
      missingRequiredLayers.length === 0 ? 'required_layers_present' : 'partial'
  };
}

export const CORE_DOMAIN_CONTRACT_COVERAGE = CORE_DOMAIN_REGISTRY.map(
  (domain) => domainCoverage(domain.id)
) as readonly CoreDomainContractCoverage[];

export const CORE_CONTRACT_FAMILY_COVERAGE = [
  {
    family: 'foundation',
    indexedCount: CORE_CONTRACT_INDEX.filter(
      (contract) => !('source' in contract)
    ).length,
    fixtureIds: [
      'core-domain-registry',
      'core-object-base',
      'core-event-base',
      'core-task-base',
      'core-workflow-contract-base',
      'core-contract-index'
    ],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'domain',
    source: 'CORE_DOMAIN_CONTRACT_SKELETONS',
    indexedCount: CORE_DOMAIN_CONTRACT_SKELETONS.length,
    fixtureIds: ['core-domain-contract-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'object',
    source: 'CORE_OBJECT_CONTRACT_SKELETONS',
    indexedCount: CORE_OBJECT_CONTRACT_SKELETONS.length,
    fixtureIds: ['core-object-contract-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'service',
    source: 'CORE_SERVICE_CONTRACT_SKELETONS',
    indexedCount: CORE_SERVICE_CONTRACT_SKELETONS.length,
    fixtureIds: ['core-service-contract-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'api',
    source: 'CORE_API_CONTRACT_SKELETONS',
    indexedCount: CORE_API_CONTRACT_SKELETONS.length,
    fixtureIds: ['core-api-contract-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'event',
    source: 'CORE_EVENT_CATALOG_SKELETONS',
    indexedCount: CORE_EVENT_CATALOG_SKELETONS.length,
    fixtureIds: ['core-event-catalog-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'workflow',
    source: 'CORE_WORKFLOW_CATALOG_SKELETONS',
    indexedCount: CORE_WORKFLOW_CATALOG_SKELETONS.length,
    fixtureIds: ['core-workflow-catalog-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'permission',
    source: 'CORE_PERMISSION_CONTRACT_SKELETONS',
    indexedCount: CORE_PERMISSION_CONTRACT_SKELETONS.length,
    fixtureIds: ['core-permission-contract-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'policy',
    source: 'CORE_POLICY_CONTRACT_SKELETONS',
    indexedCount: CORE_POLICY_CONTRACT_SKELETONS.length,
    fixtureIds: ['core-policy-contract-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  },
  {
    family: 'ai_governance',
    source: 'CORE_AI_GOVERNANCE_CONTRACT_SKELETONS',
    indexedCount: CORE_AI_GOVERNANCE_CONTRACT_SKELETONS.length,
    fixtureIds: ['core-ai-governance-contract-skeletons'],
    fixtureCoverage: 'required',
    validatorCoverage: 'present',
    testCoverage: 'collection'
  }
] as const satisfies readonly CoreContractFamilyCoverage[];

const layerDomainCounts = Object.fromEntries(
  CORE_CONTRACT_COVERAGE_LAYERS.map((layer) => [
    layer,
    CORE_DOMAIN_CONTRACT_COVERAGE.filter(
      (entry) => entry.layers[layer].status === 'validated_skeleton'
    ).length
  ])
) as unknown as Readonly<Record<CoreContractCoverageLayer, number>>;

const requiredLayerCompleteDomains = CORE_DOMAIN_CONTRACT_COVERAGE.filter(
  (entry) => entry.requiredLayerState === 'required_layers_present'
);

export const CORE_CONTRACT_COVERAGE_BASELINE = {
  id: 'core-contract-coverage-baseline-v0-1',
  version: '0.1.0',
  createdAt: '2026-07-10T00:00:00.000Z',
  scope: 'contract_structure_only',
  authority: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath: 'books/book-02-core-specification/',
    traceability: 'books/book-02-core-specification/core-specs/TRACEABILITY.md',
    mvpCut:
      'books/book-02-core-specification/core-specs/implementation/mvp-cut-v0.1.md',
    validation:
      'books/book-02-core-specification/core-specs/validation/traceability-validation.md'
  },
  assessmentBoundary: {
    structuralCoverageAssessed: true,
    sourceAlignmentCoverageAssessed: false,
    runtimeCoverageAssessed: false,
    behaviorCoverageAssessed: false,
    productionReadinessAssessed: false
  },
  contractFamilies: CORE_CONTRACT_FAMILY_COVERAGE,
  domains: CORE_DOMAIN_CONTRACT_COVERAGE,
  summary: {
    indexedContractCount: CORE_CONTRACT_INDEX.length,
    structurallyCoveredContractFamilyCount:
      CORE_CONTRACT_FAMILY_COVERAGE.length,
    totalContractFamilyCount: CORE_CONTRACT_FAMILY_COVERAGE.length,
    totalDomainCount: CORE_DOMAIN_REGISTRY.length,
    mustBuildNowDomainCount: CORE_DOMAIN_CONTRACT_COVERAGE.filter(
      (entry) => entry.requirement === 'must_build_now'
    ).length,
    stubNowDomainCount: CORE_DOMAIN_CONTRACT_COVERAGE.filter(
      (entry) => entry.requirement === 'stub_now'
    ).length,
    layerDomainCounts,
    requiredLayerCompleteDomainCount: requiredLayerCompleteDomains.length,
    mustBuildNowRequiredLayerCompleteDomainCount:
      requiredLayerCompleteDomains.filter(
        (entry) => entry.requirement === 'must_build_now'
      ).length,
    stubNowRequiredLayerCompleteDomainCount:
      requiredLayerCompleteDomains.filter(
        (entry) => entry.requirement === 'stub_now'
      ).length,
    missingRequiredLayerSlotCount: CORE_DOMAIN_CONTRACT_COVERAGE.reduce(
      (total, entry) => total + entry.missingRequiredLayers.length,
      0
    ),
    collectionValidatedDomainCount: CORE_DOMAIN_CONTRACT_COVERAGE.length,
    domainBehaviorTestedCount: 0,
    globalApiSkeletonCount: CORE_API_CONTRACT_SKELETONS.filter(
      (entry) => entry.domainId === undefined
    ).length
  }
} as const;
