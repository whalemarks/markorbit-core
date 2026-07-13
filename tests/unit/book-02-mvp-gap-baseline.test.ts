import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import {
  ACCEPTANCE_CRITERION_EVALUATORS,
  BOOK_02_MVP_GAP_BASELINE,
  inspectBook02MvpGuard,
  deriveBook02MvpAcceptanceCriteria,
  deriveBook02MvpGapSummary,
  validateBook02MvpGapBaseline
} from '../../src/index.ts';

const codes = (issues: readonly { code: string }[]) =>
  issues.map((i) => i.code);
const cloneRecord = (): Record<string, unknown> =>
  structuredClone(BOOK_02_MVP_GAP_BASELINE) as unknown as Record<
    string,
    unknown
  >;
const requirementsOf = (
  baseline: Record<string, unknown>
): Record<string, unknown>[] =>
  baseline.requirements as Record<string, unknown>[];

describe('Book 02 MVP gap baseline validation', () => {
  it('validates the canonical baseline and derives incomplete MVP state', () => {
    assert.deepEqual(
      validateBook02MvpGapBaseline(BOOK_02_MVP_GAP_BASELINE),
      []
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
    assert.equal(BOOK_02_MVP_GAP_BASELINE.summary.neverInMvp.violationCount, 0);
    assert.equal(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow.total, 115);
  });
  it('uses requirement-specific evidence and does not fabricate contract IDs', () => {
    const domain = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (r) => r.id === 'must-domain-identity'
    );
    const service = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (r) => r.id === 'must-service-identity-service'
    );
    const workflow = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (r) => r.id === 'must-workflow-customer-intake-workflow'
    );
    assert.deepEqual(domain?.implementationFiles, [
      'src/contracts/domain/core-domain-contract-skeletons.ts'
    ]);
    assert.deepEqual(service?.implementationFiles, [
      'src/contracts/service/core-service-contract-skeletons.ts'
    ]);
    assert.deepEqual(workflow?.implementationFiles, [
      'src/contracts/workflow/core-workflow-catalog-skeletons.ts'
    ]);
    assert.notDeepEqual(
      domain?.implementationFiles,
      service?.implementationFiles
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.requirements
        .flatMap((r) => r.contractIds)
        .every((id) => id.startsWith('core-')),
      true
    );
  });
  it('rejects duplicate, missing, extra, category, layer, name, and source path drift', () => {
    const duplicate = cloneRecord();
    requirementsOf(duplicate)[1] = {
      ...requirementsOf(duplicate)[1],
      id: requirementsOf(duplicate)[0]?.id
    };
    assert.ok(
      codes(validateBook02MvpGapBaseline(duplicate)).includes(
        'book02.requirements.duplicate_id'
      )
    );
    const missing = {
      ...BOOK_02_MVP_GAP_BASELINE,
      requirements: BOOK_02_MVP_GAP_BASELINE.requirements.slice(1)
    };
    assert.ok(
      codes(validateBook02MvpGapBaseline(missing)).includes(
        'book02.requirements.missing'
      )
    );
    const extra = {
      ...BOOK_02_MVP_GAP_BASELINE,
      requirements: [
        ...BOOK_02_MVP_GAP_BASELINE.requirements,
        BOOK_02_MVP_GAP_BASELINE.requirements[0]
      ]
    };
    assert.ok(
      codes(validateBook02MvpGapBaseline(extra)).includes(
        'book02.requirements.extra'
      )
    );
    for (const [key, value, code] of [
      ['category', 'stub_now', 'book02.requirements.category_changed'],
      ['layer', 'guard', 'book02.requirements.layer_changed'],
      ['name', 'Changed', 'book02.requirements.name_changed'],
      ['sourcePath', 'changed.md', 'book02.requirements.source_path_changed'],
      [
        'sourceSection',
        'Section X',
        'book02.requirements.source_section_changed'
      ],
      [
        'requiredImplementationKind',
        'changed',
        'book02.requirements.implementation_kind_changed'
      ]
    ] as const) {
      const baseline = cloneRecord();
      requirementsOf(baseline)[0] = {
        ...requirementsOf(baseline)[0],
        [key]: value
      };
      assert.ok(codes(validateBook02MvpGapBaseline(baseline)).includes(code));
    }
  });
  it('rejects invalid evidence paths, fake contract IDs, and missing files', () => {
    for (const file of [
      '/tmp/x',
      '../x',
      'C:/repo/file.ts',
      '\\\\server\\share\\file.ts',
      'missing/file.ts'
    ]) {
      const baseline = cloneRecord();
      requirementsOf(baseline)[0] = {
        ...requirementsOf(baseline)[0],
        implementationFiles: [file]
      };
      assert.ok(
        codes(validateBook02MvpGapBaseline(baseline)).some(
          (code) =>
            code === 'book02.evidence.invalid_path' ||
            code === 'book02.evidence.missing_file'
        )
      );
    }
    const fake = cloneRecord();
    requirementsOf(fake)[0] = {
      ...requirementsOf(fake)[0],
      contractIds: ['core-api-fake-api-contract']
    };
    assert.ok(
      codes(validateBook02MvpGapBaseline(fake)).includes(
        'book02.evidence.fake_contract_id'
      )
    );
  });

  it('uses actual Common Contract current depths from behavior coverage', () => {
    const expectedDepths = new Map([
      ['must-common-references', 'level_3'],
      ['must-common-errors', 'level_3'],
      ['must-common-permission-context', 'level_2'],
      ['must-common-policy-context', 'level_1'],
      ['must-common-idempotency', 'level_3'],
      ['must-common-audit-context', 'level_2'],
      ['must-common-versioning', 'level_1'],
      ['must-common-pagination', 'level_2'],
      ['must-common-ai-context', 'level_1'],
      ['must-common-human-review', 'level_2']
    ]);
    for (const [id, expectedDepth] of expectedDepths) {
      const requirement = BOOK_02_MVP_GAP_BASELINE.requirements.find(
        (r) => r.id === id
      );
      assert.equal(requirement?.currentDepth, expectedDepth);
      assert.equal(requirement?.currentDisposition, 'meets_required_depth');
      assert.notEqual(
        requirement?.currentDepth,
        requirement?.requiredDepth === 'level_2_3' ? 'level_2_3' : 'level_1_2'
      );
    }
  });
  it('inspects guards deterministically while excluding self, tests, and docs', () => {
    const temp = mkdtempSync(join(tmpdir(), 'book02-guard-'));
    try {
      const src = join(temp, 'src');
      const tests = join(temp, 'tests');
      const docs = join(temp, 'docs');
      mkdirSync(src);
      mkdirSync(tests);
      mkdirSync(docs);
      const srcFile = join(src, 'implementation.ts');
      const testFile = join(tests, 'guard.test.ts');
      const docFile = join(docs, 'guard.md');
      writeFileSync(srcFile, 'createFullWorkflowEngine');
      writeFileSync(testFile, 'createFullWorkflowEngine');
      writeFileSync(docFile, 'createFullWorkflowEngine');
      assert.deepEqual(
        inspectBook02MvpGuard({
          inspectionPaths: [src],
          forbiddenIndicators: ['createFullWorkflowEngine'],
          excludedPaths: ['ignored/']
        }).violationPresent,
        true
      );

      assert.deepEqual(
        inspectBook02MvpGuard({
          inspectionPaths: [src],
          forbiddenIndicators: [],
          forbiddenPathPatterns: [],
          structuredChecks: [`path-exists:${srcFile}`],
          excludedPaths: ['ignored/']
        }).violationPresent,
        true
      );
      assert.deepEqual(
        inspectBook02MvpGuard({
          inspectionPaths: [src],
          forbiddenIndicators: [],
          forbiddenPathPatterns: [],
          structuredChecks: [],
          excludedPaths: ['ignored/']
        }).inspectionStatus,
        'incomplete'
      );

      assert.deepEqual(
        inspectBook02MvpGuard({
          inspectionPaths: [src, tests, docs],
          forbiddenIndicators: ['createFullWorkflowEngine'],
          excludedPaths: [src, tests, docs]
        }).violationPresent,
        false
      );
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it('preserves depth distinctions and scope guards', () => {
    for (const [predicate, code] of [
      [
        (r: Record<string, unknown>) => r.layer === 'service',
        'book02.depth.service_contract_index_only'
      ],
      [
        (r: Record<string, unknown>) => r.layer === 'api',
        'book02.depth.api_skeleton_only'
      ],
      [
        (r: Record<string, unknown>) => r.layer === 'workflow',
        'book02.depth.workflow_skeleton_only'
      ],
      [
        (r: Record<string, unknown>) => r.layer === 'agent',
        'book02.depth.generic_agent_boundary'
      ],
      [
        (r: Record<string, unknown>) => r.layer === 'test',
        'book02.depth.test_contract_skeleton_only'
      ]
    ] as const) {
      const baseline = cloneRecord();
      const req = requirementsOf(baseline).find(predicate);
      if (!req) throw new Error('Expected mutated requirement.');
      req.currentDisposition = 'meets_required_depth';
      assert.ok(codes(validateBook02MvpGapBaseline(baseline)).includes(code));
    }
    const event = cloneRecord();
    const er = requirementsOf(event).find(
      (r) => r.currentDisposition === 'semantic_overlap_only'
    );
    if (!er) throw new Error('Expected semantic overlap event.');
    er.currentDisposition = 'meets_required_depth';
    assert.ok(
      codes(validateBook02MvpGapBaseline(event)).includes(
        'book02.depth.generic_event_overlap'
      )
    );
    for (const [category, disposition, code] of [
      [
        'stub_now',
        'meets_required_depth',
        'book02.scope.stub_production_ready'
      ],
      [
        'document_only',
        'meets_required_depth',
        'book02.scope.document_only_runtime_complete'
      ],
      ['never_in_mvp', 'violation_present', 'book02.scope.never_violation']
    ] as const) {
      const baseline = cloneRecord();
      const req = requirementsOf(baseline).find((r) => r.category === category);
      if (!req) throw new Error('Expected mutated requirement.');
      req.currentDisposition = disposition;
      assert.ok(codes(validateBook02MvpGapBaseline(baseline)).includes(code));
    }
  });
  it('derives acceptance and summary from evidence', () => {
    const criteria = deriveBook02MvpAcceptanceCriteria(
      BOOK_02_MVP_GAP_BASELINE.requirements
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.every(
        (criterion) => criterion.evidenceRequirementIds.length > 0
      ),
      true
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
        (criterion) =>
          criterion.id ===
          'must-build-domains-implemented-or-scaffolded-with-tests'
      )?.satisfied,
      false
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
        (criterion) =>
          criterion.id === 'must-build-objects-have-public-reference-ids'
      )?.satisfied,
      false
    );

    assert.equal(
      Object.keys(ACCEPTANCE_CRITERION_EVALUATORS).length,
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.length
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria
        .find(
          (criterion) =>
            criterion.id ===
            'must-build-domains-implemented-or-scaffolded-with-tests'
        )
        ?.evidenceRequirementIds.includes('must-test-common-contract-tests'),
      false
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria
        .find(
          (criterion) =>
            criterion.id === 'event-trace-exists-and-is-not-command'
        )
        ?.evidenceFiles.some((file) => file.includes('core-event')),
      true
    );

    assert.deepEqual(criteria, BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria);
    assert.deepEqual(
      deriveBook02MvpGapSummary(
        BOOK_02_MVP_GAP_BASELINE.requirements,
        criteria
      ),
      BOOK_02_MVP_GAP_BASELINE.summary
    );
    const baseline = cloneRecord();
    const acceptance = baseline.summary as Record<string, unknown>;
    acceptance.acceptance = {
      ...BOOK_02_MVP_GAP_BASELINE.summary.acceptance,
      book02MvpComplete: true
    };
    assert.ok(
      codes(validateBook02MvpGapBaseline(baseline)).includes(
        'book02.acceptance.static_or_inconsistent_completion'
      )
    );

    const incompleteGuard = cloneRecord();
    const guardRequirement = requirementsOf(incompleteGuard).find(
      (r) => r.id === 'never-production-data-fixtures'
    );
    if (!guardRequirement) throw new Error('Expected Never guard requirement.');
    guardRequirement.inspectionStatus = 'incomplete';
    guardRequirement.currentDisposition = 'not_required';
    const guardCriteria = incompleteGuard.acceptanceCriteria as Record<
      string,
      unknown
    >[];
    const neverCriterion = guardCriteria.find(
      (criterion) => criterion.id === 'never-in-mvp-items-are-not-implemented'
    );
    if (!neverCriterion)
      throw new Error('Expected Never acceptance criterion.');
    neverCriterion.satisfied = true;
    assert.ok(
      codes(validateBook02MvpGapBaseline(incompleteGuard)).includes(
        'book02.guard.disposition_inconsistent'
      )
    );
    assert.ok(
      codes(validateBook02MvpGapBaseline(incompleteGuard)).includes(
        'book02.acceptance.guard_inspection_incomplete'
      )
    );

    const criterionDrift = cloneRecord();
    const criteriaRecords = criterionDrift.acceptanceCriteria as Record<
      string,
      unknown
    >[];
    criteriaRecords[0] = { ...criteriaRecords[0], name: 'Changed' };
    assert.ok(
      codes(validateBook02MvpGapBaseline(criterionDrift)).includes(
        'book02.acceptance.inconsistent_criterion'
      )
    );
  });
});
