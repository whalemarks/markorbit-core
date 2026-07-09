import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY } from '../../src/index.ts';

type CoreDomainFixtureEntry = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
};

const fixture = JSON.parse(
  await readFile(new URL('../../fixtures/domains/core-domain-registry.fixture.json', import.meta.url), 'utf8')
) as readonly CoreDomainFixtureEntry[];

describe('core-domain-registry fixture', () => {
  it('has exactly 26 domains', () => {
    assert.equal(fixture.length, 26);
  });

  it('matches registry ids exactly', () => {
    assert.deepEqual(
      fixture.map((domain) => domain.id),
      CORE_DOMAIN_REGISTRY.map((domain) => domain.id)
    );
  });

  it('matches registry names exactly', () => {
    assert.deepEqual(
      fixture.map((domain) => domain.name),
      CORE_DOMAIN_REGISTRY.map((domain) => domain.name)
    );
  });

  it('matches registry categories exactly', () => {
    assert.deepEqual(
      fixture.map((domain) => domain.category),
      CORE_DOMAIN_REGISTRY.map((domain) => domain.category)
    );
  });
});
