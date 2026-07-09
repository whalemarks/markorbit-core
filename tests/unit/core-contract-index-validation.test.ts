import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_CONTRACT_INDEX, validateCoreContractIndex } from '../../src/index.ts';

const baseContract = CORE_CONTRACT_INDEX[0];

describe('Core Contract Index validation', () => {
  it('returns no errors for CORE_CONTRACT_INDEX', () => {
    assert.deepEqual(validateCoreContractIndex(CORE_CONTRACT_INDEX), []);
  });

  it('returns errors for non-array input', () => {
    assert.ok(validateCoreContractIndex({} as never).length > 0);
  });

  it('returns errors for missing id', () => {
    const { id: _id, ...contract } = baseContract;
    assert.ok(validateCoreContractIndex([contract as never]).some((error) => error.includes('id')));
  });

  it('returns errors for missing type', () => {
    const { type: _type, ...contract } = baseContract;
    assert.ok(validateCoreContractIndex([contract as never]).some((error) => error.includes('type')));
  });

  it('returns errors for missing name', () => {
    const { name: _name, ...contract } = baseContract;
    assert.ok(validateCoreContractIndex([contract as never]).some((error) => error.includes('name')));
  });

  it('returns errors for missing status', () => {
    const { status: _status, ...contract } = baseContract;
    assert.ok(validateCoreContractIndex([contract as never]).some((error) => error.includes('status')));
  });

  it('returns errors for non-positive version', () => {
    assert.ok(validateCoreContractIndex([{ ...baseContract, version: 0 }]).some((error) => error.includes('version')));
  });

  it('returns errors for missing book', () => {
    const { book: _book, ...contract } = baseContract;
    assert.ok(validateCoreContractIndex([contract as never]).some((error) => error.includes('book')));
  });

  it('returns errors for duplicate ids', () => {
    assert.ok(validateCoreContractIndex([baseContract, { ...CORE_CONTRACT_INDEX[1], id: baseContract.id }]).some((error) => error.includes('id')));
  });

  it('returns errors for duplicate names', () => {
    assert.ok(validateCoreContractIndex([baseContract, { ...CORE_CONTRACT_INDEX[1], name: baseContract.name }]).some((error) => error.includes('name')));
  });

  it('returns errors for invalid metadata', () => {
    assert.ok(validateCoreContractIndex([{ ...baseContract, metadata: [] as never }]).some((error) => error.includes('metadata')));
  });
});
