declare const coreEventTypeBrand: unique symbol;

export type CoreEventType = string & { readonly [coreEventTypeBrand]: true };

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCoreEventType(value: string): CoreEventType {
  if (typeof value !== 'string') {
    throw new TypeError('CoreEventType must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreEventType must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreEventType must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreEventType must not be longer than 120 characters.');
  }

  if (!kebabCasePattern.test(value)) {
    throw new Error('CoreEventType must be kebab-case.');
  }

  return value as CoreEventType;
}
