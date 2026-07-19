import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOOK_02_FINAL_COMPLETION_AUDIT,
  deriveBook02FinalCompletionAudit,
  validateBook02FinalCompletionAudit
} from '../../src/mvp-coverage/book-02-final-completion-audit.ts';
import {
  CORE_TASK_060_FINAL_COMPLETION_LOCK,
  validateCoreTask060FinalCompletionLock
} from '../../src/mvp-coverage/core-task-060-final-completion-lock.ts';

test('CORE-TASK-060 final completion lock is explicit and valid', () => {
  assert.equal(CORE_TASK_060_FINAL_COMPLETION_LOCK.taskId, 'CORE-TASK-060');
  assert.equal(CORE_TASK_060_FINAL_COMPLETION_LOCK.requiredAcceptanceCriteria, 19);
  assert.deepEqual(validateCoreTask060FinalCompletionLock(), []);
});

test('Book 02 final audit proves all locked completion gates', () => {
  const audit = deriveBook02FinalCompletionAudit();
  assert.equal(audit.gates.acceptanceCriteriaSatisfied, 19);
  assert.equal(audit.gates.acceptanceCriteriaTotal, 19);
  assert.equal(audit.gates.allAcceptanceCriteriaSatisfied, true);
  assert.equal(audit.gates.domainCriterionSatisfied, true);
  assert.deepEqual(audit.gates.unresolvedNonDomainMustBuildRequirementIds, []);
  assert.equal(audit.gates.allNonDomainMustBuildRequirementsMeetDepth, true);
  assert.deepEqual(audit.gates.guardInspectionIncompleteRequirementIds, []);
  assert.equal(audit.gates.allGuardInspectionsComplete, true);
  assert.equal(audit.gates.neverInMvpViolationCount, 0);
  assert.equal(audit.gates.documentOnlyUnexpectedImplementationCount, 0);
  assert.equal(audit.gates.deferredUnexpectedBlockingImplementationCount, 0);
  assert.equal(audit.gates.stubProductionDepthViolationCount, 0);
  assert.equal(audit.gates.finalCompletionLockValid, true);
  assert.equal(audit.book02MvpComplete, true);
  assert.equal(audit.completionStatus, 'complete');
  assert.equal(audit.nextProgram, 'BOOK-03-ENGINEERING-TRANSFORMATION');
  assert.deepEqual(validateBook02FinalCompletionAudit(audit), []);
});

test('exported final audit is deterministic', () => {
  assert.deepEqual(BOOK_02_FINAL_COMPLETION_AUDIT, deriveBook02FinalCompletionAudit());
});
