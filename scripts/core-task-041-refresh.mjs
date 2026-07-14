import { writeFileSync } from 'node:fs';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../src/contracts/service/core-service-contract-skeletons.ts';
import { CORE_CONTRACT_INDEX } from '../src/contracts/core-contract-index.ts';
import { CORE_CONTRACT_COVERAGE_BASELINE } from '../src/contract-coverage/core-contract-coverage-baseline.ts';
import { CORE_CONTRACT_GAP_INVENTORY } from '../src/contract-coverage/core-contract-gap-inventory.ts';
import { BOOK_02_MVP_GAP_BASELINE } from '../src/mvp-coverage/book-02-mvp-gap-baseline.ts';

const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

writeJson(
  'fixtures/contracts/core-service-contract-skeletons.fixture.json',
  CORE_SERVICE_CONTRACT_SKELETONS
);
writeJson('fixtures/contracts/core-contract-index.fixture.json', CORE_CONTRACT_INDEX);
writeJson(
  'fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json',
  CORE_CONTRACT_COVERAGE_BASELINE
);
writeJson(
  'fixtures/contract-coverage/core-contract-gap-inventory.fixture.json',
  CORE_CONTRACT_GAP_INVENTORY
);
writeJson(
  'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
  BOOK_02_MVP_GAP_BASELINE
);
