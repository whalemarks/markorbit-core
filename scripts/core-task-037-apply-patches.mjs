import { readFileSync, writeFileSync } from 'node:fs';

function update(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) return;
  writeFileSync(path, after);
}

function replaceRequired(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) throw new Error(`Missing patch target: ${label}`);
  return text.replace(search, replacement);
}

function replaceRegexRequired(text, pattern, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!pattern.test(text)) throw new Error(`Missing regex patch target: ${label}`);
  return text.replace(pattern, replacement);
}

update('src/validation/core-fixture-manifest.ts', (text) => {
  text = replaceRequired(
    text,
    "  'core_customer_service_core_lifecycle'\n] as const;",
    "  'core_customer_service_core_lifecycle',\n  'core_brand_service_core_lifecycle'\n] as const;",
    'fixture type'
  );
  return replaceRequired(
    text,
    `  {\n    id: 'book-02-mvp-gap-baseline',`,
    `  {\n    id: 'core-brand-service-core-lifecycle',\n    type: 'core_brand_service_core_lifecycle',\n    path: 'fixtures/services/core-brand-service-core-lifecycle.fixture.json',\n    required: true\n  },\n  {\n    id: 'book-02-mvp-gap-baseline',`,
    'fixture manifest entry'
  );
});

update('scripts/validate-core-fixtures.mjs', (text) => {
  text = replaceRequired(
    text,
    '  validateCoreCustomerServiceCoreLifecycleFixture\n',
    '  validateCoreCustomerServiceCoreLifecycleFixture,\n  validateCoreBrandServiceCoreLifecycleFixture\n',
    'fixture validator import'
  );
  return replaceRequired(
    text,
    '  core_customer_service_core_lifecycle: validateCoreCustomerServiceCoreLifecycleFixture,\n',
    '  core_customer_service_core_lifecycle: validateCoreCustomerServiceCoreLifecycleFixture,\n  core_brand_service_core_lifecycle: validateCoreBrandServiceCoreLifecycleFixture,\n',
    'fixture validator map'
  );
});

update('src/mvp-coverage/book-02-mvp-requirements.ts', (text) =>
  replaceRequired(text, 'fixtureCount: 28', 'fixtureCount: 29', 'fixture count')
);

update('src/contracts/service/core-service-contract-skeletons.ts', (text) =>
  replaceRegexRequired(
    text,
    /    \.\.\.\(serviceType === 'customer-service'[\s\S]*?      : \{\}\)\n/,
    `    ...(serviceType === 'customer-service'\n      ? {\n          behaviorImplementationTask: 'CORE-TASK-036',\n          behaviorDepth: 'level_2_3',\n          implementedOperations: [\n            'createCustomer',\n            'getCustomer',\n            'listCustomers',\n            'validateCustomerReference',\n            'changeCustomerStatus'\n          ]\n        }\n      : serviceType === 'brand-service'\n        ? {\n            behaviorImplementationTask: 'CORE-TASK-037',\n            behaviorDepth: 'level_2_3',\n            implementedOperations: [\n              'createBrand',\n              'getBrand',\n              'listBrands',\n              'validateBrandReference',\n              'changeBrandStatus'\n            ]\n          }\n        : {})\n`,
    'service behavior metadata'
  )
);

update('src/contracts/service/core-service-contract-validation.ts', (text) =>
  replaceRegexRequired(
    text,
    /        const isCustomerService = canonicalEntry\[0\] === 'customer-service';[\s\S]*?        \} else \{[\s\S]*?        \}\n/,
    `        const behaviorLock =\n          canonicalEntry[0] === 'customer-service'\n            ? {\n                task: 'CORE-TASK-036',\n                operations: [\n                  'createCustomer',\n                  'getCustomer',\n                  'listCustomers',\n                  'validateCustomerReference',\n                  'changeCustomerStatus'\n                ]\n              }\n            : canonicalEntry[0] === 'brand-service'\n              ? {\n                  task: 'CORE-TASK-037',\n                  operations: [\n                    'createBrand',\n                    'getBrand',\n                    'listBrands',\n                    'validateBrandReference',\n                    'changeBrandStatus'\n                  ]\n                }\n              : undefined;\n        if (behaviorLock) {\n          if (contract.metadata.behaviorImplementationTask !== behaviorLock.task)\n            errors.push(\n              \`${'${path}'}.metadata.behaviorImplementationTask must be ${'${behaviorLock.task}'}.\`\n            );\n          if (contract.metadata.behaviorDepth !== 'level_2_3')\n            errors.push(\`${'${path}'}.metadata.behaviorDepth must be level_2_3.\`);\n          if (\n            JSON.stringify(contract.metadata.implementedOperations) !==\n            JSON.stringify(behaviorLock.operations)\n          )\n            errors.push(\n              \`${'${path}'}.metadata.implementedOperations must match the locked Service operations.\`\n            );\n        } else {\n          if ('behaviorImplementationTask' in contract.metadata)\n            errors.push(\n              \`${'${path}'}.metadata.behaviorImplementationTask must be absent for Services without behavior evidence.\`\n            );\n          if ('behaviorDepth' in contract.metadata)\n            errors.push(\n              \`${'${path}'}.metadata.behaviorDepth must be absent for Services without behavior evidence.\`\n            );\n          if ('implementedOperations' in contract.metadata)\n            errors.push(\n              \`${'${path}'}.metadata.implementedOperations must be absent for Services without behavior evidence.\`\n            );\n        }\n`,
    'service contract behavior validation'
  )
);

update('src/mvp-coverage/book-02-mvp-gap-baseline.ts', (text) => {
  text = replaceRegexRequired(
    text,
    /    if \(identity\.id === 'must-service-customer-service'\) \{[\s\S]*?    \}\n    return \{/,
    `    const evidence = CORE_SERVICE_BEHAVIOR_EVIDENCE.find(\n      (entry) => entry.requirementId === identity.id\n    );\n    if (evidence) {\n      const validEvidence = validateCoreServiceBehaviorEvidence().length === 0;\n      return {\n        contractIds: [String(found.id)],\n        implementationFiles: [\n          'src/contracts/service/core-service-contract-skeletons.ts',\n          ...evidence.implementationFiles\n        ],\n        testFiles: evidence.testFiles,\n        fixtureFiles: evidence.fixtureFiles,\n        currentDepth: validEvidence ? 'level_2_3' : undefined\n      };\n    }\n    return {`,
    'service evidence derivation'
  );
  return replaceRegexRequired(
    text,
    /(function disposition\([\s\S]*?  if \(identity\.layer === 'object'\) \{[\s\S]*?  \}\n)  if \(identity\.layer === 'service'\) \{[\s\S]*?  \}\n  if \(identity\.layer === 'test'\)/,
    `$1  if (identity.layer === 'service') {\n    if (\n      ev.currentDepth === 'level_2_3' &&\n      ev.implementationFiles.length > 1 &&\n      ev.testFiles.length > 0 &&\n      ev.fixtureFiles.length > 0\n    )\n      return 'meets_required_depth';\n    return ev.testFiles.length > 0\n      ? 'partial_evidence'\n      : ev.contractIds.length > 0\n        ? 'validated_skeleton_only'\n        : 'missing';\n  }\n  if (identity.layer === 'test')`,
    'service disposition'
  );
});

update('src/mvp-coverage/book-02-mvp-gap-validation.ts', (text) =>
  replaceRegexRequired(
    text,
    /    if \(r\.layer === 'service'\) \{[\s\S]*?    \}\n\n    if \(r\.sourcePath\.includes\('event-object\.md'\)\)/,
    `    if (r.layer === 'service') {\n      const evidence = CORE_SERVICE_BEHAVIOR_EVIDENCE.find(\n        (entry) => entry.requirementId === r.id\n      );\n      const serviceIssues = validateCoreServiceBehaviorEvidence();\n      if (evidence) {\n        if (serviceIssues.length > 0)\n          issues.push(\n            issue(\n              'book02.service.fixture_validation_failed',\n              \`${'${evidence.serviceType}'} behavior evidence and fixture must validate.\`,\n              \`requirements[${'${index}'}]\`\n            )\n          );\n        if (!r.contractIds.includes(evidence.contractId))\n          issues.push(\n            issue(\n              'book02.service.contract_mismatch',\n              \`${'${evidence.serviceType}'} must reference the exact Service contract.\`,\n              \`requirements[${'${index}'}].contractIds\`\n            )\n          );\n        const exactFiles = [\n          ...evidence.implementationFiles,\n          ...evidence.testFiles,\n          ...evidence.fixtureFiles\n        ].every((file) =>\n          [...r.implementationFiles, ...r.testFiles, ...r.fixtureFiles].includes(file)\n        );\n        if (\n          r.currentDisposition === 'meets_required_depth' &&\n          (r.currentDepth !== 'level_2_3' || !exactFiles)\n        )\n          issues.push(\n            issue(\n              'book02.service.depth_inconsistent',\n              \`${'${evidence.serviceType}'} meets_required_depth requires exact behavior evidence, tests and executable fixture.\`,\n              \`requirements[${'${index}'}]\`\n            )\n          );\n      } else if (r.currentDisposition === 'meets_required_depth') {\n        issues.push(\n          issue(\n            'book02.service.cross_service_evidence',\n            'A Service without its own evidence cannot be promoted by another Service implementation.',\n            \`requirements[${'${index}'}]\`\n          )\n        );\n      }\n    }\n\n    if (r.sourcePath.includes('event-object.md'))`,
    'Book 02 Service validation'
  )
);

update('tests/unit/core-fixture-manifest.test.ts', (text) => {
  text = replaceRequired(
    text,
    "it('has exactly 28 entries'",
    "it('has exactly 29 entries'",
    'fixture count test title'
  );
  text = replaceRequired(
    text,
    'CORE_FIXTURE_MANIFEST.length, 28',
    'CORE_FIXTURE_MANIFEST.length, 29',
    'fixture count test'
  );
  text = replaceRequired(
    text,
    "    assert.equal(CORE_FIXTURE_TYPES.includes('core_customer_service_core_lifecycle'), true);",
    "    assert.equal(CORE_FIXTURE_TYPES.includes('core_customer_service_core_lifecycle'), true);\n    assert.equal(CORE_FIXTURE_TYPES.includes('core_brand_service_core_lifecycle'), true);",
    'fixture type assertion'
  );
  return replaceRequired(
    text,
    "'core_customer_service_core_lifecycle']",
    "'core_customer_service_core_lifecycle', 'core_brand_service_core_lifecycle']",
    'fixture type lock'
  );
});

const { CORE_SERVICE_CONTRACT_SKELETONS } = await import(
  '../src/contracts/service/core-service-contract-skeletons.ts'
);
const { BOOK_02_MVP_GAP_BASELINE } = await import(
  '../src/mvp-coverage/book-02-mvp-gap-baseline.ts'
);
writeFileSync(
  'fixtures/contracts/core-service-contract-skeletons.fixture.json',
  `${JSON.stringify(CORE_SERVICE_CONTRACT_SKELETONS, null, 2)}\n`
);
writeFileSync(
  'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
  `${JSON.stringify(BOOK_02_MVP_GAP_BASELINE, null, 2)}\n`
);
