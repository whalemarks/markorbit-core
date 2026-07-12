export const CORE_BEHAVIOR_DEPTH_LEVELS = [0, 1, 2, 3, 4] as const;
export type CoreBehaviorDepthLevel =
  (typeof CORE_BEHAVIOR_DEPTH_LEVELS)[number];

export type CoreBehaviorCoverageStatus =
  | 'meets_minimum_depth'
  | 'partial'
  | 'not_implemented';

export interface CoreBehaviorCoverageTarget {
  readonly id: string;
  readonly name: string;
  readonly mvpCategory: 'must_build_now' | 'stub_now' | 'document_only';
  readonly requiredMinimumDepth: CoreBehaviorDepthLevel;
  readonly requiredMaximumDepth: CoreBehaviorDepthLevel;
  readonly currentDepth: CoreBehaviorDepthLevel;
  readonly status: CoreBehaviorCoverageStatus;
  readonly sourcePath: string;
  readonly currentEvidence: readonly string[];
  readonly missingBehavior: readonly string[];
}

const root = 'books/book-02-core-specification/core-specs';

function target(
  value: Omit<CoreBehaviorCoverageTarget, 'status'>
): CoreBehaviorCoverageTarget {
  return {
    ...value,
    status:
      value.currentDepth >= value.requiredMinimumDepth
        ? 'meets_minimum_depth'
        : value.currentDepth === 0
          ? 'not_implemented'
          : 'partial'
  };
}

export const CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS = [
  target({
    id: 'references',
    name: 'References',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 3,
    requiredMaximumDepth: 3,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/references.md`,
    currentEvidence: ['Validated Reference Contract skeleton only.'],
    missingBehavior: [
      'Reference schema validation.',
      'Reference resolution.',
      'Real fail-closed enforcement.'
    ]
  }),
  target({
    id: 'errors',
    name: 'Errors',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 3,
    requiredMaximumDepth: 3,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/errors.md`,
    currentEvidence: ['Validated Error Contract skeleton only.'],
    missingBehavior: [
      'Safe error construction.',
      'Leakage prevention.',
      'Real error enforcement.'
    ]
  }),
  target({
    id: 'permission',
    name: 'Permission',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 3,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/permission-context.md`,
    currentEvidence: ['Permission and Permission Context skeletons only.'],
    missingBehavior: [
      'Service permission hook.',
      'Fail-closed protected-action enforcement.'
    ]
  }),
  target({
    id: 'policy',
    name: 'Policy',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 2,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/policy-context.md`,
    currentEvidence: ['Policy and Policy Context skeletons only.'],
    missingBehavior: [
      'Policy context schema validation.',
      'Service policy hook.'
    ]
  }),
  target({
    id: 'idempotency',
    name: 'Idempotency',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 3,
    requiredMaximumDepth: 3,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/idempotency.md`,
    currentEvidence: ['Validated Idempotency Contract skeleton only.'],
    missingBehavior: [
      'Key validation.',
      'Replay handling.',
      'Conflict detection.',
      'Duplicate-effect prevention.'
    ]
  }),
  target({
    id: 'audit-context',
    name: 'Audit Context',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/audit-context.md`,
    currentEvidence: ['Validated Audit Context Contract skeleton only.'],
    missingBehavior: ['Audit context schema validation.', 'Service trace hook.']
  }),
  target({
    id: 'events',
    name: 'Events',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 1,
    sourcePath: `${root}/objects/event-object.md`,
    currentEvidence: [
      'Generic Event shape validation.',
      'Fixture-backed Event examples.',
      'Event catalog structural validation.'
    ],
    missingBehavior: [
      'Event trace handoff through Event Service.',
      'Persisted or fully fixture-backed MVP event trace.',
      'Visibility policy hook.'
    ]
  }),
  target({
    id: 'versioning',
    name: 'Versioning',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 1,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/versioning.md`,
    currentEvidence: [
      'Validated Versioning Contract skeleton only.',
      'Generic positive version fields do not implement unsupported-version handling.'
    ],
    missingBehavior: [
      'Version schema validation.',
      'Unsupported-version fail-closed behavior.'
    ]
  }),
  target({
    id: 'pagination',
    name: 'Pagination',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/pagination.md`,
    currentEvidence: ['Validated Pagination Contract skeleton only.'],
    missingBehavior: [
      'Pagination schema validation.',
      'Basic list/search support.',
      'Policy-aware count behavior.'
    ]
  }),
  target({
    id: 'ai-context',
    name: 'AI Context',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 1,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/ai-context.md`,
    currentEvidence: ['Validated AI Context and AI Governance skeletons only.'],
    missingBehavior: [
      'AI context schema validation.',
      'Boundary metadata validation.'
    ]
  }),
  target({
    id: 'human-review',
    name: 'Human Review',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 0,
    sourcePath: `${root}/contracts/common/human-review.md`,
    currentEvidence: [
      'Validated Human Review Contract skeleton and generic review outcome type only.'
    ],
    missingBehavior: [
      'Review context schema validation.',
      'Protected-action review gate.'
    ]
  }),
  target({
    id: 'agent-runtime',
    name: 'Agent Runtime',
    mvpCategory: 'stub_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 1,
    currentDepth: 0,
    sourcePath: `${root}/implementation/mvp-cut-v0.1.md`,
    currentEvidence: ['AI Governance skeleton collection only.'],
    missingBehavior: [
      'Capability registry validation.',
      'Forbidden-action boundary tests.'
    ]
  }),
  target({
    id: 'workflow-engine',
    name: 'Workflow Engine',
    mvpCategory: 'stub_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 2,
    currentDepth: 1,
    sourcePath: `${root}/implementation/mvp-cut-v0.1.md`,
    currentEvidence: [
      'Generic Workflow Contract shape validation.',
      'Canonical workflow skeleton validation.'
    ],
    missingBehavior: [
      'MVP workflow preview validation.',
      'MVP workflow apply validation.',
      'Review, permission, policy, idempotency, and Event trace boundary validation.'
    ]
  }),
  target({
    id: 'policy-engine',
    name: 'Policy Engine',
    mvpCategory: 'document_only',
    requiredMinimumDepth: 0,
    requiredMaximumDepth: 1,
    currentDepth: 0,
    sourcePath: `${root}/implementation/mvp-cut-v0.1.md`,
    currentEvidence: ['Policy engine remains explicitly unimplemented.'],
    missingBehavior: []
  })
] as const satisfies readonly CoreBehaviorCoverageTarget[];

const meetsMinimum = CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.filter(
  (entry) => entry.status === 'meets_minimum_depth'
);
const partial = CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.filter(
  (entry) => entry.status === 'partial'
);

export const CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE = {
  id: 'core-contract-behavior-coverage-baseline-v0-1',
  version: '0.1.0',
  createdAt: '2026-07-11T00:00:00.000Z',
  task: 'CORE-TASK-026',
  scope: 'contract_behavior_depth_assessment_only',
  authority: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    mvpCut: `${root}/implementation/mvp-cut-v0.1.md`,
    traceability: `${root}/TRACEABILITY.md`,
    validation: `${root}/validation/traceability-validation.md`
  },
  depthModel: {
    0: 'documented_or_skeleton_only',
    1: 'schema_validation',
    2: 'service_hook',
    3: 'real_enforcement',
    4: 'audited_production_enforcement'
  },
  targets: CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS,
  summary: {
    totalTargetCount: CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.length,
    meetsMinimumDepthCount: meetsMinimum.length,
    partialTargetCount: partial.length,
    notImplementedTargetCount:
      CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.length -
      meetsMinimum.length -
      partial.length,
    mustBuildNowTargetCount: CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.filter(
      (entry) => entry.mvpCategory === 'must_build_now'
    ).length,
    mustBuildNowMeetsMinimumDepthCount: meetsMinimum.filter(
      (entry) => entry.mvpCategory === 'must_build_now'
    ).length,
    behaviorAcceptanceReady: false
  },
  assessmentBoundary: {
    behaviorDepthAssessed: true,
    behaviorImplementedByThisTask: false,
    executionSystemImplemented: false,
    productionReadinessAssessed: false
  }
} as const;
