import {
  createCoreValidationResult,
  type CoreValidationResult
} from './core-validation-result.ts';

const requiredScenarios = [
  'deterministic preview',
  'preview without Brand',
  'preview with Brand',
  'successful Customer-only apply',
  'successful Customer-and-Brand apply',
  'correct ordered delegation',
  'valid idempotent replay',
  'conflicting idempotency replay',
  'altered digest rejection',
  'stale version rejection',
  'expired plan rejection',
  'missing approval rejection',
  'rejected approval',
  'consumed preview rejection',
  'organization mismatch',
  'Permission rejection',
  'Policy rejection',
  'Customer reference rejection',
  'Brand reference rejection',
  'no direct Domain mutation',
  'no direct Event emission',
  'Event references remain trace-only'
] as const;

export function validateCoreCustomerIntakeWorkflowFixture(
  fixture: unknown
): CoreValidationResult {
  const issues = [];
  if (typeof fixture !== 'object' || fixture === null || Array.isArray(fixture))
    return createCoreValidationResult([
      {
        code: 'core_task_058a.fixture.invalid',
        message: 'CORE-TASK-058A fixture must be an object.',
        severity: 'error'
      }
    ]);
  const record = fixture as Record<string, unknown>;
  for (const [key, value] of Object.entries({
    fixtureType: 'core_task_058a_customer_intake_workflow',
    requirementId: 'customer-intake-workflow-supports-preview-apply',
    workflowId: 'must-workflow-customer-intake-workflow',
    workflowType: 'bounded-customer-intake-workflow',
    workflowContractId: 'core-workflow-customer-intake-workflow-contract',
    implementationTask: 'CORE-TASK-058A',
    currentDepth: 'meets_required_depth'
  }))
    if (record[key] !== value)
      issues.push({
        code: 'core_task_058a.fixture.drift',
        message: `${key} drifted from CORE-TASK-058A evidence.`,
        severity: 'error' as const,
        path: key
      });
  for (const key of [
    'previewSupported',
    'applySupported',
    'deterministicPreview',
    'previewDigestRequired',
    'previewVersionRequired',
    'humanReviewRequired',
    'permissionPolicyPreserved',
    'idempotencyRequired'
  ])
    if (record[key] !== true)
      issues.push({
        code: 'core_task_058a.fixture.missing_capability',
        message: `${key} must be true.`,
        severity: 'error' as const,
        path: key
      });
  if (
    record.directDomainMutation !== false ||
    record.directEventEmission !== false
  )
    issues.push({
      code: 'core_task_058a.fixture.boundary',
      message:
        'Workflow fixture must prove no direct Domain mutation or Event emission.',
      severity: 'error' as const
    });
  const scenarios = Array.isArray(record.scenarios) ? record.scenarios : [];
  for (const scenario of requiredScenarios)
    if (!scenarios.includes(scenario))
      issues.push({
        code: 'core_task_058a.fixture.missing_scenario',
        message: `Missing scenario: ${scenario}.`,
        severity: 'error' as const,
        path: 'scenarios'
      });
  return createCoreValidationResult(issues);
}
