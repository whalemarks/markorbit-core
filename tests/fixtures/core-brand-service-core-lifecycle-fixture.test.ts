import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { validateCoreBrandServiceCoreLifecycleFixture } from '../../src/validation/index.ts';

describe('Brand Service lifecycle fixture', () => {
  it('executes the registered deterministic Brand scenarios', () => {
    const fixture = JSON.parse(
      readFileSync(
        'fixtures/services/core-brand-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as unknown;
    const result = validateCoreBrandServiceCoreLifecycleFixture(fixture);
    assert.equal(result.ok, true);
    assert.deepEqual(result.issues, []);
  });
});
