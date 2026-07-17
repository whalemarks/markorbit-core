import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOK_02_MVP_GAP_BASELINE,
  CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE
} from '../../src/index.ts';

describe('CORE-TASK-058B Book 02 Workflow evidence', () => {
  it('promotes Trademark Application Workflow and leaves Communication Review unresolved', () => {
    const evidence = CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE;
    assert.equal(evidence.implementationTask, 'CORE-TASK-058B');
    assert.equal(evidence.previewSupported, true);
    assert.equal(evidence.applySupported, true);
    assert.equal(evidence.directDomainMutation, false);
    assert.equal(evidence.directEventEmission, false);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.requirements.find(
        (entry) => entry.id === 'must-workflow-trademark-application-workflow'
      )?.currentDisposition,
      'meets_required_depth'
    );
    assert.notEqual(
      BOOK_02_MVP_GAP_BASELINE.requirements.find(
        (entry) => entry.id === 'must-workflow-communication-review-workflow'
      )?.currentDisposition,
      'meets_required_depth'
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.unresolvedCriteria.includes(
        'trademark-application-workflow-supports-preview-apply'
      ),
      false
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.unresolvedCriteria.includes(
        'communication-review-workflow-supports-preview-apply'
      ),
      true
    );
  });
});
