import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreTestContract } from './core-test-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-11T00:00:00.000Z';
const specificationRepository = 'whalemarks/markorbit-publication';
const specificationCommit = '3349ecb8955021a8714d023348f8b24f941eb98f';
const specificationPath = 'books/book-02-core-specification/';
const testRoot = `${specificationPath}core-specs/contracts/tests/`;

const sharedNonGoals = [
  'Executable test cases, assertions, runners, setup, teardown, mocks, generated fixtures, coverage execution, or production-like data.',
  'Implementation or proof of Common, API, Workflow, Event, Agent, Permission, Policy, service, or runtime behavior.',
  'Product UI, external integration, production readiness, Book 3 execution, or replacement of the canonical Book 2 Test Contract.'
] as const;

const testSkeleton = (
  testType: string,
  name: string,
  description: string,
  sourceFile: string,
  purpose: string,
  testSubjects: readonly string[],
  requiredFixtureFamilies: readonly string[],
  specificNonGoals: readonly string[]
): CoreTestContract => {
  const sourcePath = `${testRoot}${sourceFile}`;
  return {
    id: createCoreContractId(`core-test-${testType}-contract`),
    testType,
    name,
    description,
    status: CORE_CONTRACT_STATUSES.active,
    book: coreBook,
    sourcePath,
    purpose,
    testSubjects,
    requiredFixtureFamilies,
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

export const CORE_TEST_CONTRACT_SKELETONS = [
  testSkeleton(
    'common-contract-tests',
    'Core Common Contract Test Skeleton',
    'Canonical metadata skeleton for Common Contract acceptance-test boundaries.',
    'common-contract-tests.md',
    'Defines acceptance-level test subjects for shared Common Contract primitives, safe failures, negative cases, and cross-contract consistency without implementing those tests.',
    [
      'References, errors, pagination, audit context, AI context, and human review.',
      'Permission context, policy context, idempotency, and versioning.',
      'Cross-contract consistency, safe failure, and negative-case expectations.'
    ],
    [
      'references',
      'errors',
      'permissions',
      'policies',
      'ai',
      'human-review',
      'idempotency',
      'events',
      'versions'
    ],
    [
      'Primitive behavior verification, hidden ad hoc fixtures, or weakening fail-closed and non-disclosure boundaries.'
    ]
  ),
  testSkeleton(
    'api-contract-tests',
    'Core API Contract Test Skeleton',
    'Canonical metadata skeleton for API Contract acceptance-test boundaries.',
    'api-contract-tests.md',
    'Defines acceptance-level API contract test subjects for request, response, references, errors, permissions, policies, idempotency, versioning, and service ownership without issuing requests.',
    [
      'API request, response, error, pagination, and reference contract boundaries.',
      'Permission, policy, idempotency, versioning, and non-disclosure behavior.',
      'API-to-service ownership and no-direct-event-emission boundaries.'
    ],
    [
      'api-requests',
      'api-responses',
      'references',
      'errors',
      'permissions',
      'policies',
      'idempotency',
      'versions'
    ],
    [
      'HTTP servers, routes, handlers, network requests, service calls, DTO execution, or API runtime assertions.'
    ]
  ),
  testSkeleton(
    'workflow-contract-tests',
    'Core Workflow Contract Test Skeleton',
    'Canonical metadata skeleton for Workflow Contract acceptance-test boundaries.',
    'workflow-contract-tests.md',
    'Defines acceptance-level workflow contract test subjects for preview, apply, validation, task, event, review, permission, policy, idempotency, and versioning boundaries without executing workflows.',
    [
      'Workflow definition, preview, apply, validation, and state-transition boundaries.',
      'Task, event, human-review, permission, policy, and idempotency interactions.',
      'Version preservation, safe failure, and non-runtime contract expectations.'
    ],
    [
      'workflows',
      'tasks',
      'events',
      'human-review',
      'permissions',
      'policies',
      'idempotency',
      'versions'
    ],
    [
      'Workflow engine execution, transition functions, task mutation, event emission, or apply-side effects.'
    ]
  ),
  testSkeleton(
    'agent-boundary-tests',
    'Core Agent Boundary Test Skeleton',
    'Canonical metadata skeleton for governed Agent boundary tests.',
    'agent-boundary-tests.md',
    'Defines acceptance-level Agent boundary test subjects for capability, context, source, permission, policy, review, forbidden action, trace, error, and version boundaries without invoking agents.',
    [
      'Agent contract, capability, AI context, and authorized source boundaries.',
      'Permission, policy, human-review, forbidden-action, and downstream-service boundaries.',
      'Idempotency, event trace, safe error, and version preservation expectations.'
    ],
    [
      'agents',
      'ai',
      'permissions',
      'policies',
      'human-review',
      'idempotency',
      'events',
      'versions'
    ],
    [
      'Model or prompt execution, agent orchestration, tool calls, autonomous authority, professional judgment, or downstream mutation.'
    ]
  ),
  testSkeleton(
    'permission-policy-tests',
    'Core Permission Policy Test Skeleton',
    'Canonical metadata skeleton for Permission and Policy acceptance-test boundaries.',
    'permission-policy-tests.md',
    'Defines acceptance-level test subjects for permission and policy matrices, contexts, redaction, non-disclosure, cross-organization limits, review, visibility, errors, and versioning without evaluating decisions.',
    [
      'Permission and policy matrix, context, fail-closed, and precedence boundaries.',
      'Redaction, non-disclosure, cross-organization, and human-review interactions.',
      'API, workflow, agent, event visibility, safe error, and version expectations.'
    ],
    [
      'permissions',
      'policies',
      'organizations',
      'human-review',
      'apis',
      'workflows',
      'agents',
      'events',
      'versions'
    ],
    [
      'RBAC, policy engines, rule evaluation, authorization decisions, redaction execution, or protected-action approval.'
    ]
  ),
  testSkeleton(
    'idempotency-event-tests',
    'Core Idempotency Event Test Skeleton',
    'Canonical metadata skeleton for duplicate-safety and event-trace tests.',
    'idempotency-event-tests.md',
    'Defines acceptance-level test subjects for idempotency keys, replay, conflict, duplicate prevention, event ownership, trace, visibility, errors, and versioning without performing side effects.',
    [
      'Idempotency key, semantic replay, conflict, and duplicate-effect boundaries.',
      'Event ownership, references, trace, visibility, and non-duplication expectations.',
      'Workflow apply, agent-prepared action, permission, policy, error, and version interactions.'
    ],
    [
      'idempotency',
      'events',
      'audit-context',
      'workflows',
      'apis',
      'agents',
      'permissions',
      'policies',
      'versions'
    ],
    [
      'Idempotency stores, fingerprints, replay execution, object creation, task creation, event emission, or side-effect verification.'
    ]
  ),
  testSkeleton(
    'error-versioning-tests',
    'Core Error Versioning Test Skeleton',
    'Canonical metadata skeleton for safe-error and compatibility tests.',
    'error-versioning-tests.md',
    'Defines acceptance-level test subjects for safe errors, controlled codes, leakage prevention, supported and unsupported versions, breaking changes, history, and deprecation without throwing errors or migrating data.',
    [
      'Safe error shape, controlled code, correlation, retryability, and non-disclosure boundaries.',
      'Supported, missing, unsupported, mismatched, breaking, and deprecated version expectations.',
      'Historical API, workflow, event, and Agent version trace preservation.'
    ],
    [
      'errors',
      'versions',
      'permissions',
      'policies',
      'apis',
      'workflows',
      'events',
      'agents'
    ],
    [
      'Runtime exceptions, stack inspection, data migration, compatibility adapters, version negotiation, or historical record mutation.'
    ]
  )
] as const satisfies readonly CoreTestContract[];
