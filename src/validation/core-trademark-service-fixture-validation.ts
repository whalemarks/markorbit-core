import { validateCoreTrademarkServiceEvidenceFixture } from '../service-coverage/core-trademark-service-evidence-fixture.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreTrademarkServiceCoreLifecycleFixture(
  fixture: unknown
) {
  return createCoreValidationResult(
    validateCoreTrademarkServiceEvidenceFixture(fixture).map((entry) => ({
      code: entry.code,
      severity: 'error' as const,
      message: entry.message,
      path: entry.path
    }))
  );
}
