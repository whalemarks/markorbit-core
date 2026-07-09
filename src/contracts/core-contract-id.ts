declare const coreContractIdBrand: unique symbol;

export type CoreContractId = string & { readonly [coreContractIdBrand]: true };

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCoreContractId(value: string): CoreContractId {
  if (typeof value !== 'string') {
    throw new TypeError('CoreContractId must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreContractId must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreContractId must not contain spaces or other whitespace.');
  }

  if (value.length > 160) {
    throw new Error('CoreContractId must not be longer than 160 characters.');
  }

  if (!kebabCasePattern.test(value)) {
    throw new Error('CoreContractId must be kebab-case.');
  }

  return value as CoreContractId;
}
