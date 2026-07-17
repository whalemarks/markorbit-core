import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOK_02_MVP_GAP_BASELINE,
  CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE
} from '../../src/index.ts';

describe('CORE-TASK-058A Book 02 Workflow evidence', () => {
  it('promotes only Customer Intake Workflow and leaves the next workflow tasks unresolved', () => {
    const evidence = CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE;
    assert.equal(evidence.implementationTask, 'CORE-TASK-058A');
    assert.equal(evidence.previewSupported, true);
    assert.equal(evidence.applySupported, true);
    assert.equal(evidence.directDomainMutation, false);
    assert.equal(evidence.directEventEmission, false);
    assert.deepEqual(
      [
        'plan/execution consistency',
        'Customer-reference propagation',
        'configured Task-step enforcement',
        'genuine Event-reference aggregation',
        'executable fixture scenario traceability'
      ].every((capability) => evidence.provenCapabilities.includes(capability)),
      true
    );
    const customer = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (entry) => entry.id === 'must-workflow-customer-intake-workflow'
    );
    const trademark = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (entry) => entry.id === 'must-workflow-trademark-application-workflow'
    );
    const communication = BOOK_02_MVP_GAP_BASELINE.requirements.find(
      (entry) => entry.id === 'must-workflow-communication-review-workflow'
    );
    assert.equal(customer?.currentDisposition, 'meets_required_depth');
    assert.notEqual(trademark?.currentDisposition, 'meets_required_depth');
    assert.notEqual(communication?.currentDisposition, 'meets_required_depth');
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.unresolvedCriteria.includes(
        'trademark-application-workflow-supports-preview-apply'
      ),
      true
    );
  });
});
