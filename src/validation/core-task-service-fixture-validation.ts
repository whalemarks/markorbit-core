import { CORE_TASK_IMPLEMENTED_OPERATIONS } from '../services/task/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreTaskServiceActionableWorkFoundationFixture(
  fixture: unknown
) {
  const issues: {
    code: string;
    severity: 'error';
    message: string;
    path?: string;
  }[] = [];
  if (
    typeof fixture !== 'object' ||
    fixture === null ||
    Array.isArray(fixture)
  ) {
    issues.push({
      code: 'core.task_service.fixture_invalid',
      severity: 'error',
      message: 'Task Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (record.fixtureType !== 'core_task_service_actionable_work_foundation')
    issues.push({
      code: 'core.task_service.fixture_type',
      severity: 'error',
      message: 'Task Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_TASK_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.task_service.operations',
      severity: 'error',
      message: 'Task Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !== CORE_TASK_IMPLEMENTED_OPERATIONS.length ||
    expected.assignmentDoesNotGrantPermission !== true ||
    expected.aiSuggestionRequiresGovernedActivation !== true ||
    expected.workflowCompletionGuardRequired !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true ||
    expected.noProjectManagementRuntime !== true
  )
    issues.push({
      code: 'core.task_service.expectations',
      severity: 'error',
      message: 'Task Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
