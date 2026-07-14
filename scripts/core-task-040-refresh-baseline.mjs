import { writeFileSync } from 'node:fs';
import { BOOK_02_MVP_GAP_BASELINE } from '../src/mvp-coverage/book-02-mvp-gap-baseline.ts';

writeFileSync(
  'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
  `${JSON.stringify(BOOK_02_MVP_GAP_BASELINE, null, 2)}\n`
);
