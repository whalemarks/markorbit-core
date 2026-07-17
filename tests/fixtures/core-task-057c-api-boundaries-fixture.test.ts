import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  CORE_TASK_057C_API_BOUNDARY_EVIDENCE,
  validateCoreApiBoundaryFixture
} from '../../src/index.ts';
describe('CORE-TASK-057C API fixture', () => {
  it('matches all six final API evidence records', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/api/core-task-057c-api-boundaries.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(fixture, CORE_TASK_057C_API_BOUNDARY_EVIDENCE);
    assert.equal(validateCoreApiBoundaryFixture(fixture).ok, true);
  });
});
