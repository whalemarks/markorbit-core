import { validateBook02PostServiceCompletionAudit } from '../mvp-coverage/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreBook02PostServiceCompletionAuditFixture(
  fixture: unknown
) {
  return createCoreValidationResult(
    validateBook02PostServiceCompletionAudit(fixture).map((issue) => ({
      code: issue.code,
      severity: 'error' as const,
      message: issue.message,
      path: issue.path
    }))
  );
}
