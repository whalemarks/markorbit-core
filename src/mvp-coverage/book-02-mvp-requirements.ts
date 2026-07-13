export type Book02MvpCategory =
  | 'must_build_now'
  | 'stub_now'
  | 'document_only'
  | 'defer'
  | 'never_in_mvp';
export type Book02MvpLayer =
  | 'domain'
  | 'object'
  | 'service'
  | 'common_contract'
  | 'api'
  | 'workflow'
  | 'event'
  | 'agent'
  | 'test'
  | 'guard';
export type Book02MvpDisposition =
  | 'meets_required_depth'
  | 'partial_evidence'
  | 'validated_skeleton_only'
  | 'boundary_scaffold_only'
  | 'semantic_overlap_only'
  | 'fixture_only'
  | 'documented_only'
  | 'missing'
  | 'not_required'
  | 'violation_present';

export interface Book02MvpRequirementIdentity {
  readonly id: string;
  readonly name: string;
  readonly category: Book02MvpCategory;
  readonly layer: Book02MvpLayer;
  readonly sourcePath: string;
  readonly requiredImplementationKind: string;
  readonly requiredCapabilities: readonly string[];
  readonly requiredDepth?: string;
  readonly dependencies: readonly string[];
}
export interface Book02MvpRequirement extends Book02MvpRequirementIdentity {
  readonly currentDisposition: Book02MvpDisposition;
  readonly currentDepth?: string;
  readonly contractIds: readonly string[];
  readonly implementationFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly fixtureFiles: readonly string[];
  readonly gapReasons: readonly string[];
}

export const BOOK_02_AUTHORITY = {
  repository: 'whalemarks/markorbit-publication',
  commit: '3349ecb8955021a8714d023348f8b24f941eb98f',
  files: [
    'books/book-02-core-specification/core-specs/implementation/mvp-cut-v0.1.md',
    'books/book-02-core-specification/core-specs/implementation/implementation-depth-matrix.md',
    'books/book-02-core-specification/core-specs/TRACEABILITY.md',
    'books/book-02-core-specification/core-specs/validation/traceability-validation.md'
  ]
} as const;
export const BOOK_02_EXPECTED_COUNTS = {
  mustBuildNow: 115,
  stubNow: 31,
  documentOnly: 14,
  defer: 17,
  neverInMvp: 18,
  acceptanceCriteria: 19,
  fixtureCount: 26
} as const;
export const MUST_BUILD_DOMAINS = [
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
] as const;
export const COMMON_CONTRACTS = [
  'references',
  'errors',
  'permission-context',
  'policy-context',
  'idempotency',
  'audit-context',
  'versioning',
  'pagination',
  'ai-context',
  'human-review'
] as const;
export const MUST_BUILD_WORKFLOWS = [
  'customer-intake-workflow',
  'trademark-application-workflow',
  'communication-review-workflow'
] as const;
export const MUST_BUILD_EVENTS = [
  'customer-created',
  'brand-created',
  'trademark-created',
  'matter-created',
  'order-created',
  'document-created',
  'document-attached',
  'evidence-created',
  'task-created',
  'task-updated',
  'task-completed',
  'communication-created',
  'communication-reviewed',
  'communication-sent',
  'workflow-contract-previewed',
  'workflow-contract-applied',
  'permission-evaluated',
  'policy-evaluated'
] as const;
export const MUST_BUILD_AGENTS = [
  'knowledge-agent',
  'task-agent',
  'communication-agent',
  'workflow-agent',
  'audit-agent'
] as const;
export const MUST_BUILD_TESTS = [
  'common-contract-tests',
  'api-contract-tests',
  'workflow-contract-tests',
  'agent-boundary-tests',
  'permission-policy-tests',
  'idempotency-event-tests',
  'error-versioning-tests'
] as const;
export const STUB_DOMAINS = [
  'knowledge',
  'notification',
  'opportunity',
  'partner',
  'agent',
  'service-provider',
  'service-network',
  'routing'
] as const;
export const STUB_WORKFLOWS = [
  'office-action-response-workflow',
  'provider-routing-workflow',
  'renewal-workflow',
  'assignment-workflow',
  'evidence-review-workflow'
] as const;
export const STUB_AGENTS = [
  'routing-agent',
  'advanced-agent-registry-runtime'
] as const;
export const DOCUMENT_ONLY_ITEMS = Array.from(
  { length: 14 },
  (_, i) => `document-only-${String(i + 1).padStart(2, '0')}`
) as readonly string[];
export const DEFER_ITEMS = Array.from(
  { length: 17 },
  (_, i) => `defer-${String(i + 1).padStart(2, '0')}`
) as readonly string[];
export const NEVER_IN_MVP_ITEMS = [
  'full-workflow-engine',
  'full-policy-engine',
  'ai-official-submission',
  'ai-deadline-certification',
  'ai-final-provider-selection',
  'api-direct-domain-mutation',
  'workflow-direct-active-task-creation',
  'workflow-direct-event-emission',
  'agent-direct-event-emission',
  'production-fixtures',
  'raw-database-ids-in-public-responses',
  'unsafe-stack-traces',
  'silent-unsupported-version-acceptance',
  'event-bus',
  'database-persistence',
  'external-communication-send',
  'official-filing-integration',
  'payment-execution'
] as const;
export const MVP_ACCEPTANCE_CRITERIA = Array.from(
  { length: 19 },
  (_, i) => `book-02-mvp-acceptance-${String(i + 1).padStart(2, '0')}`
) as readonly string[];
const book = 'books/book-02-core-specification/core-specs';
const objectPath = (d: string) =>
  `${book}/objects/${d === 'workflow-contract' ? 'workflow-contract' : d}.md`;
const cap = (s: string) =>
  s
    .split('-')
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(' ');
function req(
  id: string,
  name: string,
  category: Book02MvpCategory,
  layer: Book02MvpLayer,
  sourcePath: string,
  kind: string,
  requiredCapabilities: readonly string[],
  requiredDepth?: string
): Book02MvpRequirementIdentity {
  return {
    id,
    name,
    category,
    layer,
    sourcePath,
    requiredImplementationKind: kind,
    requiredCapabilities,
    requiredDepth,
    dependencies: []
  };
}
export const BOOK_02_MVP_REQUIREMENT_IDENTITIES: readonly Book02MvpRequirementIdentity[] =
  [
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-domain-${d}`,
        cap(d),
        'must_build_now',
        'domain',
        `${book}/domains/${d}.md`,
        'structural_contract',
        ['domain boundary']
      )
    ),
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-object-${d}`,
        `${cap(d)} Object`,
        'must_build_now',
        'object',
        objectPath(d),
        'structural_contract',
        ['object contract']
      )
    ),
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-service-${d}-service`,
        `${cap(d)} Service`,
        'must_build_now',
        'service',
        `${book}/services/${d}-service.md`,
        'real_boundary_behavior',
        ['service boundary behavior']
      )
    ),
    ...COMMON_CONTRACTS.map((c) =>
      req(
        `must-common-${c}`,
        cap(c),
        'must_build_now',
        'common_contract',
        `${book}/common/${c}.md`,
        'minimum_depth_behavior',
        ['contract hook'],
        c.includes('permission') || c.includes('policy')
          ? 'minimum_depth'
          : 'structural_or_minimum_depth'
      )
    ),
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-api-${d}-api-contract`,
        `${cap(d)} API Contract`,
        'must_build_now',
        'api',
        `${book}/api/${d}-api-contract.md`,
        'validator_and_service_delegation',
        ['request/response validation', 'service delegation']
      )
    ),
    ...MUST_BUILD_WORKFLOWS.map((w) =>
      req(
        `must-workflow-${w}`,
        cap(w),
        'must_build_now',
        'workflow',
        `${book}/workflows/${w}.md`,
        'preview_apply_validator',
        [
          'preview request validation',
          'apply request validation',
          'safe error behavior'
        ]
      )
    ),
    ...MUST_BUILD_EVENTS.map((e) =>
      req(
        `must-event-${e}`,
        cap(e),
        'must_build_now',
        'event',
        `${book}/events/${e}.md`,
        'event_record_or_deterministic_fixture',
        ['event reference id', 'safe payload', 'schema version']
      )
    ),
    ...MUST_BUILD_AGENTS.map((a) =>
      req(
        `must-agent-${a}`,
        cap(a),
        'must_build_now',
        'agent',
        `${book}/agents/${a}.md`,
        'boundary_safe_scaffold',
        ['allowed capability validation', 'forbidden action validation']
      )
    ),
    ...MUST_BUILD_TESTS.map((t) =>
      req(
        `must-test-${t}`,
        cap(t),
        'must_build_now',
        'test',
        `${book}/tests/${t}.md`,
        'executable_test_family',
        ['mapped executable tests']
      )
    ),
    ...STUB_DOMAINS.map((d) =>
      req(
        `stub-domain-${d}`,
        cap(d),
        'stub_now',
        'domain',
        `${book}/domains/${d}.md`,
        'bounded_stub',
        ['no production execution']
      )
    ),
    ...STUB_DOMAINS.map((d) =>
      req(
        `stub-service-${d}-service`,
        `${cap(d)} Service`,
        'stub_now',
        'service',
        `${book}/services/${d}-service.md`,
        'bounded_stub',
        ['no production execution']
      )
    ),
    ...STUB_DOMAINS.map((d) =>
      req(
        `stub-api-${d}-api-contract`,
        `${cap(d)} API`,
        'stub_now',
        'api',
        `${book}/api/${d}-api-contract.md`,
        'bounded_stub',
        ['validation only']
      )
    ),
    ...STUB_WORKFLOWS.map((w) =>
      req(
        `stub-workflow-${w}`,
        cap(w),
        'stub_now',
        'workflow',
        `${book}/workflows/${w}.md`,
        'preview_or_validation_only',
        ['no official filing', 'no external send', 'no provider selection']
      )
    ),
    ...STUB_AGENTS.map((a) =>
      req(
        `stub-agent-${a}`,
        cap(a),
        'stub_now',
        'agent',
        `${book}/agents/${a}.md`,
        'bounded_stub',
        ['no production runtime']
      )
    ),
    ...DOCUMENT_ONLY_ITEMS.map((g) =>
      req(
        `document-only-${g}`,
        cap(g),
        'document_only',
        'guard',
        `${book}/implementation/mvp-cut-v0.1.md#section-7`,
        'document_only',
        ['no runtime implementation']
      )
    ),
    ...DEFER_ITEMS.map((g) =>
      req(
        `defer-${g}`,
        cap(g),
        'defer',
        'guard',
        `${book}/implementation/mvp-cut-v0.1.md#section-8`,
        'defer',
        ['outside MVP implementation']
      )
    ),
    ...NEVER_IN_MVP_ITEMS.map((g) =>
      req(
        `never-${g}`,
        cap(g),
        'never_in_mvp',
        'guard',
        `${book}/implementation/mvp-cut-v0.1.md#section-9`,
        'never_in_mvp',
        ['must not be implemented']
      )
    )
  ] as const;
