import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_WORKFLOW_CONTRACT_STATUSES,
  createCoreWorkflowContractId,
  createCoreWorkflowContractType,
  createCoreWorkflowStepId
} from '../../src/index.ts';

const expectedStatuses = ['draft', 'active', 'inactive', 'deprecated', 'archived'];

describe('Core Workflow Contract base primitives', () => {
  it('createCoreWorkflowContractId accepts valid ids', () => {
    assert.equal(createCoreWorkflowContractId('workflow-contract-001'), 'workflow-contract-001');
  });

  it('createCoreWorkflowContractId rejects empty values', () => {
    assert.throws(() => createCoreWorkflowContractId(''));
  });

  it('createCoreWorkflowContractId rejects values with spaces', () => {
    assert.throws(() => createCoreWorkflowContractId('workflow contract 001'));
  });

  it('createCoreWorkflowContractType accepts kebab-case values', () => {
    assert.equal(createCoreWorkflowContractType('record-preparation-workflow'), 'record-preparation-workflow');
  });

  it('createCoreWorkflowContractType rejects empty values', () => {
    assert.throws(() => createCoreWorkflowContractType(''));
  });

  it('createCoreWorkflowContractType rejects values with spaces', () => {
    assert.throws(() => createCoreWorkflowContractType('record preparation workflow'));
  });

  it('createCoreWorkflowContractType rejects non-kebab-case values', () => {
    assert.throws(() => createCoreWorkflowContractType('RecordPreparationWorkflow'));
    assert.throws(() => createCoreWorkflowContractType('record_preparation_workflow'));
  });

  it('CoreWorkflowContractStatus contains exactly draft, active, inactive, deprecated, archived', () => {
    assert.deepEqual(Object.values(CORE_WORKFLOW_CONTRACT_STATUSES), expectedStatuses);
  });

  it('createCoreWorkflowStepId accepts valid kebab-case ids', () => {
    assert.equal(createCoreWorkflowStepId('collect-record-inputs'), 'collect-record-inputs');
  });

  it('createCoreWorkflowStepId rejects empty values', () => {
    assert.throws(() => createCoreWorkflowStepId(''));
  });

  it('createCoreWorkflowStepId rejects values with spaces', () => {
    assert.throws(() => createCoreWorkflowStepId('collect record inputs'));
  });

  it('createCoreWorkflowStepId rejects non-kebab-case values', () => {
    assert.throws(() => createCoreWorkflowStepId('CollectRecordInputs'));
    assert.throws(() => createCoreWorkflowStepId('collect_record_inputs'));
  });
});
