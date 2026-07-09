import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_OBJECT_STATUSES,
  createCoreObjectId,
  createCoreObjectType,
  createCoreObjectVersion
} from '../../src/index.ts';

describe('Core Object base types', () => {
  it('createCoreObjectId accepts valid ids', () => {
    assert.equal(createCoreObjectId('object-001'), 'object-001');
  });

  it('createCoreObjectId rejects empty values', () => {
    assert.throws(() => createCoreObjectId(''));
  });

  it('createCoreObjectId rejects values with spaces', () => {
    assert.throws(() => createCoreObjectId('object 001'));
  });

  it('createCoreObjectType accepts kebab-case values', () => {
    assert.equal(createCoreObjectType('trademark-record'), 'trademark-record');
  });

  it('createCoreObjectType rejects empty values', () => {
    assert.throws(() => createCoreObjectType(''));
  });

  it('createCoreObjectType rejects values with spaces', () => {
    assert.throws(() => createCoreObjectType('trademark record'));
  });

  it('createCoreObjectType rejects non-kebab-case values', () => {
    assert.throws(() => createCoreObjectType('TrademarkRecord'));
    assert.throws(() => createCoreObjectType('trademark_record'));
  });

  it('CoreObjectStatus includes exactly draft, active, inactive, archived, deleted', () => {
    assert.deepEqual(Object.values(CORE_OBJECT_STATUSES), ['draft', 'active', 'inactive', 'archived', 'deleted']);
  });

  it('createCoreObjectVersion accepts positive integer version', () => {
    assert.deepEqual(createCoreObjectVersion({ version: 1, createdAt: '2026-07-09T00:00:00Z' }), {
      version: 1,
      createdAt: '2026-07-09T00:00:00Z'
    });
  });

  it('createCoreObjectVersion rejects zero, negative and non-integer versions', () => {
    assert.throws(() => createCoreObjectVersion({ version: 0, createdAt: '2026-07-09T00:00:00Z' }));
    assert.throws(() => createCoreObjectVersion({ version: -1, createdAt: '2026-07-09T00:00:00Z' }));
    assert.throws(() => createCoreObjectVersion({ version: 1.5, createdAt: '2026-07-09T00:00:00Z' }));
  });
});
