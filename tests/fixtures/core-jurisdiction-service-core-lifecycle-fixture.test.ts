import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { validateCoreJurisdictionServiceCoreLifecycleFixture } from '../../src/validation/core-jurisdiction-service-fixture-validation.ts';

describe('Jurisdiction Service lifecycle fixture', () => {
  it('executes the registered deterministic Jurisdiction scenarios', () => {
    const fixture = JSON.parse(
      readFileSync(
        'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as unknown;
    const result = validateCoreJurisdictionServiceCoreLifecycleFixture(fixture);
    assert.equal(result.ok, true);
    assert.deepEqual(result.issues, []);
  });
});
