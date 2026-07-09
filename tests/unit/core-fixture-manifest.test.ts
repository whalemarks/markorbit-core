import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_FIXTURE_MANIFEST, CORE_FIXTURE_TYPES } from '../../src/index.ts';

describe('CORE_FIXTURE_MANIFEST', () => {
  it('has exactly 5 entries', () => {
    assert.equal(CORE_FIXTURE_MANIFEST.length, 5);
  });

  it('ids are unique', () => {
    assert.equal(new Set(CORE_FIXTURE_MANIFEST.map((entry) => entry.id)).size, CORE_FIXTURE_MANIFEST.length);
  });

  it('paths are unique', () => {
    assert.equal(new Set(CORE_FIXTURE_MANIFEST.map((entry) => entry.path)).size, CORE_FIXTURE_MANIFEST.length);
  });

  it('all entries are required', () => {
    assert.ok(CORE_FIXTURE_MANIFEST.every((entry) => entry.required === true));
  });

  it('CoreFixtureType contains exactly the required five fixture types', () => {
    assert.deepEqual(CORE_FIXTURE_TYPES, ['domain_registry', 'object_base', 'event_base', 'task_base', 'workflow_contract_base']);
  });
});
