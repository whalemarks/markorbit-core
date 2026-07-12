import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_IDEMPOTENCY_FIXTURE,
  CoreIdempotencyRegistry,
  createCoreRequestFingerprint
} from '../../src/index.ts';

describe('CORE-TASK-029 Idempotency Enforcement', () => {
  it('creates a stable fingerprint independent of object key order', () => {
    assert.equal(
      createCoreRequestFingerprint({ a: 1, b: 2 }),
      createCoreRequestFingerprint({ b: 2, a: 1 })
    );
  });
  it('executes once and replays the original safe result', () => {
    const registry = new CoreIdempotencyRegistry(() => 1_000);
    let effects = 0;
    const effect = () => ({ referenceId: `order:${++effects}` });
    const first = registry.execute(CORE_IDEMPOTENCY_FIXTURE, effect);
    const replay = registry.execute(
      {
        ...CORE_IDEMPOTENCY_FIXTURE,
        request: { quantity: 1, sku: 'book-02', organizationId: 'org:alpha' }
      },
      effect
    );
    assert.equal(first.ok && first.value.status, 'New');
    assert.equal(replay.ok && replay.value.status, 'ExistingReplayed');
    assert.equal(effects, 1);
    assert.deepEqual(
      first.ok && first.value.result,
      replay.ok && replay.value.result
    );
  });
  it('rejects missing, unsafe, conflicting, and expired keys', () => {
    let now = 1_000;
    const registry = new CoreIdempotencyRegistry(() => now);
    assert.equal(
      registry.execute(
        { ...CORE_IDEMPOTENCY_FIXTURE, idempotencyKey: null },
        () => true
      ).ok,
      false
    );
    assert.equal(
      registry.execute(
        { ...CORE_IDEMPOTENCY_FIXTURE, idempotencyKey: 'token:secret-value' },
        () => true
      ).ok,
      false
    );
    registry.execute(
      { ...CORE_IDEMPOTENCY_FIXTURE, ttlMilliseconds: 10 },
      () => true
    );
    assert.equal(
      registry.execute(
        { ...CORE_IDEMPOTENCY_FIXTURE, request: { changed: true } },
        () => true
      ).ok,
      false
    );
    now = 1_010;
    assert.equal(
      registry.execute(CORE_IDEMPOTENCY_FIXTURE, () => true).ok,
      false
    );
  });
  it('re-evaluates permission and policy before replay', () => {
    const registry = new CoreIdempotencyRegistry();
    registry.execute(CORE_IDEMPOTENCY_FIXTURE, () => 'created');
    const denied = registry.execute(
      { ...CORE_IDEMPOTENCY_FIXTURE, permissionAllowed: false },
      () => 'duplicate'
    );
    const restricted = registry.execute(
      { ...CORE_IDEMPOTENCY_FIXTURE, policyAllowed: false },
      () => 'duplicate'
    );
    assert.equal(!denied.ok && denied.error.code, 'PermissionDenied');
    assert.equal(!restricted.ok && restricted.error.code, 'PolicyRestricted');
  });
});
