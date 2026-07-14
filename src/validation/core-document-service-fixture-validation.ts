import { validateCoreDocumentServiceEvidenceFixture } from '../service-coverage/core-document-service-evidence-fixture.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreDocumentServiceGovernedArtifactFoundationFixture(
  fixture: unknown
) {
  return createCoreValidationResult(
    validateCoreDocumentServiceEvidenceFixture(fixture).map((entry) => ({
      code: entry.code,
      severity: 'error' as const,
      message: entry.message,
      path: entry.path
    }))
  );
}
