import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, value) => writeFileSync(path, value.endsWith('\n') ? value : `${value}\n`);
const required = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
};

let coverageIndex = read('src/service-coverage/index.ts');
if (!coverageIndex.includes('core-jurisdiction-service-evidence-fixture')) {
  coverageIndex += `export * from './core-jurisdiction-service-evidence-fixture.ts';\n`;
}
write('src/service-coverage/index.ts', coverageIndex);

let validationIndex = read('src/validation/index.ts');
if (!validationIndex.includes('core-jurisdiction-service-fixture-validation')) {
  validationIndex += `export * from './core-jurisdiction-service-fixture-validation.ts';\n`;
}
write('src/validation/index.ts', validationIndex);

let behaviorEvidence = read('src/service-coverage/core-service-behavior-evidence.ts');
behaviorEvidence = required(
  behaviorEvidence,
  `import {\n  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n  CORE_TRADEMARK_MINIMUM_CAPABILITIES\n} from '../services/trademark/index.ts';`,
  `import {\n  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n  CORE_TRADEMARK_MINIMUM_CAPABILITIES\n} from '../services/trademark/index.ts';\nimport {\n  CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,\n  CORE_JURISDICTION_MINIMUM_CAPABILITIES\n} from '../services/jurisdiction/index.ts';`,
  'Jurisdiction evidence imports'
);
behaviorEvidence = required(
  behaviorEvidence,
  `  }\n] as const satisfies readonly CoreServiceBehaviorEvidence[];`,
  `  },\n  {\n    requirementId: 'must-service-jurisdiction-service',\n    serviceType: 'jurisdiction-service',\n    domainId: 'jurisdiction',\n    contractId: 'core-service-jurisdiction-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/jurisdiction-service.md',\n    currentDepth: 'level_2_3',\n    operations: CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,\n    provenMinimumCapabilities: CORE_JURISDICTION_MINIMUM_CAPABILITIES,\n    unresolvedServiceOperations: [\n      'updateJurisdiction',\n      'linkJurisdictionOffice',\n      'linkJurisdictionRuleReference',\n      'linkJurisdictionServiceScope',\n      'archiveJurisdiction'\n    ],\n    implementationFiles: [\n      'src/services/jurisdiction/core-jurisdiction-service.ts'\n    ],\n    testFiles: [\n      'tests/unit/core-jurisdiction-service-core-lifecycle.test.ts'\n    ],\n    fixtureFiles: [\n      'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json'\n    ]\n  }\n] as const satisfies readonly CoreServiceBehaviorEvidence[];`,
  'Jurisdiction evidence entry'
);
write('src/service-coverage/core-service-behavior-evidence.ts', behaviorEvidence);

let behaviorValidation = read('src/service-coverage/core-service-behavior-validation.ts');
behaviorValidation = required(
  behaviorValidation,
  `import {\n  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n  CORE_TRADEMARK_MINIMUM_CAPABILITIES\n} from '../services/trademark/index.ts';`,
  `import {\n  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n  CORE_TRADEMARK_MINIMUM_CAPABILITIES\n} from '../services/trademark/index.ts';\nimport {\n  CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,\n  CORE_JURISDICTION_MINIMUM_CAPABILITIES\n} from '../services/jurisdiction/index.ts';`,
  'Jurisdiction validator imports'
);
behaviorValidation = required(
  behaviorValidation,
  `import { validateCoreTrademarkServiceEvidenceFixture } from './core-trademark-service-evidence-fixture.ts';`,
  `import { validateCoreTrademarkServiceEvidenceFixture } from './core-trademark-service-evidence-fixture.ts';\nimport { validateCoreJurisdictionServiceEvidenceFixture } from './core-jurisdiction-service-evidence-fixture.ts';`,
  'Jurisdiction fixture validator import'
);
behaviorValidation = behaviorValidation.replace(
  `  readonly trademarkFixture?: unknown;\n`,
  `  readonly trademarkFixture?: unknown;\n  readonly jurisdictionFixture?: unknown;\n`
);
behaviorValidation = behaviorValidation.replace(
  `  readonly domainId: 'customer' | 'brand' | 'trademark';`,
  `  readonly domainId: 'customer' | 'brand' | 'trademark' | 'jurisdiction';`
);
behaviorValidation = behaviorValidation.replace(
  `    'customerFixture' | 'brandFixture' | 'trademarkFixture';`,
  `    | 'customerFixture'\n    | 'brandFixture'\n    | 'trademarkFixture'\n    | 'jurisdictionFixture';`
);
behaviorValidation = required(
  behaviorValidation,
  `  }\n] as const satisfies readonly ExpectedServiceEvidence[];`,
  `  },\n  {\n    requirementId: 'must-service-jurisdiction-service',\n    serviceType: 'jurisdiction-service',\n    domainId: 'jurisdiction',\n    contractId: 'core-service-jurisdiction-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/jurisdiction-service.md',\n    operations: CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,\n    capabilities: CORE_JURISDICTION_MINIMUM_CAPABILITIES,\n    unresolved: [\n      'updateJurisdiction',\n      'linkJurisdictionOffice',\n      'linkJurisdictionRuleReference',\n      'linkJurisdictionServiceScope',\n      'archiveJurisdiction'\n    ],\n    fixtureOverride: 'jurisdictionFixture',\n    fixtureValidator: validateCoreJurisdictionServiceEvidenceFixture\n  }\n] as const satisfies readonly ExpectedServiceEvidence[];`,
  'Jurisdiction expected evidence'
);
behaviorValidation = behaviorValidation.replace(
  'Service behavior evidence must contain exactly Customer, Brand, and Trademark entries in canonical order.',
  'Service behavior evidence must contain exactly Customer, Brand, Trademark, and Jurisdiction entries in canonical order.'
);
write('src/service-coverage/core-service-behavior-validation.ts', behaviorValidation);

let contracts = read('src/contracts/service/core-service-contract-skeletons.ts');
contracts = contracts.replace(
  `implementationTask: 'CORE-TASK-021' | 'CORE-TASK-038' = 'CORE-TASK-021'`,
  `implementationTask: 'CORE-TASK-021' | 'CORE-TASK-038' | 'CORE-TASK-039' = 'CORE-TASK-021'`
);
contracts = required(
  contracts,
  `        : serviceType === 'trademark-service'\n          ? {\n              behaviorImplementationTask: 'CORE-TASK-038',\n              behaviorDepth: 'level_2_3',\n              implementedOperations: [\n                'createTrademark',\n                'getTrademark',\n                'listTrademarks',\n                'validateTrademarkReference',\n                'changeTrademarkStatus'\n              ]\n            }\n          : {})`,
  `        : serviceType === 'trademark-service'\n          ? {\n              behaviorImplementationTask: 'CORE-TASK-038',\n              behaviorDepth: 'level_2_3',\n              implementedOperations: [\n                'createTrademark',\n                'getTrademark',\n                'listTrademarks',\n                'validateTrademarkReference',\n                'changeTrademarkStatus'\n              ]\n            }\n          : serviceType === 'jurisdiction-service'\n            ? {\n                behaviorImplementationTask: 'CORE-TASK-039',\n                behaviorDepth: 'level_2_3',\n                implementedOperations: [\n                  'createJurisdiction',\n                  'getJurisdiction',\n                  'listJurisdictions',\n                  'validateJurisdictionReference',\n                  'resolveJurisdictionByCode',\n                  'changeJurisdictionStatus'\n                ]\n              }\n            : {})`,
  'Jurisdiction contract metadata'
);
contracts = required(
  contracts,
  `  serviceSkeleton('jurisdiction-reference-service', 'jurisdiction', 'Jurisdiction Reference Service Contract Skeleton', 'Skeleton contract boundary for jurisdiction reference service responsibilities.', 'Establishes a service contract placeholder for jurisdiction references without implementing legal lookup behavior.', ['Jurisdiction reference service contract boundary.'], ['jurisdiction domain references'], ['jurisdiction reference outputs']),`,
  `  canonicalServiceSkeleton(\n    'jurisdiction-service',\n    'jurisdiction',\n    'Core Jurisdiction Service Contract Skeleton',\n    'jurisdiction-service.md',\n    'Defines the Jurisdiction service ownership boundary for canonical territorial and procedural contexts without implementing legal rules, fees, deadlines, official synchronization, provider routing, or legal conclusions.',\n    ['Jurisdiction service ownership, validation, lifecycle, code-resolution, and reference boundary.'],\n    ['jurisdiction, trademark, classification, matter, order, document, evidence, knowledge, policy, agent, service-provider, and routing references'],\n    ['jurisdiction boundary references and governed code-resolution results'],\n    ['Legal rule engine, fee engine, deadline engine, official registry synchronization, agent selection, provider routing, or AI legal advice.'],\n    'CORE-TASK-039'\n  ),`,
  'promote Jurisdiction contract'
);
write('src/contracts/service/core-service-contract-skeletons.ts', contracts);

let manifest = read('src/validation/core-fixture-manifest.ts');
manifest = required(
  manifest,
  `  'core_trademark_service_core_lifecycle'\n] as const;`,
  `  'core_trademark_service_core_lifecycle',\n  'core_jurisdiction_service_core_lifecycle'\n] as const;`,
  'Jurisdiction fixture type'
);
manifest = required(
  manifest,
  `  {\n    id: 'book-02-mvp-gap-baseline',`,
  `  {\n    id: 'core-jurisdiction-service-core-lifecycle',\n    type: 'core_jurisdiction_service_core_lifecycle',\n    path: 'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',\n    required: true\n  },\n  {\n    id: 'book-02-mvp-gap-baseline',`,
  'Jurisdiction manifest entry'
);
write('src/validation/core-fixture-manifest.ts', manifest);

let requirements = read('src/mvp-coverage/book-02-mvp-requirements.ts');
requirements = requirements.replace('fixtureCount: 30', 'fixtureCount: 31');
write('src/mvp-coverage/book-02-mvp-requirements.ts', requirements);

let fixtureScript = read('scripts/validate-core-fixtures.mjs');
fixtureScript = required(
  fixtureScript,
  `  validateCoreTrademarkServiceCoreLifecycleFixture,`,
  `  validateCoreTrademarkServiceCoreLifecycleFixture,\n  validateCoreJurisdictionServiceCoreLifecycleFixture,`,
  'fixture validator import'
);
fixtureScript = required(
  fixtureScript,
  `  core_trademark_service_core_lifecycle:\n    validateCoreTrademarkServiceCoreLifecycleFixture,`,
  `  core_trademark_service_core_lifecycle:\n    validateCoreTrademarkServiceCoreLifecycleFixture,\n  core_jurisdiction_service_core_lifecycle:\n    validateCoreJurisdictionServiceCoreLifecycleFixture,`,
  'fixture validator map'
);
write('scripts/validate-core-fixtures.mjs', fixtureScript);

console.log('generated Jurisdiction integration');
