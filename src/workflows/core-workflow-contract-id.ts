declare const coreWorkflowContractIdBrand: unique symbol;

export type CoreWorkflowContractId = string & { readonly [coreWorkflowContractIdBrand]: true };

export function createCoreWorkflowContractId(value: string): CoreWorkflowContractId {
  if (typeof value !== 'string') {
    throw new TypeError('CoreWorkflowContractId must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreWorkflowContractId must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreWorkflowContractId must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreWorkflowContractId must not be longer than 120 characters.');
  }

  return value as CoreWorkflowContractId;
}
