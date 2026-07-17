import {
  CORE_API_BOUNDARY_EVIDENCE,
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
      message: 'CORE-TASK-057A API boundary fixture must be an array.'
    });
    return createCoreValidationResult(issues);
  }
  for (const message of validateCoreApiBoundaryEvidence(
    fixture as readonly CoreApiBoundaryEvidence[]
  ))
    issues.push({
      code: 'core.api_boundary.validation',
      severity: 'error',
      message
    });
  if (JSON.stringify(fixture) !== JSON.stringify(CORE_API_BOUNDARY_EVIDENCE))
    issues.push({
      code: 'core.api_boundary.fixture_drift',
      severity: 'error',
      message:
        'CORE-TASK-057A API boundary fixture must match deterministic source evidence.'
    });
  return createCoreValidationResult(issues);
}
