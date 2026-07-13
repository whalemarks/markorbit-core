import { existsSync } from 'node:fs';
import {
  BOOK_02_AUTHORITY,
  BOOK_02_EXPECTED_COUNTS,
  BOOK_02_MVP_REQUIREMENT_IDENTITIES,
  MVP_ACCEPTANCE_CRITERIA,
  type Book02MvpDisposition,
  type Book02MvpRequirement
} from './book-02-mvp-requirements.ts';

export interface Book02MvpAcceptanceSummary {
  readonly acceptanceCriteriaSatisfied: number;
  readonly acceptanceCriteriaTotal: number;
  readonly unresolvedCriteria: readonly string[];
  readonly book02MvpComplete: boolean;
}
export interface Book02MvpGapSummary {
  readonly mustBuildNow: Record<string, number>;
  readonly stubNow: {
    readonly total: number;
    readonly safelyBounded: number;
    readonly productionDepthViolations: number;
  };
  readonly documentOnly: {
    readonly total: number;
    readonly unexpectedImplementationCount: number;
  };
  readonly defer: {
    readonly total: number;
    readonly unexpectedBlockingImplementationCount: number;
  };
  readonly neverInMvp: {
    readonly total: number;
    readonly violationCount: number;
  };
  readonly acceptance: Book02MvpAcceptanceSummary;
  readonly knownExecutionSpineGaps: readonly string[];
}
export interface Book02MvpGapBaseline {
  readonly fixtureType: 'book_02_mvp_gap_baseline';
  readonly authority: typeof BOOK_02_AUTHORITY;
  readonly requirements: readonly Book02MvpRequirement[];
  readonly acceptanceCriteria: readonly string[];
  readonly summary: Book02MvpGapSummary;
}
const evidence = {
  domain: ['src/contracts/domain/core-domain-contract-skeletons.ts'],
  object: ['src/contracts/object/core-object-contract-skeletons.ts'],
  service: ['src/contracts/service/core-service-contract-skeletons.ts'],
  api: ['src/contracts/api/core-api-contract-skeletons.ts'],
  workflow: ['src/contracts/workflow/core-workflow-catalog-skeletons.ts'],
  event: ['src/contracts/event/core-event-catalog-skeletons.ts'],
  common_contract: [
    'src/behaviors/core-reference-behavior.ts',
    'src/behaviors/core-safe-error.ts',
    'src/behaviors/core-idempotency-behavior.ts',
    'src/behaviors/core-version-behavior.ts',
    'src/behaviors/core-ai-context-behavior.ts',
    'src/behaviors/core-governance-behavior.ts'
  ],
  agent: ['src/behaviors/core-agent-boundary.ts'],
  test: ['src/contracts/test/core-test-contract-skeletons.ts'],
  guard: []
} as const;
const testEvidence = [
  'tests/unit/core-contract-behavior-acceptance-lock.test.ts'
];
function dispositionFor(
  id: string,
  layer: string,
  category: string
): Book02MvpDisposition {
  if (category === 'stub_now') return 'boundary_scaffold_only';
  if (
    category === 'document_only' ||
    category === 'defer' ||
    category === 'never_in_mvp'
  )
    return 'not_required';
  if (layer === 'domain' || layer === 'object')
    return 'validated_skeleton_only';
  if (layer === 'common_contract') return 'partial_evidence';
  if (
    layer === 'service' ||
    layer === 'api' ||
    layer === 'workflow' ||
    layer === 'test'
  )
    return 'validated_skeleton_only';
  if (layer === 'agent') return 'boundary_scaffold_only';
  if (layer === 'event')
    return id.includes('task-created') || id.includes('communication-reviewed')
      ? 'semantic_overlap_only'
      : 'missing';
  return 'missing';
}
function gaps(layer: string, disp: Book02MvpDisposition): readonly string[] {
  if (disp === 'meets_required_depth' || disp === 'not_required') return [];
  if (disp === 'semantic_overlap_only')
    return [
      'Generic catalog semantics overlap, but no explicit validated canonical alias mapping exists.'
    ];
  if (disp === 'boundary_scaffold_only')
    return [
      'Boundary scaffold is present without full named MVP runtime behavior.'
    ];
  if (disp === 'partial_evidence')
    return [
      'Selected behavior hooks are accepted at minimum depth, but execution-spine completion is unresolved.'
    ];
  if (disp === 'validated_skeleton_only')
    return [
      `${layer} has structural contract evidence only; required MVP behavior depth is not proven.`
    ];
  return ['No current implementation evidence meets the required MVP depth.'];
}
export function buildBook02MvpGapBaseline(): Book02MvpGapBaseline {
  const requirements = BOOK_02_MVP_REQUIREMENT_IDENTITIES.map((identity) => {
    const currentDisposition = dispositionFor(
      identity.id,
      identity.layer,
      identity.category
    );
    const files = evidence[identity.layer] ?? [];
    return {
      ...identity,
      currentDisposition,
      currentDepth:
        currentDisposition === 'partial_evidence'
          ? 'minimum_depth_hook'
          : currentDisposition === 'not_required'
            ? 'outside_mvp'
            : 'structural_only',
      contractIds:
        identity.layer === 'guard'
          ? []
          : [
              `core-${identity.layer}-${identity.name.toLowerCase().replaceAll(' ', '-')}-contract`
            ],
      implementationFiles: files.filter((f) => existsSync(f)),
      testFiles: identity.layer === 'common_contract' ? testEvidence : [],
      fixtureFiles: [],
      gapReasons: gaps(identity.layer, currentDisposition)
    };
  });
  const count = (category: string) =>
    requirements.filter((r) => r.category === category).length;
  const must = requirements.filter((r) => r.category === 'must_build_now');
  const dispositionCounts: Record<string, number> = {
    total: must.length,
    meets_required_depth: 0,
    partial_evidence: 0,
    validated_skeleton_only: 0,
    boundary_scaffold_only: 0,
    semantic_overlap_only: 0,
    fixture_only: 0,
    missing: 0
  };
  for (const req of must)
    dispositionCounts[req.currentDisposition] =
      (dispositionCounts[req.currentDisposition] ?? 0) + 1;
  const unresolvedCriteria = MVP_ACCEPTANCE_CRITERIA.filter(
    (_, index) => index > 1
  );
  const acceptance = {
    acceptanceCriteriaSatisfied:
      MVP_ACCEPTANCE_CRITERIA.length - unresolvedCriteria.length,
    acceptanceCriteriaTotal: BOOK_02_EXPECTED_COUNTS.acceptanceCriteria,
    unresolvedCriteria,
    book02MvpComplete:
      unresolvedCriteria.length === 0 &&
      must.every((r) => r.currentDisposition === 'meets_required_depth')
  };
  return {
    fixtureType: 'book_02_mvp_gap_baseline',
    authority: BOOK_02_AUTHORITY,
    requirements,
    acceptanceCriteria: MVP_ACCEPTANCE_CRITERIA,
    summary: {
      mustBuildNow: dispositionCounts,
      stubNow: {
        total: count('stub_now'),
        safelyBounded: count('stub_now'),
        productionDepthViolations: 0
      },
      documentOnly: {
        total: count('document_only'),
        unexpectedImplementationCount: 0
      },
      defer: {
        total: count('defer'),
        unexpectedBlockingImplementationCount: 0
      },
      neverInMvp: { total: count('never_in_mvp'), violationCount: 0 },
      acceptance,
      knownExecutionSpineGaps: [
        'Service behavior',
        'API validator/service delegation',
        'exact MVP Events',
        'three preview/apply Workflows',
        'five named Agent scaffolds',
        'executable test families'
      ]
    }
  };
}
export const BOOK_02_MVP_GAP_BASELINE = buildBook02MvpGapBaseline();
