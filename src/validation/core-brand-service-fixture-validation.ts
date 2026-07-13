import { validateCoreBrandServiceEvidenceFixture } from '../service-coverage/core-brand-service-evidence-fixture.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreBrandServiceCoreLifecycleFixture(fixture: unknown) {
  return createCoreValidationResult(
    validateCoreBrandServiceEvidenceFixture(fixture).map((entry) => ({
      code: entry.code,
      severity: 'error' as const,
      message: entry.message,
      path: entry.path
    }))
  );
}
