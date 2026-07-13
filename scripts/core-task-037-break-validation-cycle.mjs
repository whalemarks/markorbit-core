import { readFileSync, writeFileSync } from 'node:fs';

function update(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (before !== after) writeFileSync(path, after);
}

function replaceRequired(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
}

update('src/validation/index.ts', (text) =>
  text.replace(
    "export * from './core-brand-service-fixture-validation.ts';\n",
    ''
  )
);

update('scripts/validate-core-fixtures.mjs', (text) => {
  text = replaceRequired(
    text,
    '  validateCoreCustomerServiceCoreLifecycleFixture,\n  validateCoreBrandServiceCoreLifecycleFixture\n} from \'../src/validation/index.ts\';',
    "  validateCoreCustomerServiceCoreLifecycleFixture\n} from '../src/validation/index.ts';\nimport { validateCoreBrandServiceCoreLifecycleFixture } from '../src/validation/core-brand-service-fixture-validation.ts';",
    'fixture CLI direct Brand validator import'
  );
  return text;
});

update(
  'tests/fixtures/core-brand-service-core-lifecycle-fixture.test.ts',
  (text) =>
    replaceRequired(
      text,
      "import { validateCoreBrandServiceCoreLifecycleFixture } from '../../src/validation/index.ts';",
      "import { validateCoreBrandServiceCoreLifecycleFixture } from '../../src/validation/core-brand-service-fixture-validation.ts';",
      'fixture test direct Brand validator import'
    )
);
