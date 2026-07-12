import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_OBJECT_STATUSES } from '../../src/index.ts';

type CoreObjectBaseFixtureEntry = {
  readonly id?: string;
  readonly type?: string;
  readonly domainId?: string;
  readonly status?: string;
  readonly version?: unknown;
  readonly metadata?: unknown;
  readonly [key: string]: unknown;
};

const fixture = JSON.parse(
  await readFile(new URL('../../fixtures/objects/core-object-base.fixture.json', import.meta.url), 'utf8')
) as readonly CoreObjectBaseFixtureEntry[];

const allowedBaseFields = new Set(['id', 'type', 'domainId', 'status', 'version', 'metadata']);

describe('core-object-base fixture', () => {
  it('has exactly 3 sample objects', () => {
    assert.equal(fixture.length, 3);
  });

  it('has id, type, domainId, status, version, and metadata for each object', () => {
    for (const object of fixture) {
      assert.ok(object.id);
      assert.ok(object.type);
      assert.ok(object.domainId);
      assert.ok(object.status);
      assert.ok(object.version);
      assert.ok(object.metadata);
    }
  });

  it('uses domain ids that exist in CORE_DOMAIN_REGISTRY', () => {
    const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));

    for (const object of fixture) {
      assert.ok(object.domainId && domainIds.has(object.domainId));
    }
  });

  it('uses valid CoreObjectStatus values', () => {
    const statuses = new Set<string>(Object.values(CORE_OBJECT_STATUSES));

    for (const object of fixture) {
      assert.ok(object.status && statuses.has(object.status));
    }
  });

  it('does not define domain-specific business fields', () => {
    for (const object of fixture) {
      assert.deepEqual(Object.keys(object).filter((field) => !allowedBaseFields.has(field)), []);
    }
  });
});
