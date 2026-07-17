import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  validateCoreApiBoundaryFixture
} from '../../src/index.ts';

describe('CORE-TASK-057A API boundary fixture', () => {
  it('matches deterministic source evidence and validates cleanly', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/api/core-task-057a-api-boundaries.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(fixture, CORE_API_BOUNDARY_EVIDENCE);
    assert.equal(validateCoreApiBoundaryFixture(fixture).ok, true);
  });
});
