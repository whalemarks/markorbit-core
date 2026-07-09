declare const coreEventIdBrand: unique symbol;

export type CoreEventId = string & { readonly [coreEventIdBrand]: true };

export function createCoreEventId(value: string): CoreEventId {
  if (typeof value !== 'string') {
    throw new TypeError('CoreEventId must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreEventId must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreEventId must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreEventId must not be longer than 120 characters.');
  }

  return value as CoreEventId;
}
