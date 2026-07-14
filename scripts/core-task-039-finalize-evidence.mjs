import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, value) =>
  writeFileSync(path, value.endsWith('\n') ? value : `${value}\n`);
const replaceRequired = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
};

const evidencePath =
  'src/service-coverage/core-jurisdiction-service-evidence-fixture.ts';
let evidence = read(evidencePath);

evidence = replaceRequired(
  evidence,
  `  const publicReference = fixture.publicReferenceRecord;\n  const objectRecord = fixture.objectRecord;\n  const createRequest = fixture.createRequest;`,
  `  const publicReference = fixture.publicReferenceRecord;\n  const duplicateCodePublicReference = fixture.duplicateCodePublicReferenceRecord;\n  const objectRecord = fixture.objectRecord;\n  const duplicateCodeObjectRecord = fixture.duplicateCodeObjectRecord;\n  const createRequest = fixture.createRequest;\n  const duplicateCodeCreateRequest = fixture.duplicateCodeCreateRequest;`,
  'duplicate-code fixture declarations'
);
evidence = replaceRequired(
  evidence,
  `    typeof fixture.jurisdictionReferenceId !== 'string' ||\n    typeof fixture.organizationScopeReferenceId !== 'string' ||`,
  `    typeof fixture.jurisdictionReferenceId !== 'string' ||\n    typeof fixture.duplicateCodeJurisdictionReferenceId !== 'string' ||\n    typeof fixture.organizationScopeReferenceId !== 'string' ||`,
  'duplicate-code reference id shape'
);
evidence = replaceRequired(
  evidence,
  `    !isRecord(publicReference) ||\n    !isRecord(objectRecord) ||\n    !isRecord(createRequest) ||`,
  `    !isRecord(publicReference) ||\n    !isRecord(duplicateCodePublicReference) ||\n    !isRecord(objectRecord) ||\n    !isRecord(duplicateCodeObjectRecord) ||\n    !isRecord(createRequest) ||\n    !isRecord(duplicateCodeCreateRequest) ||`,
  'duplicate-code fixture object shape'
);
evidence = replaceRequired(
  evidence,
  `  const jurisdictionReferenceRecord = referenceRecord(publicReference);\n  const traces = new CoreEventTraceRegistry();`,
  `  const jurisdictionReferenceRecord = referenceRecord(publicReference);\n  const duplicateCodeJurisdictionReferenceRecord = referenceRecord(\n    duplicateCodePublicReference\n  );\n  const traces = new CoreEventTraceRegistry();`,
  'duplicate-code reference record'
);
evidence = replaceRequired(
  evidence,
  `      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,\n      jurisdictionReferenceRecord\n    ]),`,
  `      ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,\n      jurisdictionReferenceRecord,\n      duplicateCodeJurisdictionReferenceRecord\n    ]),`,
  'duplicate-code reference registry'
);
evidence = replaceRequired(
  evidence,
  `    const get = service.getJurisdiction({`,
  `    const duplicateCode = service.createJurisdiction({\n      objectRecord:\n        duplicateCodeObjectRecord as unknown as CoreMvpObjectBaseRecord,\n      publicReferenceRecord: duplicateCodeJurisdictionReferenceRecord,\n      jurisdictionCode: String(duplicateCodeCreateRequest.jurisdictionCode),\n      jurisdictionType: duplicateCodeCreateRequest.jurisdictionType,\n      jurisdictionStatus: duplicateCodeCreateRequest.jurisdictionStatus,\n      nameReference: String(duplicateCodeCreateRequest.nameReference),\n      sourceReference: String(duplicateCodeCreateRequest.sourceReference),\n      idempotencyKey: String(duplicateCodeCreateRequest.idempotencyKey),\n      governance: governance(\n        'jurisdiction.create',\n        'jurisdiction:create',\n        'jurisdiction.write',\n        fixture.duplicateCodeJurisdictionReferenceId,\n        fixture.organizationScopeReferenceId\n      )\n    });\n    if (\n      duplicateCode.ok ||\n      duplicateCode.error.code !== expected.duplicateCodeConflictCode ||\n      store.list().length !== expected.recordCountAfterCreate ||\n      traces.visibleTo(['Internal']).length !==\n        expected.eventTraceCountAfterReplay\n    ) {\n      issues.push(\n        issue(\n          'core.jurisdiction_service.evidence_duplicate_code_failed',\n          'Jurisdiction Service duplicate code scenario failed.',\n          'duplicateCodeCreateRequest'\n        )\n      );\n    }\n\n    const get = service.getJurisdiction({`,
  'duplicate-code executable scenario'
);
write(evidencePath, evidence);

const unitPath = 'tests/unit/core-jurisdiction-service-core-lifecycle.test.ts';
let unit = read(unitPath);
unit = replaceRequired(
  unit,
  `const jurisdictionReference =\n  fixture.publicReferenceRecord as CoreReferenceRecord;\nconst objectRecord = fixture.objectRecord as unknown as CoreMvpObjectBaseRecord;\nconst jurisdictionReferenceId = String(fixture.jurisdictionReferenceId);`,
  `const jurisdictionReference =\n  fixture.publicReferenceRecord as CoreReferenceRecord;\nconst duplicateCodeJurisdictionReference =\n  fixture.duplicateCodePublicReferenceRecord as CoreReferenceRecord;\nconst objectRecord = fixture.objectRecord as unknown as CoreMvpObjectBaseRecord;\nconst duplicateCodeObjectRecord =\n  fixture.duplicateCodeObjectRecord as unknown as CoreMvpObjectBaseRecord;\nconst jurisdictionReferenceId = String(fixture.jurisdictionReferenceId);\nconst duplicateCodeJurisdictionReferenceId = String(\n  fixture.duplicateCodeJurisdictionReferenceId\n);`,
  'unit duplicate-code constants'
);
unit = replaceRequired(
  unit,
  `  it('returns safe list and reference-validation outputs', () => {`,
  `  it('rejects the same normalized code for a different Jurisdiction reference', () => {\n    const { service, store, traces } = setup([\n      duplicateCodeJurisdictionReference\n    ]);\n    assert.equal(createJurisdiction(service).ok, true);\n    const duplicateCodeRequest =\n      fixture.duplicateCodeCreateRequest as Record<string, unknown>;\n    const duplicate = service.createJurisdiction({\n      objectRecord: duplicateCodeObjectRecord,\n      publicReferenceRecord: duplicateCodeJurisdictionReference,\n      jurisdictionCode: String(duplicateCodeRequest.jurisdictionCode),\n      jurisdictionType: duplicateCodeRequest.jurisdictionType,\n      jurisdictionStatus: duplicateCodeRequest.jurisdictionStatus,\n      nameReference: String(duplicateCodeRequest.nameReference),\n      sourceReference: String(duplicateCodeRequest.sourceReference),\n      idempotencyKey: String(duplicateCodeRequest.idempotencyKey),\n      governance: governance(\n        'jurisdiction.create',\n        'jurisdiction:create',\n        'jurisdiction.write',\n        duplicateCodeJurisdictionReferenceId\n      )\n    });\n    assert.equal(duplicate.ok, false);\n    if (!duplicate.ok) {\n      assert.deepEqual(\n        [duplicate.error.code, duplicate.error.category],\n        ['JurisdictionCodeAlreadyExists', 'Conflict']\n      );\n    }\n    assert.equal(store.list().length, 1);\n    assert.equal(traces.visibleTo(['Internal']).length, 1);\n  });\n\n  it('returns safe list and reference-validation outputs', () => {`,
  'unit duplicate-code test'
);
write(unitPath, unit);

const packagePath = 'package.json';
const packageJson = JSON.parse(read(packagePath));
const governedPaths = [
  'docs/architecture/core-jurisdiction-service-lifecycle-resolution-boundary.md',
  'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',
  'src/services/jurisdiction/core-jurisdiction-service.ts',
  'src/services/jurisdiction/index.ts',
  'src/service-coverage/core-jurisdiction-service-evidence-fixture.ts',
  'src/validation/core-jurisdiction-service-fixture-validation.ts',
  'tests/fixtures/core-jurisdiction-service-core-lifecycle-fixture.test.ts',
  'tests/unit/core-jurisdiction-service-core-lifecycle.test.ts',
  'tests/unit/core-task-039-book-02-service-evidence.test.ts',
  'tests/unit/core-task-039-service-contract-metadata.test.ts',
  'src/contracts/service/core-service-contract-skeletons.ts',
  'src/contracts/service/core-service-contract-validation.ts',
  'fixtures/contracts/core-service-contract-skeletons.fixture.json',
  'fixtures/contracts/core-contract-index.fixture.json',
  'fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json',
  'fixtures/contract-coverage/core-contract-gap-inventory.fixture.json',
  'src/service-coverage/core-service-behavior-evidence.ts',
  'src/service-coverage/core-service-behavior-validation.ts',
  'src/validation/core-fixture-manifest.ts',
  'scripts/validate-core-fixtures.mjs'
];
for (const scriptName of ['format', 'format:check']) {
  for (const governedPath of governedPaths) {
    if (!packageJson.scripts[scriptName].includes(governedPath)) {
      packageJson.scripts[scriptName] += ` ${governedPath}`;
    }
  }
}
write(packagePath, JSON.stringify(packageJson, null, 2));

console.log('CORE-TASK-039 final evidence repair complete');
