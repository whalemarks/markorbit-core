import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import {
  ACCEPTANCE_CRITERION_EVALUATORS,
  BOOK_02_MVP_GAP_BASELINE,
  BOOK_02_MVP_TEST_FAMILY_EVIDENCE,
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
  CORE_CONTRACT_INDEX,
  MVP_ACCEPTANCE_CRITERION_IDS,
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

const objectFixtureRecords = (): Record<string, unknown>[] =>
  JSON.parse(
    readFileSync(
      'fixtures/objects/core-mvp-object-public-reference-foundation.fixture.json',
      'utf8'
    )
  ) as Record<string, unknown>[];
const corruptedObjectFixtureBaseline = (
  mutate: (record: Record<string, unknown>) => Record<string, unknown>
): Record<string, unknown> => {
  const baseline = cloneRecord();
  const fixtures = objectFixtureRecords();
  const customerIndex = fixtures.findIndex(
    (record) => record.domainId === 'customer'
  );
  if (customerIndex === -1) throw new Error('Expected customer fixture.');
  fixtures[customerIndex] = mutate(fixtures[customerIndex]);
  return { ...baseline, __objectFixtureRecords: fixtures };
};
const validateWithObjectFixtures = (baseline: Record<string, unknown>) =>
  validateBook02MvpGapBaseline(baseline, {
    objectFixtureRecords: baseline.__objectFixtureRecords as
      Record<string, unknown>[] | undefined
  });

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
      'src/contracts/service/core-service-contract-skeletons.ts',
      'src/services/identity/core-identity-service.ts'
    ]);
    assert.deepEqual(workflow?.implementationFiles, [
      'src/workflows/core-customer-intake-workflow.ts'
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

  it('requires actual Object fixture validation before Object depth is accepted', () => {
    for (const mutate of [
      (record: Record<string, unknown>) => ({
        ...record,
        metadata: { databaseId: 'db-1' }
      }),
      (record: Record<string, unknown>) => ({
        ...record,
        auditMetadata: { createdAt: '2026-99-99T00:00:00.000Z' }
      }),
      (record: Record<string, unknown>) => ({
        ...record,
        visibility: { permissionScopeReferenceId: 'missing' }
      }),
      (record: Record<string, unknown>) => ({
        ...record,
        version: {
          version: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          databaseId: 'db-1'
        }
      })
    ] as const) {
      const baseline = corruptedObjectFixtureBaseline(mutate);
      const validationCodes = codes(validateWithObjectFixtures(baseline));
      assert.ok(
        validationCodes.includes('book02.object.fixture_validation_failed')
      );
      assert.ok(validationCodes.includes('book02.object.depth_inconsistent'));
    }
  });

  it('reports missing Object fixture context and inconsistent fixture counts', () => {
    const fixtures = objectFixtureRecords();
    const customerIndex = fixtures.findIndex(
      (record) => record.domainId === 'customer'
    );
    if (customerIndex === -1) throw new Error('Expected customer fixture.');
    const missingContext = cloneRecord();
    fixtures[customerIndex] = {
      ...fixtures[customerIndex],
      publicReferenceId: 'customer:ref:not-in-fixture-records'
    };
    const missingContextCodes = codes(
      validateBook02MvpGapBaseline(missingContext, {
        objectFixtureRecords: fixtures
      })
    );
    assert.ok(
      missingContextCodes.includes('book02.object.fixture_context_missing')
    );
    assert.ok(
      missingContextCodes.includes('book02.object.reference_evidence_missing')
    );

    const duplicateFixtures = objectFixtureRecords();
    duplicateFixtures.push({ ...duplicateFixtures[customerIndex] });
    const duplicateCodes = codes(
      validateBook02MvpGapBaseline(cloneRecord(), {
        objectFixtureRecords: duplicateFixtures
      })
    );
    assert.ok(duplicateCodes.includes('book02.object.fixture_duplicate'));
    assert.ok(
      duplicateCodes.includes('book02.object.fixture_count_inconsistent')
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
      const exportFile = join(src, 'runtime.ts');
      writeFileSync(exportFile, 'export function createFullPolicyEngine() {}');
      assert.deepEqual(
        inspectBook02MvpGuard({
          inspectionPaths: [src],
          forbiddenIndicators: [],
          forbiddenPathPatterns: [],
          structuredChecks: ['runtime-export:createFullPolicyEngine'],
          excludedPaths: ['ignored/']
        }).violationPresent,
        true
      );
      assert.deepEqual(
        inspectBook02MvpGuard({
          inspectionPaths: [src],
          forbiddenIndicators: [],
          forbiddenPathPatterns: [],
          structuredChecks: ['runtime-export:notPresentExport'],
          excludedPaths: ['ignored/']
        }).violationPresent,
        false
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
  it('maps exact Test Family evidence to real contracts, behavior IDs, and executable tests', () => {
    assert.deepEqual(Object.keys(BOOK_02_MVP_TEST_FAMILY_EVIDENCE), [
      'common-contract-tests',
      'api-contract-tests',
      'workflow-contract-tests',
      'agent-boundary-tests',
      'permission-policy-tests',
      'idempotency-event-tests',
      'error-versioning-tests'
    ]);
    const contractIds = new Set(
      CORE_CONTRACT_INDEX.map((entry) => String(entry.id))
    );
    const behaviorIds = new Set(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map(
        (entry) => entry.behaviorId
      )
    );
    for (const evidence of Object.values(BOOK_02_MVP_TEST_FAMILY_EVIDENCE)) {
      assert.equal(contractIds.has(evidence.contractId), true);
      assert.equal(evidence.testFiles.length > 0, true);
      assert.equal(
        evidence.behaviorIds.every((behaviorId) => behaviorIds.has(behaviorId)),
        true
      );
    }
    assert.deepEqual(
      BOOK_02_MVP_GAP_BASELINE.requirements
        .filter((requirement) => requirement.layer === 'test')
        .map((requirement) => [requirement.id, requirement.currentDisposition]),
      [
        ['must-test-common-contract-tests', 'meets_required_depth'],
        ['must-test-api-contract-tests', 'partial_evidence'],
        ['must-test-workflow-contract-tests', 'partial_evidence'],
        ['must-test-agent-boundary-tests', 'partial_evidence'],
        ['must-test-permission-policy-tests', 'meets_required_depth'],
        ['must-test-idempotency-event-tests', 'meets_required_depth'],
        ['must-test-error-versioning-tests', 'meets_required_depth']
      ]
    );
  });
  it('keeps Domain disposition separate from scaffold-with-tests acceptance', () => {
    const domainCriterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (criterion) =>
        criterion.id ===
        'must-build-domains-implemented-or-scaffolded-with-tests'
    );
    if (!domainCriterion) throw new Error('Expected Domain criterion.');
    assert.equal(domainCriterion.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.requirements
        .filter(
          (requirement) =>
            requirement.layer === 'domain' &&
            requirement.category === 'must_build_now'
        )
        .every(
          (requirement) =>
            requirement.currentDisposition === 'validated_skeleton_only'
        ),
      true
    );
    const withoutDomainTest = cloneRecord();
    const criterionRecords = withoutDomainTest.acceptanceCriteria as Record<
      string,
      unknown
    >[];
    const mutatedDomainCriterion = criterionRecords.find(
      (criterion) =>
        criterion.id ===
        'must-build-domains-implemented-or-scaffolded-with-tests'
    );
    if (!mutatedDomainCriterion) throw new Error('Expected Domain criterion.');
    mutatedDomainCriterion.satisfied = false;
    mutatedDomainCriterion.evidenceFiles = [];
    mutatedDomainCriterion.unresolvedReasons = [
      'Domain executable skeleton test removed.'
    ];
    assert.ok(
      codes(validateBook02MvpGapBaseline(withoutDomainTest)).includes(
        'book02.acceptance.inconsistent_criterion'
      )
    );
    const missingDomain = cloneRecord();
    const domainRequirement = requirementsOf(missingDomain).find(
      (requirement) => requirement.id === 'must-domain-identity'
    );
    if (!domainRequirement) throw new Error('Expected Domain requirement.');
    domainRequirement.currentDisposition = 'missing';
    const missingCriteria = deriveBook02MvpAcceptanceCriteria(
      missingDomain.requirements as typeof BOOK_02_MVP_GAP_BASELINE.requirements
    );
    assert.equal(
      missingCriteria.find(
        (criterion) =>
          criterion.id ===
          'must-build-domains-implemented-or-scaffolded-with-tests'
      )?.satisfied,
      false
    );
  });
  it('preserves depth distinctions and scope guards', () => {
    for (const [predicate, code] of [
      [
        (r: Record<string, unknown>) => r.id === 'must-service-policy-service',
        'book02.depth.service_contract_index_only'
      ],
      [
        (r: Record<string, unknown>) =>
          r.layer === 'workflow' &&
          r.currentDisposition === 'boundary_scaffold_only',
        'book02.depth.workflow_skeleton_only'
      ],
      [
        (r: Record<string, unknown>) => r.layer === 'agent',
        'book02.depth.generic_agent_boundary'
      ]
    ] as const) {
      const baseline = cloneRecord();
      const req = requirementsOf(baseline).find(predicate);
      if (!req) throw new Error('Expected mutated requirement.');
      req.currentDisposition = 'meets_required_depth';
      if (req.layer === 'service') {
        req.implementationFiles = [
          'src/contracts/service/core-service-contract-skeletons.ts'
        ];
      }
      assert.ok(codes(validateBook02MvpGapBaseline(baseline)).includes(code));
    }
    const testDepth = cloneRecord();
    const testReq = requirementsOf(testDepth).find(
      (r) => r.id === 'must-test-api-contract-tests'
    );
    if (!testReq) throw new Error('Expected Test Family requirement.');
    testReq.currentDisposition = 'meets_required_depth';
    testReq.testFiles = [];
    assert.ok(
      codes(validateBook02MvpGapBaseline(testDepth)).includes(
        'book02.depth.test_contract_skeleton_only'
      )
    );
    const event = cloneRecord();
    const er = requirementsOf(event).find((r) => r.layer === 'event');
    if (!er) throw new Error('Expected MVP Event requirement.');
    er.currentDisposition = 'meets_required_depth';
    er.currentDepth = 'level_0';
    er.implementationFiles = [
      'src/contracts/event/core-event-catalog-skeletons.ts'
    ];
    er.testFiles = [];
    er.fixtureFiles = [];
    er.gapReasons = [
      'Generic catalog semantics overlap, but no explicit validated canonical alias mapping exists.'
    ];
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
      true
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
        (criterion) =>
          criterion.id === 'must-build-objects-have-public-reference-ids'
      )?.satisfied,
      true
    );
    assert.deepEqual(Object.keys(ACCEPTANCE_CRITERION_EVALUATORS), [
      ...MVP_ACCEPTANCE_CRITERION_IDS
    ]);
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
    const satisfiedIds = criteria
      .filter((criterion) => criterion.satisfied)
      .map((criterion) => criterion.id);
    assert.deepEqual(satisfiedIds, [
      'must-build-domains-implemented-or-scaffolded-with-tests',
      'must-build-objects-have-public-reference-ids',
      'must-build-services-own-behavior',
      'must-build-api-validators-exist',
      'customer-intake-workflow-supports-preview-apply',
      'trademark-application-workflow-supports-preview-apply',
      'communication-review-workflow-supports-preview-apply',
      'permission-and-policy-fail-closed',
      'ai-forbidden-actions-are-blocked',
      'human-review-gates-protected-actions',
      'idempotency-replay-and-conflict-are-tested',
      'event-trace-exists-and-is-not-command',
      'api-layer-does-not-emit-events-directly',
      'errors-are-safe',
      'unsupported-versions-fail-closed',
      'deferred-items-do-not-block-mvp',
      'never-in-mvp-items-are-not-implemented'
    ]);
    assert.deepEqual(
      criteria.find(
        (criterion) => criterion.id === 'permission-and-policy-fail-closed'
      )?.behaviorIds,
      ['permission', 'policy']
    );
    assert.deepEqual(
      criteria.find(
        (criterion) => criterion.id === 'ai-forbidden-actions-are-blocked'
      )?.behaviorIds,
      ['ai-context', 'agent-runtime']
    );
    assert.equal(
      criteria.find(
        (criterion) =>
          criterion.id === 'api-layer-does-not-emit-events-directly'
      )?.satisfied,
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
    const unknownStructuredCheck = cloneRecord();
    const unknownGuard = requirementsOf(unknownStructuredCheck).find(
      (r) => r.id === 'document-only-full-policy-engine'
    );
    if (!unknownGuard) throw new Error('Expected Document Only guard.');
    unknownGuard.structuredChecks = [
      'unsupported-prefix:createFullPolicyEngine'
    ];
    assert.ok(
      codes(validateBook02MvpGapBaseline(unknownStructuredCheck)).includes(
        'book02.guard.structured_check_unknown'
      )
    );
    const fakeBehavior = cloneRecord();
    const fakeBehaviorCriteria = fakeBehavior.acceptanceCriteria as Record<
      string,
      unknown
    >[];
    const permissionCriterion = fakeBehaviorCriteria.find(
      (criterion) => criterion.id === 'permission-and-policy-fail-closed'
    );
    if (!permissionCriterion)
      throw new Error('Expected Permission/Policy acceptance criterion.');
    permissionCriterion.behaviorIds = ['permission', 'fabricated-behavior'];
    assert.ok(
      codes(validateBook02MvpGapBaseline(fakeBehavior)).includes(
        'book02.acceptance.behavior_evidence_missing'
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
