export interface CoreObjectVersion {
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export type CoreObjectVersionInput = CoreObjectVersion;

const isoLikePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/;

function assertIsoLikeString(value: string, fieldName: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty ISO-like string.`);
  }

  if (!isoLikePattern.test(value)) {
    throw new Error(`${fieldName} must be an ISO-like string.`);
  }
}

export function createCoreObjectVersion(input: CoreObjectVersionInput): CoreObjectVersion {
  if (!Number.isInteger(input.version) || input.version <= 0) {
    throw new Error('CoreObjectVersion version must be a positive integer.');
  }

  assertIsoLikeString(input.createdAt, 'createdAt');

  if (input.updatedAt !== undefined) {
    assertIsoLikeString(input.updatedAt, 'updatedAt');
  }

  return { ...input };
}
