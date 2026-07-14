import { validateCoreJurisdictionServiceEvidenceFixture } from '../service-coverage/core-jurisdiction-service-evidence-fixture.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreJurisdictionServiceCoreLifecycleFixture(
  fixture: unknown
) {
  return createCoreValidationResult(
    validateCoreJurisdictionServiceEvidenceFixture(fixture).map((entry) => ({
      code: entry.code,
      severity: 'error' as const,
      message: entry.message,
      path: entry.path
    }))
  );
}
