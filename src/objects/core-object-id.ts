declare const coreObjectIdBrand: unique symbol;

export type CoreObjectId = string & { readonly [coreObjectIdBrand]: true };

export function createCoreObjectId(value: string): CoreObjectId {
  if (typeof value !== 'string') {
    throw new TypeError('CoreObjectId must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreObjectId must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreObjectId must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreObjectId must not be longer than 120 characters.');
  }

  return value as CoreObjectId;
}
