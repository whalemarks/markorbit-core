import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { validateCoreEvidenceServiceEvidenceFixture } from '../../src/index.ts';

describe('CORE-TASK-042 Evidence Service proof-layer foundation', () => {
  it('executes the governed Evidence proof-layer fixture', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-evidence-service-proof-layer-foundation.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(validateCoreEvidenceServiceEvidenceFixture(fixture), []);
  });

  it('rejects corrupted relationship and Event expectations', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-evidence-service-proof-layer-foundation.fixture.json',
        'utf8'
      )
    );
    fixture.expected.finalClaimCount = 99;
    assert.ok(
      validateCoreEvidenceServiceEvidenceFixture(fixture).some(
        (entry) =>
          entry.code === 'core.evidence_service.final_relationships_failed'
      )
    );
  });
});
