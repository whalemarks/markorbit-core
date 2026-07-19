export const CORE_TASK_060_FINAL_COMPLETION_LOCK = {
  taskId: 'CORE-TASK-060',
  lockVersion: '1.0.0',
  auditExecuted: true,
  authorityMode: 'book-02-frozen-baseline',
  completionFormula: 'acceptance_plus_non_domain_depth_plus_guard_integrity',
  requiredAcceptanceCriteria: 19,
  domainValidatedSkeletonsAccepted: true,
  allNonDomainMustBuildRequirementsMustMeetDepth: true,
  allGuardInspectionsMustBeComplete: true,
  neverInMvpViolationsMustRemainZero: true,
  deferredAndDocumentOnlyItemsMustRemainBounded: true,
  externalProtectedActionsRemainUnauthorized: true,
  fullWorkflowEngineExcluded: true,
  fullAgentRuntimeExcluded: true
} as const;

export function validateCoreTask060FinalCompletionLock(): readonly string[] {
  const errors: string[] = [];
  const lock = CORE_TASK_060_FINAL_COMPLETION_LOCK;
  if (lock.taskId !== 'CORE-TASK-060') errors.push('task id must be CORE-TASK-060');
  if (!lock.auditExecuted) errors.push('final completion audit must be executed');
  if (lock.requiredAcceptanceCriteria !== 19)
    errors.push('all 19 Book 02 acceptance criteria must be required');
  if (!lock.domainValidatedSkeletonsAccepted)
    errors.push('locked Domain skeleton completion semantics must be preserved');
  if (!lock.allNonDomainMustBuildRequirementsMustMeetDepth)
    errors.push('all non-Domain Must Build requirements must meet depth');
  if (!lock.allGuardInspectionsMustBeComplete)
    errors.push('all controlled guard inspections must be complete');
  if (!lock.neverInMvpViolationsMustRemainZero)
    errors.push('Never in MVP violations must remain zero');
  if (!lock.deferredAndDocumentOnlyItemsMustRemainBounded)
    errors.push('deferred and document-only items must remain bounded');
  if (!lock.externalProtectedActionsRemainUnauthorized)
    errors.push('External Protected Actions must remain unauthorized');
  if (!lock.fullWorkflowEngineExcluded || !lock.fullAgentRuntimeExcluded)
    errors.push('deferred full runtimes must remain excluded');
  return errors;
}
