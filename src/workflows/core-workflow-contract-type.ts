declare const coreWorkflowContractTypeBrand: unique symbol;

export type CoreWorkflowContractType = string & { readonly [coreWorkflowContractTypeBrand]: true };

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCoreWorkflowContractType(value: string): CoreWorkflowContractType {
  if (typeof value !== 'string') {
    throw new TypeError('CoreWorkflowContractType must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreWorkflowContractType must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreWorkflowContractType must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreWorkflowContractType must not be longer than 120 characters.');
  }

  if (!kebabCasePattern.test(value)) {
    throw new Error('CoreWorkflowContractType must be kebab-case.');
  }

  return value as CoreWorkflowContractType;
}
