import { readFileSync, writeFileSync } from 'node:fs';

function update(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) writeFileSync(path, after);
}

function replaceRequired(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
}

update('src/services/brand/core-brand-service.ts', (text) =>
  replaceRequired(
    text,
    "import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../contracts/index.ts';",
    "import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../contracts/service/core-service-contract-skeletons.ts';",
    'direct Service contract import'
  )
);

update('tests/fixtures/book-02-mvp-gap-baseline-fixture.test.ts', (text) => {
  text = replaceRequired(
    text,
    "it('locks required fixture count at 28'",
    "it('locks required fixture count at 29'",
    'fixture test title'
  );
  return replaceRequired(
    text,
    'BOOK_02_EXPECTED_COUNTS.fixtureCount, 28',
    'BOOK_02_EXPECTED_COUNTS.fixtureCount, 29',
    'fixture test value'
  );
});

const formatPaths = [
  'docs/architecture/core-brand-service-lifecycle-boundary.md',
  'fixtures/services/core-brand-service-core-lifecycle.fixture.json',
  'src/services/brand/core-brand-service.ts',
  'src/services/brand/index.ts',
  'src/services/index.ts',
  'src/service-coverage/core-brand-service-evidence-fixture.ts',
  'src/service-coverage/core-service-behavior-evidence.ts',
  'src/service-coverage/core-service-behavior-validation.ts',
  'src/service-coverage/index.ts',
  'src/validation/core-brand-service-fixture-validation.ts',
  'src/validation/index.ts',
  'tests/fixtures/core-brand-service-core-lifecycle-fixture.test.ts',
  'tests/unit/core-brand-service-core-lifecycle.test.ts',
  'tests/unit/core-service-behavior-evidence.test.ts',
  'tests/unit/core-task-037-book-02-service-evidence.test.ts',
  'tests/unit/core-task-037-service-contract-metadata.test.ts'
];
update('package.json', (text) => {
  const data = JSON.parse(text);
  for (const scriptName of ['format', 'format:check']) {
    const current = data.scripts[scriptName];
    const missing = formatPaths.filter((path) => !current.includes(path));
    data.scripts[scriptName] = `${current} ${missing.join(' ')}`.trim();
  }
  return `${JSON.stringify(data, null, 2)}\n`;
});

const note = `\n\nCORE-TASK-037 note: Brand Service core lifecycle behavior is implemented at the governed MVP boundary with create, read, list, reference validation, and status transition operations. Customer and Brand are the only two Must Build Services with executable owned behavior; the remaining 16 Services remain incomplete. Brand update and relationship-linking operations, Brand API validators, Customer Intake Workflow preview/apply, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 34 meets_required_depth, 3 partial_evidence, 55 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-038 — select the next Service-owned behavior batch from the updated Book 02 MVP gap baseline.\n`;
for (const path of ['README.md', 'CORE-MANIFEST.md', 'CORE-ROADMAP.md', 'CHANGELOG.md']) {
  update(path, (text) =>
    text.includes('CORE-TASK-037 note: Brand Service core lifecycle behavior')
      ? text
      : `${text.trimEnd()}${note}`
  );
}
