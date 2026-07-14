import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, value) => writeFileSync(path, value.endsWith('\n') ? value : `${value}\n`);
const required = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
};

let evidenceTest = read('tests/unit/core-service-behavior-evidence.test.ts');
evidenceTest = required(
  evidenceTest,
  `  CORE_CUSTOMER_MINIMUM_CAPABILITIES,\n  CORE_SERVICE_BEHAVIOR_EVIDENCE,`,
  `  CORE_CUSTOMER_MINIMUM_CAPABILITIES,\n  CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,\n  CORE_JURISDICTION_MINIMUM_CAPABILITIES,\n  CORE_SERVICE_BEHAVIOR_EVIDENCE,`,
  'Jurisdiction evidence test imports'
);
evidenceTest = evidenceTest.replace(
  'validates exact Customer, Brand, and Trademark Service evidence in canonical order',
  'validates exact Customer, Brand, Trademark, and Jurisdiction Service evidence in canonical order'
);
evidenceTest = evidenceTest.replace('CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 3', 'CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 4');
evidenceTest = required(
  evidenceTest,
  `        'must-service-brand-service',\n        'must-service-trademark-service'`,
  `        'must-service-brand-service',\n        'must-service-trademark-service',\n        'must-service-jurisdiction-service'`,
  'Jurisdiction evidence requirement ID'
);
evidenceTest = required(
  evidenceTest,
  `    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[2]?.provenMinimumCapabilities,\n      CORE_TRADEMARK_MINIMUM_CAPABILITIES\n    );`,
  `    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[2]?.provenMinimumCapabilities,\n      CORE_TRADEMARK_MINIMUM_CAPABILITIES\n    );\n    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[3]?.operations,\n      CORE_JURISDICTION_IMPLEMENTED_OPERATIONS\n    );\n    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[3]?.provenMinimumCapabilities,\n      CORE_JURISDICTION_MINIMUM_CAPABILITIES\n    );`,
  'Jurisdiction evidence assertions'
);
evidenceTest = evidenceTest.replaceAll(
  `const [customer, brand, trademark] = CORE_SERVICE_BEHAVIOR_EVIDENCE;`,
  `const [customer, brand, trademark, jurisdiction] = CORE_SERVICE_BEHAVIOR_EVIDENCE;`
);
evidenceTest = evidenceTest.replace(
  `evidence: [customer, brand]`,
  `evidence: [customer, brand, trademark]`
);
evidenceTest = evidenceTest.replaceAll(
  `evidence: [customer, customer, trademark]`,
  `evidence: [customer, customer, trademark, jurisdiction]`
);
evidenceTest = evidenceTest.replaceAll(
  `          trademark\n        ]`,
  `          trademark,\n          jurisdiction\n        ]`
);
evidenceTest = evidenceTest.replaceAll(
  `evidence: [customer, { ...brand, domainId: 'customer' }, trademark]`,
  `evidence: [customer, { ...brand, domainId: 'customer' }, trademark, jurisdiction]`
);
evidenceTest = evidenceTest.replaceAll(
  `          trademark\n        ]`,
  `          trademark,\n          jurisdiction\n        ]`
);
evidenceTest = evidenceTest.replaceAll(
  `          trademark\n        ]`,
  `          trademark,\n          jurisdiction\n        ]`
);
evidenceTest = evidenceTest.replace(
  `it('executes all three fixtures and rejects corrupted lifecycle expectations'`,
  `it('executes all four fixtures and rejects corrupted lifecycle expectations'`
);
evidenceTest = required(
  evidenceTest,
  `    assert.equal(\n      validateCoreServiceBehaviorEvidence({ trademarkFixture }).some(\n        (issue) => issue.code === 'core.service.fixture_invalid'\n      ),\n      true\n    );`,
  `    assert.equal(\n      validateCoreServiceBehaviorEvidence({ trademarkFixture }).some(\n        (issue) => issue.code === 'core.service.fixture_invalid'\n      ),\n      true\n    );\n\n    const jurisdictionFixture = JSON.parse(\n      await readFile(\n        'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',\n        'utf8'\n      )\n    ) as { expected: Record<string, unknown> };\n    jurisdictionFixture.expected.eventTraceCountAfterStatusReplay = 999;\n    assert.equal(\n      validateCoreServiceBehaviorEvidence({ jurisdictionFixture }).some(\n        (issue) => issue.code === 'core.service.fixture_invalid'\n      ),\n      true\n    );`,
  'Jurisdiction corrupted fixture assertion'
);
write('tests/unit/core-service-behavior-evidence.test.ts', evidenceTest);

for (const path of ['README.md', 'CORE-MANIFEST.md', 'CORE-ROADMAP.md', 'CHANGELOG.md']) {
  let content = read(path);
  if (!content.includes('CORE-TASK-039 note:')) {
    content += `\nCORE-TASK-039 note: Jurisdiction Service core lifecycle and code-resolution behavior is implemented at the governed MVP boundary with create, read, list, reference validation, code resolution, and status transition operations. Customer, Brand, Trademark, and Jurisdiction are the four Must Build Services with executable owned behavior; the remaining 14 Services remain incomplete. Jurisdiction metadata update, office/rule/service-scope linkage, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 36 meets_required_depth, 3 partial_evidence, 53 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-040 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.\n`;
  }
  write(path, content);
}

const cache = Date.now();
const contracts = await import(`../src/contracts/index.ts?task039=${cache}`);
const coverage = await import(`../src/contract-coverage/index.ts?task039=${cache}`);
const mvp = await import(`../src/mvp-coverage/book-02-mvp-gap-baseline.ts?task039=${cache}`);
const outputs = [
  ['fixtures/contracts/core-service-contract-skeletons.fixture.json', contracts.CORE_SERVICE_CONTRACT_SKELETONS],
  ['fixtures/contracts/core-contract-index.fixture.json', contracts.CORE_CONTRACT_INDEX],
  ['fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json', coverage.CORE_CONTRACT_COVERAGE_BASELINE],
  ['fixtures/contract-coverage/core-contract-gap-inventory.fixture.json', coverage.CORE_CONTRACT_GAP_INVENTORY],
  ['fixtures/contract-coverage/core-contract-coverage-acceptance-lock.fixture.json', coverage.CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK],
  ['fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json', mvp.BOOK_02_MVP_GAP_BASELINE]
];
for (const [path, value] of outputs) write(path, JSON.stringify(value, null, 2));

console.log('generated Jurisdiction derived fixtures');
