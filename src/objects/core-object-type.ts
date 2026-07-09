declare const coreObjectTypeBrand: unique symbol;

export type CoreObjectType = string & { readonly [coreObjectTypeBrand]: true };

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCoreObjectType(value: string): CoreObjectType {
  if (typeof value !== 'string') {
    throw new TypeError('CoreObjectType must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreObjectType must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreObjectType must not contain spaces or other whitespace.');
  }

  if (value.length > 80) {
    throw new Error('CoreObjectType must not be longer than 80 characters.');
  }

  if (!kebabCasePattern.test(value)) {
    throw new Error('CoreObjectType must be kebab-case.');
  }

  return value as CoreObjectType;
}
