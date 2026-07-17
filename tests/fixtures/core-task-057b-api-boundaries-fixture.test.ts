import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  validateCoreApiBoundaryFixture
} from '../../src/index.ts';
const domainIds = new Set([
  'customer',
  'brand',
  'trademark',
  'jurisdiction',
  'classification',
  'document',
  'evidence'
]);
describe('CORE-TASK-057B API boundary fixture', () => {
  it('matches deterministic source evidence and validates cleanly', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/api/core-task-057b-api-boundaries.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(
      fixture,
      CORE_API_BOUNDARY_EVIDENCE.filter((entry) =>
        domainIds.has(entry.domainId)
      )
    );
    assert.equal(validateCoreApiBoundaryFixture(fixture).ok, true);
  });
});
