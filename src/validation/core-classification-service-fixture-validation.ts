import { validateCoreClassificationServiceEvidenceFixture } from '../service-coverage/core-classification-service-evidence-fixture.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreClassificationServiceCoreScopeValidationFixture(
  fixture: unknown
) {
  return createCoreValidationResult(
    validateCoreClassificationServiceEvidenceFixture(fixture).map((entry) => ({
      code: entry.code,
      severity: 'error' as const,
      message: entry.message,
      path: entry.path
    }))
  );
}
