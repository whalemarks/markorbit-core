declare const coreTaskTypeBrand: unique symbol;

export type CoreTaskType = string & { readonly [coreTaskTypeBrand]: true };

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCoreTaskType(value: string): CoreTaskType {
  if (typeof value !== 'string') {
    throw new TypeError('CoreTaskType must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreTaskType must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreTaskType must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreTaskType must not be longer than 120 characters.');
  }

  if (!kebabCasePattern.test(value)) {
    throw new Error('CoreTaskType must be kebab-case.');
  }

  return value as CoreTaskType;
}
