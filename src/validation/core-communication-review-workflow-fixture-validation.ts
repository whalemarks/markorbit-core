import {
  createCoreValidationResult,
  type CoreValidationResult
} from './core-validation-result.ts';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
export function validateCoreCommunicationReviewWorkflowFixture(
  fixture: unknown
): CoreValidationResult {
  const issues = [];
  const record = asRecord(fixture);
  if (!record)
    return createCoreValidationResult([
      {
        code: 'core_task_058c.fixture.invalid',
        message: 'CORE-TASK-058C fixture must be an object.',
        severity: 'error'
      }
    ]);
  for (const [key, value] of Object.entries({
    fixtureType: 'core_task_058c_communication_review_workflow',
    requirementId: 'communication-review-workflow-supports-preview-apply',
    workflowId: 'must-workflow-communication-review-workflow',
    workflowType: 'bounded-communication-review-workflow',
    implementationTask: 'CORE-TASK-058C',
    currentDepth: 'meets_required_depth',
    nextTask: 'CORE-TASK-059'
  }))
    if (record[key] !== value)
      issues.push({
        code: 'core_task_058c.fixture.drift',
        message: `${key} drifted from CORE-TASK-058C evidence.`,
        severity: 'error' as const,
        path: key
      });
  for (const key of [
    'previewSupported',
    'applySupported',
    'deterministicPreview',
    'previewValidationOnly',
    'separateTypedPlans',
    'humanReviewRequired',
    'permissionPolicyPreserved',
    'idempotencyRequired',
    'partialFailureSupported',
    'eventReferencesTraceOnly'
  ])
    if (record[key] !== true)
      issues.push({
        code: 'core_task_058c.fixture.missing_capability',
        message: `${key} must be true.`,
        severity: 'error' as const,
        path: key
      });
  if (
    record.directDomainMutation !== false ||
    record.directEventEmission !== false ||
    record.mvpComplete !== false
  )
    issues.push({
      code: 'core_task_058c.fixture.boundary',
      message:
        'Fixture must prove no direct mutation/event emission and keep MVP incomplete.',
      severity: 'error' as const
    });
  const scenarios = Array.isArray(record.declaredScenarios)
    ? record.declaredScenarios
    : [];
  if (scenarios.length < 31)
    issues.push({
      code: 'core_task_058c.fixture.scenarios',
      message:
        'Fixture must declare positive and negative executable scenario evidence.',
      severity: 'error' as const,
      path: 'declaredScenarios'
    });
  return createCoreValidationResult(issues);
}
