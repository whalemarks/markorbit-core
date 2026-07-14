import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  'src/service-coverage/core-jurisdiction-service-evidence-fixture.ts',
  'tests/unit/core-jurisdiction-service-core-lifecycle.test.ts'
];

for (const path of files) {
  const source = readFileSync(path, 'utf8');
  writeFileSync(
    path,
    source.split("requestingService: 'classification-reference-service'").join(
      "requestingService: 'classification-service'"
    )
  );
}
