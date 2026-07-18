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
  CORE_DOMAIN_CONTRACT_SKELETONS,
  CORE_EVENT_CATALOG_SKELETONS,
  CORE_MVP_EVENT_CONTRACT_LOCKS,
  validateCoreMvpEventContractLocks,
  CORE_OBJECT_CONTRACT_SKELETONS,
  CORE_SERVICE_CONTRACT_SKELETONS,
  CORE_TEST_CONTRACT_SKELETONS,
  CORE_WORKFLOW_CATALOG_SKELETONS
} from '../contracts/index.ts';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  validateCoreApiBoundaryEvidence
} from '../api-coverage/index.ts';
import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import {
  CORE_SERVICE_BEHAVIOR_EVIDENCE,
  validateCoreServiceBehaviorEvidence
} from '../service-coverage/index.ts';
import {
  CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE,
  CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE,
  CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE
} from '../workflows/index.ts';
import {
  CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS,
  coreMvpObjectFixtureValidationContextFor
} from '../objects/core-mvp-object-base-record.ts';
import { CORE_MVP_OBJECT_CANONICAL_PROFILES } from '../objects/core-mvp-object-profiles.ts';
import { validateCoreMvpObjectBaseRecord } from '../objects/core-mvp-object-validation.ts';
import {
  BOOK_02_AUTHORITY,
  BOOK_02_EXPECTED_COUNTS,
  BOOK_02_GUARD_INSPECTION_RULES,
  BOOK_02_MVP_REQUIREMENT_IDENTITIES,
  MVP_ACCEPTANCE_CRITERIA_IDENTITIES,
  MVP_ACCEPTANCE_CRITERION_DEPENDENCIES,
  type Book02GuardInspectionStatus,
  type Book02MvpAcceptanceCriterion,
  type Book02MvpAcceptanceCriterionId,
  type Book02MvpTestFamilyEvidence,
  type Book02MvpTestFamilyId,
  type Book02StructuredGuardCheck,
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
    readonly inspectionComplete: number;
    readonly inspectionIncomplete: number;
    readonly unexpectedImplementationCount: number;
  };
  readonly defer: {
    readonly total: number;
    readonly inspectionComplete: number;
    readonly inspectionIncomplete: number;
    readonly unexpectedBlockingImplementationCount: number;
  };
  readonly neverInMvp: {
    readonly total: number;
    readonly inspectionComplete: number;
    readonly inspectionIncomplete: number;
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
  readonly forbiddenPathPatterns?: readonly string[];
  readonly structuredChecks?: readonly Book02StructuredGuardCheck[];
  readonly excludedPaths?: readonly string[];
  readonly inspectionStatus?: Book02GuardInspectionStatus;
  readonly inspectedFiles?: readonly string[];
  readonly violationReasons?: readonly string[];
}

export const BOOK_02_MVP_TEST_FAMILY_EVIDENCE = {
  'common-contract-tests': {
    contractId: 'core-test-common-contract-tests-contract',
    implementationFiles: [
      'src/behaviors/core-reference-behavior.ts',
      'src/behaviors/core-safe-error.ts',
      'src/behaviors/core-governance-behavior.ts',
      'src/behaviors/core-idempotency-behavior.ts',
      'src/behaviors/core-event-pagination-behavior.ts',
      'src/behaviors/core-version-behavior.ts',
      'src/behaviors/core-ai-context-behavior.ts',
      'src/behaviors/core-agent-boundary.ts'
    ],
    testFiles: [
      'tests/unit/core-safety-boundary-foundations.test.ts',
      'tests/unit/core-governance-context-review-hooks.test.ts',
      'tests/unit/core-idempotency-enforcement.test.ts',
      'tests/unit/core-event-pagination-hooks.test.ts'
    ],
    behaviorIds: [
      'references',
      'errors',
      'permission',
      'policy',
      'idempotency',
      'audit-context',
      'events',
      'versioning',
      'pagination',
      'ai-context',
      'human-review'
    ],
    provenCapabilities: [
      'contract specification',
      'mapped executable test files',
      'positive coverage',
      'negative coverage',
      'execution under pnpm test or a dedicated evidence runner'
    ],
    unresolvedCapabilities: []
  },
  'api-contract-tests': {
    contractId: 'core-test-api-contract-tests-contract',
    implementationFiles: [
      'src/contracts/api/core-api-contract-skeletons.ts',
      'src/api/core-governed-api-boundary.ts',
      'src/api/core-governed-api-specs.ts'
    ],
    testFiles: [
      'tests/unit/core-api-contract-skeletons.test.ts',
      'tests/unit/core-task-057a-api-boundary-foundation.test.ts'
    ],
    behaviorIds: [],
    provenCapabilities: [
      'contract specification',
      'mapped executable test files',
      'positive coverage',
      'negative coverage',
      'execution under pnpm test or a dedicated evidence runner'
    ],
    unresolvedCapabilities: [
      'remaining thirteen API validator/delegation boundaries',
      'complete API-family no-direct-Event proof'
    ]
  },
  'workflow-contract-tests': {
    contractId: 'core-test-workflow-contract-tests-contract',
    implementationFiles: ['src/workflows/core-workflow-contract-validation.ts'],
    testFiles: ['tests/unit/core-workflow-contract-validation.test.ts'],
    behaviorIds: ['workflow-engine'],
    provenCapabilities: [
      'contract specification',
      'mapped executable test files',
      'positive coverage',
      'negative coverage',
      'execution under pnpm test or a dedicated evidence runner'
    ],
    unresolvedCapabilities: ['preview/apply workflow behavior']
  },
  'agent-boundary-tests': {
    contractId: 'core-test-agent-boundary-tests-contract',
    implementationFiles: [
      'src/behaviors/core-agent-boundary.ts',
      'src/behaviors/core-ai-context-behavior.ts',
      'src/behaviors/core-governance-behavior.ts'
    ],
    testFiles: [
      'tests/unit/core-safety-boundary-foundations.test.ts',
      'tests/unit/core-governance-context-review-hooks.test.ts'
    ],
    behaviorIds: ['agent-runtime', 'ai-context', 'human-review'],
    provenCapabilities: [
      'contract specification',
      'mapped executable test files',
      'positive coverage',
      'negative coverage',
      'execution under pnpm test or a dedicated evidence runner'
    ],
    unresolvedCapabilities: [
      'named Agent scaffold coverage',
      'direct Event emission negative tests'
    ]
  },
  'permission-policy-tests': {
    contractId: 'core-test-permission-policy-tests-contract',
    implementationFiles: ['src/behaviors/core-governance-behavior.ts'],
    testFiles: ['tests/unit/core-governance-context-review-hooks.test.ts'],
    behaviorIds: ['permission', 'policy', 'human-review', 'audit-context'],
    provenCapabilities: [
      'contract specification',
      'mapped executable test files',
      'positive coverage',
      'negative coverage',
      'execution under pnpm test or a dedicated evidence runner'
    ],
    unresolvedCapabilities: []
  },
  'idempotency-event-tests': {
    contractId: 'core-test-idempotency-event-tests-contract',
    implementationFiles: [
      'src/behaviors/core-idempotency-behavior.ts',
      'src/behaviors/core-event-pagination-behavior.ts'
    ],
    testFiles: [
      'tests/unit/core-idempotency-enforcement.test.ts',
      'tests/unit/core-event-pagination-hooks.test.ts'
    ],
    behaviorIds: ['idempotency', 'events'],
    provenCapabilities: [
      'contract specification',
      'mapped executable test files',
      'positive coverage',
      'negative coverage',
      'execution under pnpm test or a dedicated evidence runner'
    ],
    unresolvedCapabilities: []
  },
  'error-versioning-tests': {
    contractId: 'core-test-error-versioning-tests-contract',
    implementationFiles: [
      'src/behaviors/core-safe-error.ts',
      'src/behaviors/core-version-behavior.ts'
    ],
    testFiles: ['tests/unit/core-safety-boundary-foundations.test.ts'],
    behaviorIds: ['errors', 'versioning'],
    provenCapabilities: [
      'contract specification',
      'mapped executable test files',
      'positive coverage',
      'negative coverage',
      'execution under pnpm test or a dedicated evidence runner'
    ],
    unresolvedCapabilities: []
  }
} as const satisfies Record<Book02MvpTestFamilyId, Book02MvpTestFamilyEvidence>;

const existing = (paths: readonly string[]) =>
  paths.filter((path) => existsSync(path));
const readJsonArray = (path: string): readonly Record<string, unknown>[] => {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    return Array.isArray(parsed)
      ? (parsed as readonly Record<string, unknown>[])
      : [];
  } catch {
    return [];
  }
};
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
    (typeof CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence)[number] | undefined
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
const textInspectionExtensions = ['.ts', '.json', '.mjs', '.js'] as const;

export interface Book02MvpGuardInspectionInput {
  readonly inspectionPaths: readonly string[];
  readonly forbiddenIndicators: readonly string[];
  readonly forbiddenPathPatterns?: readonly string[];
  readonly structuredChecks?: readonly Book02StructuredGuardCheck[];
  readonly excludedPaths: readonly string[];
}
export interface Book02MvpGuardInspectionResult {
  readonly inspectionStatus: Book02GuardInspectionStatus;
  readonly inspectedFiles: readonly string[];
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
function ruleIsComplete(input: Book02MvpGuardInspectionInput): boolean {
  return (
    input.inspectionPaths.length > 0 &&
    input.excludedPaths.length > 0 &&
    (input.forbiddenIndicators.length > 0 ||
      (input.forbiddenPathPatterns?.length ?? 0) > 0 ||
      (input.structuredChecks?.length ?? 0) > 0)
  );
}
function structuredCheckViolation(
  check: Book02StructuredGuardCheck,
  inspectedFiles: readonly string[]
): string | undefined {
  const packageJson = existsSync('package.json')
    ? (JSON.parse(readFileSync('package.json', 'utf8')) as Record<
        string,
        unknown
      >)
    : {};
  const dependencies = {
    ...(typeof packageJson.dependencies === 'object' && packageJson.dependencies
      ? packageJson.dependencies
      : {}),
    ...(typeof packageJson.devDependencies === 'object' &&
    packageJson.devDependencies
      ? packageJson.devDependencies
      : {})
  } as Record<string, unknown>;
  const scripts =
    typeof packageJson.scripts === 'object' && packageJson.scripts
      ? (packageJson.scripts as Record<string, unknown>)
      : {};
  if (check.startsWith('package-dependency:')) {
    const dependency = check.slice('package-dependency:'.length);
    return dependency in dependencies
      ? `package.json declares forbidden dependency ${dependency}.`
      : undefined;
  }
  if (check.startsWith('package-script:')) {
    const script = check.slice('package-script:'.length);
    return script in scripts
      ? `package.json declares forbidden script ${script}.`
      : undefined;
  }
  if (check.startsWith('path-exists:')) {
    const path = check.slice('path-exists:'.length);
    return existsSync(path)
      ? `${path} exists for forbidden guard check.`
      : undefined;
  }
  if (check.startsWith('fixture-type:')) {
    const fixtureType = check.slice('fixture-type:'.length);
    const files = collectInspectableFiles(
      ['fixtures'],
      ['fixtures/mvp-coverage/', 'tests/', 'docs/']
    );
    for (const file of files) {
      try {
        const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<
          string,
          unknown
        >;
        if (
          parsed.fixtureType === fixtureType ||
          parsed.fixture_type === fixtureType
        )
          return `${file} declares forbidden fixture type ${fixtureType}.`;
      } catch {
        continue;
      }
    }
    return undefined;
  }
  if (check.startsWith('runtime-export:')) {
    const exportName = check.slice('runtime-export:'.length);
    const exportDeclaration = new RegExp(
      `\\bexport\\s+(?:const|function|class|type|interface)\\s+${exportName}\\b`
    );
    const exportReference = new RegExp(
      `\\bexport\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`
    );
    for (const file of inspectedFiles) {
      if (!file.endsWith('.ts')) continue;
      const text = readFileSync(file, 'utf8');
      if (exportDeclaration.test(text) || exportReference.test(text))
        return `${file} exports forbidden runtime symbol ${exportName}.`;
    }
    return undefined;
  }
  return `Unsupported structured guard check ${check}.`;
}
export function inspectBook02MvpGuard(
  input: Book02MvpGuardInspectionInput
): Book02MvpGuardInspectionResult {
  const inspectedFiles = collectInspectableFiles(
    input.inspectionPaths,
    input.excludedPaths
  );
  if (!ruleIsComplete(input))
    return {
      inspectionStatus: 'incomplete',
      inspectedFiles,
      violationPresent: false,
      violationReasons: []
    };
  const violationReasons: string[] = [];
  for (const file of inspectedFiles) {
    const normalized = normalizePath(file);
    for (const pattern of input.forbiddenPathPatterns ?? []) {
      if (normalized.includes(normalizePath(pattern)))
        violationReasons.push(
          `${file} matches forbidden path pattern ${pattern}.`
        );
    }
    const text = readFileSync(file, 'utf8');
    for (const indicator of input.forbiddenIndicators) {
      if (text.includes(indicator))
        violationReasons.push(
          `${file} contains forbidden indicator ${indicator}.`
        );
    }
  }
  for (const check of input.structuredChecks ?? []) {
    const violation = structuredCheckViolation(check, inspectedFiles);
    if (violation) violationReasons.push(violation);
  }
  return {
    inspectionStatus: 'complete',
    inspectedFiles,
    violationPresent: violationReasons.length > 0,
    violationReasons
  };
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
    const profileMatches = CORE_MVP_OBJECT_CANONICAL_PROFILES.filter(
      (entry) => entry.domainId === domainId
    );
    const profile = profileMatches[0];
    const contractMatches = profile
      ? CORE_OBJECT_CONTRACT_SKELETONS.filter(
          (entry) => entry.id === profile.objectContractId
        )
      : [];
    const found = contractMatches[0];
    const objectFoundationFiles = [
      'src/objects/core-mvp-object-profiles.ts',
      'src/objects/core-mvp-object-base-record.ts',
      'src/objects/core-mvp-object-validation.ts'
    ];
    const objectFoundationTests = [
      'tests/unit/core-mvp-object-public-reference-foundation.test.ts',
      'tests/fixtures/core-mvp-object-public-reference-foundation-fixture.test.ts'
    ];
    const objectFoundationFixture =
      'fixtures/objects/core-mvp-object-public-reference-foundation.fixture.json';
    const fixtureRecords = readJsonArray(objectFoundationFixture);
    const fixtureMatches = fixtureRecords.filter(
      (entry) => entry.domainId === domainId
    );
    const fixtureRecord = fixtureMatches[0];
    const publicReferenceMatches =
      typeof fixtureRecord?.publicReferenceId === 'string'
        ? CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.filter(
            (entry) => entry.referenceId === fixtureRecord.publicReferenceId
          )
        : [];
    const publicReferenceRecord = publicReferenceMatches[0];
    const fixtureContext =
      typeof fixtureRecord?.publicReferenceId === 'string'
        ? coreMvpObjectFixtureValidationContextFor(
            fixtureRecord.publicReferenceId
          )
        : undefined;
    const fixtureValidation = fixtureContext
      ? validateCoreMvpObjectBaseRecord(fixtureRecord, fixtureContext)
      : undefined;
    const hasExactObjectEvidence = Boolean(
      profileMatches.length === 1 &&
      contractMatches.length === 1 &&
      fixtureMatches.length === 1 &&
      publicReferenceMatches.length === 1 &&
      profile &&
      found &&
      fixtureRecord &&
      publicReferenceRecord &&
      fixtureContext &&
      fixtureValidation?.ok === true &&
      found.domainId === profile.domainId &&
      found.objectType === profile.objectType &&
      found.sourcePath === profile.sourcePath &&
      fixtureRecord.objectType === profile.objectType &&
      fixtureRecord.objectContractId === profile.objectContractId &&
      fixtureRecord.domainId === profile.domainId &&
      publicReferenceRecord.objectType === profile.objectType &&
      publicReferenceRecord.referenceDomain === profile.domainId &&
      [
        ...objectFoundationFiles,
        ...objectFoundationTests,
        objectFoundationFixture,
        'src/behaviors/core-reference-behavior.ts'
      ].every((path) => existsSync(path))
    );
    return found
      ? {
          contractIds: [String(found.id)],
          implementationFiles: [
            'src/contracts/object/core-object-contract-skeletons.ts',
            ...objectFoundationFiles,
            'src/behaviors/core-reference-behavior.ts'
          ],
          testFiles: objectFoundationTests,
          fixtureFiles: [objectFoundationFixture],
          currentDepth: hasExactObjectEvidence ? 'level_2' : undefined
        }
      : emptyEvidence();
  }
  if (identity.layer === 'service') {
    const serviceId = identity.id
      .replace(/^must-service-/, '')
      .replace(/^stub-service-/, '')
      .replace(/-service$/, '');
    const evidence = CORE_SERVICE_BEHAVIOR_EVIDENCE.find(
      (entry) => entry.requirementId === identity.id
    );
    const found = evidence
      ? CORE_SERVICE_CONTRACT_SKELETONS.find(
          (entry) => entry.id === evidence.contractId
        )
      : CORE_SERVICE_CONTRACT_SKELETONS.find(
          (entry) => entry.domainId === serviceId
        );
    if (!found) return emptyEvidence();
    if (evidence) {
      const validEvidence = validateCoreServiceBehaviorEvidence().length === 0;
      return {
        contractIds: [String(found.id)],
        implementationFiles: [
          'src/contracts/service/core-service-contract-skeletons.ts',
          ...evidence.implementationFiles
        ],
        testFiles: evidence.testFiles,
        fixtureFiles: evidence.fixtureFiles,
        currentDepth: validEvidence ? 'level_2_3' : undefined
      };
    }
    return {
      contractIds: [String(found.id)],
      implementationFiles: [
        'src/contracts/service/core-service-contract-skeletons.ts'
      ],
      testFiles: [],
      fixtureFiles: []
    };
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
    const evidence = CORE_API_BOUNDARY_EVIDENCE.find(
      (entry) => entry.requirementId === identity.id
    );
    const found = evidence
      ? CORE_API_CONTRACT_SKELETONS.find(
          (entry) => entry.id === evidence.apiContractId
        )
      : CORE_API_CONTRACT_SKELETONS.find(
          (entry) => entry.domainId === domainId
        );
    return found
      ? evidence
        ? {
            contractIds: [String(found.id)],
            implementationFiles: existing(evidence.implementationFiles),
            testFiles: existing(evidence.testFiles),
            fixtureFiles: existing(evidence.fixtureFiles),
            currentDepth: evidence.currentDepth
          }
        : {
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
    if (
      identity.id ===
      CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.workflowId
    )
      return {
        contractIds: [
          CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.workflowContractId
        ],
        implementationFiles: existing(
          CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.implementationFiles
        ),
        testFiles: existing(
          CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.testFiles
        ),
        fixtureFiles: existing(
          CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.fixtureFiles
        ),
        currentDepth: 'level_2'
      };
    if (
      identity.id ===
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.workflowId
    )
      return {
        contractIds: [
          CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.workflowContractId
        ],
        implementationFiles: existing(
          CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.implementationFiles
        ),
        testFiles: existing(
          CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.testFiles
        ),
        fixtureFiles: [],
        currentDepth: 'level_2'
      };
    if (
      identity.id ===
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.workflowId
    )
      return {
        contractIds: [
          CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.workflowContractId
        ],
        implementationFiles: existing(
          CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.implementationFiles
        ),
        testFiles: existing(
          CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.testFiles
        ),
        fixtureFiles: existing(
          CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.fixtureFiles
        ),
        currentDepth: 'level_2'
      };
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
    const locked = CORE_MVP_EVENT_CONTRACT_LOCKS.find(
      (entry) => entry.requirementId === identity.id
    );
    if (locked && validateCoreMvpEventContractLocks().length === 0) {
      return {
        contractIds: [
          String(locked.id),
          ...(locked.resolution.aliasTargetContractId
            ? [String(locked.resolution.aliasTargetContractId)]
            : [])
        ],
        implementationFiles: [
          'src/contracts/event/core-mvp-event-contract-lock.ts',
          'src/contracts/event/core-mvp-event-contract-validation.ts'
        ],
        testFiles: ['tests/unit/core-mvp-event-contract-lock.test.ts'],
        fixtureFiles: [
          'fixtures/contracts/core-mvp-event-contract-lock.fixture.json'
        ],
        currentDepth: 'level_1'
      };
    }
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
    const family = identity.id.replace(
      'must-test-',
      ''
    ) as Book02MvpTestFamilyId;
    const found = CORE_TEST_CONTRACT_SKELETONS.find(
      (entry) => entry.testType === family
    );
    const evidence = BOOK_02_MVP_TEST_FAMILY_EVIDENCE[family];
    return found && evidence
      ? {
          contractIds: [String(found.id)].filter(
            (id) => id === evidence.contractId
          ),
          implementationFiles: existing([
            'src/contracts/test/core-test-contract-skeletons.ts',
            ...evidence.implementationFiles
          ]),
          testFiles: existing(evidence.testFiles),
          fixtureFiles: []
        }
      : emptyEvidence();
  }
  if (identity.layer === 'guard') {
    return {
      ...emptyEvidence(),
      inspectionPaths:
        BOOK_02_GUARD_INSPECTION_RULES[
          identity.id as keyof typeof BOOK_02_GUARD_INSPECTION_RULES
        ]?.inspectionPaths ?? [],
      forbiddenIndicators:
        BOOK_02_GUARD_INSPECTION_RULES[
          identity.id as keyof typeof BOOK_02_GUARD_INSPECTION_RULES
        ]?.forbiddenIndicators ?? [],
      forbiddenPathPatterns:
        BOOK_02_GUARD_INSPECTION_RULES[
          identity.id as keyof typeof BOOK_02_GUARD_INSPECTION_RULES
        ]?.forbiddenPathPatterns ?? [],
      structuredChecks:
        BOOK_02_GUARD_INSPECTION_RULES[
          identity.id as keyof typeof BOOK_02_GUARD_INSPECTION_RULES
        ]?.structuredChecks ?? [],
      excludedPaths:
        BOOK_02_GUARD_INSPECTION_RULES[
          identity.id as keyof typeof BOOK_02_GUARD_INSPECTION_RULES
        ]?.excludedPaths ?? []
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
    const inspection = inspectBook02MvpGuard({
      inspectionPaths: ev.inspectionPaths ?? [],
      forbiddenIndicators: ev.forbiddenIndicators ?? [],
      forbiddenPathPatterns: ev.forbiddenPathPatterns ?? [],
      structuredChecks: ev.structuredChecks ?? [],
      excludedPaths: ev.excludedPaths ?? []
    });
    if (inspection.inspectionStatus === 'incomplete') return 'documented_only';
    return inspection.violationPresent ? 'violation_present' : 'not_required';
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
  if (identity.layer === 'object') {
    return ev.currentDepth === 'level_2' &&
      ev.testFiles.length > 0 &&
      ev.fixtureFiles.length > 0
      ? 'meets_required_depth'
      : ev.contractIds.length > 0
        ? 'validated_skeleton_only'
        : 'missing';
  }
  if (identity.layer === 'service') {
    if (
      ev.currentDepth === 'level_2_3' &&
      ev.implementationFiles.length > 1 &&
      ev.testFiles.length > 0 &&
      ev.fixtureFiles.length > 0
    )
      return 'meets_required_depth';
    return ev.testFiles.length > 0
      ? 'partial_evidence'
      : ev.contractIds.length > 0
        ? 'validated_skeleton_only'
        : 'missing';
  }
  if (identity.layer === 'api') {
    const evidence = CORE_API_BOUNDARY_EVIDENCE.find(
      (entry) => entry.requirementId === identity.id
    );
    if (
      evidence &&
      validateCoreApiBoundaryEvidence().length === 0 &&
      ev.currentDepth === 'level_2' &&
      ev.implementationFiles.length > 1 &&
      ev.testFiles.length > 0 &&
      ev.fixtureFiles.length > 0 &&
      identity.requiredCapabilities.every((capability) =>
        evidence.provenCapabilities.includes(
          capability as (typeof evidence.provenCapabilities)[number]
        )
      ) &&
      evidence.unresolvedCapabilities.length === 0
    )
      return 'meets_required_depth';
    return ev.testFiles.length > 0
      ? 'partial_evidence'
      : ev.contractIds.length > 0
        ? 'validated_skeleton_only'
        : 'missing';
  }
  if (identity.layer === 'workflow') {
    if (
      identity.id ===
        CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.workflowId &&
      ev.currentDepth === 'level_2' &&
      ev.implementationFiles.length > 0 &&
      ev.testFiles.length > 0 &&
      ev.fixtureFiles.length > 0 &&
      CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.previewSupported &&
      CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.applySupported &&
      CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.directDomainMutation ===
        false &&
      CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.directEventEmission ===
        false
    )
      return 'meets_required_depth';
    if (
      identity.id ===
        CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.workflowId &&
      ev.currentDepth === 'level_2' &&
      ev.implementationFiles.length > 0 &&
      ev.testFiles.length > 0 &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.previewSupported &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.applySupported &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.previewGovernedReferenceValidation &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.existingTrademarkValidation &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.brandCustomerRelationshipValidation &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.normalizedMutationPayloads &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.previewValidationPlan &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.applyMutationPlan &&
      CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.structuredPartialFailureEvidence
    )
      return 'meets_required_depth';
    if (
      identity.id ===
        CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.workflowId &&
      ev.currentDepth === 'level_2' &&
      ev.implementationFiles.length > 0 &&
      ev.testFiles.length > 0 &&
      ev.fixtureFiles.length > 0 &&
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.previewSupported &&
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.applySupported &&
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.previewValidationOnly &&
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.separatedPreviewValidationAndApplyMutationPlans &&
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.noDirectDomainMutation &&
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.noDirectEventEmission &&
      CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.eventReferencesTraceOnly
    )
      return 'meets_required_depth';
    return ev.testFiles.length > 0
      ? 'partial_evidence'
      : ev.contractIds.length > 0
        ? 'validated_skeleton_only'
        : 'missing';
  }
  if (identity.layer === 'event') {
    if (
      ev.currentDepth === 'level_1' &&
      ev.implementationFiles.length > 1 &&
      ev.testFiles.length > 0 &&
      ev.fixtureFiles.length > 0
    )
      return 'meets_required_depth';
    return ev.contractIds.length > 0 ? 'semantic_overlap_only' : 'missing';
  }
  if (identity.layer === 'agent')
    return ev.implementationFiles.length > 0
      ? 'boundary_scaffold_only'
      : 'missing';
  if (identity.layer === 'test') {
    const family = identity.id.replace(
      'must-test-',
      ''
    ) as Book02MvpTestFamilyId;
    const evidence = BOOK_02_MVP_TEST_FAMILY_EVIDENCE[family];
    if (!evidence || ev.contractIds.length === 0) return 'missing';
    const hasExecutableTests = ev.testFiles.length > 0;
    const hasAllCapabilities = identity.requiredCapabilities.every(
      (capability) =>
        evidence.provenCapabilities.some((proven) => proven === capability)
    );
    if (
      hasExecutableTests &&
      hasAllCapabilities &&
      evidence.unresolvedCapabilities.length === 0
    )
      return 'meets_required_depth';
    return hasExecutableTests ? 'partial_evidence' : 'validated_skeleton_only';
  }
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
          forbiddenPathPatterns: ev.forbiddenPathPatterns ?? [],
          structuredChecks: ev.structuredChecks ?? [],
          excludedPaths: ev.excludedPaths ?? []
        })
      : {
          inspectionStatus: 'complete' as const,
          inspectedFiles: [],
          violationPresent: false,
          violationReasons: []
        };
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
    contractIds: ev.contractIds,
    implementationFiles: ev.implementationFiles,
    testFiles: ev.testFiles,
    fixtureFiles: ev.fixtureFiles,
    inspectionPaths: ev.inspectionPaths,
    forbiddenIndicators: ev.forbiddenIndicators,
    forbiddenPathPatterns: ev.forbiddenPathPatterns,
    structuredChecks: ev.structuredChecks,
    excludedPaths: ev.excludedPaths,
    inspectionStatus:
      identity.layer === 'guard' ? guardInspection.inspectionStatus : undefined,
    inspectedFiles:
      identity.layer === 'guard' ? guardInspection.inspectedFiles : undefined,
    violationReasons,
    gapReasons: gapReasons(identity, currentDisposition)
  };
}
const byCategory = (
  requirements: readonly Book02MvpRequirement[],
  category: string
) => requirements.filter((r) => r.category === category);
function noViolations(requirements: readonly Book02MvpRequirement[]): boolean {
  return requirements.every(
    (r) => r.currentDisposition !== 'violation_present'
  );
}
function filesFor(
  requirements: readonly Book02MvpRequirement[]
): readonly string[] {
  return [
    ...new Set(
      requirements.flatMap((r) => [
        ...r.implementationFiles,
        ...r.testFiles,
        ...r.fixtureFiles
      ])
    )
  ].sort();
}
function requirementsMeet(
  requirements: readonly Book02MvpRequirement[]
): boolean {
  return (
    requirements.length > 0 &&
    requirements.every((r) => r.currentDisposition === 'meets_required_depth')
  );
}
function guardsComplete(
  requirements: readonly Book02MvpRequirement[]
): boolean {
  return (
    requirements.length > 0 &&
    requirements.every((r) => r.inspectionStatus === 'complete')
  );
}
export interface Book02MvpAcceptanceEvaluation {
  readonly satisfied: boolean;
  readonly evidenceRequirementIds: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly evidenceFiles: readonly string[];
  readonly unresolvedReasons: readonly string[];
}
type AcceptanceCriterionId = Book02MvpAcceptanceCriterionId;
type AcceptanceCriterionEvaluator = (
  requirements: readonly Book02MvpRequirement[]
) => Book02MvpAcceptanceEvaluation;
function mappedRequirements(
  id: AcceptanceCriterionId,
  requirements: readonly Book02MvpRequirement[]
): readonly Book02MvpRequirement[] {
  const ids = MVP_ACCEPTANCE_CRITERION_DEPENDENCIES[id];
  return requirements.filter((r) => ids.some((id) => id === r.id));
}
function mappedEvaluation(
  id: AcceptanceCriterionId,
  requirements: readonly Book02MvpRequirement[],
  satisfied: boolean,
  unresolvedReasons: readonly string[],
  behaviorIds: readonly string[] = []
): Book02MvpAcceptanceEvaluation {
  const mapped = mappedRequirements(id, requirements);
  return {
    satisfied,
    evidenceRequirementIds: MVP_ACCEPTANCE_CRITERION_DEPENDENCIES[id],
    behaviorIds,
    evidenceFiles: filesFor(mapped),
    unresolvedReasons: satisfied ? [] : unresolvedReasons
  };
}
function incompleteGuardReasons(
  requirements: readonly Book02MvpRequirement[]
): readonly string[] {
  return requirements
    .filter((r) => r.inspectionStatus !== 'complete')
    .map((r) => `${r.id} has incomplete guard inspection.`);
}
function guardEvaluation(
  id: AcceptanceCriterionId,
  requirements: readonly Book02MvpRequirement[]
): Book02MvpAcceptanceEvaluation {
  const mapped = mappedRequirements(id, requirements);
  const incomplete = incompleteGuardReasons(mapped);
  const violationReasons = mapped
    .filter((r) => r.currentDisposition === 'violation_present')
    .map((r) => `${r.id} has forbidden implementation evidence.`);
  return mappedEvaluation(
    id,
    requirements,
    incomplete.length === 0 && violationReasons.length === 0,
    [...incomplete, ...violationReasons]
  );
}
function behaviorEvidenceFiles(behaviorId: string): readonly string[] {
  const behavior = behaviorById.get(behaviorId);
  return existing([
    ...(behavior?.sourceFiles ?? []),
    ...(behavior?.testFiles ?? []),
    ...fixtureFilesOf(behavior)
  ]);
}

function acceptedBehaviorEvidence(behaviorIds: readonly string[]): {
  readonly ok: boolean;
  readonly files: readonly string[];
} {
  const files = behaviorIds.flatMap((behaviorId) =>
    behaviorEvidenceFiles(behaviorId)
  );
  return {
    ok:
      behaviorIds.length > 0 &&
      behaviorIds.every((behaviorId) => behaviorById.has(behaviorId)) &&
      files.length > 0,
    files: [...new Set(files)].sort()
  };
}
function testFamilyEvidence(
  family: Book02MvpTestFamilyId
): Book02MvpTestFamilyEvidence {
  return BOOK_02_MVP_TEST_FAMILY_EVIDENCE[family];
}
function testedBehaviorEvaluation(
  id: AcceptanceCriterionId,
  requirements: readonly Book02MvpRequirement[],
  behaviorIds: readonly string[],
  testFamilies: readonly Book02MvpTestFamilyId[],
  unresolvedReasons: readonly string[]
): Book02MvpAcceptanceEvaluation {
  const behavior = acceptedBehaviorEvidence(behaviorIds);
  const families = testFamilies.map(testFamilyEvidence);
  const testsExist = families.every(
    (family) =>
      family.testFiles.length > 0 &&
      family.testFiles.every((file) => existsSync(file))
  );
  const familyBehaviorIds = new Set(
    families.flatMap((family) => family.behaviorIds)
  );
  const behaviorMapped = behaviorIds.every((behaviorId) =>
    familyBehaviorIds.has(behaviorId)
  );
  const mapped = mappedRequirements(id, requirements);
  return {
    ...mappedEvaluation(
      id,
      requirements,
      behavior.ok && testsExist && behaviorMapped,
      unresolvedReasons,
      behaviorIds
    ),
    evidenceFiles: [
      ...new Set([
        ...filesFor(mapped),
        ...behavior.files,
        ...families.flatMap((family) => family.testFiles),
        ...families.flatMap((family) => family.implementationFiles)
      ])
    ].sort()
  };
}
export const ACCEPTANCE_CRITERION_EVALUATORS = {
  'must-build-domains-implemented-or-scaffolded-with-tests': (requirements) => {
    const mapped = mappedRequirements(
      'must-build-domains-implemented-or-scaffolded-with-tests',
      requirements
    );
    const domainTest = 'tests/unit/core-domain-contract-skeletons.test.ts';
    const domainTestExists = existsSync(domainTest);
    const allDomainSkeletons =
      mapped.length === 18 &&
      mapped.every(
        (r) =>
          r.layer === 'domain' &&
          r.currentDisposition === 'validated_skeleton_only' &&
          r.contractIds.length === 1 &&
          r.implementationFiles.includes(
            'src/contracts/domain/core-domain-contract-skeletons.ts'
          )
      );
    return {
      ...mappedEvaluation(
        'must-build-domains-implemented-or-scaffolded-with-tests',
        requirements,
        allDomainSkeletons && domainTestExists,
        [
          'All 18 Domain requirements must have validated skeletons and executable Domain skeleton tests.'
        ]
      ),
      evidenceFiles: [...new Set([...filesFor(mapped), domainTest])].sort()
    };
  },
  'must-build-objects-have-public-reference-ids': (requirements) => {
    const mapped = mappedRequirements(
      'must-build-objects-have-public-reference-ids',
      requirements
    );
    const explicitReferenceEvidence = mapped.every(
      (r) =>
        r.requiredCapabilities.includes('public reference id') &&
        r.currentDisposition === 'meets_required_depth'
    );
    return mappedEvaluation(
      'must-build-objects-have-public-reference-ids',
      requirements,
      explicitReferenceEvidence,
      [
        'All 18 Object requirements require explicit public-reference evidence, not generic skeleton evidence.'
      ]
    );
  },
  'must-build-services-own-behavior': (requirements) =>
    mappedEvaluation(
      'must-build-services-own-behavior',
      requirements,
      requirementsMeet(
        mappedRequirements('must-build-services-own-behavior', requirements)
      ),
      ['All 18 Service requirements must meet real owning behavior depth.']
    ),
  'must-build-api-validators-exist': (requirements) =>
    mappedEvaluation(
      'must-build-api-validators-exist',
      requirements,
      requirementsMeet(
        mappedRequirements('must-build-api-validators-exist', requirements)
      ),
      [
        'All 18 API requirements must prove validators, delegation, and no direct mutation/emission tests.'
      ]
    ),
  'customer-intake-workflow-supports-preview-apply': (requirements) =>
    mappedEvaluation(
      'customer-intake-workflow-supports-preview-apply',
      requirements,
      requirementsMeet(
        mappedRequirements(
          'customer-intake-workflow-supports-preview-apply',
          requirements
        )
      ),
      ['Customer Intake Workflow must prove preview/apply validation.']
    ),
  'trademark-application-workflow-supports-preview-apply': (requirements) =>
    mappedEvaluation(
      'trademark-application-workflow-supports-preview-apply',
      requirements,
      requirementsMeet(
        mappedRequirements(
          'trademark-application-workflow-supports-preview-apply',
          requirements
        )
      ),
      ['Trademark Application Workflow must prove preview/apply validation.']
    ),
  'communication-review-workflow-supports-preview-apply': (requirements) =>
    mappedEvaluation(
      'communication-review-workflow-supports-preview-apply',
      requirements,
      requirementsMeet(
        mappedRequirements(
          'communication-review-workflow-supports-preview-apply',
          requirements
        )
      ),
      ['Communication Review Workflow must prove preview/apply validation.']
    ),
  'permission-and-policy-fail-closed': (requirements) =>
    testedBehaviorEvaluation(
      'permission-and-policy-fail-closed',
      requirements,
      ['permission', 'policy'],
      ['permission-policy-tests'],
      [
        'Permission and Policy fail-closed behavior plus executable negative tests must be accepted.'
      ]
    ),
  'ai-forbidden-actions-are-blocked': (requirements) =>
    testedBehaviorEvaluation(
      'ai-forbidden-actions-are-blocked',
      requirements,
      ['ai-context', 'agent-runtime'],
      ['agent-boundary-tests'],
      [
        'AI forbidden-action and Agent boundary behavior must be accepted with executable tests.'
      ]
    ),
  'human-review-gates-protected-actions': (requirements) =>
    testedBehaviorEvaluation(
      'human-review-gates-protected-actions',
      requirements,
      ['human-review', 'permission', 'policy'],
      ['permission-policy-tests'],
      [
        'Human Review protected-action gates require accepted review, permission, and policy tests.'
      ]
    ),
  'idempotency-replay-and-conflict-are-tested': (requirements) =>
    testedBehaviorEvaluation(
      'idempotency-replay-and-conflict-are-tested',
      requirements,
      ['idempotency'],
      ['idempotency-event-tests'],
      ['Idempotency replay and conflict tests must be accepted.']
    ),
  'event-trace-exists-and-is-not-command': (requirements) => {
    const mapped = mappedRequirements(
      'event-trace-exists-and-is-not-command',
      requirements
    );
    const guardMapped = mapped.filter((r) => r.layer === 'guard');
    const behavior = acceptedBehaviorEvidence(['events']);
    const family = testFamilyEvidence('idempotency-event-tests');
    const satisfied =
      behavior.ok &&
      family.behaviorIds.includes('events') &&
      guardsComplete(guardMapped) &&
      noViolations(guardMapped);
    return {
      ...mappedEvaluation(
        'event-trace-exists-and-is-not-command',
        requirements,
        satisfied,
        [
          'Accepted generic Event trace behavior, executable tests, and event-reference-not-command guard evidence are required.'
        ],
        ['events']
      ),
      evidenceFiles: [
        ...new Set([
          ...filesFor(mapped),
          ...behavior.files,
          ...family.testFiles,
          ...family.implementationFiles
        ])
      ].sort()
    };
  },
  'api-layer-does-not-emit-events-directly': (requirements) =>
    mappedEvaluation(
      'api-layer-does-not-emit-events-directly',
      requirements,
      requirementsMeet(
        mappedRequirements(
          'api-layer-does-not-emit-events-directly',
          requirements
        )
      ),
      ['Executable API negative tests must prove no direct Event emission.']
    ),
  'workflow-layer-does-not-emit-events-directly': (requirements) =>
    mappedEvaluation(
      'workflow-layer-does-not-emit-events-directly',
      requirements,
      requirementsMeet(
        mappedRequirements(
          'workflow-layer-does-not-emit-events-directly',
          requirements
        )
      ),
      [
        'Executable Workflow negative tests must prove no direct Event emission.'
      ]
    ),
  'agent-layer-does-not-emit-events-directly': (requirements) =>
    mappedEvaluation(
      'agent-layer-does-not-emit-events-directly',
      requirements,
      requirementsMeet(
        mappedRequirements(
          'agent-layer-does-not-emit-events-directly',
          requirements
        )
      ),
      ['Executable Agent negative tests must prove no direct Event emission.']
    ),
  'errors-are-safe': (requirements) =>
    testedBehaviorEvaluation(
      'errors-are-safe',
      requirements,
      ['errors'],
      ['error-versioning-tests'],
      ['Safe error behavior and negative error tests must be accepted.']
    ),
  'unsupported-versions-fail-closed': (requirements) =>
    testedBehaviorEvaluation(
      'unsupported-versions-fail-closed',
      requirements,
      ['versioning'],
      ['error-versioning-tests'],
      ['Unsupported version handling and negative tests must fail closed.']
    ),
  'deferred-items-do-not-block-mvp': (requirements) =>
    guardEvaluation('deferred-items-do-not-block-mvp', requirements),
  'never-in-mvp-items-are-not-implemented': (requirements) =>
    guardEvaluation('never-in-mvp-items-are-not-implemented', requirements)
} satisfies Record<
  Book02MvpAcceptanceCriterionId,
  AcceptanceCriterionEvaluator
>;
export function deriveBook02MvpAcceptanceCriteria(
  requirements: readonly Book02MvpRequirement[]
): readonly Book02MvpAcceptanceCriterion[] {
  return MVP_ACCEPTANCE_CRITERIA_IDENTITIES.map((criterion) => {
    const evaluator = ACCEPTANCE_CRITERION_EVALUATORS[criterion.id];
    const evaluation = evaluator(requirements);
    return {
      ...criterion,
      satisfied: evaluation.satisfied,
      evidenceRequirementIds: evaluation.evidenceRequirementIds,
      behaviorIds: evaluation.behaviorIds,
      evidenceFiles: evaluation.evidenceFiles,
      unresolvedReasons: evaluation.unresolvedReasons
    };
  });
}

export function isBook02MvpCompletionReady(
  requirements: readonly Book02MvpRequirement[],
  acceptanceCriteria: readonly Book02MvpAcceptanceCriterion[]
): boolean {
  const allAcceptanceCriteriaSatisfied = acceptanceCriteria.every(
    (criterion) => criterion.satisfied
  );
  const domainCriterionSatisfied = acceptanceCriteria.some(
    (criterion) =>
      criterion.id ===
        'must-build-domains-implemented-or-scaffolded-with-tests' &&
      criterion.satisfied
  );
  const nonDomainMustBuildRequirementsMeetDepth = requirements
    .filter(
      (requirement) =>
        requirement.category === 'must_build_now' &&
        requirement.layer !== 'domain'
    )
    .every(
      (requirement) => requirement.currentDisposition === 'meets_required_depth'
    );
  return (
    allAcceptanceCriteriaSatisfied &&
    domainCriterionSatisfied &&
    nonDomainMustBuildRequirementsMeetDepth
  );
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
      inspectionComplete: docs.filter((r) => r.inspectionStatus === 'complete')
        .length,
      inspectionIncomplete: docs.filter(
        (r) => r.inspectionStatus !== 'complete'
      ).length,
      unexpectedImplementationCount: docs.filter(
        (r) =>
          r.currentDisposition === 'violation_present' ||
          r.currentDisposition === 'meets_required_depth'
      ).length
    },
    defer: {
      total: defers.length,
      inspectionComplete: defers.filter(
        (r) => r.inspectionStatus === 'complete'
      ).length,
      inspectionIncomplete: defers.filter(
        (r) => r.inspectionStatus !== 'complete'
      ).length,
      unexpectedBlockingImplementationCount: defers.filter(
        (r) => r.currentDisposition === 'violation_present'
      ).length
    },
    neverInMvp: {
      total: never.length,
      inspectionComplete: never.filter((r) => r.inspectionStatus === 'complete')
        .length,
      inspectionIncomplete: never.filter(
        (r) => r.inspectionStatus !== 'complete'
      ).length,
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
      book02MvpComplete: isBook02MvpCompletionReady(
        requirements,
        acceptanceCriteria
      )
    },
    knownExecutionSpineGaps: [
      'API validator/service delegation',
      'three preview/apply Workflows',
      'API, Workflow, and Agent Event emission separation'
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
