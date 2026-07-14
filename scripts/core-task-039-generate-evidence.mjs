import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, value) => {
  const slash = path.lastIndexOf('/');
  if (slash > 0) mkdirSync(path.slice(0, slash), { recursive: true });
  writeFileSync(path, value.endsWith('\n') ? value : `${value}\n`);
};
const required = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
};
const regexRequired = (text, regex, replacement, label) => {
  if (!regex.test(text)) throw new Error(`Missing regex target: ${label}`);
  return text.replace(regex, replacement);
};
const rename = (value) =>
  value
    .replaceAll('CORE_BRAND', 'CORE_JURISDICTION')
    .replaceAll('CoreBrand', 'CoreJurisdiction')
    .replaceAll('Brand', 'Jurisdiction')
    .replaceAll('brand', 'jurisdiction')
    .replaceAll('037', '039');

const fixture = {
  fixtureType: 'core_jurisdiction_service_core_lifecycle',
  authority: {
    repository: 'whalemarks/markorbit-publication',
    commit: '3349ecb8955021a8714d023348f8b24f941eb98f'
  },
  fixedNow: '2026-07-14T01:00:00.000Z',
  updatedNow: '2026-07-14T01:05:00.000Z',
  jurisdictionReferenceId: 'jurisdiction:ref:core-task-039',
  organizationScopeReferenceId: 'organization:ref:scope-0001',
  publicReferenceRecord: {
    referenceId: 'jurisdiction:ref:core-task-039',
    objectType: 'jurisdiction-record',
    referenceDomain: 'jurisdiction',
    status: 'Active'
  },
  objectRecord: {
    publicReferenceId: 'jurisdiction:ref:core-task-039',
    objectType: 'jurisdiction-record',
    domainId: 'jurisdiction',
    objectContractId: 'core-object-jurisdiction-record-contract',
    status: 'active',
    version: { version: 1, createdAt: '2026-07-14T01:00:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-14T01:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-039'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: 'organization:ref:scope-0001'
    }
  },
  createRequest: {
    jurisdictionCode: 'US',
    jurisdictionType: 'National',
    jurisdictionStatus: 'Active',
    nameReference: 'name:synthetic:jurisdiction-us-039',
    sourceReference: 'source:synthetic:jurisdiction-039',
    idempotencyKey: 'idem:create:core-task-039'
  },
  conflictingCreateRequest: { jurisdictionType: 'Regional' },
  duplicateCreateRequest: { idempotencyKey: 'idem:create:duplicate-jurisdiction-039' },
  statusTransitionRequest: {
    targetStatus: 'Deprecated',
    reasonReference: 'reason:synthetic:deprecate-jurisdiction',
    idempotencyKey: 'idem:status:core-task-039'
  },
  statusConflictRequest: {
    targetStatus: 'ReviewRequired',
    reasonReference: 'reason:synthetic:review-jurisdiction',
    idempotencyKey: 'idem:status:core-task-039'
  },
  invalidStatusTransitionRequest: {
    targetStatus: 'Active',
    idempotencyKey: 'idem:status:invalid-core-task-039'
  },
  expected: {
    recordCountAfterCreate: 1,
    eventTraceCountAfterCreate: 1,
    eventTraceCountAfterReplay: 1,
    eventTraceCountAfterStatusChange: 2,
    eventTraceCountAfterStatusReplay: 2,
    sameKeyConflictCode: 'IdempotencyConflict',
    duplicateJurisdictionCode: 'JurisdictionAlreadyExists',
    invalidTransitionCode: 'InvalidJurisdictionTransition',
    statusConflictCode: 'IdempotencyConflict',
    resolvedReferenceId: 'jurisdiction:ref:core-task-039'
  }
};
write('fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json', JSON.stringify(fixture, null, 2));

let evidence = rename(read('src/service-coverage/core-brand-service-evidence-fixture.ts'));
evidence = evidence.replace(`  const customerReference = fixture.customerReferenceRecord;\n`, '');
evidence = evidence.replace(`    typeof fixture.customerReferenceId !== 'string' ||\n`, '');
evidence = evidence.replace(`    !isRecord(customerReference) ||\n`, '');
evidence = evidence.replace(`  const customerReferenceRecord = referenceRecord(customerReference);\n`, '');
evidence = evidence.replace(`      customerReferenceRecord\n`, '');
evidence = required(evidence, `      jurisdictionType: createRequest.jurisdictionType,`, `      jurisdictionCode: String(createRequest.jurisdictionCode),\n      jurisdictionType: createRequest.jurisdictionType,`, 'create code');
evidence = evidence.replace(`      customerReferenceId: fixture.customerReferenceId,\n`, '');
evidence = required(evidence, `    if (\n      !get.ok ||\n      !list.ok ||\n      list.value.items.length !== 1 ||\n      !validation.ok ||\n      validation.value.reasonCode !== 'Valid'\n    ) {`, `    const resolved = service.resolveJurisdictionByCode({\n      jurisdictionCode: String(createRequest.jurisdictionCode),\n      requestingDomain: 'classification',\n      requestingService: 'classification-reference-service',\n      governance: governance(\n        'jurisdiction.resolve_by_code',\n        'jurisdiction:resolve',\n        'jurisdiction.reference',\n        CORE_JURISDICTION_COLLECTION_TARGET,\n        fixture.organizationScopeReferenceId\n      )\n    });\n    if (\n      !get.ok ||\n      !list.ok ||\n      list.value.items.length !== 1 ||\n      !validation.ok ||\n      validation.value.reasonCode !== 'Valid' ||\n      !resolved.ok ||\n      resolved.value.jurisdictionReferenceId !== expected.resolvedReferenceId\n    ) {`, 'resolve evidence');
write('src/service-coverage/core-jurisdiction-service-evidence-fixture.ts', evidence);
write('src/validation/core-jurisdiction-service-fixture-validation.ts', `import { validateCoreJurisdictionServiceEvidenceFixture } from '../service-coverage/core-jurisdiction-service-evidence-fixture.ts';\nimport { createCoreValidationResult } from './core-validation-result.ts';\n\nexport function validateCoreJurisdictionServiceCoreLifecycleFixture(fixture: unknown) {\n  return createCoreValidationResult(\n    validateCoreJurisdictionServiceEvidenceFixture(fixture).map((entry) => ({\n      code: entry.code,\n      severity: 'error' as const,\n      message: entry.message,\n      path: entry.path\n    }))\n  );\n}\n`);

let fixtureTest = rename(read('tests/fixtures/core-brand-service-core-lifecycle-fixture.test.ts'));
write('tests/fixtures/core-jurisdiction-service-core-lifecycle-fixture.test.ts', fixtureTest);

let unit = rename(read('tests/unit/core-brand-service-core-lifecycle.test.ts'));
unit = unit.replace(`const customerReference =\n  fixture.customerReferenceRecord as CoreReferenceRecord;\n`, '');
unit = unit.replace(`const customerReferenceId = String(fixture.customerReferenceId);\n`, '');
unit = regexRequired(unit, /function setup\(includeCustomer = true\) \{[\s\S]*?const clocks =/, `function setup(extraReferences: readonly CoreReferenceRecord[] = []) {\n  const traces = new CoreEventTraceRegistry();\n  const store = new CoreInMemoryJurisdictionServiceStore();\n  const references = [\n    ...CORE_MVP_OBJECT_FIXTURE_RELATED_REFERENCE_RECORDS,\n    jurisdictionReference,\n    ...extraReferences\n  ];\n  const clocks =`, 'setup');
unit = unit.replace(`    jurisdictionType: 'Word',\n    jurisdictionStatus: 'Active',`, `    jurisdictionCode: 'US',\n    jurisdictionType: 'National',\n    jurisdictionStatus: 'Active',`);
unit = unit.replace(`    customerReferenceId,\n`, '');
unit = regexRequired(unit, /assert\.deepEqual\(CORE_JURISDICTION_TYPES, \[[\s\S]*?\]\);/, `assert.deepEqual(CORE_JURISDICTION_TYPES, [\n      'National',\n      'Regional',\n      'International',\n      'Territory',\n      'Office',\n      'Custom',\n      'Unknown'\n    ]);`, 'type assertion');
unit = regexRequired(unit, /assert\.deepEqual\(CORE_JURISDICTION_STATUSES, \[[\s\S]*?\]\);/, `assert.deepEqual(CORE_JURISDICTION_STATUSES, [\n      'Draft',\n      'Active',\n      'ReviewRequired',\n      'Deprecated',\n      'Reserved',\n      'Archived'\n    ]);`, 'status assertion');
unit = regexRequired(unit, /\n  it\('requires a registered active Customer reference',[\s\S]*?\n  \}\);/, `\n  it('resolves the canonical jurisdiction code', () => {\n    const { service, traces } = setup();\n    assert.equal(createJurisdiction(service).ok, true);\n    const resolved = service.resolveJurisdictionByCode({\n      jurisdictionCode: 'us',\n      requestingDomain: 'classification',\n      requestingService: 'classification-reference-service',\n      governance: governance(\n        'jurisdiction.resolve_by_code',\n        'jurisdiction:resolve',\n        'jurisdiction.reference',\n        'jurisdiction:collection'\n      )\n    });\n    assert.equal(resolved.ok, true);\n    if (resolved.ok) {\n      assert.equal(resolved.value.isValid, true);\n      assert.equal(resolved.value.jurisdictionReferenceId, jurisdictionReferenceId);\n      assert.equal(resolved.value.jurisdictionCode, 'US');\n    }\n    assert.equal(traces.visibleTo(['Internal']).length, 1);\n  });`, 'resolve test');
unit = unit.replace(`filters: { jurisdictionType: 'Word', jurisdictionStatus: 'Active' },`, `filters: { jurisdictionCode: 'US', jurisdictionType: 'National', jurisdictionStatus: 'Active' },`);
unit = unit.replace(`      assert.equal('customerReferenceId' in summary, false);\n`, '');
unit = unit.replace(`      assert.equal('customerReferenceId' in validation.value, false);\n`, '');
unit = unit.replaceAll(`targetStatus: 'Archived' as const`, `targetStatus: 'Deprecated' as const`);
unit = unit.replaceAll(`reason:synthetic:archive-jurisdiction`, `reason:synthetic:deprecate-jurisdiction`);
unit = unit.replaceAll(`targetStatus: 'Archived',`, `targetStatus: 'Deprecated',`);
write('tests/unit/core-jurisdiction-service-core-lifecycle.test.ts', unit);

console.log('generated Jurisdiction evidence');
