import {
  CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS,
  type CoreBehaviorDepthLevel
} from './core-contract-behavior-coverage-baseline.ts';

export interface CoreBehaviorGapTarget {
  readonly behaviorId: string;
  readonly currentDepth: CoreBehaviorDepthLevel;
  readonly targetDepth: CoreBehaviorDepthLevel;
  readonly depthIncrement: number;
  readonly sourcePath: string;
  readonly requiredBehavior: readonly string[];
  readonly dependencies: readonly string[];
  readonly implementationBatch: string;
}

export interface CoreBehaviorImplementationBatch {
  readonly id: string;
  readonly name: string;
  readonly behaviorIds: readonly string[];
  readonly targetCount: number;
  readonly depthIncrement: number;
  readonly dependsOn: readonly string[];
  readonly boundary: string;
}

const baselineById = new Map(
  CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.map((entry) => [entry.id, entry])
);

const depthAtInventoryLock = new Map<string, CoreBehaviorDepthLevel>([
  ['references', 0],
  ['errors', 0],
  ['versioning', 0],
  ['ai-context', 0],
  ['agent-runtime', 0],
  ['idempotency', 0],
  ['permission', 0],
  ['policy', 0],
  ['audit-context', 0],
  ['human-review', 0],
  ['events', 1],
  ['pagination', 0]
]);

function gap(
  behaviorId: string,
  implementationBatch: string,
  requiredBehavior: readonly string[],
  dependencies: readonly string[] = []
): CoreBehaviorGapTarget {
  const baseline = baselineById.get(behaviorId);
  if (baseline === undefined)
    throw new Error(`Unknown behavior coverage target: ${behaviorId}.`);

  const currentDepth = depthAtInventoryLock.get(behaviorId);
  if (currentDepth === undefined)
    throw new Error(`Missing inventory-lock depth: ${behaviorId}.`);

  return {
    behaviorId,
    currentDepth,
    targetDepth: baseline.requiredMinimumDepth,
    depthIncrement: baseline.requiredMinimumDepth - currentDepth,
    sourcePath: baseline.sourcePath,
    requiredBehavior,
    dependencies,
    implementationBatch
  };
}

export const CORE_CONTRACT_BEHAVIOR_GAP_TARGETS = [
  gap('references', 'CORE-TASK-028', [
    'Validate public reference shape and type.',
    'Resolve references without exposing database identifiers.',
    'Fail closed for missing, invalid, or inaccessible references.'
  ]),
  gap('errors', 'CORE-TASK-028', [
    'Construct controlled Core errors.',
    'Prevent unsafe internal detail leakage.',
    'Enforce safe failure for unsupported behavior.'
  ]),
  gap('versioning', 'CORE-TASK-028', [
    'Validate supported contract versions.',
    'Fail closed for unsupported versions.'
  ]),
  gap('ai-context', 'CORE-TASK-028', [
    'Validate AI context shape.',
    'Validate source, capability, boundary, and review metadata.'
  ]),
  gap('agent-runtime', 'CORE-TASK-028', [
    'Validate the boundary-safe capability registry.',
    'Reject forbidden Agent actions in boundary tests.'
  ]),
  gap(
    'idempotency',
    'CORE-TASK-029',
    [
      'Validate idempotency keys for duplicate-sensitive actions.',
      'Return the recorded result for valid replay.',
      'Reject key reuse with conflicting input.',
      'Prevent duplicate effects.'
    ],
    ['references', 'errors', 'versioning']
  ),
  gap(
    'permission',
    'CORE-TASK-030',
    [
      'Validate Permission Context.',
      'Provide a service permission hook.',
      'Fail closed for denied protected actions.'
    ],
    ['references', 'errors']
  ),
  gap(
    'policy',
    'CORE-TASK-030',
    [
      'Validate Policy Context.',
      'Provide a service policy hook.',
      'Block or redact restricted behavior.'
    ],
    ['references', 'errors']
  ),
  gap(
    'audit-context',
    'CORE-TASK-030',
    [
      'Validate Audit Context.',
      'Provide a service trace hook without implementing production observability.'
    ],
    ['references', 'errors']
  ),
  gap(
    'human-review',
    'CORE-TASK-030',
    [
      'Validate Human Review Context.',
      'Block gated actions until a valid review outcome exists.'
    ],
    ['permission', 'policy', 'audit-context']
  ),
  gap(
    'events',
    'CORE-TASK-031',
    [
      'Provide Event trace handoff through Event Service.',
      'Maintain a persisted or fixture-backed MVP Event trace.',
      'Apply the visibility policy hook.',
      'Keep Event references non-commanding.'
    ],
    [
      'references',
      'errors',
      'permission',
      'policy',
      'audit-context',
      'idempotency'
    ]
  ),
  gap(
    'pagination',
    'CORE-TASK-031',
    [
      'Validate pagination input and output.',
      'Provide basic list and search pagination.',
      'Apply policy-aware count behavior.'
    ],
    ['references', 'errors', 'permission', 'policy']
  )
] as const satisfies readonly CoreBehaviorGapTarget[];

function batch(
  id: string,
  name: string,
  dependsOn: readonly string[],
  boundary: string
): CoreBehaviorImplementationBatch {
  const targets = CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.filter(
    (entry) => entry.implementationBatch === id
  );
  return {
    id,
    name,
    behaviorIds: targets.map((entry) => entry.behaviorId),
    targetCount: targets.length,
    depthIncrement: targets.reduce(
      (total, entry) => total + entry.depthIncrement,
      0
    ),
    dependsOn,
    boundary
  };
}

export const CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES = [
  batch(
    'CORE-TASK-028',
    'Safety and Boundary Foundations',
    [],
    'Implement only Book 2 reference, safe error, version, AI context, and Agent boundary behavior; no business service mutation.'
  ),
  batch(
    'CORE-TASK-029',
    'Idempotency Enforcement',
    ['CORE-TASK-028'],
    'Implement deterministic replay and conflict protection without introducing external persistence infrastructure.'
  ),
  batch(
    'CORE-TASK-030',
    'Governance Context and Review Hooks',
    ['CORE-TASK-028'],
    'Implement Permission, Policy, Audit, and Human Review validation/hooks without a full Policy Engine or professional decision authority.'
  ),
  batch(
    'CORE-TASK-031',
    'Event Trace and Pagination Hooks',
    ['CORE-TASK-029', 'CORE-TASK-030'],
    'Implement fixture-backed Event trace and basic pagination hooks without an event bus, workflow engine, database, or production integration.'
  )
] as const satisfies readonly CoreBehaviorImplementationBatch[];

export const CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY = {
  id: 'core-contract-behavior-gap-inventory-v0-1',
  version: '0.1.0',
  createdAt: '2026-07-12T00:00:00.000Z',
  task: 'CORE-TASK-027',
  scope: 'behavior_gap_inventory_lock_only',
  authority: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    mvpCut:
      'books/book-02-core-specification/core-specs/implementation/mvp-cut-v0.1.md',
    traceability: 'books/book-02-core-specification/core-specs/TRACEABILITY.md',
    validation:
      'books/book-02-core-specification/core-specs/validation/traceability-validation.md'
  },
  targets: CORE_CONTRACT_BEHAVIOR_GAP_TARGETS,
  implementationBatches: CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES,
  excludedFromMinimumDepthWork: [
    {
      behaviorId: 'workflow-engine',
      reason:
        'Current Level 1 meets the Stub Now minimum; Level 2 remains optional within the Book 2 range.'
    },
    {
      behaviorId: 'policy-engine',
      reason:
        'Current Level 0 meets the Document Only minimum; a full Policy Engine remains outside MVP.'
    }
  ],
  summary: {
    baselineTargetCount: CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.length,
    gapTargetCount: CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.length,
    totalDepthIncrement: CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.reduce(
      (total, entry) => total + entry.depthIncrement,
      0
    ),
    implementationBatchCount:
      CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES.length,
    excludedMinimumSatisfiedTargetCount: 2,
    behaviorImplementedByThisTask: false
  },
  nonGoals: [
    'No behavior implementation is added by this inventory task.',
    'No full Workflow Engine or Policy Engine is authorized.',
    'No database, event bus, external integration, or Product behavior is authorized.',
    'No AI or automated professional decision authority is authorized.'
  ]
} as const;
