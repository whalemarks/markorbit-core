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
    currentDepth: 3,
    sourcePath: `${root}/contracts/common/references.md`,
    currentEvidence: [
      'Typed public reference validation.',
      'Deterministic in-memory reference resolution.',
      'Fail-closed invalid, missing, mismatched, status, and deleted-reference behavior.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'errors',
    name: 'Errors',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 3,
    requiredMaximumDepth: 3,
    currentDepth: 3,
    sourcePath: `${root}/contracts/common/errors.md`,
    currentEvidence: [
      'Controlled safe error construction.',
      'Unsafe SQL, stack, credential, prompt, and database detail suppression.',
      'Deterministic safe fallback messages.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'permission',
    name: 'Permission',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 3,
    currentDepth: 2,
    sourcePath: `${root}/contracts/common/permission-context.md`,
    currentEvidence: [
      'Permission context validation and decision-reference enforcement.',
      'Fail-closed protected-action permission hook.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'policy',
    name: 'Policy',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 2,
    currentDepth: 1,
    sourcePath: `${root}/contracts/common/policy-context.md`,
    currentEvidence: [
      'Policy context validation, restriction handling, and human-review requirement propagation.'
    ],
    missingBehavior: ['Service policy hook.']
  }),
  target({
    id: 'idempotency',
    name: 'Idempotency',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 3,
    requiredMaximumDepth: 3,
    currentDepth: 3,
    sourcePath: `${root}/contracts/common/idempotency.md`,
    currentEvidence: [
      'Opaque idempotency-key validation and stable canonical request fingerprints.',
      'Deterministic same-request replay with original safe result reuse.',
      'Fingerprint conflict and expired-record fail-closed behavior.',
      'Permission and Policy re-evaluation before both first execution and replay.',
      'Single-execution duplicate-effect prevention.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'audit-context',
    name: 'Audit Context',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 2,
    sourcePath: `${root}/contracts/common/audit-context.md`,
    currentEvidence: [
      'Required audit trace validation.',
      'Immutable safe audit-context handoff from governed actions.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'events',
    name: 'Events',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 2,
    sourcePath: `${root}/objects/event-object.md`,
    currentEvidence: [
      'Generic Event shape and catalog validation.',
      'Append-only in-memory Event trace handoff.',
      'Event visibility policy filtering.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'versioning',
    name: 'Versioning',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 1,
    currentDepth: 1,
    sourcePath: `${root}/contracts/common/versioning.md`,
    currentEvidence: [
      'Contract-facing semantic version validation.',
      'Supported-version allowlist enforcement.',
      'Unsupported-version fail-closed behavior.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'pagination',
    name: 'Pagination',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 2,
    sourcePath: `${root}/contracts/common/pagination.md`,
    currentEvidence: [
      'Bounded cursor pagination with stable allowed-field sorting.',
      'Permission/Policy visibility filtering and safe total-count omission.',
      'Stricter Agent page limits and tamper-resistant query-bound cursors.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'ai-context',
    name: 'AI Context',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 1,
    currentDepth: 1,
    sourcePath: `${root}/contracts/common/ai-context.md`,
    currentEvidence: [
      'AI assistance, Agent identity, capability, data scope, output mode, source trace, and review metadata validation.',
      'AI-generated output disclosure enforcement.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'human-review',
    name: 'Human Review',
    mvpCategory: 'must_build_now',
    requiredMinimumDepth: 2,
    requiredMaximumDepth: 2,
    currentDepth: 2,
    sourcePath: `${root}/contracts/common/human-review.md`,
    currentEvidence: [
      'Human Review context and completed-decision validation.',
      'Policy-triggered protected-action review gate.'
    ],
    missingBehavior: []
  }),
  target({
    id: 'agent-runtime',
    name: 'Agent Runtime',
    mvpCategory: 'stub_now',
    requiredMinimumDepth: 1,
    requiredMaximumDepth: 1,
    currentDepth: 1,
    sourcePath: `${root}/implementation/mvp-cut-v0.1.md`,
    currentEvidence: [
      'Deterministic Agent registry validation.',
      'Capability allowlist enforcement.',
      'Forbidden, out-of-scope, suspended, and revoked Agent rejection.',
      'Permission/Policy evaluation remains explicitly required downstream.'
    ],
    missingBehavior: []
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
    behaviorAcceptanceReady: true
  },
  assessmentBoundary: {
    behaviorDepthAssessed: true,
    behaviorImplementedByThisTask: false,
    executionSystemImplemented: false,
    productionReadinessAssessed: false
  }
} as const;
