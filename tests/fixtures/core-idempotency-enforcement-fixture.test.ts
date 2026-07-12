import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CORE_IDEMPOTENCY_FIXTURE,
  CoreIdempotencyRegistry
} from '../../src/index.ts';

describe('Core idempotency enforcement fixture', () => {
  it('matches the canonical fixture and prevents duplicate effects', () => {
    const fixture = JSON.parse(
      readFileSync(
        'fixtures/behaviors/core-idempotency-enforcement.fixture.json',
        'utf8'
      )
    );
    assert.deepEqual(fixture, CORE_IDEMPOTENCY_FIXTURE);
    const registry = new CoreIdempotencyRegistry(() => 1_000);
    let effects = 0;
    assert.equal(registry.execute(fixture, () => ++effects).ok, true);
    assert.equal(registry.execute(fixture, () => ++effects).ok, true);
    assert.equal(effects, 1);
  });
});
