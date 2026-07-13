import { existsSync } from 'node:fs';
import {
  BOOK_02_EXPECTED_COUNTS,
  BOOK_02_MVP_REQUIREMENT_IDENTITIES,
  type Book02MvpRequirement
} from './book-02-mvp-requirements.ts';
import {
  BOOK_02_MVP_GAP_BASELINE,
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
const rel = (p: string) => !p.startsWith('/') && !p.includes('..');
export function validateBook02MvpRequirements(
  requirements: readonly Book02MvpRequirement[]
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
  requirements.forEach((r, i) => {
    const e = expected[i];
    if (seen.has(r.id))
      issues.push(
        issue(
          'book02.requirements.duplicate_id',
          `Duplicate requirement id ${r.id}.`,
          `requirements[${i}].id`
        )
      );
    seen.add(r.id);
    if (!e) {
      issues.push(
        issue(
          'book02.requirements.extra',
          `Unexpected requirement ${r.id}.`,
          `requirements[${i}]`
        )
      );
      return;
    }
    if (r.id !== e.id)
      issues.push(
        issue(
          'book02.requirements.order_or_missing',
          `Expected ${e.id} at index ${i}.`,
          `requirements[${i}].id`
        )
      );
    if (r.category !== e.category)
      issues.push(
        issue(
          'book02.requirements.category_changed',
          `Category for ${r.id} changed.`,
          `requirements[${i}].category`
        )
      );
    if (r.sourcePath !== e.sourcePath)
      issues.push(
        issue(
          'book02.requirements.source_path_changed',
          `Source path for ${r.id} changed.`,
          `requirements[${i}].sourcePath`
        )
      );
    if (r.sourcePath.includes('event-object.md'))
      issues.push(
        issue(
          'book02.requirements.legacy_event_object_path',
          'Legacy event-object.md must not be canonical.',
          `requirements[${i}].sourcePath`
        )
      );
    for (const [kind, files] of [
      ['implementationFiles', r.implementationFiles],
      ['testFiles', r.testFiles],
      ['fixtureFiles', r.fixtureFiles]
    ] as const)
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
    if (
      r.layer === 'service' &&
      r.currentDisposition === 'meets_required_depth' &&
      r.implementationFiles.every((f) => f.includes('contracts/service'))
    )
      issues.push(
        issue(
          'book02.depth.service_contract_index_only',
          'Contract skeleton/index evidence cannot satisfy Service behavior.',
          `requirements[${i}]`
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
          `requirements[${i}]`
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
          `requirements[${i}]`
        )
      );
    if (
      r.layer === 'test' &&
      r.currentDisposition === 'meets_required_depth' &&
      r.implementationFiles.some((f) => f.includes('contracts/test'))
    )
      issues.push(
        issue(
          'book02.depth.test_contract_skeleton_only',
          'Test contract skeleton cannot satisfy executable test-family evidence.',
          `requirements[${i}]`
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
          `requirements[${i}]`
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
          `requirements[${i}]`
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
          `requirements[${i}]`
        )
      );
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
export function validateBook02MvpGapBaseline(
  baseline: Book02MvpGapBaseline
): readonly Book02MvpValidationIssue[] {
  const issues = [...validateBook02MvpRequirements(baseline.requirements)];
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
export function validateBook02MvpFixture(
  fixture: unknown
): readonly Book02MvpValidationIssue[] {
  const json = JSON.stringify(fixture);
  const canonical = JSON.stringify(BOOK_02_MVP_GAP_BASELINE);
  return json === canonical
    ? []
    : [
        issue(
          'book02.fixture.drift',
          'Book 02 MVP gap fixture drifted from canonical derived baseline.',
          'fixture'
        )
      ];
}
