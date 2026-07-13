import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK } from '../behavior-coverage/index.ts';
import {
  CORE_CONTRACT_INDEX,
  CORE_OBJECT_CONTRACT_SKELETONS
} from '../contracts/index.ts';
import { CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS } from '../objects/core-mvp-object-base-record.ts';
import { CORE_MVP_OBJECT_CANONICAL_PROFILES } from '../objects/core-mvp-object-profiles.ts';
import {
  BOOK_02_AUTHORITY,
  BOOK_02_EXPECTED_COUNTS,
  BOOK_02_GUARD_INSPECTION_RULES,
  BOOK_02_MVP_REQUIREMENT_IDENTITIES,
  DEFER_ITEMS,
  DOCUMENT_ONLY_ITEMS,
  MVP_ACCEPTANCE_CRITERIA_IDENTITIES,
  NEVER_IN_MVP_ITEMS,
  type Book02MvpAcceptanceCriterion,
  type Book02MvpDisposition,
  type Book02MvpRequirement
} from './book-02-mvp-requirements.ts';
import {
  ACCEPTANCE_CRITERION_EVALUATORS,
  BOOK_02_MVP_GAP_BASELINE,
  BOOK_02_MVP_TEST_FAMILY_EVIDENCE,
  deriveBook02MvpAcceptanceCriteria,
  deriveBook02MvpGapSummary,
  type Book02MvpGapBaseline
} from './book-02-mvp-gap-baseline.ts';

export interface Book02MvpValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}
const issue = (
  code: string,
  message: string,
  path?: string
): Book02MvpValidationIssue => ({ code, message, path });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');
const actualContractIds = new Set(
  CORE_CONTRACT_INDEX.map((entry) => String(entry.id))
);
const acceptedBehaviorIds = new Set(
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map((entry) =>
    String(entry.behaviorId)
  )
);
const isWindowsAbsolute = (p: string) =>
  /^[A-Za-z]:[\\/]/.test(p) || p.startsWith('\\\\');
const rel = (p: string) =>
  !isAbsolute(p) &&
  !isWindowsAbsolute(p) &&
  !p.startsWith('/') &&
  !p.includes('..');
const structuredCheckPrefixes = [
  'package-dependency:',
  'package-script:',
  'path-exists:',
  'fixture-type:',
  'runtime-export:'
] as const;
const hasKnownStructuredCheckPrefix = (check: string) =>
  structuredCheckPrefixes.some((prefix) => check.startsWith(prefix));
const objectFixtureRecords = (): readonly Record<string, unknown>[] => {
  try {
    const parsed = JSON.parse(
      readFileSync(
        'fixtures/objects/core-mvp-object-public-reference-foundation.fixture.json',
        'utf8'
      )
    ) as unknown;
    return Array.isArray(parsed)
      ? (parsed as readonly Record<string, unknown>[])
      : [];
  } catch {
    return [];
  }
};
const dispositions = new Set<Book02MvpDisposition>([
  'meets_required_depth',
  'partial_evidence',
  'validated_skeleton_only',
  'boundary_scaffold_only',
  'semantic_overlap_only',
  'fixture_only',
  'documented_only',
  'missing',
  'not_required',
  'violation_present'
]);

function parseBaseline(value: unknown): Book02MvpGapBaseline | undefined {
  if (!isRecord(value)) return undefined;
  if (value.fixtureType !== 'book_02_mvp_gap_baseline') return undefined;
  if (
    !Array.isArray(value.requirements) ||
    !Array.isArray(value.acceptanceCriteria) ||
    !isRecord(value.summary)
  )
    return undefined;
  if (!isRecord(value.summary.acceptance)) return undefined;
  return value as unknown as Book02MvpGapBaseline;
}
function sameStrings(
  actual: readonly string[] | undefined,
  expected: readonly string[]
): boolean {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((entry, index) => entry === expected[index])
  );
}
function validateGuardRuleCoverage(issues: Book02MvpValidationIssue[]): void {
  const expected = [
    ...DOCUMENT_ONLY_ITEMS.map((item) => `document-only-${item}`),
    ...DEFER_ITEMS.map((item) => `defer-${item}`),
    ...NEVER_IN_MVP_ITEMS.map((item) => `never-${item}`)
  ];
  const actual = Object.keys(BOOK_02_GUARD_INSPECTION_RULES);
  for (const id of expected) {
    const rule =
      BOOK_02_GUARD_INSPECTION_RULES[
        id as keyof typeof BOOK_02_GUARD_INSPECTION_RULES
      ];
    if (!rule) {
      issues.push(
        issue(
          'book02.guard.rule_missing',
          `Missing guard inspection rule ${id}.`,
          id
        )
      );
      continue;
    }
    const nonEmpty =
      rule.inspectionPaths.length > 0 &&
      rule.excludedPaths.length > 0 &&
      (rule.forbiddenIndicators.length > 0 ||
        (rule.forbiddenPathPatterns?.length ?? 0) > 0 ||
        (rule.structuredChecks?.length ?? 0) > 0);
    if (!nonEmpty)
      issues.push(
        issue(
          'book02.guard.rule_empty',
          `Guard inspection rule ${id} is empty.`,
          id
        )
      );
  }
  for (const id of actual) {
    if (!expected.includes(id))
      issues.push(
        issue(
          'book02.guard.rule_extra',
          `Unexpected guard inspection rule ${id}.`,
          id
        )
      );
  }
}
function validateAcceptanceEvaluatorCoverage(
  issues: Book02MvpValidationIssue[]
): void {
  const expected = MVP_ACCEPTANCE_CRITERIA_IDENTITIES.map(
    (criterion) => criterion.id
  );
  const actual = Object.keys(ACCEPTANCE_CRITERION_EVALUATORS);
  for (const id of expected)
    if (!actual.includes(id))
      issues.push(
        issue(
          'book02.acceptance.evaluator_missing',
          `Missing evaluator ${id}.`,
          id
        )
      );
  const expectedSet = new Set<string>(expected);
  for (const id of actual)
    if (!expectedSet.has(id))
      issues.push(
        issue(
          'book02.acceptance.evaluator_extra',
          `Unexpected evaluator ${id}.`,
          id
        )
      );
}

function validateTestFamilyEvidenceCoverage(
  issues: Book02MvpValidationIssue[]
): void {
  const expected = BOOK_02_MVP_REQUIREMENT_IDENTITIES.filter(
    (identity) => identity.layer === 'test'
  ).map((identity) => identity.id.replace('must-test-', ''));
  const actual = Object.keys(BOOK_02_MVP_TEST_FAMILY_EVIDENCE);
  for (const id of expected) {
    const evidence =
      BOOK_02_MVP_TEST_FAMILY_EVIDENCE[
        id as keyof typeof BOOK_02_MVP_TEST_FAMILY_EVIDENCE
      ];
    if (!evidence) {
      issues.push(
        issue(
          'book02.test_family.evidence_missing',
          `Missing Test Family evidence ${id}.`,
          id
        )
      );
      continue;
    }
    if (!actualContractIds.has(evidence.contractId))
      issues.push(
        issue(
          'book02.test_family.fake_contract_id',
          `Unexpected Test Family contract id ${evidence.contractId}.`,
          id
        )
      );
    for (const behaviorId of evidence.behaviorIds)
      if (!acceptedBehaviorIds.has(behaviorId))
        issues.push(
          issue(
            'book02.test_family.fake_behavior_id',
            `Unexpected Test Family behavior id ${behaviorId}.`,
            id
          )
        );
    for (const file of evidence.testFiles)
      if (!rel(file) || !existsSync(file))
        issues.push(
          issue(
            'book02.test_family.missing_test_file',
            `Mapped Test Family file ${file} is missing or unsafe.`,
            file
          )
        );
  }
  for (const id of actual)
    if (!expected.includes(id))
      issues.push(
        issue(
          'book02.test_family.evidence_extra',
          `Unexpected Test Family evidence ${id}.`,
          id
        )
      );
}
function validateRequirementShape(
  value: unknown,
  index: number,
  issues: Book02MvpValidationIssue[]
): value is Book02MvpRequirement {
  if (!isRecord(value)) {
    issues.push(
      issue(
        'book02.requirements.invalid_shape',
        'Requirement must be an object.',
        `requirements[${index}]`
      )
    );
    return false;
  }
  for (const key of [
    'id',
    'name',
    'category',
    'layer',
    'sourcePath',
    'sourceSection',
    'requiredImplementationKind',
    'currentDisposition'
  ]) {
    if (typeof value[key] !== 'string')
      issues.push(
        issue(
          'book02.requirements.invalid_shape',
          `${key} must be a string.`,
          `requirements[${index}].${key}`
        )
      );
  }
  for (const key of [
    'requiredCapabilities',
    'dependencies',
    'contractIds',
    'implementationFiles',
    'testFiles',
    'fixtureFiles',
    'gapReasons'
  ]) {
    if (!isStringArray(value[key]))
      issues.push(
        issue(
          'book02.requirements.invalid_shape',
          `${key} must be a string array.`,
          `requirements[${index}].${key}`
        )
      );
  }
  for (const key of [
    'inspectionPaths',
    'forbiddenIndicators',
    'forbiddenPathPatterns',
    'structuredChecks',
    'excludedPaths',
    'inspectedFiles',
    'violationReasons'
  ]) {
    if (value[key] !== undefined && !isStringArray(value[key]))
      issues.push(
        issue(
          'book02.requirements.invalid_shape',
          `${key} must be a string array when present.`,
          `requirements[${index}].${key}`
        )
      );
  }
  if (
    value.inspectionStatus !== undefined &&
    value.inspectionStatus !== 'complete' &&
    value.inspectionStatus !== 'incomplete'
  )
    issues.push(
      issue(
        'book02.requirements.invalid_shape',
        'inspectionStatus must be complete or incomplete when present.',
        `requirements[${index}].inspectionStatus`
      )
    );
  return true;
}
export function validateBook02MvpRequirements(
  requirements: readonly unknown[]
): readonly Book02MvpValidationIssue[] {
  const issues: Book02MvpValidationIssue[] = [];
  const expected = BOOK_02_MVP_REQUIREMENT_IDENTITIES;
  if (requirements.length !== expected.length)
    issues.push(
      issue(
        'book02.requirements.count',
        `Expected ${expected.length} canonical requirements.`,
        'requirements'
      )
    );
  const seen = new Set<string>();
  requirements.forEach((candidate, index) => {
    if (!validateRequirementShape(candidate, index, issues)) return;
    const r = candidate;
    const e = expected[index];
    if (seen.has(r.id))
      issues.push(
        issue(
          'book02.requirements.duplicate_id',
          `Duplicate requirement id ${r.id}.`,
          `requirements[${index}].id`
        )
      );
    seen.add(r.id);
    if (!e) {
      issues.push(
        issue(
          'book02.requirements.extra',
          `Unexpected requirement ${r.id}.`,
          `requirements[${index}]`
        )
      );
      return;
    }
    if (r.id !== e.id)
      issues.push(
        issue(
          'book02.requirements.order_or_missing',
          `Expected ${e.id} at index ${index}.`,
          `requirements[${index}].id`
        )
      );
    if (r.name !== e.name)
      issues.push(
        issue(
          'book02.requirements.name_changed',
          `Name for ${r.id} changed.`,
          `requirements[${index}].name`
        )
      );
    if (r.layer !== e.layer)
      issues.push(
        issue(
          'book02.requirements.layer_changed',
          `Layer for ${r.id} changed.`,
          `requirements[${index}].layer`
        )
      );
    if (r.category !== e.category)
      issues.push(
        issue(
          'book02.requirements.category_changed',
          `Category for ${r.id} changed.`,
          `requirements[${index}].category`
        )
      );
    if (r.sourcePath !== e.sourcePath)
      issues.push(
        issue(
          'book02.requirements.source_path_changed',
          `Source path for ${r.id} changed.`,
          `requirements[${index}].sourcePath`
        )
      );
    if (r.sourceSection !== e.sourceSection)
      issues.push(
        issue(
          'book02.requirements.source_section_changed',
          `Source section for ${r.id} changed.`,
          `requirements[${index}].sourceSection`
        )
      );
    if (r.requiredImplementationKind !== e.requiredImplementationKind)
      issues.push(
        issue(
          'book02.requirements.implementation_kind_changed',
          `Required implementation kind for ${r.id} changed.`,
          `requirements[${index}].requiredImplementationKind`
        )
      );
    if (!sameStrings(r.requiredCapabilities, e.requiredCapabilities))
      issues.push(
        issue(
          'book02.requirements.required_capability_changed',
          `Required capabilities for ${r.id} changed.`,
          `requirements[${index}].requiredCapabilities`
        )
      );
    if (r.requiredDepth !== e.requiredDepth)
      issues.push(
        issue(
          'book02.requirements.depth_changed',
          `Required depth for ${r.id} changed.`,
          `requirements[${index}].requiredDepth`
        )
      );
    if (!sameStrings(r.dependencies, e.dependencies))
      issues.push(
        issue(
          'book02.requirements.dependencies_changed',
          `Dependencies for ${r.id} changed.`,
          `requirements[${index}].dependencies`
        )
      );
    if (r.layer === 'guard') {
      if (!isStringArray(r.inspectionPaths) || r.inspectionPaths.length === 0)
        issues.push(
          issue(
            'book02.guard.inspection_paths',
            'Guard requirements must declare inspection paths.',
            `requirements[${index}].inspectionPaths`
          )
        );
      if (
        !isStringArray(r.excludedPaths) ||
        !r.excludedPaths.includes('src/mvp-coverage/') ||
        !r.excludedPaths.includes('tests/') ||
        !r.excludedPaths.includes('docs/')
      )
        issues.push(
          issue(
            'book02.guard.excluded_paths',
            'Guard requirements must exclude self, tests, docs, and governance docs.',
            `requirements[${index}].excludedPaths`
          )
        );
      const hasCheck =
        (r.forbiddenIndicators?.length ?? 0) > 0 ||
        (r.forbiddenPathPatterns?.length ?? 0) > 0 ||
        (r.structuredChecks?.length ?? 0) > 0;
      if (!hasCheck)
        issues.push(
          issue(
            'book02.guard.rule_empty',
            'Guard requirement must expose at least one indicator, path pattern, or structured check.',
            `requirements[${index}]`
          )
        );
      for (const check of r.structuredChecks ?? []) {
        if (!hasKnownStructuredCheckPrefix(check))
          issues.push(
            issue(
              'book02.guard.structured_check_unknown',
              `Unsupported structured guard check ${check}.`,
              `requirements[${index}].structuredChecks`
            )
          );
      }
      if (
        r.inspectionStatus !== 'complete' &&
        r.inspectionStatus !== 'incomplete'
      )
        issues.push(
          issue(
            'book02.guard.missing_inspection_status',
            'Guard requirement must expose inspectionStatus.',
            `requirements[${index}].inspectionStatus`
          )
        );
      if (
        r.inspectionStatus === 'incomplete' &&
        r.currentDisposition === 'not_required'
      )
        issues.push(
          issue(
            'book02.guard.disposition_inconsistent',
            'Incomplete guard inspection cannot be reported as not_required.',
            `requirements[${index}].currentDisposition`
          )
        );
      if (
        r.currentDisposition === 'violation_present' &&
        (!r.violationReasons || r.violationReasons.length === 0)
      )
        issues.push(
          issue(
            'book02.guard.violation_without_reasons',
            'Guard violation must include violation reasons.',
            `requirements[${index}].violationReasons`
          )
        );
    }

    if (r.layer === 'object') {
      const domainId = r.id.replace('must-object-', '');
      const profile = CORE_MVP_OBJECT_CANONICAL_PROFILES.find(
        (entry) => entry.domainId === domainId
      );
      const contract = profile
        ? CORE_OBJECT_CONTRACT_SKELETONS.find(
            (entry) => entry.id === profile.objectContractId
          )
        : undefined;
      const fixtureMatches = objectFixtureRecords().filter(
        (entry) => entry.domainId === domainId
      );
      const fixtureRecord = fixtureMatches[0];
      const publicReferenceRecord =
        typeof fixtureRecord?.publicReferenceId === 'string'
          ? CORE_MVP_OBJECT_FIXTURE_PUBLIC_REFERENCE_RECORDS.find(
              (entry) => entry.referenceId === fixtureRecord.publicReferenceId
            )
          : undefined;
      if (!profile || !contract)
        issues.push(
          issue(
            'book02.object.profile_contract_mismatch',
            'Object requirement must map to an exact canonical profile and real Object contract.',
            `requirements[${index}]`
          )
        );
      if (profile && contract) {
        if (
          profile.domainId !== contract.domainId ||
          profile.objectType !== contract.objectType ||
          profile.objectContractId !== contract.id
        )
          issues.push(
            issue(
              'book02.object.profile_contract_mismatch',
              'Object profile must match the real Object contract.',
              `requirements[${index}]`
            )
          );
        if (profile.sourcePath !== contract.sourcePath)
          issues.push(
            issue(
              'book02.object.profile_source_mismatch',
              'Object profile source path must match the real Object contract.',
              `requirements[${index}]`
            )
          );
      }
      if (fixtureMatches.length === 0)
        issues.push(
          issue(
            'book02.object.fixture_missing',
            'Object requirement must have an exact fixture record.',
            `requirements[${index}]`
          )
        );
      if (fixtureMatches.length > 1)
        issues.push(
          issue(
            'book02.object.fixture_duplicate',
            'Object requirement must not have duplicate fixture records.',
            `requirements[${index}]`
          )
        );
      if (
        profile &&
        fixtureRecord &&
        (fixtureRecord.objectType !== profile.objectType ||
          fixtureRecord.objectContractId !== profile.objectContractId ||
          fixtureRecord.domainId !== profile.domainId)
      )
        issues.push(
          issue(
            'book02.object.fixture_profile_mismatch',
            'Object fixture record must match the exact profile.',
            `requirements[${index}]`
          )
        );
      if (
        !profile ||
        !fixtureRecord ||
        !publicReferenceRecord ||
        publicReferenceRecord.objectType !== profile.objectType ||
        publicReferenceRecord.referenceDomain !== profile.domainId
      )
        issues.push(
          issue(
            'book02.object.reference_evidence_missing',
            'Object fixture must have matching public Reference evidence.',
            `requirements[${index}]`
          )
        );
      const hasDepthEvidence = Boolean(
        profile &&
        contract &&
        fixtureRecord &&
        publicReferenceRecord &&
        r.contractIds.includes(String(contract.id)) &&
        r.implementationFiles.includes(
          'src/objects/core-mvp-object-profiles.ts'
        ) &&
        r.implementationFiles.includes(
          'src/objects/core-mvp-object-base-record.ts'
        ) &&
        r.implementationFiles.includes(
          'src/objects/core-mvp-object-validation.ts'
        ) &&
        r.testFiles.includes(
          'tests/unit/core-mvp-object-public-reference-foundation.test.ts'
        ) &&
        r.testFiles.includes(
          'tests/fixtures/core-mvp-object-public-reference-foundation-fixture.test.ts'
        ) &&
        r.fixtureFiles.includes(
          'fixtures/objects/core-mvp-object-public-reference-foundation.fixture.json'
        )
      );
      if (r.currentDisposition === 'meets_required_depth' && !hasDepthEvidence)
        issues.push(
          issue(
            'book02.object.depth_inconsistent',
            'Object meets_required_depth requires exact profile, contract, fixture, reference, implementation, and test evidence.',
            `requirements[${index}]`
          )
        );
    }
    if (r.sourcePath.includes('event-object.md'))
      issues.push(
        issue(
          'book02.requirements.legacy_event_object_path',
          'Legacy event-object.md must not be canonical.',
          `requirements[${index}].sourcePath`
        )
      );
    if (!dispositions.has(r.currentDisposition))
      issues.push(
        issue(
          'book02.requirements.invalid_disposition',
          `Invalid disposition for ${r.id}.`,
          `requirements[${index}].currentDisposition`
        )
      );
    for (const contractId of r.contractIds)
      if (!actualContractIds.has(contractId))
        issues.push(
          issue(
            'book02.evidence.fake_contract_id',
            `Unexpected contract id ${contractId}.`,
            `requirements[${index}].contractIds`
          )
        );
    for (const [kind, files] of [
      ['implementationFiles', r.implementationFiles],
      ['testFiles', r.testFiles],
      ['fixtureFiles', r.fixtureFiles]
    ] as const) {
      for (const file of files) {
        if (!rel(file))
          issues.push(
            issue(
              'book02.evidence.invalid_path',
              `${kind} path must be repository-relative without traversal.`,
              file
            )
          );
        else if (!existsSync(file))
          issues.push(
            issue(
              'book02.evidence.missing_file',
              `${kind} path does not exist.`,
              file
            )
          );
      }
    }
    validateDispositionConsistency(r, index, issues);
  });
  for (const e of expected)
    if (!seen.has(e.id))
      issues.push(
        issue(
          'book02.requirements.missing',
          `Missing requirement ${e.id}.`,
          'requirements'
        )
      );
  return issues;
}
function validateDispositionConsistency(
  r: Book02MvpRequirement,
  index: number,
  issues: Book02MvpValidationIssue[]
): void {
  if (
    r.layer === 'service' &&
    r.currentDisposition === 'meets_required_depth' &&
    r.implementationFiles.every((f) => f.includes('contracts/service'))
  )
    issues.push(
      issue(
        'book02.depth.service_contract_index_only',
        'Contract skeleton/index evidence cannot satisfy Service behavior.',
        `requirements[${index}]`
      )
    );
  if (
    r.layer === 'api' &&
    r.currentDisposition === 'meets_required_depth' &&
    r.implementationFiles.some((f) => f.includes('contracts/api'))
  )
    issues.push(
      issue(
        'book02.depth.api_skeleton_only',
        'API skeleton cannot satisfy validator and Service delegation behavior.',
        `requirements[${index}]`
      )
    );
  if (
    r.layer === 'workflow' &&
    r.currentDisposition === 'meets_required_depth' &&
    r.implementationFiles.some((f) => f.includes('catalog-skeletons'))
  )
    issues.push(
      issue(
        'book02.depth.workflow_skeleton_only',
        'Workflow skeleton cannot satisfy preview/apply behavior.',
        `requirements[${index}]`
      )
    );
  if (
    r.layer === 'event' &&
    r.currentDisposition === 'meets_required_depth' &&
    r.gapReasons.some((g) => g.includes('overlap'))
  )
    issues.push(
      issue(
        'book02.depth.generic_event_overlap',
        'Generic Event semantic overlap cannot satisfy exact MVP Event.',
        `requirements[${index}]`
      )
    );
  if (
    r.layer === 'agent' &&
    r.currentDisposition === 'meets_required_depth' &&
    r.implementationFiles.some((f) => f.includes('agent-boundary'))
  )
    issues.push(
      issue(
        'book02.depth.generic_agent_boundary',
        'Generic Agent boundary infrastructure cannot satisfy named Agent scaffold.',
        `requirements[${index}]`
      )
    );
  if (
    r.layer === 'test' &&
    r.currentDisposition === 'meets_required_depth' &&
    (r.testFiles.length === 0 ||
      r.implementationFiles.every((f) => f.includes('contracts/test')))
  )
    issues.push(
      issue(
        'book02.depth.test_contract_skeleton_only',
        'Test contract skeleton cannot satisfy executable test-family evidence.',
        `requirements[${index}]`
      )
    );
  if (
    r.category === 'stub_now' &&
    r.currentDisposition === 'meets_required_depth'
  )
    issues.push(
      issue(
        'book02.scope.stub_production_ready',
        'Stub Now item cannot be production-ready.',
        `requirements[${index}]`
      )
    );
  if (
    r.category === 'document_only' &&
    r.currentDisposition === 'meets_required_depth'
  )
    issues.push(
      issue(
        'book02.scope.document_only_runtime_complete',
        'Document Only item cannot be completed runtime.',
        `requirements[${index}]`
      )
    );
  if (
    r.category === 'never_in_mvp' &&
    r.currentDisposition === 'violation_present'
  )
    issues.push(
      issue(
        'book02.scope.never_violation',
        'Never in MVP violation is present.',
        `requirements[${index}]`
      )
    );
}
export function validateBook02MvpGapBaseline(
  value: unknown
): readonly Book02MvpValidationIssue[] {
  const baseline = parseBaseline(value);
  if (!baseline)
    return [
      issue(
        'book02.baseline.invalid_shape',
        'Book 02 MVP gap baseline must be a fixture object.',
        'baseline'
      )
    ];
  const issues = [...validateBook02MvpRequirements(baseline.requirements)];
  validateGuardRuleCoverage(issues);
  validateAcceptanceEvaluatorCoverage(issues);
  validateTestFamilyEvidenceCoverage(issues);
  if (JSON.stringify(baseline.authority) !== JSON.stringify(BOOK_02_AUTHORITY))
    issues.push(
      issue(
        'book02.authority.changed',
        'Book 02 authority changed.',
        'authority'
      )
    );
  const counts = {
    must_build_now: BOOK_02_EXPECTED_COUNTS.mustBuildNow,
    stub_now: BOOK_02_EXPECTED_COUNTS.stubNow,
    document_only: BOOK_02_EXPECTED_COUNTS.documentOnly,
    defer: BOOK_02_EXPECTED_COUNTS.defer,
    never_in_mvp: BOOK_02_EXPECTED_COUNTS.neverInMvp
  } as const;
  for (const [category, expected] of Object.entries(counts)) {
    const actual = baseline.requirements.filter(
      (r) => r.category === category
    ).length;
    if (actual !== expected)
      issues.push(
        issue(
          'book02.category.count',
          `${category} expected ${expected} but found ${actual}.`,
          category
        )
      );
  }
  validateAcceptance(baseline, issues);
  const derivedSummary = deriveBook02MvpGapSummary(
    baseline.requirements,
    baseline.acceptanceCriteria
  );
  if (JSON.stringify(baseline.summary) !== JSON.stringify(derivedSummary))
    issues.push(
      issue(
        'book02.summary.inconsistent',
        'Summary must equal values derived from requirement dispositions and acceptance criteria.',
        'summary'
      )
    );
  if (baseline.summary.stubNow.productionDepthViolations > 0)
    issues.push(
      issue(
        'book02.scope.stub_production_ready',
        'Stub Now production-depth violation exists.',
        'summary.stubNow.productionDepthViolations'
      )
    );
  if (baseline.summary.documentOnly.unexpectedImplementationCount > 0)
    issues.push(
      issue(
        'book02.scope.document_only_runtime_complete',
        'Document Only implementation violation exists.',
        'summary.documentOnly.unexpectedImplementationCount'
      )
    );
  if (baseline.summary.neverInMvp.violationCount > 0)
    issues.push(
      issue(
        'book02.scope.never_violation',
        'Never in MVP violation exists.',
        'summary.neverInMvp.violationCount'
      )
    );
  return issues;
}
function validateAcceptanceCriterionShape(
  value: unknown,
  index: number,
  issues: Book02MvpValidationIssue[]
): value is Book02MvpAcceptanceCriterion {
  if (!isRecord(value)) {
    issues.push(
      issue(
        'book02.acceptance.invalid_shape',
        'Acceptance criterion must be an object.',
        `acceptanceCriteria[${index}]`
      )
    );
    return false;
  }
  for (const key of ['id', 'name', 'sourcePath', 'sourceSection']) {
    if (typeof value[key] !== 'string')
      issues.push(
        issue(
          'book02.acceptance.invalid_shape',
          `${key} must be a string.`,
          `acceptanceCriteria[${index}].${key}`
        )
      );
  }
  if (typeof value.satisfied !== 'boolean')
    issues.push(
      issue(
        'book02.acceptance.invalid_shape',
        'satisfied must be boolean.',
        `acceptanceCriteria[${index}].satisfied`
      )
    );
  for (const key of [
    'dependencies',
    'evidenceRequirementIds',
    'behaviorIds',
    'evidenceFiles',
    'unresolvedReasons'
  ]) {
    if (!isStringArray(value[key]))
      issues.push(
        issue(
          'book02.acceptance.invalid_shape',
          `${key} must be a string array.`,
          `acceptanceCriteria[${index}].${key}`
        )
      );
  }
  return true;
}
function validateAcceptance(
  baseline: Book02MvpGapBaseline,
  issues: Book02MvpValidationIssue[]
): void {
  if (
    baseline.acceptanceCriteria.length !==
    BOOK_02_EXPECTED_COUNTS.acceptanceCriteria
  )
    issues.push(
      issue(
        'book02.acceptance.count',
        'Acceptance criteria count must be 19.',
        'acceptanceCriteria'
      )
    );
  const derived = deriveBook02MvpAcceptanceCriteria(baseline.requirements);
  baseline.acceptanceCriteria.forEach((candidate: unknown, index: number) => {
    if (!validateAcceptanceCriterionShape(candidate, index, issues)) return;
    const criterion = candidate;
    const expected = MVP_ACCEPTANCE_CRITERIA_IDENTITIES[index];
    const expectedDerived = derived[index];
    if (!expected || !expectedDerived) return;
    if (criterion.id !== expected.id)
      issues.push(
        issue(
          'book02.acceptance.order',
          `Expected acceptance criterion ${expected.id}.`,
          `acceptanceCriteria[${index}].id`
        )
      );
    if (criterion.name !== expected.name)
      issues.push(
        issue(
          'book02.acceptance.name_changed',
          `Acceptance criterion name changed.`,
          `acceptanceCriteria[${index}].name`
        )
      );
    if (
      criterion.sourcePath !== expected.sourcePath ||
      criterion.sourceSection !== expected.sourceSection
    )
      issues.push(
        issue(
          'book02.acceptance.source_changed',
          `Acceptance criterion source changed.`,
          `acceptanceCriteria[${index}]`
        )
      );
    if (JSON.stringify(criterion) !== JSON.stringify(expectedDerived))
      issues.push(
        issue(
          'book02.acceptance.inconsistent_criterion',
          `Acceptance criterion must be derived from evidence.`,
          `acceptanceCriteria[${index}]`
        )
      );
    for (const behaviorId of criterion.behaviorIds ?? [])
      if (!acceptedBehaviorIds.has(behaviorId))
        issues.push(
          issue(
            'book02.acceptance.behavior_evidence_missing',
            `Acceptance criterion reports unknown behavior evidence ${behaviorId}.`,
            `acceptanceCriteria[${index}].behaviorIds`
          )
        );
    if (
      criterion.id ===
        'must-build-domains-implemented-or-scaffolded-with-tests' &&
      !criterion.satisfied
    ) {
      const derivedCriterion = derived.find(
        (entry) => entry.id === criterion.id
      );
      if (derivedCriterion?.satisfied)
        issues.push(
          issue(
            'book02.acceptance.domain_scaffold_test_inconsistent',
            'Domain scaffold-with-tests acceptance must be satisfied when exact Domain skeleton evidence and tests exist.',
            `acceptanceCriteria[${index}]`
          )
        );
    }

    if (
      criterion.id === 'must-build-objects-have-public-reference-ids' &&
      criterion.satisfied &&
      !criterion.evidenceFiles.some((file) =>
        file.includes('core-mvp-object-public-reference-foundation')
      )
    )
      issues.push(
        issue(
          'book02.acceptance.public_reference_unproven',
          'Object public-reference acceptance cannot be satisfied without explicit public-reference evidence.',
          `acceptanceCriteria[${index}]`
        )
      );
  });
  for (const criterion of baseline.acceptanceCriteria) {
    if (
      (criterion.id === 'deferred-items-do-not-block-mvp' ||
        criterion.id === 'never-in-mvp-items-are-not-implemented') &&
      criterion.satisfied
    ) {
      const mapped = baseline.requirements.filter((r) =>
        criterion.evidenceRequirementIds.includes(r.id)
      );
      if (mapped.some((r) => r.inspectionStatus !== 'complete'))
        issues.push(
          issue(
            'book02.acceptance.guard_inspection_incomplete',
            'Guard acceptance criteria cannot be satisfied with incomplete inspection.',
            `acceptanceCriteria.${criterion.id}`
          )
        );
    }
  }
  const derivedComplete =
    baseline.summary.acceptance.unresolvedCriteria.length === 0 &&
    baseline.requirements
      .filter((r) => r.category === 'must_build_now')
      .every((r) => r.currentDisposition === 'meets_required_depth');
  if (baseline.summary.acceptance.book02MvpComplete !== derivedComplete)
    issues.push(
      issue(
        'book02.acceptance.static_or_inconsistent_completion',
        'book02MvpComplete must be dynamically derived from unresolved evidence.',
        'summary.acceptance.book02MvpComplete'
      )
    );
}
export function validateBook02MvpFixture(
  fixture: unknown
): readonly Book02MvpValidationIssue[] {
  const structural = validateBook02MvpGapBaseline(fixture);
  if (structural.length > 0) return structural;
  return JSON.stringify(fixture) === JSON.stringify(BOOK_02_MVP_GAP_BASELINE)
    ? []
    : [
        issue(
          'book02.fixture.drift',
          'Book 02 MVP gap fixture drifted from canonical derived baseline.',
          'fixture'
        )
      ];
}
