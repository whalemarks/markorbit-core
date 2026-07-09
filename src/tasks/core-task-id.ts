declare const coreTaskIdBrand: unique symbol;

export type CoreTaskId = string & { readonly [coreTaskIdBrand]: true };

export function createCoreTaskId(value: string): CoreTaskId {
  if (typeof value !== 'string') {
    throw new TypeError('CoreTaskId must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreTaskId must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreTaskId must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreTaskId must not be longer than 120 characters.');
  }

  return value as CoreTaskId;
}
