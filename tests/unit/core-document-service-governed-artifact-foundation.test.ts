import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { validateCoreDocumentServiceEvidenceFixture } from '../../src/index.ts';

describe('CORE-TASK-041 Document Service governed artifact foundation', () => {
  it('executes the governed Document lifecycle fixture', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(validateCoreDocumentServiceEvidenceFixture(fixture), []);
  });

  it('rejects corrupted event expectations', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json',
        'utf8'
      )
    );
    fixture.expected.eventTraceCountAfterArchiveReplay = 999;
    assert.ok(
      validateCoreDocumentServiceEvidenceFixture(fixture).some(
        (entry) => entry.code === 'core.document_service.evidence_archive_failed'
      )
    );
  });
});
