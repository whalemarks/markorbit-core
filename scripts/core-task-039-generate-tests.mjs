import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, value) => writeFileSync(path, value.endsWith('\n') ? value : `${value}\n`);
const required = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
};
const regexRequired = (text, regex, replacement, label) => {
  if (!regex.test(text)) throw new Error(`Missing regex target: ${label}`);
  return text.replace(regex, replacement);
};

let contractValidation = read('src/contracts/service/core-service-contract-validation.ts');
contractValidation = required(
  contractValidation,
  `const canonicalServiceSourceRoot = 'books/book-02-core-specification/core-specs/services/';`,
  `const canonicalServiceSourceRoot = 'books/book-02-core-specification/core-specs/services/';\n\nconst behaviorLocks = {\n  'customer-service': {\n    task: 'CORE-TASK-036',\n    operations: [\n      'createCustomer',\n      'getCustomer',\n      'listCustomers',\n      'validateCustomerReference',\n      'changeCustomerStatus'\n    ]\n  },\n  'brand-service': {\n    task: 'CORE-TASK-037',\n    operations: [\n      'createBrand',\n      'getBrand',\n      'listBrands',\n      'validateBrandReference',\n      'changeBrandStatus'\n    ]\n  },\n  'trademark-service': {\n    task: 'CORE-TASK-038',\n    operations: [\n      'createTrademark',\n      'getTrademark',\n      'listTrademarks',\n      'validateTrademarkReference',\n      'changeTrademarkStatus'\n    ]\n  },\n  'jurisdiction-service': {\n    task: 'CORE-TASK-039',\n    operations: [\n      'createJurisdiction',\n      'getJurisdiction',\n      'listJurisdictions',\n      'validateJurisdictionReference',\n      'resolveJurisdictionByCode',\n      'changeJurisdictionStatus'\n    ]\n  }\n} as const;\n\nconst promotedContracts = {\n  4: {\n    id: 'core-service-trademark-service-contract',\n    serviceType: 'trademark-service',\n    domainId: 'trademark',\n    name: 'Core Trademark Service Contract Skeleton',\n    sourceFile: 'trademark-service.md',\n    task: 'CORE-TASK-038'\n  },\n  5: {\n    id: 'core-service-jurisdiction-service-contract',\n    serviceType: 'jurisdiction-service',\n    domainId: 'jurisdiction',\n    name: 'Core Jurisdiction Service Contract Skeleton',\n    sourceFile: 'jurisdiction-service.md',\n    task: 'CORE-TASK-039'\n  }\n} as const;`,
  'behavior locks'
);
contractValidation = required(
  contractValidation,
  `    const canonicalEntry = canonicalServiceEntries[index - existingServiceSkeletonCount];`,
  `    const promoted = promotedContracts[index as keyof typeof promotedContracts];\n    if (promoted !== undefined) {\n      if (contract.id !== promoted.id) errors.push(\`${'${path}'}.id must match the promoted ${'${promoted.task}'} contract.\`);\n      if (contract.serviceType !== promoted.serviceType) errors.push(\`${'${path}'}.serviceType must match the promoted ${'${promoted.task}'} contract.\`);\n      if (contract.domainId !== promoted.domainId) errors.push(\`${'${path}'}.domainId must match the promoted ${'${promoted.task}'} contract.\`);\n      if (contract.name !== promoted.name) errors.push(\`${'${path}'}.name must match the promoted ${'${promoted.task}'} contract.\`);\n      if (contract.sourcePath !== \`${'${canonicalServiceSourceRoot}${promoted.sourceFile}'}\`) errors.push(\`${'${path}'}.sourcePath must match the locked Book 2 source.\`);\n      if (contract.implementationDepth !== 'validated_skeleton') errors.push(\`${'${path}'}.implementationDepth must be validated_skeleton.\`);\n      if (!isPlainObject(contract.metadata) || contract.metadata.implementationTask !== promoted.task) errors.push(\`${'${path}'}.metadata.implementationTask must be ${'${promoted.task}'}.\`);\n    }\n\n    const behaviorLock = behaviorLocks[contract.serviceType as keyof typeof behaviorLocks];\n    if (behaviorLock !== undefined) {\n      if (!isPlainObject(contract.metadata)) {\n        errors.push(\`${'${path}'}.metadata must be present for behavior evidence.\`);\n      } else {\n        if (contract.metadata.behaviorImplementationTask !== behaviorLock.task) errors.push(\`${'${path}'}.metadata.behaviorImplementationTask must be ${'${behaviorLock.task}'}.\`);\n        if (contract.metadata.behaviorDepth !== 'level_2_3') errors.push(\`${'${path}'}.metadata.behaviorDepth must be level_2_3.\`);\n        if (JSON.stringify(contract.metadata.implementedOperations) !== JSON.stringify(behaviorLock.operations)) errors.push(\`${'${path}'}.metadata.implementedOperations must match the locked Service operations.\`);\n      }\n    } else if (isPlainObject(contract.metadata)) {\n      if ('behaviorImplementationTask' in contract.metadata) errors.push(\`${'${path}'}.metadata.behaviorImplementationTask must be absent for Services without behavior evidence.\`);\n      if ('behaviorDepth' in contract.metadata) errors.push(\`${'${path}'}.metadata.behaviorDepth must be absent for Services without behavior evidence.\`);\n      if ('implementedOperations' in contract.metadata) errors.push(\`${'${path}'}.metadata.implementedOperations must be absent for Services without behavior evidence.\`);\n    }\n\n    const canonicalEntry = canonicalServiceEntries[index - existingServiceSkeletonCount];`,
  'promoted validation'
);
contractValidation = regexRequired(
  contractValidation,
  /\n        const behaviorLock =[\s\S]*?\n        \}\n      \}\n    \}/,
  `\n      }\n    }`,
  'remove old canonical behavior block'
);
write('src/contracts/service/core-service-contract-validation.ts', contractValidation);

let skeletonTest = read('tests/unit/core-service-contract-skeletons.test.ts');
skeletonTest = required(
  skeletonTest,
  `  it('adds exactly the 7 safe CORE-TASK-023 Service stubs', () => {`,
  `  it('promotes the legacy Jurisdiction reference contract in place', () => {\n    const jurisdiction = CORE_SERVICE_CONTRACT_SKELETONS[5];\n    assert.equal(jurisdiction?.id, 'core-service-jurisdiction-service-contract');\n    assert.equal(jurisdiction?.serviceType, 'jurisdiction-service');\n    assert.equal(jurisdiction?.sourcePath, 'books/book-02-core-specification/core-specs/services/jurisdiction-service.md');\n    assert.equal(jurisdiction?.metadata?.implementationTask, 'CORE-TASK-039');\n    assert.equal(jurisdiction?.metadata?.behaviorImplementationTask, 'CORE-TASK-039');\n    assert.deepEqual(jurisdiction?.metadata?.implementedOperations, [\n      'createJurisdiction',\n      'getJurisdiction',\n      'listJurisdictions',\n      'validateJurisdictionReference',\n      'resolveJurisdictionByCode',\n      'changeJurisdictionStatus'\n    ]);\n  });\n  it('adds exactly the 7 safe CORE-TASK-023 Service stubs', () => {`,
  'Jurisdiction contract test'
);
write('tests/unit/core-service-contract-skeletons.test.ts', skeletonTest);

let manifestTest = read('tests/unit/core-fixture-manifest.test.ts');
manifestTest = manifestTest.replace('has exactly 30 entries', 'has exactly 31 entries').replace('CORE_FIXTURE_MANIFEST.length, 30', 'CORE_FIXTURE_MANIFEST.length, 31');
manifestTest = required(
  manifestTest,
  `    assert.equal(CORE_FIXTURE_TYPES.includes('core_trademark_service_core_lifecycle'), true);`,
  `    assert.equal(CORE_FIXTURE_TYPES.includes('core_trademark_service_core_lifecycle'), true);\n    assert.equal(CORE_FIXTURE_TYPES.includes('core_jurisdiction_service_core_lifecycle'), true);`,
  'manifest Jurisdiction assertion'
);
manifestTest = manifestTest.replace(`'core_trademark_service_core_lifecycle']);`, `'core_trademark_service_core_lifecycle', 'core_jurisdiction_service_core_lifecycle']);`);
write('tests/unit/core-fixture-manifest.test.ts', manifestTest);

let oldBaseline = read('tests/unit/core-task-038-book-02-service-evidence.test.ts');
oldBaseline = oldBaseline.replace("it('promotes exactly Customer, Brand, and Trademark Services'", "it('preserves Customer, Brand, and Trademark Service evidence'");
oldBaseline = regexRequired(
  oldBaseline,
  /assert\.deepEqual\(\n      implemented\.map\(\(requirement\) => requirement\.id\),[\s\S]*?\n    \);/,
  `assert.ok([\n      'must-service-customer-service',\n      'must-service-brand-service',\n      'must-service-trademark-service'\n    ].every((id) => implemented.some((requirement) => requirement.id === id)));`,
  'forward compatible 038 services'
);
oldBaseline = oldBaseline.replace(/\n    assert\.equal\([\s\S]*?validated_skeleton_only'[\s\S]*?\n    \);/, '');
oldBaseline = oldBaseline.replace("it('derives 35 / 3 / 54 and leaves global Service acceptance unresolved'", "it('preserves the CORE-TASK-038 acceptance boundary'");
oldBaseline = regexRequired(
  oldBaseline,
  /    assert\.deepEqual\(BOOK_02_MVP_GAP_BASELINE\.summary\.mustBuildNow, \{[\s\S]*?\n    \}\);/,
  `    assert.ok(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow.meets_required_depth >= 35);\n    assert.ok(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow.validated_skeleton_only <= 54);`,
  'forward compatible 038 counts'
);
write('tests/unit/core-task-038-book-02-service-evidence.test.ts', oldBaseline);

let oldMetadata = read('tests/unit/core-task-037-service-contract-metadata.test.ts');
oldMetadata = oldMetadata.replace(
  `      'trademark-service'\n    ]);`,
  `      'trademark-service',\n      'jurisdiction-service'\n    ]);`
);
write('tests/unit/core-task-037-service-contract-metadata.test.ts', oldMetadata);

write('tests/unit/core-task-039-book-02-service-evidence.test.ts', `import assert from 'node:assert/strict';\nimport { describe, it } from 'node:test';\nimport { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';\n\ndescribe('CORE-TASK-039 Book 02 Service evidence', () => {\n  it('promotes exactly Customer, Brand, Trademark, and Jurisdiction Services', () => {\n    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter((requirement) => requirement.layer === 'service');\n    const implemented = services.filter((requirement) => requirement.currentDisposition === 'meets_required_depth');\n    assert.deepEqual(implemented.map((requirement) => requirement.id), [\n      'must-service-customer-service',\n      'must-service-brand-service',\n      'must-service-trademark-service',\n      'must-service-jurisdiction-service'\n    ]);\n    assert.ok(implemented.every((requirement) => requirement.currentDepth === 'level_2_3'));\n    assert.equal(services.filter((requirement) => requirement.currentDisposition === 'validated_skeleton_only').length, 14);\n  });\n\n  it('derives 36 / 3 / 53 and leaves global Service acceptance unresolved', () => {\n    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {\n      total: 115,\n      meets_required_depth: 36,\n      partial_evidence: 3,\n      validated_skeleton_only: 53,\n      boundary_scaffold_only: 5,\n      semantic_overlap_only: 18,\n      fixture_only: 0,\n      missing: 0\n    });\n    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find((entry) => entry.id === 'must-build-services-own-behavior');\n    assert.equal(criterion?.satisfied, false);\n    assert.equal(BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied, 11);\n    assert.equal(BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete, false);\n  });\n});\n`);
write('tests/unit/core-task-039-service-contract-metadata.test.ts', `import assert from 'node:assert/strict';\nimport { describe, it } from 'node:test';\nimport { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/index.ts';\n\ndescribe('CORE-TASK-039 Jurisdiction Service contract metadata', () => {\n  it('locks the promoted canonical behavior metadata', () => {\n    const jurisdiction = CORE_SERVICE_CONTRACT_SKELETONS[5];\n    assert.equal(jurisdiction?.id, 'core-service-jurisdiction-service-contract');\n    assert.equal(jurisdiction?.serviceType, 'jurisdiction-service');\n    assert.equal(jurisdiction?.domainId, 'jurisdiction');\n    assert.equal(jurisdiction?.metadata?.implementationTask, 'CORE-TASK-039');\n    assert.equal(jurisdiction?.metadata?.behaviorImplementationTask, 'CORE-TASK-039');\n    assert.equal(jurisdiction?.metadata?.behaviorDepth, 'level_2_3');\n    assert.deepEqual(jurisdiction?.metadata?.implementedOperations, [\n      'createJurisdiction',\n      'getJurisdiction',\n      'listJurisdictions',\n      'validateJurisdictionReference',\n      'resolveJurisdictionByCode',\n      'changeJurisdictionStatus'\n    ]);\n    assert.equal(CORE_SERVICE_CONTRACT_SKELETONS.some((entry) => entry.id === 'core-service-jurisdiction-reference-service-contract'), false);\n  });\n});\n`);

console.log('generated Jurisdiction validations and tests');
