import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import {
  CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE,
  type CoreBehaviorCoverageTarget
} from './core-contract-behavior-coverage-baseline.ts';
import { CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY } from './core-contract-behavior-gap-inventory.ts';

export type CoreBehaviorAcceptanceBasis =
  'implemented_batch' | 'preexisting_minimum';

export type CoreBehaviorAcceptanceEvidence = {
  readonly behaviorId: string;
  readonly acceptanceBasis: CoreBehaviorAcceptanceBasis;
  readonly implementationTasks: readonly string[];
  readonly sourceFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly fixtureFiles?: readonly string[];
  readonly evidenceDescription: readonly string[];
};

export const CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS = [
  'production_ready',
  'execution_system_complete',
  'book_02_mvp_complete',
  'domain_behavior_complete',
  'workflow_engine_complete',
  'policy_engine_complete',
  'database_complete',
  'external_integrations_complete',
  'ai_autonomous_authority',
  'professional_decision_authority'
] as const;

function deriveExpectedImplementationBatches(): readonly string[] {
  return Object.freeze([
    ...new Set(
      CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY.targets.map(
        (target) => target.implementationBatch
      )
    )
  ]);
}

export const CORE_BEHAVIOR_ACCEPTANCE_EXPECTED_IMPLEMENTATION_BATCHES =
  deriveExpectedImplementationBatches();

export const CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_EVIDENCE = [
  {
    behaviorId: 'references',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-028'],
    sourceFiles: ['src/behaviors/core-reference-behavior.ts'],
    testFiles: ['tests/unit/core-safety-boundary-foundations.test.ts'],
    fixtureFiles: [
      'fixtures/behaviors/core-safety-boundary-foundations.fixture.json'
    ],
    evidenceDescription: [
      'Reference shape, resolution, type, domain, status, and deleted-reference checks.'
    ]
  },
  {
    behaviorId: 'errors',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-028'],
    sourceFiles: ['src/behaviors/core-safe-error.ts'],
    testFiles: ['tests/unit/core-safety-boundary-foundations.test.ts'],
    fixtureFiles: [
      'fixtures/behaviors/core-safety-boundary-foundations.fixture.json'
    ],
    evidenceDescription: [
      'Safe error category/code allowlists and unsafe detail suppression.'
    ]
  },
  {
    behaviorId: 'permission',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-030'],
    sourceFiles: ['src/behaviors/core-governance-behavior.ts'],
    testFiles: ['tests/unit/core-governance-context-review-hooks.test.ts'],
    evidenceDescription: [
      'Permission context validation and protected-action decision enforcement.'
    ]
  },
  {
    behaviorId: 'policy',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-030'],
    sourceFiles: ['src/behaviors/core-governance-behavior.ts'],
    testFiles: ['tests/unit/core-governance-context-review-hooks.test.ts'],
    evidenceDescription: [
      'Policy context validation, restriction rejection, and review propagation.'
    ]
  },
  {
    behaviorId: 'idempotency',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-029'],
    sourceFiles: ['src/behaviors/core-idempotency-behavior.ts'],
    testFiles: ['tests/unit/core-idempotency-enforcement.test.ts'],
    fixtureFiles: [
      'fixtures/behaviors/core-idempotency-enforcement.fixture.json'
    ],
    evidenceDescription: [
      'Key validation, fingerprints, single side effect, replay, conflict, expiration, and permission/policy re-evaluation.'
    ]
  },
  {
    behaviorId: 'audit-context',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-030'],
    sourceFiles: ['src/behaviors/core-governance-behavior.ts'],
    testFiles: ['tests/unit/core-governance-context-review-hooks.test.ts'],
    evidenceDescription: ['Audit context validation and governed handoff.']
  },
  {
    behaviorId: 'events',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-031'],
    sourceFiles: ['src/behaviors/core-event-pagination-behavior.ts'],
    testFiles: ['tests/unit/core-event-pagination-hooks.test.ts'],
    evidenceDescription: [
      'Append-only trace, duplicate protection, and visibility filtering.'
    ]
  },
  {
    behaviorId: 'versioning',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-028'],
    sourceFiles: ['src/behaviors/core-version-behavior.ts'],
    testFiles: ['tests/unit/core-safety-boundary-foundations.test.ts'],
    fixtureFiles: [
      'fixtures/behaviors/core-safety-boundary-foundations.fixture.json'
    ],
    evidenceDescription: [
      'Semantic contract version validation and supported-version fail-closed behavior.'
    ]
  },
  {
    behaviorId: 'pagination',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-031'],
    sourceFiles: ['src/behaviors/core-event-pagination-behavior.ts'],
    testFiles: ['tests/unit/core-event-pagination-hooks.test.ts'],
    evidenceDescription: [
      'Bounded cursor pagination, query-bound cursors, limit/sort validation, permission/policy filtering, and safe count omission.'
    ]
  },
  {
    behaviorId: 'ai-context',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-028'],
    sourceFiles: ['src/behaviors/core-ai-context-behavior.ts'],
    testFiles: ['tests/unit/core-safety-boundary-foundations.test.ts'],
    fixtureFiles: [
      'fixtures/behaviors/core-safety-boundary-foundations.fixture.json'
    ],
    evidenceDescription: [
      'AI context, Agent identity/capability/data-scope/output/source/review validation.'
    ]
  },
  {
    behaviorId: 'human-review',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-030'],
    sourceFiles: ['src/behaviors/core-governance-behavior.ts'],
    testFiles: ['tests/unit/core-governance-context-review-hooks.test.ts'],
    evidenceDescription: [
      'Human Review context and protected-action review gate.'
    ]
  },
  {
    behaviorId: 'agent-runtime',
    acceptanceBasis: 'implemented_batch',
    implementationTasks: ['CORE-TASK-028'],
    sourceFiles: ['src/behaviors/core-agent-boundary.ts'],
    testFiles: ['tests/unit/core-safety-boundary-foundations.test.ts'],
    fixtureFiles: [
      'fixtures/behaviors/core-safety-boundary-foundations.fixture.json'
    ],
    evidenceDescription: [
      'Agent registry, capability allowlist, status rejection, and downstream permission/policy requirement.'
    ]
  },
  {
    behaviorId: 'workflow-engine',
    acceptanceBasis: 'preexisting_minimum',
    implementationTasks: [],
    sourceFiles: ['src/workflows/core-workflow-contract-validation.ts'],
    testFiles: ['tests/unit/core-workflow-contract-validation.test.ts'],
    fixtureFiles: [
      'fixtures/workflows/core-workflow-contract-base.fixture.json'
    ],
    evidenceDescription: [
      'Only generic Workflow validation Level 1 is accepted; no complete Workflow Engine is accepted.'
    ]
  },
  {
    behaviorId: 'policy-engine',
    acceptanceBasis: 'preexisting_minimum',
    implementationTasks: [],
    sourceFiles: ['src/contracts/policy/core-policy-contract-validation.ts'],
    testFiles: ['tests/unit/core-policy-contract-skeletons.test.ts'],
    fixtureFiles: [
      'fixtures/contracts/core-policy-contract-skeletons.fixture.json'
    ],
    evidenceDescription: [
      'Only Document Only Level 0 policy-engine status is accepted; no complete Policy Engine is accepted.'
    ]
  }
] as const satisfies readonly CoreBehaviorAcceptanceEvidence[];

export const CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK = {
  id: 'core-contract-behavior-acceptance-lock-v0-1',
  version: '0.1.0',
  task: 'CORE-TASK-033',
  scope: 'selected_core_behavior_hook_acceptance',
  authority: CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.authority,
  evidence: CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_EVIDENCE,
  acceptedImplementationBatches: [
    'CORE-TASK-028',
    'CORE-TASK-029',
    'CORE-TASK-030',
    'CORE-TASK-031'
  ],
  nonGoals: CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS
} as const;

export type CoreBehaviorAcceptanceLock =
  typeof CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK;

export function deriveCoreContractBehaviorAcceptanceSummary(
  lock: {
    readonly evidence: readonly CoreBehaviorAcceptanceEvidence[];
    readonly acceptedImplementationBatches: readonly string[];
  },
  baseline: {
    readonly targets: readonly CoreBehaviorCoverageTarget[];
  } = CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE
) {
  const acceptedIds = new Set(lock.evidence.map((entry) => entry.behaviorId));
  const acceptedTargets = baseline.targets.filter(
    (target) =>
      acceptedIds.has(target.id) &&
      target.currentDepth >= target.requiredMinimumDepth
  );
  return {
    behaviorTargetsAccepted: acceptedTargets.length,
    behaviorTargetCount: baseline.targets.length,
    mustBuildNowAccepted: acceptedTargets.filter(
      (target) => target.mvpCategory === 'must_build_now'
    ).length,
    mustBuildNowTargetCount: baseline.targets.filter(
      (target) => target.mvpCategory === 'must_build_now'
    ).length,
    implementedBatchTargets: lock.evidence.filter(
      (entry) => entry.acceptanceBasis === 'implemented_batch'
    ).length,
    preexistingMinimumTargets: lock.evidence.filter(
      (entry) => entry.acceptanceBasis === 'preexisting_minimum'
    ).length,
    implementationBatchesAccepted: lock.acceptedImplementationBatches.length,
    evidenceMappings: lock.evidence.length
  } as const;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stringArray(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string')
    ? value
    : undefined;
}

function evidenceArray(
  value: unknown
): readonly CoreBehaviorAcceptanceEvidence[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const entries: CoreBehaviorAcceptanceEvidence[] = [];
  for (const entry of value) {
    if (!isPlainObject(entry)) return undefined;
    const implementationTasks = stringArray(entry.implementationTasks);
    const sourceFiles = stringArray(entry.sourceFiles);
    const testFiles = stringArray(entry.testFiles);
    const fixtureFiles =
      entry.fixtureFiles === undefined
        ? undefined
        : stringArray(entry.fixtureFiles);
    const evidenceDescription = stringArray(entry.evidenceDescription);
    if (
      typeof entry.behaviorId !== 'string' ||
      (entry.acceptanceBasis !== 'implemented_batch' &&
        entry.acceptanceBasis !== 'preexisting_minimum') ||
      implementationTasks === undefined ||
      sourceFiles === undefined ||
      testFiles === undefined ||
      (fixtureFiles === undefined && entry.fixtureFiles !== undefined) ||
      evidenceDescription === undefined
    )
      return undefined;
    entries.push({
      behaviorId: entry.behaviorId,
      acceptanceBasis: entry.acceptanceBasis,
      implementationTasks,
      sourceFiles,
      testFiles,
      ...(fixtureFiles === undefined ? {} : { fixtureFiles }),
      evidenceDescription
    });
  }
  return entries;
}

function validPath(path: string, prefix: string): string | undefined {
  if (isAbsolute(path) || path.includes('..'))
    return `${path} must be repository-relative and must not contain ..`;
  if (!path.startsWith(prefix)) return `${path} must be under ${prefix}`;
  if (!existsSync(path)) return `${path} must exist`;
  return undefined;
}

export function validateCoreContractBehaviorAcceptanceLock(
  value: unknown,
  baseline: {
    readonly targets: readonly CoreBehaviorCoverageTarget[];
  } = CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE
): readonly string[] {
  if (!isPlainObject(value))
    return ['Behavior acceptance lock must be a plain object.'];

  const errors: string[] = [];
  if (value.id !== 'core-contract-behavior-acceptance-lock-v0-1')
    errors.push('Behavior acceptance lock id must match the canonical id.');
  if (value.version !== '0.1.0')
    errors.push(
      'Behavior acceptance lock version must match the canonical version.'
    );
  if (value.task !== 'CORE-TASK-033')
    errors.push('Behavior acceptance lock task must be CORE-TASK-033.');
  if (value.scope !== 'selected_core_behavior_hook_acceptance')
    errors.push(
      'Behavior acceptance lock scope must remain selected Core behavior-hook acceptance only.'
    );
  if (
    JSON.stringify(value.authority) !==
    JSON.stringify(CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.authority)
  )
    errors.push(
      'Behavior acceptance authority must match the behavior coverage baseline authority.'
    );

  const evidence = evidenceArray(value.evidence);
  if (evidence === undefined) {
    errors.push('Behavior acceptance evidence must be a typed evidence array.');
  }
  const acceptedImplementationBatches = stringArray(
    value.acceptedImplementationBatches
  );
  if (acceptedImplementationBatches === undefined)
    errors.push(
      'Behavior acceptance implementation batches must be an array of strings.'
    );
  const nonGoals = stringArray(value.nonGoals);
  if (nonGoals === undefined)
    errors.push('Behavior acceptance nonGoals must be an array of strings.');

  const safeEvidence = evidence ?? [];
  const baselineIds = baseline.targets.map((target) => target.id);
  const evidenceIds = safeEvidence.map((entry) => entry.behaviorId);
  if (safeEvidence.length !== 14)
    errors.push(
      'Behavior acceptance evidence must contain exactly 14 entries.'
    );
  if (JSON.stringify(evidenceIds) !== JSON.stringify(baselineIds))
    errors.push(
      'Behavior acceptance evidence IDs and order must match the behavior coverage baseline exactly.'
    );
  if (new Set(evidenceIds).size !== evidenceIds.length)
    errors.push(
      'Behavior acceptance evidence must not contain duplicate behavior IDs.'
    );
  for (const target of baseline.targets)
    if (target.currentDepth < target.requiredMinimumDepth)
      errors.push(`${target.id} currentDepth must meet requiredMinimumDepth.`);

  const gaps = new Map(
    CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY.targets.map((target) => [
      target.behaviorId,
      target.implementationBatch
    ])
  );
  const exclusions = new Set<string>(
    CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY.excludedFromMinimumDepthWork.map(
      (entry) => entry.behaviorId
    )
  );
  for (const entry of safeEvidence) {
    const gapBatch = gaps.get(entry.behaviorId);
    if (gapBatch !== undefined) {
      if (entry.acceptanceBasis !== 'implemented_batch')
        errors.push(`${entry.behaviorId} must be implemented_batch.`);
      if (
        JSON.stringify(entry.implementationTasks) !== JSON.stringify([gapBatch])
      )
        errors.push(
          `${entry.behaviorId} implementationTasks must match Behavior Gap Inventory.`
        );
    } else if (exclusions.has(entry.behaviorId)) {
      if (entry.acceptanceBasis !== 'preexisting_minimum')
        errors.push(`${entry.behaviorId} must be preexisting_minimum.`);
      if (entry.implementationTasks.length !== 0)
        errors.push(`${entry.behaviorId} must not claim implementation tasks.`);
    } else
      errors.push(
        `${entry.behaviorId} is neither a gap target nor a minimum-satisfied exclusion.`
      );

    if (entry.sourceFiles.length < 1 || entry.testFiles.length < 1)
      errors.push(`${entry.behaviorId} must include source and test evidence.`);
    for (const path of entry.sourceFiles) {
      const issue = validPath(path, 'src/');
      if (issue) errors.push(issue);
    }
    for (const path of entry.testFiles) {
      const issue = validPath(path, 'tests/');
      if (issue) errors.push(issue);
    }
    for (const path of entry.fixtureFiles ?? []) {
      const issue = validPath(path, 'fixtures/');
      if (issue) errors.push(issue);
    }
    if (
      entry.behaviorId === 'policy-engine' &&
      /\b(accepted|implemented|complete)\s+policy\s+engine\b/.test(
        entry.evidenceDescription
          .join(' ')
          .toLowerCase()
          .replace('no complete policy engine', '')
      )
    )
      errors.push(
        'policy-engine evidence must not claim a complete Policy Engine.'
      );
  }

  if (
    JSON.stringify(acceptedImplementationBatches ?? []) !==
    JSON.stringify(CORE_BEHAVIOR_ACCEPTANCE_EXPECTED_IMPLEMENTATION_BATCHES)
  )
    errors.push(
      'Behavior acceptance must accept exactly the implementation batches derived from the Behavior Gap Inventory.'
    );
  if (
    JSON.stringify(nonGoals ?? []) !==
    JSON.stringify(CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS)
  )
    errors.push(
      'Behavior acceptance nonGoals must exactly match the required non-goals in deterministic order.'
    );
  return errors;
}
