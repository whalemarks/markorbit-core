import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
  CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE,
  type CoreBehaviorDepthLevel
} from '../behavior-coverage/index.ts';
import {
  CORE_API_CONTRACT_SKELETONS,
  CORE_COMMON_CONTRACT_SKELETONS,
  CORE_CONTRACT_INDEX,
  CORE_DOMAIN_CONTRACT_SKELETONS,
  CORE_EVENT_CATALOG_SKELETONS,
  CORE_OBJECT_CONTRACT_SKELETONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  CORE_TEST_CONTRACT_SKELETONS,
  CORE_WORKFLOW_CATALOG_SKELETONS
} from '../contracts/index.ts';
import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import {
  BOOK_02_AUTHORITY,
  BOOK_02_EXPECTED_COUNTS,
  BOOK_02_MVP_REQUIREMENT_IDENTITIES,
  MVP_ACCEPTANCE_CRITERIA_IDENTITIES,
  MVP_ACCEPTANCE_CRITERION_DEPENDENCIES,
  type Book02MvpAcceptanceCriterion,
  type Book02MvpDepth,
  type Book02MvpDisposition,
  type Book02MvpRequirement,
  type Book02MvpRequirementIdentity
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
  readonly acceptanceCriteria: readonly Book02MvpAcceptanceCriterion[];
  readonly summary: Book02MvpGapSummary;
}

interface CurrentEvidence {
  readonly contractIds: readonly string[];
  readonly implementationFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly fixtureFiles: readonly string[];
  readonly currentDepth?: Book02MvpDepth;
  readonly inspectionPaths?: readonly string[];
  readonly forbiddenIndicators?: readonly string[];
  readonly excludedPaths?: readonly string[];
  readonly violationReasons?: readonly string[];
}

const existing = (paths: readonly string[]) =>
  paths.filter((path) => existsSync(path));
const contractIndexIds = new Set<string>(
  CORE_CONTRACT_INDEX.map((entry) => String(entry.id))
);
const behaviorById: ReadonlyMap<
  string,
  (typeof CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence)[number]
> = new Map(
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map((entry) => [
    entry.behaviorId,
    entry
  ])
);
const fixtureFilesOf = (
  behavior:
    | (typeof CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence)[number]
    | undefined
): readonly string[] =>
  behavior && 'fixtureFiles' in behavior ? behavior.fixtureFiles : [];
const behaviorTargetById = new Map(
  CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.targets.map((target) => [
    target.id,
    target
  ])
);
const commonBehaviorIds: Record<string, string> = {
  references: 'references',
  errors: 'errors',
  'permission-context': 'permission',
  'policy-context': 'policy',
  idempotency: 'idempotency',
  'audit-context': 'audit-context',
  versioning: 'versioning',
  pagination: 'pagination',
  'ai-context': 'ai-context',
  'human-review': 'human-review'
};
const relatedEventTypes: Record<string, readonly string[]> = {
  'customer-created': ['core-object-created'],
  'brand-created': ['core-object-created'],
  'trademark-created': ['core-object-created'],
  'matter-created': ['core-object-created'],
  'order-created': ['core-object-created'],
  'document-created': ['core-object-created'],
  'document-attached': ['core-object-updated'],
  'evidence-created': ['core-object-created'],
  'task-created': ['core-task-created'],
  'task-updated': ['core-task-status-changed'],
  'task-completed': ['core-task-status-changed'],
  'communication-created': ['core-communication-draft-created'],
  'communication-reviewed': ['core-communication-approved'],
  'communication-sent': ['core-communication-approved'],
  'workflow-contract-previewed': ['core-workflow-contract-registered'],
  'workflow-contract-applied': ['core-workflow-contract-registered'],
  'permission-evaluated': ['core-review-completed'],
  'policy-evaluated': ['core-review-completed']
};
const guardIndicators: Record<string, readonly string[]> = {
  'document-only-full-policy-engine': [
    'createFullPolicyEngine',
    'FullPolicyEngine'
  ],
  'document-only-full-workflow-engine': [
    'createFullWorkflowEngine',
    'FullWorkflowEngine'
  ],
  'document-only-payment-execution': ['executePayment', 'PaymentExecution'],
  'never-api-layer-mutating-domain-state-directly': ['apiDirectDomainMutation'],
  'never-workflow-layer-emitting-domain-events-directly': [
    'workflowDirectEventEmission'
  ],
  'never-agent-layer-emitting-events-directly': ['agentDirectEventEmission'],
  'never-production-data-fixtures': [
    'productionFixture',
    'production_data_fixture'
  ],
  'never-raw-database-ids-in-public-responses': ['rawDatabaseId'],
  'never-unsafe-stack-traces-in-api-responses': ['stackTrace'],
  'never-silent-unsupported-version-acceptance': [
    'acceptUnsupportedVersionSilently'
  ]
};
const inspectionPaths = ['src', 'fixtures', 'package.json'] as const;
const excludedGuardPaths = [
  'src/mvp-coverage/',
  'fixtures/mvp-coverage/',
  'tests/',
  'docs/',
  'CHANGELOG.md',
  'CORE-MANIFEST.md',
  'CORE-ROADMAP.md',
  'README.md'
] as const;
const textInspectionExtensions = ['.ts', '.json', '.mjs', '.js'] as const;

export interface Book02MvpGuardInspectionInput {
  readonly inspectionPaths: readonly string[];
  readonly forbiddenIndicators: readonly string[];
  readonly excludedPaths: readonly string[];
}
export interface Book02MvpGuardInspectionResult {
  readonly violationPresent: boolean;
  readonly violationReasons: readonly string[];
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/');
}
function isExcluded(path: string, excludedPaths: readonly string[]): boolean {
  const normalized = normalizePath(path);
  return excludedPaths.some((excluded) => {
    const normalizedExcluded = normalizePath(excluded);
    return (
      normalized === normalizedExcluded ||
      normalized.startsWith(normalizedExcluded)
    );
  });
}
function collectInspectableFiles(
  paths: readonly string[],
  excludedPaths: readonly string[]
): readonly string[] {
  const files: string[] = [];
  const visit = (path: string) => {
    const normalized = normalizePath(path);
    if (isExcluded(normalized, excludedPaths) || !existsSync(normalized))
      return;
    const stat = statSync(normalized);
    if (stat.isDirectory()) {
      for (const child of readdirSync(normalized).sort())
        visit(join(normalized, child));
      return;
    }
    if (
      normalized === 'package.json' ||
      textInspectionExtensions.some((extension) =>
        normalized.endsWith(extension)
      )
    )
      files.push(normalized);
  };
  for (const path of [...paths].sort()) visit(path);
  return files.sort();
}
export function inspectBook02MvpGuard(
  input: Book02MvpGuardInspectionInput
): Book02MvpGuardInspectionResult {
  const violationReasons: string[] = [];
  for (const file of collectInspectableFiles(
    input.inspectionPaths,
    input.excludedPaths
  )) {
    const text = readFileSync(file, 'utf8');
    for (const indicator of input.forbiddenIndicators) {
      if (text.includes(indicator))
        violationReasons.push(
          `${file} contains forbidden indicator ${indicator}.`
        );
    }
  }
  return { violationPresent: violationReasons.length > 0, violationReasons };
}
function depthFromNumber(depth: CoreBehaviorDepthLevel): Book02MvpDepth {
  return depth === 0
    ? 'level_0'
    : depth === 1
      ? 'level_1'
      : depth === 2
        ? 'level_2'
        : 'level_3';
}
function commonMeetsRequired(
  requiredDepth: Book02MvpDepth | undefined,
  currentDepth: Book02MvpDepth
): boolean {
  if (!requiredDepth) return false;
  const order: Record<Book02MvpDepth, number> = {
    level_0: 0,
    level_1: 1,
    level_1_2: 1,
    level_2: 2,
    level_2_3: 2,
    level_3: 3,
    forbidden: Number.POSITIVE_INFINITY
  };
  return order[currentDepth] >= order[requiredDepth];
}
function evidenceFor(identity: Book02MvpRequirementIdentity): CurrentEvidence {
  if (identity.layer === 'domain') {
    const domainId = identity.name.toLowerCase().replaceAll(' ', '-');
    const found =
      CORE_DOMAIN_CONTRACT_SKELETONS.find(
        (entry) => entry.domainId === domainId
      ) ?? CORE_DOMAIN_REGISTRY.find((entry) => entry.id === domainId);
    return found
      ? {
          contractIds: 'id' in found ? [String(found.id)] : [],
          implementationFiles: [
            'src/contracts/domain/core-domain-contract-skeletons.ts'
          ],
          testFiles: [],
          fixtureFiles: []
        }
      : emptyEvidence();
  }
  if (identity.layer === 'object') {
    const domainId = identity.id.replace('must-object-', '');
    const found = CORE_OBJECT_CONTRACT_SKELETONS.find(
      (entry) => entry.domainId === domainId
    );
    return found
      ? {
          contractIds: [String(found.id)],
          implementationFiles: [
            'src/contracts/object/core-object-contract-skeletons.ts'
          ],
          testFiles: [],
          fixtureFiles: []
        }
      : emptyEvidence();
  }
  if (identity.layer === 'service') {
    const serviceId = identity.id
      .replace(/^must-service-/, '')
      .replace(/^stub-service-/, '')
      .replace(/-service$/, '');
    const found = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (entry) => entry.domainId === serviceId
    );
    return found
      ? {
          contractIds: [String(found.id)],
          implementationFiles: [
            'src/contracts/service/core-service-contract-skeletons.ts'
          ],
          testFiles: [],
          fixtureFiles: []
        }
      : emptyEvidence();
  }
  if (identity.layer === 'common_contract') {
    const commonType = identity.id.replace('must-common-', '');
    const skeleton = CORE_COMMON_CONTRACT_SKELETONS.find(
      (entry) => entry.commonType === commonType
    );
    const behavior = behaviorById.get(
      commonBehaviorIds[commonType] ?? commonType
    );
    return {
      contractIds: skeleton ? [String(skeleton.id)] : [],
      implementationFiles: existing(behavior?.sourceFiles ?? []),
      testFiles: existing(behavior?.testFiles ?? []),
      fixtureFiles: existing(fixtureFilesOf(behavior)),
      currentDepth: depthFromNumber(
        behaviorTargetById.get(commonBehaviorIds[commonType] ?? commonType)
          ?.currentDepth ?? 0
      )
    };
  }
  if (identity.layer === 'api') {
    const domainId = identity.id
      .replace(/^must-api-/, '')
      .replace(/^stub-api-/, '')
      .replace('-api-contract', '');
    const found = CORE_API_CONTRACT_SKELETONS.find(
      (entry) => entry.domainId === domainId
    );
    return found
      ? {
          contractIds: [String(found.id)],
          implementationFiles: [
            'src/contracts/api/core-api-contract-skeletons.ts'
          ],
          testFiles: [],
          fixtureFiles: []
        }
      : emptyEvidence();
  }
  if (identity.layer === 'workflow') {
    const workflowType = identity.id
      .replace(/^must-workflow-/, '')
      .replace(/^stub-workflow-/, '');
    const found = CORE_WORKFLOW_CATALOG_SKELETONS.find(
      (entry) => entry.workflowType === workflowType
    );
    return found
      ? {
          contractIds: [String(found.id)],
          implementationFiles: [
            'src/contracts/workflow/core-workflow-catalog-skeletons.ts'
          ],
          testFiles: [],
          fixtureFiles: []
        }
      : emptyEvidence();
  }
  if (identity.layer === 'event') {
    const eventType = identity.id.replace('must-event-', '');
    const exact = CORE_EVENT_CATALOG_SKELETONS.find(
      (entry) => entry.eventType === eventType
    );
    const related = CORE_EVENT_CATALOG_SKELETONS.filter((entry) =>
      (relatedEventTypes[eventType] ?? []).includes(entry.eventType)
    );
    return exact
      ? {
          contractIds: [String(exact.id)],
          implementationFiles: [
            'src/contracts/event/core-event-catalog-skeletons.ts'
          ],
          testFiles: [],
          fixtureFiles: []
        }
      : related.length > 0
        ? {
            contractIds: related.map((entry) => String(entry.id)),
            implementationFiles: [
              'src/contracts/event/core-event-catalog-skeletons.ts'
            ],
            testFiles: [],
            fixtureFiles: []
          }
        : emptyEvidence();
  }
  if (identity.layer === 'agent') {
    const behavior = behaviorById.get('agent-runtime');
    return {
      contractIds: [],
      implementationFiles: existing(behavior?.sourceFiles ?? []),
      testFiles: existing(behavior?.testFiles ?? []),
      fixtureFiles: existing(fixtureFilesOf(behavior))
    };
  }
  if (identity.layer === 'test') {
    const family = identity.id.replace('must-test-', '');
    const found = CORE_TEST_CONTRACT_SKELETONS.find(
      (entry) => entry.testType === family
    );
    return found
      ? {
          contractIds: [String(found.id)],
          implementationFiles: [
            'src/contracts/test/core-test-contract-skeletons.ts'
          ],
          testFiles: [],
          fixtureFiles: []
        }
      : emptyEvidence();
  }
  if (identity.layer === 'guard') {
    return {
      ...emptyEvidence(),
      inspectionPaths,
      forbiddenIndicators: guardIndicators[identity.id] ?? [],
      excludedPaths: excludedGuardPaths
    };
  }
  return emptyEvidence();
}
function emptyEvidence(): CurrentEvidence {
  return {
    contractIds: [],
    implementationFiles: [],
    testFiles: [],
    fixtureFiles: []
  };
}
function disposition(
  identity: Book02MvpRequirementIdentity,
  ev: CurrentEvidence
): Book02MvpDisposition {
  if (identity.layer === 'guard') {
    return inspectBook02MvpGuard({
      inspectionPaths: ev.inspectionPaths ?? [],
      forbiddenIndicators: ev.forbiddenIndicators ?? [],
      excludedPaths: ev.excludedPaths ?? []
    }).violationPresent
      ? 'violation_present'
      : 'not_required';
  }
  if (identity.category === 'stub_now')
    return ev.contractIds.length > 0 || ev.implementationFiles.length > 0
      ? 'boundary_scaffold_only'
      : 'missing';
  if (identity.layer === 'common_contract') {
    const accepted = behaviorById.has(
      commonBehaviorIds[identity.id.replace('must-common-', '')] ??
        identity.id.replace('must-common-', '')
    );
    const filesExist =
      ev.implementationFiles.length > 0 && ev.testFiles.length > 0;
    if (
      accepted &&
      filesExist &&
      commonMeetsRequired(identity.requiredDepth, ev.currentDepth ?? 'level_0')
    )
      return 'meets_required_depth';
    return filesExist
      ? 'partial_evidence'
      : ev.contractIds.length > 0
        ? 'validated_skeleton_only'
        : 'missing';
  }
  if (identity.layer === 'event') {
    return ev.contractIds.length > 0 ? 'semantic_overlap_only' : 'missing';
  }
  if (identity.layer === 'agent')
    return ev.implementationFiles.length > 0
      ? 'boundary_scaffold_only'
      : 'missing';
  return ev.contractIds.length > 0 || ev.implementationFiles.length > 0
    ? 'validated_skeleton_only'
    : 'missing';
}
function gapReasons(
  identity: Book02MvpRequirementIdentity,
  currentDisposition: Book02MvpDisposition
): readonly string[] {
  if (
    currentDisposition === 'meets_required_depth' ||
    currentDisposition === 'not_required'
  )
    return [];
  if (currentDisposition === 'semantic_overlap_only')
    return [
      'Generic catalog semantics overlap, but no explicit validated canonical alias mapping exists.'
    ];
  if (currentDisposition === 'boundary_scaffold_only')
    return [
      'Boundary scaffold is present without full named MVP runtime behavior.'
    ];
  if (currentDisposition === 'partial_evidence')
    return [
      'Selected behavior hooks are accepted at minimum depth, but execution-spine completion is unresolved.'
    ];
  if (currentDisposition === 'fixture_only')
    return [
      'Deterministic fixture or exact catalog evidence exists, but runtime emission is not accepted.'
    ];
  if (currentDisposition === 'validated_skeleton_only')
    return [
      `${identity.layer} has structural contract evidence only; required MVP behavior depth is not proven.`
    ];
  if (currentDisposition === 'violation_present')
    return [
      'Forbidden implementation indicator was detected in controlled runtime areas.'
    ];
  return ['No current implementation evidence meets the required MVP depth.'];
}
export function deriveBook02MvpRequirementState(
  identity: Book02MvpRequirementIdentity
): Book02MvpRequirement {
  const ev = evidenceFor(identity);
  const currentDisposition = disposition(identity, ev);
  const guardInspection =
    identity.layer === 'guard'
      ? inspectBook02MvpGuard({
          inspectionPaths: ev.inspectionPaths ?? [],
          forbiddenIndicators: ev.forbiddenIndicators ?? [],
          excludedPaths: ev.excludedPaths ?? []
        })
      : { violationPresent: false, violationReasons: [] };
  const violationReasons =
    currentDisposition === 'violation_present'
      ? guardInspection.violationReasons
      : [];
  return {
    ...identity,
    currentDisposition,
    currentDepth:
      ev.currentDepth ??
      (currentDisposition === 'not_required' ? 'level_0' : 'level_0'),
    contractIds: ev.contractIds.filter((id) => contractIndexIds.has(id)),
    implementationFiles: ev.implementationFiles,
    testFiles: ev.testFiles,
    fixtureFiles: ev.fixtureFiles,
    inspectionPaths: ev.inspectionPaths,
    forbiddenIndicators: ev.forbiddenIndicators,
    excludedPaths: ev.excludedPaths,
    violationReasons,
    gapReasons: gapReasons(identity, currentDisposition)
  };
}
const byCategory = (
  requirements: readonly Book02MvpRequirement[],
  category: string
) => requirements.filter((r) => r.category === category);
function allMeet(requirements: readonly Book02MvpRequirement[]): boolean {
  return (
    requirements.length > 0 &&
    requirements.every((r) => r.currentDisposition === 'meets_required_depth')
  );
}
function noViolations(requirements: readonly Book02MvpRequirement[]): boolean {
  return requirements.every(
    (r) => r.currentDisposition !== 'violation_present'
  );
}
export function deriveBook02MvpAcceptanceCriteria(
  requirements: readonly Book02MvpRequirement[]
): readonly Book02MvpAcceptanceCriterion[] {
  return MVP_ACCEPTANCE_CRITERIA_IDENTITIES.map((criterion) => {
    const evidenceRequirementIds = evidenceIdsForCriterion(criterion.id);
    const evidenceRequirements = requirements.filter((r) =>
      evidenceRequirementIds.includes(r.id)
    );
    const satisfied = criterionSatisfied(
      criterion.id,
      requirements,
      evidenceRequirements
    );
    return {
      ...criterion,
      satisfied,
      evidenceRequirementIds,
      unresolvedReasons: satisfied
        ? []
        : [
            `${criterion.name} is not yet proven by mapped requirement evidence.`
          ]
    };
  });
}
const acceptanceEvidenceMap: Record<string, readonly string[]> =
  MVP_ACCEPTANCE_CRITERION_DEPENDENCIES;
function evidenceIdsForCriterion(id: string): readonly string[] {
  return acceptanceEvidenceMap[id] ?? [];
}
function criterionSatisfied(
  id: string,
  requirements: readonly Book02MvpRequirement[],
  evidenceRequirements: readonly Book02MvpRequirement[]
): boolean {
  const noNeverViolations = noViolations(
    requirements.filter((r) => r.category === 'never_in_mvp')
  );
  if (
    id === 'deferred-items-do-not-block-mvp' ||
    id === 'never-in-mvp-items-are-not-implemented'
  )
    return noViolations(evidenceRequirements);
  return allMeet(evidenceRequirements) && noNeverViolations;
}
export function deriveBook02MvpGapSummary(
  requirements: readonly Book02MvpRequirement[],
  acceptanceCriteria: readonly Book02MvpAcceptanceCriterion[]
): Book02MvpGapSummary {
  const must = byCategory(requirements, 'must_build_now');
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
  const stubs = byCategory(requirements, 'stub_now');
  const docs = byCategory(requirements, 'document_only');
  const defers = byCategory(requirements, 'defer');
  const never = byCategory(requirements, 'never_in_mvp');
  const unresolvedCriteria = acceptanceCriteria
    .filter((criterion) => !criterion.satisfied)
    .map((criterion) => criterion.id);
  return {
    mustBuildNow: dispositionCounts,
    stubNow: {
      total: stubs.length,
      safelyBounded: stubs.filter(
        (r) =>
          r.currentDisposition === 'boundary_scaffold_only' ||
          r.currentDisposition === 'not_required'
      ).length,
      productionDepthViolations: stubs.filter(
        (r) =>
          r.currentDisposition === 'meets_required_depth' ||
          r.currentDisposition === 'violation_present'
      ).length
    },
    documentOnly: {
      total: docs.length,
      unexpectedImplementationCount: docs.filter(
        (r) =>
          r.currentDisposition === 'violation_present' ||
          r.currentDisposition === 'meets_required_depth'
      ).length
    },
    defer: {
      total: defers.length,
      unexpectedBlockingImplementationCount: defers.filter(
        (r) => r.currentDisposition === 'violation_present'
      ).length
    },
    neverInMvp: {
      total: never.length,
      violationCount: never.filter(
        (r) => r.currentDisposition === 'violation_present'
      ).length
    },
    acceptance: {
      acceptanceCriteriaSatisfied: acceptanceCriteria.filter(
        (criterion) => criterion.satisfied
      ).length,
      acceptanceCriteriaTotal: BOOK_02_EXPECTED_COUNTS.acceptanceCriteria,
      unresolvedCriteria,
      book02MvpComplete:
        unresolvedCriteria.length === 0 &&
        must.every((r) => r.currentDisposition === 'meets_required_depth')
    },
    knownExecutionSpineGaps: [
      'Service behavior',
      'API validator/service delegation',
      'exact MVP Events',
      'three preview/apply Workflows',
      'five named Agent scaffolds',
      'executable test families'
    ]
  };
}
export function buildBook02MvpGapBaseline(): Book02MvpGapBaseline {
  const requirements = BOOK_02_MVP_REQUIREMENT_IDENTITIES.map(
    deriveBook02MvpRequirementState
  );
  const acceptanceCriteria = deriveBook02MvpAcceptanceCriteria(requirements);
  return {
    fixtureType: 'book_02_mvp_gap_baseline',
    authority: BOOK_02_AUTHORITY,
    requirements,
    acceptanceCriteria,
    summary: deriveBook02MvpGapSummary(requirements, acceptanceCriteria)
  };
}
export const BOOK_02_MVP_GAP_BASELINE = buildBook02MvpGapBaseline();
