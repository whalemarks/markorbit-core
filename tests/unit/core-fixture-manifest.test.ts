import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_FIXTURE_MANIFEST, CORE_FIXTURE_TYPES } from '../../src/index.ts';

describe('CORE_FIXTURE_MANIFEST', () => {
  it('has exactly 11 entries', () => {
    assert.equal(CORE_FIXTURE_MANIFEST.length, 11);
  });

  it('includes service_contract_skeletons, api_contract_skeletons, and event_catalog_skeletons types', () => {
    assert.equal(CORE_FIXTURE_TYPES.includes('service_contract_skeletons'), true);
    assert.equal(CORE_FIXTURE_TYPES.includes('api_contract_skeletons'), true);
    assert.equal(CORE_FIXTURE_TYPES.includes('event_catalog_skeletons'), true);
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

  it('CoreFixtureType contains exactly the required fixture types', () => {
    assert.deepEqual(CORE_FIXTURE_TYPES, ['domain_registry', 'object_base', 'event_base', 'task_base', 'workflow_contract_base', 'contract_index', 'domain_contract_skeletons', 'object_contract_skeletons', 'service_contract_skeletons', 'api_contract_skeletons', 'event_catalog_skeletons']);
  });
});
