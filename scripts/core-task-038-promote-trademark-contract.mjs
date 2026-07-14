import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, value) =>
  writeFileSync(path, value.endsWith('\n') ? value : `${value}\n`);
const replaceRequired = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
};

let skeletons = read('src/contracts/service/core-service-contract-skeletons.ts');

skeletons = replaceRequired(
  skeletons,
  `  produces: readonly string[],\n  specificNonGoals: readonly string[]\n): CoreServiceContract => ({`,
  `  produces: readonly string[],\n  specificNonGoals: readonly string[],\n  implementationTask: 'CORE-TASK-021' | 'CORE-TASK-038' = 'CORE-TASK-021'\n): CoreServiceContract => ({`,
  'canonical Service implementation task parameter'
);
skeletons = replaceRequired(
  skeletons,
  `    implementationTask: 'CORE-TASK-021',`,
  `    implementationTask,`,
  'canonical Service implementation task metadata'
);

const duplicateTrademarkBlock = `  canonicalServiceSkeleton(\n    'trademark-service',\n    'trademark',\n    'Core Trademark Service Contract Skeleton',\n    'trademark-service.md',\n    'Defines the Trademark service ownership boundary for legal and procedural protection records without implementing filing, prosecution, registry synchronization, deadline calculation, fee calculation, similarity scoring, or legal conclusions.',\n    ['Trademark service ownership, validation, lifecycle, relationship-reference, and reference boundary.'],\n    ['trademark, brand, jurisdiction, classification, document, evidence, and matter references'],\n    ['trademark boundary references'],\n    ['Official registry synchronization, filing execution, prosecution workflow, deadline engine, fee engine, registrability scoring, similarity search, or legal opinion automation.']\n  ),\n`;
skeletons = replaceRequired(
  skeletons,
  duplicateTrademarkBlock,
  '',
  'duplicate Trademark Service contract'
);

const legacyTrademarkLine = `  serviceSkeleton('trademark-reference-service', 'trademark', 'Trademark Reference Service Contract Skeleton', 'Skeleton contract boundary for trademark reference service responsibilities.', 'Establishes a service contract placeholder for trademark references without trademark-specific service behavior.', ['Trademark reference service contract boundary.'], ['trademark domain references'], ['trademark reference outputs']),`;
const promotedTrademarkBlock = `  canonicalServiceSkeleton(\n    'trademark-service',\n    'trademark',\n    'Core Trademark Service Contract Skeleton',\n    'trademark-service.md',\n    'Defines the Trademark service ownership boundary for legal and procedural protection records without implementing filing, prosecution, registry synchronization, deadline calculation, fee calculation, similarity scoring, or legal conclusions.',\n    ['Trademark service ownership, validation, lifecycle, relationship-reference, and reference boundary.'],\n    ['trademark, brand, jurisdiction, classification, document, evidence, and matter references'],\n    ['trademark boundary references'],\n    ['Official registry synchronization, filing execution, prosecution workflow, deadline engine, fee engine, registrability scoring, similarity search, or legal opinion automation.'],\n    'CORE-TASK-038'\n  ),`;
skeletons = replaceRequired(
  skeletons,
  legacyTrademarkLine,
  promotedTrademarkBlock,
  'legacy Trademark reference Service promotion'
);
write('src/contracts/service/core-service-contract-skeletons.ts', skeletons);

let validation = read('src/contracts/service/core-service-contract-validation.ts');
validation = validation.replace(
  `  ['trademark-service', 'trademark', 'Core Trademark Service Contract Skeleton', 'trademark-service.md', 'CORE-TASK-038'],\n`,
  ''
);
validation = validation
  .replace('contracts.length !== 27', 'contracts.length !== 26')
  .replace('exactly 27 entries', 'exactly 26 entries');
validation = validation.replace(
  /\n\s*: canonicalEntry\[0\] === 'trademark-service'[\s\S]*?\n\s*: undefined;/,
  '\n              : undefined;'
);
write('src/contracts/service/core-service-contract-validation.ts', validation);

let serviceTest = read('tests/unit/core-service-contract-skeletons.test.ts');
serviceTest = serviceTest
  .replace('has exactly 27 entries', 'has exactly 26 entries')
  .replace('CORE_SERVICE_CONTRACT_SKELETONS.length, 27', 'CORE_SERVICE_CONTRACT_SKELETONS.length, 26')
  .replace("adds the CORE-TASK-038 Trademark Service contract at index 19", "promotes the legacy Trademark reference contract in place")
  .replace('const trademark = CORE_SERVICE_CONTRACT_SKELETONS[19];', 'const trademark = CORE_SERVICE_CONTRACT_SKELETONS[4];')
  .replace('const additions = CORE_SERVICE_CONTRACT_SKELETONS.slice(20);', 'const additions = CORE_SERVICE_CONTRACT_SKELETONS.slice(19);');
serviceTest = replaceRequired(
  serviceTest,
  `    assert.equal(trademark?.metadata?.behaviorImplementationTask, 'CORE-TASK-038');`,
  `    assert.equal(trademark?.serviceType, 'trademark-service');\n    assert.equal(trademark?.sourcePath, 'books/book-02-core-specification/core-specs/services/trademark-service.md');\n    assert.equal(trademark?.metadata?.implementationTask, 'CORE-TASK-038');\n    assert.equal(trademark?.metadata?.behaviorImplementationTask, 'CORE-TASK-038');`,
  'Trademark promoted contract assertions'
);
write('tests/unit/core-service-contract-skeletons.test.ts', serviceTest);

for (const path of [
  'src/service-coverage/core-brand-service-evidence-fixture.ts',
  'tests/unit/core-brand-service-core-lifecycle.test.ts'
]) {
  const current = read(path);
  write(path, current.replaceAll("'trademark-reference-service'", "'trademark-service'"));
}

const cacheBust = `task038-contract-promotion-${Date.now()}`;
const contracts = await import(`../src/contracts/index.ts?${cacheBust}`);
const coverage = await import(`../src/contract-coverage/index.ts?${cacheBust}`);
const mvp = await import(`../src/mvp-coverage/book-02-mvp-gap-baseline.ts?${cacheBust}`);

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
writeFileSync(
  'fixtures/contracts/core-service-contract-skeletons.fixture.json',
  json(contracts.CORE_SERVICE_CONTRACT_SKELETONS)
);
writeFileSync(
  'fixtures/contracts/core-contract-index.fixture.json',
  json(contracts.CORE_CONTRACT_INDEX)
);
writeFileSync(
  'fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json',
  json(coverage.CORE_CONTRACT_COVERAGE_BASELINE)
);
writeFileSync(
  'fixtures/contract-coverage/core-contract-gap-inventory.fixture.json',
  json(coverage.CORE_CONTRACT_GAP_INVENTORY)
);
writeFileSync(
  'fixtures/contract-coverage/core-contract-coverage-acceptance-lock.fixture.json',
  json(coverage.CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK)
);
writeFileSync(
  'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
  json(mvp.BOOK_02_MVP_GAP_BASELINE)
);
