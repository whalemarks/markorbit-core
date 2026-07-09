import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CoreWorkflowContract } from '../../src/index.ts';
import { validateCoreWorkflowContract } from '../../src/index.ts';

const validContract = {
  id: 'workflow-contract-001',
  type: 'record-preparation-workflow',
  name: 'Record Preparation Workflow Contract',
  domainId: 'trademark',
  status: 'draft',
  version: 1,
  steps: [{ id: 'collect-record-inputs', name: 'Collect Record Inputs', metadata: { fixture: true } }],
  transitions: [],
  createdAt: '2026-07-09T00:00:00.000Z',
  metadata: { fixture: true }
} as unknown as CoreWorkflowContract;

function contractWith(overrides: Record<string, unknown>): CoreWorkflowContract {
  return { ...validContract, ...overrides } as unknown as CoreWorkflowContract;
}

describe('validateCoreWorkflowContract', () => {
  it('returns no errors for a valid contract', () => {
    assert.deepEqual(validateCoreWorkflowContract(validContract), []);
  });

  it('returns errors for missing id', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ id: undefined })).some((error) => error.includes('id')));
  });

  it('returns errors for missing type', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ type: undefined })).some((error) => error.includes('type')));
  });

  it('returns errors for missing name', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ name: undefined })).some((error) => error.includes('name')));
  });

  it('returns errors for missing domainId', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ domainId: undefined })).some((error) => error.includes('domainId')));
  });

  it('returns errors for missing status', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ status: undefined })).some((error) => error.includes('status')));
  });

  it('returns errors for non-positive version', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ version: 0 })).some((error) => error.includes('positive integer')));
  });

  it('returns errors when steps is missing or empty', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ steps: undefined })).some((error) => error.includes('steps')));
    assert.ok(validateCoreWorkflowContract(contractWith({ steps: [] })).some((error) => error.includes('at least one')));
  });

  it('returns errors if a step is missing id or name', () => {
    const errors = validateCoreWorkflowContract(contractWith({ steps: [{ id: '', name: '' }] }));

    assert.ok(errors.some((error) => error.includes('steps[0].id')));
    assert.ok(errors.some((error) => error.includes('steps[0].name')));
  });

  it('returns errors if transition references unknown step ids', () => {
    const errors = validateCoreWorkflowContract(
      contractWith({ transitions: [{ fromStepId: 'unknown-step', toStepId: 'also-unknown' }] })
    );

    assert.ok(errors.some((error) => error.includes('fromStepId must reference')));
    assert.ok(errors.some((error) => error.includes('toStepId must reference')));
  });

  it('returns errors if metadata is not a plain object', () => {
    assert.ok(validateCoreWorkflowContract(contractWith({ metadata: [] })).some((error) => error.includes('metadata')));
    assert.ok(
      validateCoreWorkflowContract(contractWith({ steps: [{ id: 'step-one', name: 'Step One', metadata: [] }] })).some(
        (error) => error.includes('steps[0].metadata')
      )
    );
    assert.ok(
      validateCoreWorkflowContract(contractWith({ transitions: [{ fromStepId: 'collect-record-inputs', toStepId: 'collect-record-inputs', metadata: [] }] })).some(
        (error) => error.includes('transitions[0].metadata')
      )
    );
  });
});
