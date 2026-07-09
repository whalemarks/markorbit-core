import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_CATEGORIES, CORE_DOMAIN_REGISTRY } from '../../src/index.ts';

const expectedCategoryCounts = {
  [CORE_DOMAIN_CATEGORIES.foundation]: 6,
  [CORE_DOMAIN_CATEGORIES.professional]: 6,
  [CORE_DOMAIN_CATEGORIES.businessExecution]: 8,
  [CORE_DOMAIN_CATEGORIES.collaborationNetwork]: 6
} as const;

describe('CORE_DOMAIN_REGISTRY', () => {
  it('has exactly 26 domains', () => {
    assert.equal(CORE_DOMAIN_REGISTRY.length, 26);
  });

  it('has unique ids', () => {
    const ids = CORE_DOMAIN_REGISTRY.map((domain) => domain.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('has unique names', () => {
    const names = CORE_DOMAIN_REGISTRY.map((domain) => domain.name);
    assert.equal(new Set(names).size, names.length);
  });

  it('has category, description, book, and active status for every domain', () => {
    for (const domain of CORE_DOMAIN_REGISTRY) {
      assert.ok(domain.category);
      assert.ok(domain.description);
      assert.equal(domain.book, 'Book 02 — MarkOrbit Core Specification');
      assert.equal(domain.status, 'active');
    }
  });

  it('has all four categories', () => {
    const categories = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.category));

    assert.deepEqual(categories, new Set(Object.values(CORE_DOMAIN_CATEGORIES)));
  });

  it('has the correct count for each category', () => {
    const actualCategoryCounts = Object.fromEntries(
      Object.values(CORE_DOMAIN_CATEGORIES).map((category) => [
        category,
        CORE_DOMAIN_REGISTRY.filter((domain) => domain.category === category).length
      ])
    );

    assert.deepEqual(actualCategoryCounts, expectedCategoryCounts);
  });
});
