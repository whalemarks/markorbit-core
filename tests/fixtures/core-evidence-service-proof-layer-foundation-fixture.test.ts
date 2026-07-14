import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { validateCoreEvidenceServiceProofLayerFoundationFixture } from '../../src/index.ts';

describe('Evidence Service proof-layer fixture', () => {
  it('validates through the required fixture system', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-evidence-service-proof-layer-foundation.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(
      validateCoreEvidenceServiceProofLayerFoundationFixture(fixture),
      { ok: true, issues: [] }
    );
  });
});
