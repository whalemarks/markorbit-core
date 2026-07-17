import {
  CORE_API_BOUNDARY_EVIDENCE,
  CORE_TASK_057A_API_BOUNDARY_EVIDENCE,
  CORE_TASK_057B_API_BOUNDARY_EVIDENCE,
  validateCoreApiBoundaryEvidence,
  type CoreApiBoundaryEvidence
} from '../api-coverage/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreApiBoundaryFixture(fixture: unknown) {
  const issues: {
    code: string;
    severity: 'error';
    message: string;
    path?: string;
  }[] = [];
  if (!Array.isArray(fixture)) {
    issues.push({
      code: 'core.api_boundary.fixture_invalid',
      severity: 'error',
      message: 'Core API boundary fixture must be an array.'
    });
    return createCoreValidationResult(issues);
  }
  const typed = fixture as readonly CoreApiBoundaryEvidence[];
  const expected = typed.every(
    (entry) => entry?.implementationTask === 'CORE-TASK-057A'
  )
    ? CORE_TASK_057A_API_BOUNDARY_EVIDENCE
    : typed.every((entry) => entry?.implementationTask === 'CORE-TASK-057B')
      ? CORE_TASK_057B_API_BOUNDARY_EVIDENCE
      : CORE_API_BOUNDARY_EVIDENCE;
  for (const message of validateCoreApiBoundaryEvidence(typed))
    issues.push({
      code: 'core.api_boundary.validation',
      severity: 'error',
      message
    });
  if (JSON.stringify(fixture) !== JSON.stringify(expected))
    issues.push({
      code: 'core.api_boundary.fixture_drift',
      severity: 'error',
      message: 'API boundary fixture must match deterministic source evidence.'
    });
  return createCoreValidationResult(issues);
}
