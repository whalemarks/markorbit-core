export const CORE_VALIDATION_SEVERITIES = ['error', 'warning', 'info'] as const;

export type CoreValidationSeverity = (typeof CORE_VALIDATION_SEVERITIES)[number];

export interface CoreValidationIssue {
  readonly code: string;
  readonly severity: CoreValidationSeverity;
  readonly message: string;
  readonly path?: string;
  readonly source?: string;
}

export interface CoreValidationResult {
  readonly ok: boolean;
  readonly issues: readonly CoreValidationIssue[];
}

export function createCoreValidationResult(issues: readonly CoreValidationIssue[]): CoreValidationResult {
  return {
    ok: !issues.some((issue) => issue.severity === 'error'),
    issues
  };
}
