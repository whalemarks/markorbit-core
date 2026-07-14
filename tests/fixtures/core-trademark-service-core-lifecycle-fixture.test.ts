import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { validateCoreTrademarkServiceCoreLifecycleFixture } from '../../src/validation/core-trademark-service-fixture-validation.ts';

describe('Trademark Service lifecycle fixture', () => {
  it('executes the registered deterministic Trademark scenarios', () => {
    const fixture = JSON.parse(
      readFileSync(
        'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as unknown;
    const result = validateCoreTrademarkServiceCoreLifecycleFixture(fixture);
    assert.equal(result.ok, true);
    assert.deepEqual(result.issues, []);
  });
});
