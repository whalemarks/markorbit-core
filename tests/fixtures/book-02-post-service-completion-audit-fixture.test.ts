import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  validateBook02PostServiceCompletionAudit,
  validateCoreBook02PostServiceCompletionAuditFixture
} from '../../src/index.ts';

const readFixture = async (): Promise<unknown> =>
  JSON.parse(
    await readFile(
      new URL(
        '../../fixtures/mvp-coverage/book-02-post-service-completion-audit.fixture.json',
        import.meta.url
      ),
      'utf8'
    )
  );

describe('Book 02 post-service completion audit fixture', () => {
  it('validates the deterministic fixture through both validation layers', async () => {
    const fixture = await readFixture();
    assert.deepEqual(validateBook02PostServiceCompletionAudit(fixture), []);
    assert.equal(
      validateCoreBook02PostServiceCompletionAuditFixture(fixture).ok,
      true
    );
  });

  it('rejects workstream drift', async () => {
    const fixture = (await readFixture()) as Record<string, unknown>;
    const workstreams = fixture.executionWorkstreams as Record<
      string,
      unknown
    >[];
    workstreams[0] = { ...workstreams[0], taskIds: ['CORE-TASK-X'] };
    assert.equal(
      validateBook02PostServiceCompletionAudit(fixture)[0]?.code,
      'book02.post_service_audit.workstream_drift'
    );
  });
});
