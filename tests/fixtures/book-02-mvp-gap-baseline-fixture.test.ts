import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  BOOK_02_EXPECTED_COUNTS,
  validateBook02MvpFixture
} from '../../src/index.ts';
const readFixture = async (): Promise<unknown> =>
  JSON.parse(
    await readFile(
      new URL(
        '../../fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
        import.meta.url
      ),
      'utf8'
    )
  );
describe('Book 02 MVP gap baseline fixture', () => {
  it('validates the canonical deterministic fixture', async () => {
    assert.deepEqual(validateBook02MvpFixture(await readFixture()), []);
  });
  it('detects fixture drift', async () => {
    const fixture = (await readFixture()) as Record<string, unknown>;
    const criteria = fixture.acceptanceCriteria as Record<string, unknown>[];
    criteria[0] = { ...criteria[0], name: 'Changed' };
    assert.equal(
      validateBook02MvpFixture(fixture)[0]?.code,
      'book02.acceptance.name_changed'
    );
  });
  it('locks required fixture count at 31', () => {
    assert.equal(BOOK_02_EXPECTED_COUNTS.fixtureCount, 31);
  });
});
