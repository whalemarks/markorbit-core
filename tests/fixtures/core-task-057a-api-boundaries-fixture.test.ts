import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  validateCoreApiBoundaryFixture
} from '../../src/index.ts';

const coreTask057aEvidence = CORE_API_BOUNDARY_EVIDENCE.filter(
  (entry) => entry.implementationTask === 'CORE-TASK-057A'
);

describe('CORE-TASK-057A API boundary fixture', () => {
  it('matches deterministic source evidence and validates cleanly', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/api/core-task-057a-api-boundaries.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(fixture, coreTask057aEvidence);
    assert.equal(validateCoreApiBoundaryFixture(fixture).ok, true);
  });
});
