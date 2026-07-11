import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreCommonContract } from './core-common-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-11T00:00:00.000Z';
const specificationRepository = 'whalemarks/markorbit-publication';
const specificationCommit = '3349ecb8955021a8714d023348f8b24f941eb98f';
const specificationPath = 'books/book-02-core-specification/';
const commonRoot = `${specificationPath}core-specs/contracts/common/`;

const sharedNonGoals = [
  'Executable validation, decision, replay, migration, redaction, review, authorization, storage, or side-effect behavior.',
  'Service, API, workflow, event bus, permission engine, policy engine, AI runtime, database, Product UI, or Book 3 execution implementation.',
  'Production data, production readiness, domain-specific business behavior, or replacement of the canonical Book 2 source contract.'
] as const;

const commonSkeleton = (
  commonType: string,
  name: string,
  description: string,
  sourceFile: string,
  purpose: string,
  owns: readonly string[],
  specificNonGoals: readonly string[]
): CoreCommonContract => {
  const sourcePath = `${commonRoot}${sourceFile}`;
  return {
    id: createCoreContractId(`core-common-${commonType}-contract`),
    commonType,
    name,
    description,
    status: CORE_CONTRACT_STATUSES.active,
    book: coreBook,
    sourcePath,
    purpose,
    owns,
    nonGoals: [...sharedNonGoals, ...specificNonGoals],
    implementationDepth: 'validated_skeleton',
    createdAt,
    metadata: {
      specificationRepository,
      specificationCommit,
      specificationPath,
      implementationTask: 'CORE-TASK-020'
    }
  };
};

export const CORE_COMMON_CONTRACT_SKELETONS = [
  commonSkeleton(
    'references',
    'Core References Contract Skeleton',
    'Canonical metadata skeleton for public and cross-domain reference boundaries.',
    'references.md',
    'Defines the canonical reference naming, typing, trace, validation, and safe-exposure boundary without implementing reference resolution.',
    [
      'Canonical reference field naming and typed-reference boundary.',
      'Cross-domain, actor, subject, target, agent, and correlation reference rules.',
      'Safe reference validation and exposure expectations.'
    ],
    [
      'Reference resolvers, database ID mapping, existence disclosure, permission inference, or cross-domain service calls.'
    ]
  ),
  commonSkeleton(
    'errors',
    'Core Errors Contract Skeleton',
    'Canonical metadata skeleton for controlled and safe Core error boundaries.',
    'errors.md',
    'Defines controlled error shape, categorization, correlation, retryability, non-disclosure, and leakage-prevention boundaries without throwing runtime errors.',
    [
      'Controlled error-code and safe-message boundary.',
      'Correlation, retryability, next-step, and restricted-field omission expectations.',
      'Non-disclosure and sensitive-internal leakage prevention rules.'
    ],
    [
      'Runtime exception classes, stack handling, transport status mapping, logging, retries, or error recovery execution.'
    ]
  ),
  commonSkeleton(
    'pagination',
    'Core Pagination Contract Skeleton',
    'Canonical metadata skeleton for policy-aware list pagination boundaries.',
    'pagination.md',
    'Defines request, response, cursor, limit, sorting, count, filtering, and safe-empty-result boundaries without implementing queries.',
    [
      'Pagination request, response, cursor, and list-envelope boundary.',
      'Limit, sorting, filtering, and empty-result expectations.',
      'Policy-aware total-count omission and safe exposure rules.'
    ],
    [
      'Database queries, cursor encoding, search execution, result filtering, count computation, or collection mutation.'
    ]
  ),
  commonSkeleton(
    'audit-context',
    'Core Audit Context Contract Skeleton',
    'Canonical metadata skeleton for correlation and event-trace context boundaries.',
    'audit-context.md',
    'Defines correlation, causation, actor, service, event-reference, and trace context boundaries while preserving that audit references are not commands.',
    [
      'Correlation, causation, actor, service, and event-reference context boundary.',
      'Trace preservation and audit visibility expectations.',
      'Event references as historical trace rather than executable commands.'
    ],
    [
      'Audit logging infrastructure, event emission, command dispatch, compliance conclusions, or trace persistence.'
    ]
  ),
  commonSkeleton(
    'ai-context',
    'Core AI Context Contract Skeleton',
    'Canonical metadata skeleton for bounded AI assistance context.',
    'ai-context.md',
    'Defines authorized source, capability, policy-omission, risk, output, review, and trace context boundaries without assembling prompts or executing AI.',
    [
      'Authorized source and capability scope boundary.',
      'Policy omission, restricted-field, risk, review, and output metadata expectations.',
      'AI-origin, uncertainty, and downstream-use disclosure boundary.'
    ],
    [
      'Prompt construction, model invocation, RAG, vector retrieval, autonomous action, hidden reasoning, or output approval.'
    ]
  ),
  commonSkeleton(
    'human-review',
    'Core Human Review Contract Skeleton',
    'Canonical metadata skeleton for accountable human-review boundaries.',
    'human-review.md',
    'Defines review requirement, status, decision-record, reviewer, source, scope, and trace boundaries without making review decisions.',
    [
      'Human-review requirement, status, scope, reviewer, and source boundary.',
      'Accountable review-record and reference expectations.',
      'Protected-use gating and downstream-use restriction boundary.'
    ],
    [
      'Reviewer assignment, approval or rejection decisions, workflow gates, downstream execution, or bypass authority.'
    ]
  ),
  commonSkeleton(
    'permission-context',
    'Core Permission Context Contract Skeleton',
    'Canonical metadata skeleton for permission-decision context boundaries.',
    'permission-context.md',
    'Defines actor, operation, permission-key, decision, reason, scope, and trace context boundaries without evaluating or granting permissions.',
    [
      'Actor, operation, permission-key, decision, reason, and scope context boundary.',
      'Fail-closed and protected-action permission expectations.',
      'Permission trace and safe error boundary.'
    ],
    [
      'Permission grants, RBAC administration, authorization middleware, permission evaluation, or protected-action execution.'
    ]
  ),
  commonSkeleton(
    'policy-context',
    'Core Policy Context Contract Skeleton',
    'Canonical metadata skeleton for policy restriction context boundaries.',
    'policy-context.md',
    'Defines actor, operation, policy decision, restriction, redaction, omission, review, data-access, and trace context boundaries without policy evaluation.',
    [
      'Policy decision, restriction, redaction, omission, and review context boundary.',
      'Data-access scope and cross-organization policy expectations.',
      'Fail-closed policy trace and safe exposure rules.'
    ],
    [
      'Policy authoring, rule evaluation, enforcement, redaction execution, data filtering, or compliance decisions.'
    ]
  ),
  commonSkeleton(
    'idempotency',
    'Core Idempotency Contract Skeleton',
    'Canonical metadata skeleton for duplicate-safe operation boundaries.',
    'idempotency.md',
    'Defines idempotency key, scope, fingerprint, replay, conflict, retry, result, and event-safety boundaries without implementing an idempotency store.',
    [
      'Idempotency key, scope, fingerprint, status, and result boundary.',
      'Identical replay, conflicting replay, and safe retry expectations.',
      'Duplicate side-effect and duplicate event prevention boundary.'
    ],
    [
      'Fingerprint computation, idempotency persistence, atomic side effects, replay execution, locking, or duplicate detection runtime.'
    ]
  ),
  commonSkeleton(
    'versioning',
    'Core Versioning Contract Skeleton',
    'Canonical metadata skeleton for compatibility and version-trace boundaries.',
    'versioning.md',
    'Defines contract, schema, API, service, event, agent, workflow, compatibility, breaking-change, deprecation, and migration boundaries without performing migrations.',
    [
      'Canonical version field, format, and compatibility boundary.',
      'Breaking-change, deprecation, migration, and historical-version expectations.',
      'Version preservation across APIs, services, events, agents, and workflows.'
    ],
    [
      'Schema migration execution, compatibility adapters, version negotiation, data rewriting, deployment, or deprecation enforcement.'
    ]
  )
] as const satisfies readonly CoreCommonContract[];
