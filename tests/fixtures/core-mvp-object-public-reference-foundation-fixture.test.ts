import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  CORE_MVP_OBJECT_PROFILE_ORDER,
  validateCoreMvpObjectPublicReferenceFoundationFixture
} from '../../src/index.ts';

const readFixture = async (): Promise<unknown> =>
  JSON.parse(
    await readFile(
      new URL(
        '../../fixtures/objects/core-mvp-object-public-reference-foundation.fixture.json',
        import.meta.url
      ),
      'utf8'
    )
  );

describe('Core MVP Object public-reference fixture', () => {
  it('contains exactly 18 valid Object base records in canonical order', async () => {
    const fixture = await readFixture();
    assert.equal(Array.isArray(fixture), true);
    assert.equal((fixture as readonly unknown[]).length, 18);
    assert.deepEqual(
      (fixture as readonly Record<string, unknown>[]).map((r) => r.domainId),
      [...CORE_MVP_OBJECT_PROFILE_ORDER]
    );
    assert.deepEqual(
      validateCoreMvpObjectPublicReferenceFoundationFixture(fixture).issues,
      []
    );
  });

  it('detects canonical drift and invalid fixture evidence', async () => {
    const fixture = (await readFixture()) as Record<string, unknown>[];
    fixture[0] = { ...fixture[0], domainId: 'customer' };
    assert.equal(
      validateCoreMvpObjectPublicReferenceFoundationFixture(fixture).issues.some(
        (i) => i.code === 'core.object.fixture_order_changed'
      ),
      true
    );
    fixture[0] = { ...fixture[0], domainId: 'identity', publicReferenceId: 'missing:ref:0001' };
    assert.equal(
      validateCoreMvpObjectPublicReferenceFoundationFixture(fixture).issues.some(
        (i) => i.code === 'core.object.reference_evidence_missing'
      ),
      true
    );
  });
});
