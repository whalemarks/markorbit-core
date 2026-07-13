import { readFileSync, writeFileSync } from 'node:fs';

const path = 'tests/unit/core-brand-service-core-lifecycle.test.ts';
const before = readFileSync(path, 'utf8');
const search = "import { validateCoreBrandServiceEvidenceFixture } from '../../src/service-coverage/index.ts';";
const replacement = "import { validateCoreBrandServiceEvidenceFixture } from '../../src/service-coverage/core-brand-service-evidence-fixture.ts';";
if (!before.includes(search) && !before.includes(replacement)) {
  throw new Error('Missing Brand evidence import target.');
}
writeFileSync(path, before.replace(search, replacement));
