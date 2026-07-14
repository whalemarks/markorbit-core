import { validateCoreEvidenceServiceEvidenceFixture } from '../service-coverage/core-evidence-service-evidence-fixture.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreEvidenceServiceProofLayerFoundationFixture(
  fixture: unknown
) {
  return createCoreValidationResult(
    validateCoreEvidenceServiceEvidenceFixture(fixture).map((entry) => ({
      code: entry.code,
      severity: 'error' as const,
      message: entry.message,
      path: entry.path
    }))
  );
}
