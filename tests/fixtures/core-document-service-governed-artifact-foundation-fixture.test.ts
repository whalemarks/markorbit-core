import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { validateCoreDocumentServiceGovernedArtifactFoundationFixture } from '../../src/index.ts';

describe('Document Service governed artifact fixture', () => {
  it('validates through the required fixture system', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(
      validateCoreDocumentServiceGovernedArtifactFoundationFixture(fixture),
      { ok: true, issues: [] }
    );
  });
});
