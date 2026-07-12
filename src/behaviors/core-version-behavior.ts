import {
  createCoreSafeError,
  type CoreBehaviorResult
} from './core-safe-error.ts';

export interface CoreVersionContext {
  readonly contractVersion: string;
  readonly schemaVersion?: string | null;
}

const semanticVersionPattern = /^v\d+\.\d+\.\d+$/;

export function validateCoreVersion(
  value: CoreVersionContext,
  supportedContractVersions: readonly string[]
): CoreBehaviorResult<CoreVersionContext> {
  if (!semanticVersionPattern.test(value.contractVersion))
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'VersionUnsupported',
        category: 'Version',
        message: 'The contract version is invalid.'
      })
    };
  if (
    value.schemaVersion !== null &&
    value.schemaVersion !== undefined &&
    !semanticVersionPattern.test(value.schemaVersion)
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'VersionUnsupported',
        category: 'Version',
        message: 'The schema version is invalid.'
      })
    };
  if (!supportedContractVersions.includes(value.contractVersion))
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'VersionUnsupported',
        category: 'Version',
        message: 'The contract version is not supported.'
      })
    };
  return { ok: true, value: Object.freeze({ ...value }) };
}
