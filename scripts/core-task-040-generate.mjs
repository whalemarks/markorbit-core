import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, content) => writeFileSync(path, content);
const replaceOnce = (path, from, to) => {
  const content = read(path);
  if (!content.includes(from)) {
    if (content.includes(to)) return;
    throw new Error(`Missing replacement target in ${path}: ${from.slice(0, 100)}`);
  }
  write(path, content.replace(from, to));
};
const appendOnce = (path, marker, addition) => {
  const content = read(path);
  if (content.includes(addition.trim())) return;
  if (!content.includes(marker)) throw new Error(`Missing append marker in ${path}`);
  write(path, content.replace(marker, `${marker}${addition}`));
};

replaceOnce(
  'src/behaviors/core-safe-error.ts',
  "  'JurisdictionObjectMismatch',\n  'AuditContextMissing',",
  "  'JurisdictionObjectMismatch',\n  'ClassificationAlreadyExists',\n  'ClassificationNotFound',\n  'InvalidClassificationScheme',\n  'InvalidClassificationStatus',\n  'InvalidClassificationReviewStatus',\n  'InvalidClassificationTransition',\n  'InvalidClassificationReference',\n  'InvalidClassificationTrademarkReference',\n  'InvalidClassificationBrandReference',\n  'InvalidClassificationJurisdictionReference',\n  'ClassReferenceRequired',\n  'GoodsServicesItemsRequired',\n  'ClassNumberOnlyNotAllowed',\n  'InvalidClassificationItemType',\n  'InvalidClassificationItemReference',\n  'ClassificationSourceReferenceRequired',\n  'ClassificationReasonReferenceRequired',\n  'ClassificationObjectMismatch',\n  'AuditContextMissing',"
);

appendOnce(
  'src/services/index.ts',
  "export * from './jurisdiction/index.ts';",
  "\nexport * from './classification/index.ts';"
);
appendOnce(
  'src/service-coverage/index.ts',
  "export * from './core-jurisdiction-service-evidence-fixture.ts';",
  "\nexport * from './core-classification-service-evidence-fixture.ts';"
);
appendOnce(
  'src/validation/index.ts',
  "export * from './core-jurisdiction-service-fixture-validation.ts';",
  "\nexport * from './core-classification-service-fixture-validation.ts';"
);

replaceOnce(
  'src/contracts/service/core-service-contract-skeletons.ts',
  "    'CORE-TASK-021' | 'CORE-TASK-038' | 'CORE-TASK-039' = 'CORE-TASK-021'",
  "    | 'CORE-TASK-021'\n    | 'CORE-TASK-038'\n    | 'CORE-TASK-039'\n    | 'CORE-TASK-040' = 'CORE-TASK-021'"
);
replaceOnce(
  'src/contracts/service/core-service-contract-skeletons.ts',
  "            : {})",
  "            : serviceType === 'classification-service'\n              ? {\n                  behaviorImplementationTask: 'CORE-TASK-040',\n                  behaviorDepth: 'level_2_3',\n                  implementedOperations: [\n                    'createClassification',\n                    'getClassification',\n                    'listClassifications',\n                    'validateClassification',\n                    'validateClassificationReference',\n                    'changeClassificationStatus'\n                  ]\n                }\n              : {})"
);
replaceOnce(
  'src/contracts/service/core-service-contract-skeletons.ts',
  "  serviceSkeleton(\n    'classification-reference-service',\n    'classification',\n    'Classification Reference Service Contract Skeleton',\n    'Skeleton contract boundary for classification reference service responsibilities.',\n    'Establishes a service contract placeholder for classification references without implementing classification behavior.',\n    ['Classification reference service contract boundary.'],\n    ['classification domain references'],\n    ['classification reference outputs']\n  ),",
  "  canonicalServiceSkeleton(\n    'classification-service',\n    'classification',\n    'Core Classification Service Contract Skeleton',\n    'classification-service.md',\n    'Defines the Classification service ownership boundary for governed goods/services scope without implementing filing, official item synchronization, fee calculation, AI recommendation, or legal conclusions.',\n    [\n      'Classification service ownership, scope validation, lifecycle, review-gating, and reference boundary.'\n    ],\n    [\n      'classification, trademark, brand, jurisdiction, knowledge, document, evidence, matter, order, policy, and agent references'\n    ],\n    ['classification boundary references and governed validation results'],\n    [\n      'Item mutation operations, AI classification engine, official wording certification, fee engine, filing execution, or automatic approval.'\n    ],\n    'CORE-TASK-040'\n  ),"
);

replaceOnce(
  'src/contracts/service/core-service-contract-validation.ts',
  "  'jurisdiction-service': {\n    task: 'CORE-TASK-039',\n    operations: [\n      'createJurisdiction',\n      'getJurisdiction',\n      'listJurisdictions',\n      'validateJurisdictionReference',\n      'resolveJurisdictionByCode',\n      'changeJurisdictionStatus'\n    ]\n  }",
  "  'jurisdiction-service': {\n    task: 'CORE-TASK-039',\n    operations: [\n      'createJurisdiction',\n      'getJurisdiction',\n      'listJurisdictions',\n      'validateJurisdictionReference',\n      'resolveJurisdictionByCode',\n      'changeJurisdictionStatus'\n    ]\n  },\n  'classification-service': {\n    task: 'CORE-TASK-040',\n    operations: [\n      'createClassification',\n      'getClassification',\n      'listClassifications',\n      'validateClassification',\n      'validateClassificationReference',\n      'changeClassificationStatus'\n    ]\n  }"
);
replaceOnce(
  'src/contracts/service/core-service-contract-validation.ts',
  "  5: {\n    id: 'core-service-jurisdiction-service-contract',\n    serviceType: 'jurisdiction-service',\n    domainId: 'jurisdiction',\n    name: 'Core Jurisdiction Service Contract Skeleton',\n    sourceFile: 'jurisdiction-service.md',\n    task: 'CORE-TASK-039'\n  }",
  "  5: {\n    id: 'core-service-jurisdiction-service-contract',\n    serviceType: 'jurisdiction-service',\n    domainId: 'jurisdiction',\n    name: 'Core Jurisdiction Service Contract Skeleton',\n    sourceFile: 'jurisdiction-service.md',\n    task: 'CORE-TASK-039'\n  },\n  6: {\n    id: 'core-service-classification-service-contract',\n    serviceType: 'classification-service',\n    domainId: 'classification',\n    name: 'Core Classification Service Contract Skeleton',\n    sourceFile: 'classification-service.md',\n    task: 'CORE-TASK-040'\n  }"
);

replaceOnce(
  'src/service-coverage/core-service-behavior-evidence.ts',
  "} from '../services/jurisdiction/index.ts';",
  "} from '../services/jurisdiction/index.ts';\nimport {\n  CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,\n  CORE_CLASSIFICATION_MINIMUM_CAPABILITIES\n} from '../services/classification/index.ts';"
);
{
  const path = 'src/service-coverage/core-service-behavior-evidence.ts';
  let content = read(path);
  if (!content.includes("requirementId: 'must-service-classification-service'")) {
    const index = content.lastIndexOf('\n] as const satisfies');
    if (index < 0) throw new Error('Missing Service evidence closing marker');
    const entry = `,\n  {\n    requirementId: 'must-service-classification-service',\n    serviceType: 'classification-service',\n    domainId: 'classification',\n    contractId: 'core-service-classification-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/classification-service.md',\n    currentDepth: 'level_2_3',\n    operations: CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,\n    provenMinimumCapabilities: CORE_CLASSIFICATION_MINIMUM_CAPABILITIES,\n    unresolvedServiceOperations: [\n      'updateClassification',\n      'addClassificationItem',\n      'updateClassificationItem',\n      'removeClassificationItem',\n      'linkClassificationTrademark',\n      'linkClassificationJurisdiction',\n      'recommendClassification',\n      'reviewClassification',\n      'archiveClassification'\n    ],\n    implementationFiles: [\n      'src/services/classification/core-classification-service.ts'\n    ],\n    testFiles: [\n      'tests/unit/core-classification-service-core-scope-validation.test.ts'\n    ],\n    fixtureFiles: [\n      'fixtures/services/core-classification-service-core-scope-validation.fixture.json'\n    ]\n  }`;
    content = `${content.slice(0, index)}${entry}${content.slice(index)}`;
    write(path, content);
  }
}

replaceOnce(
  'src/service-coverage/core-service-behavior-validation.ts',
  "} from '../services/jurisdiction/index.ts';",
  "} from '../services/jurisdiction/index.ts';\nimport {\n  CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,\n  CORE_CLASSIFICATION_MINIMUM_CAPABILITIES\n} from '../services/classification/index.ts';"
);
replaceOnce(
  'src/service-coverage/core-service-behavior-validation.ts',
  "import { validateCoreJurisdictionServiceEvidenceFixture } from './core-jurisdiction-service-evidence-fixture.ts';",
  "import { validateCoreJurisdictionServiceEvidenceFixture } from './core-jurisdiction-service-evidence-fixture.ts';\nimport { validateCoreClassificationServiceEvidenceFixture } from './core-classification-service-evidence-fixture.ts';"
);
replaceOnce(
  'src/service-coverage/core-service-behavior-validation.ts',
  "  readonly jurisdictionFixture?: unknown;",
  "  readonly jurisdictionFixture?: unknown;\n  readonly classificationFixture?: unknown;"
);
replaceOnce(
  'src/service-coverage/core-service-behavior-validation.ts',
  "  readonly domainId: 'customer' | 'brand' | 'trademark' | 'jurisdiction';",
  "  readonly domainId:\n    | 'customer'\n    | 'brand'\n    | 'trademark'\n    | 'jurisdiction'\n    | 'classification';"
);
replaceOnce(
  'src/service-coverage/core-service-behavior-validation.ts',
  "    | 'jurisdictionFixture';",
  "    | 'jurisdictionFixture'\n    | 'classificationFixture';"
);
{
  const path = 'src/service-coverage/core-service-behavior-validation.ts';
  let content = read(path);
  if (!content.includes("requirementId: 'must-service-classification-service'")) {
    const marker = '\n] as const satisfies readonly ExpectedServiceEvidence[];';
    const index = content.indexOf(marker);
    if (index < 0) throw new Error('Missing expected evidence closing marker');
    const entry = `,\n  {\n    requirementId: 'must-service-classification-service',\n    serviceType: 'classification-service',\n    domainId: 'classification',\n    contractId: 'core-service-classification-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/classification-service.md',\n    operations: CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,\n    capabilities: CORE_CLASSIFICATION_MINIMUM_CAPABILITIES,\n    unresolved: [\n      'updateClassification',\n      'addClassificationItem',\n      'updateClassificationItem',\n      'removeClassificationItem',\n      'linkClassificationTrademark',\n      'linkClassificationJurisdiction',\n      'recommendClassification',\n      'reviewClassification',\n      'archiveClassification'\n    ],\n    fixtureOverride: 'classificationFixture',\n    fixtureValidator: validateCoreClassificationServiceEvidenceFixture\n  }`;
    content = `${content.slice(0, index)}${entry}${content.slice(index)}`;
    content = content.replace(
      'Service behavior evidence must contain exactly Customer, Brand, Trademark, and Jurisdiction entries in canonical order.',
      'Service behavior evidence must contain exactly Customer, Brand, Trademark, Jurisdiction, and Classification entries in canonical order.'
    );
    write(path, content);
  }
}

replaceOnce(
  'src/validation/core-fixture-manifest.ts',
  "  'core_jurisdiction_service_core_lifecycle'",
  "  'core_jurisdiction_service_core_lifecycle',\n  'core_classification_service_core_scope_validation'"
);
replaceOnce(
  'src/validation/core-fixture-manifest.ts',
  "  {\n    id: 'book-02-mvp-gap-baseline',",
  "  {\n    id: 'core-classification-service-core-scope-validation',\n    type: 'core_classification_service_core_scope_validation',\n    path: 'fixtures/services/core-classification-service-core-scope-validation.fixture.json',\n    required: true\n  },\n  {\n    id: 'book-02-mvp-gap-baseline',"
);
replaceOnce(
  'src/mvp-coverage/book-02-mvp-requirements.ts',
  '  fixtureCount: 31',
  '  fixtureCount: 32'
);

replaceOnce(
  'scripts/validate-core-fixtures.mjs',
  "import { validateCoreJurisdictionServiceCoreLifecycleFixture } from '../src/validation/core-jurisdiction-service-fixture-validation.ts';",
  "import { validateCoreJurisdictionServiceCoreLifecycleFixture } from '../src/validation/core-jurisdiction-service-fixture-validation.ts';\nimport { validateCoreClassificationServiceCoreScopeValidationFixture } from '../src/validation/core-classification-service-fixture-validation.ts';"
);
replaceOnce(
  'scripts/validate-core-fixtures.mjs',
  "  core_jurisdiction_service_core_lifecycle:\n    validateCoreJurisdictionServiceCoreLifecycleFixture",
  "  core_jurisdiction_service_core_lifecycle:\n    validateCoreJurisdictionServiceCoreLifecycleFixture,\n  core_classification_service_core_scope_validation:\n    validateCoreClassificationServiceCoreScopeValidationFixture"
);

replaceOnce(
  'tests/fixtures/book-02-mvp-gap-baseline-fixture.test.ts',
  "  it('locks required fixture count at 31', () => {\n    assert.equal(BOOK_02_EXPECTED_COUNTS.fixtureCount, 31);",
  "  it('locks required fixture count at 32', () => {\n    assert.equal(BOOK_02_EXPECTED_COUNTS.fixtureCount, 32);"
);
replaceOnce(
  'tests/unit/core-fixture-manifest.test.ts',
  "  it('has exactly 31 entries', () => {\n    assert.equal(CORE_FIXTURE_MANIFEST.length, 31);",
  "  it('has exactly 32 entries', () => {\n    assert.equal(CORE_FIXTURE_MANIFEST.length, 32);"
);
replaceOnce(
  'tests/unit/core-fixture-manifest.test.ts',
  "      CORE_FIXTURE_TYPES.includes('core_jurisdiction_service_core_lifecycle'),\n      true\n    );",
  "      CORE_FIXTURE_TYPES.includes('core_jurisdiction_service_core_lifecycle'),\n      true\n    );\n    assert.equal(\n      CORE_FIXTURE_TYPES.includes(\n        'core_classification_service_core_scope_validation'\n      ),\n      true\n    );"
);
replaceOnce(
  'tests/unit/core-fixture-manifest.test.ts',
  "      'core_jurisdiction_service_core_lifecycle'\n    ]);",
  "      'core_jurisdiction_service_core_lifecycle',\n      'core_classification_service_core_scope_validation'\n    ]);"
);

const formatFiles = [
  'docs/architecture/core-classification-service-scope-validation-boundary.md',
  'fixtures/services/core-classification-service-core-scope-validation.fixture.json',
  'src/services/classification/core-classification-service.ts',
  'src/services/classification/index.ts',
  'src/service-coverage/core-classification-service-evidence-fixture.ts',
  'src/validation/core-classification-service-fixture-validation.ts',
  'tests/fixtures/core-classification-service-core-scope-validation-fixture.test.ts',
  'tests/unit/core-classification-service-core-scope-validation.test.ts',
  'tests/unit/core-task-040-book-02-service-evidence.test.ts',
  'tests/unit/core-task-040-service-contract-metadata.test.ts'
].join(' ');
replaceOnce(
  'package.json',
  'src/validation/core-fixture-manifest.ts scripts/validate-core-fixtures.mjs"',
  `src/validation/core-fixture-manifest.ts scripts/validate-core-fixtures.mjs ${formatFiles}"`
);

const note = '\n\nCORE-TASK-040 note: Classification Service core scope and validation behavior is implemented at the governed MVP boundary with create, read, list, structural validation, reference validation, and controlled status transition operations. Customer, Brand, Trademark, Jurisdiction, and Classification are the five Must Build Services with executable owned behavior; the remaining 13 Services remain incomplete. Item mutation, AI recommendation, official wording synchronization, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 37 meets_required_depth, 3 partial_evidence, 52 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-041 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.\n';
for (const path of ['README.md', 'CORE-MANIFEST.md', 'CORE-ROADMAP.md', 'CHANGELOG.md']) {
  const content = read(path);
  if (!content.includes('CORE-TASK-040 note:')) write(path, `${content.trimEnd()}${note}`);
}

write(
  'docs/architecture/core-classification-service-scope-validation-boundary.md',
  `# Core Classification Service scope and validation boundary\n\nClassification Service is the fifth dependency-first Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.\n\n## Authority\n\n- Repository: whalemarks/markorbit-publication\n- Commit: 3349ecb8955021a8714d023348f8b24f941eb98f\n- Primary specifications: Classification Domain, Object, and Service.\n\n## Exact operation scope\n\n- createClassification\n- getClassification\n- listClassifications\n- validateClassification\n- validateClassificationReference\n- changeClassificationStatus\n\nClassification requires a controlled scheme, at least one class reference, and at least one goods/services item linked to a declared class. A class number alone is not a valid Classification.\n\n## Review and AI boundary\n\nDraft scope is structurally valid but remains review-required. ReviewRequired to Approved or Rejected requires completed governed human review. AIRecommended is never treated as ApprovedForFiling. Classification Service does not file applications or certify official wording.\n\n## Safety and governance\n\nThe boundary reuses Object, Reference, Permission, Policy, Human Review, Audit, Idempotency, Pagination, Safe Error, and Event trace foundations. Organization scope is enforced before reads, list pagination, validation, reference validation, and mutation. List, validation, and Event outputs omit item contents, source references, visibility, metadata, and governance internals.\n\n## Evidence\n\nRequired fixture 32 executes create, replay, idempotency conflict, safe reads, structural validation, reference validation, review-required transition, governed approval, approval replay, approval conflict, record counts, Event counts, and payload safety.\n\n## Explicit non-goals\n\nItem add/update/remove operations, metadata update, relationship mutation, AI recommendation, official item synchronization, legal-rule and fee engines, filing execution, API validators, Workflow preview/apply, persistence, Event bus runtime, Book 02 completion, and production readiness remain incomplete.\n`
);

await import('../src/services/classification/core-classification-service.ts');
const { CORE_SERVICE_CONTRACT_SKELETONS } = await import(
  '../src/contracts/service/core-service-contract-skeletons.ts'
);
const { CORE_CONTRACT_INDEX } = await import('../src/contracts/core-contract-index.ts');
const {
  CORE_CONTRACT_COVERAGE_BASELINE,
  CORE_CONTRACT_GAP_INVENTORY
} = await import('../src/contract-coverage/index.ts');
const { BOOK_02_MVP_GAP_BASELINE } = await import(
  '../src/mvp-coverage/book-02-mvp-gap-baseline.ts'
);
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
write(
  'fixtures/contracts/core-service-contract-skeletons.fixture.json',
  json(CORE_SERVICE_CONTRACT_SKELETONS)
);
write('fixtures/contracts/core-contract-index.fixture.json', json(CORE_CONTRACT_INDEX));
write(
  'fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json',
  json(CORE_CONTRACT_COVERAGE_BASELINE)
);
write(
  'fixtures/contract-coverage/core-contract-gap-inventory.fixture.json',
  json(CORE_CONTRACT_GAP_INVENTORY)
);
write(
  'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
  json(BOOK_02_MVP_GAP_BASELINE)
);
