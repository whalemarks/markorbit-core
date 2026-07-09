import type { CoreContractDefinition } from './core-contract-definition.ts';
import { CORE_CONTRACT_STATUSES } from './core-contract-status.ts';
import { CORE_CONTRACT_TYPES } from './core-contract-type.ts';

const validTypes = new Set<string>(Object.values(CORE_CONTRACT_TYPES));
const validStatuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreContractIndex(index: readonly CoreContractDefinition[]): readonly string[] {
  if (!Array.isArray(index)) {
    return ['Core contract index must be an array.'];
  }

  const errors: string[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  const allIds = new Set<string>();

  for (const contract of index) {
    if (contract && typeof contract.id === 'string') allIds.add(contract.id);
  }

  index.forEach((contract, indexPosition) => {
    const path = `contracts[${indexPosition}]`;
    if (!isPlainObject(contract)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!contract.id) errors.push(`${path}.id is required.`);
    if (!contract.type) errors.push(`${path}.type is required.`);
    if (!contract.name) errors.push(`${path}.name is required.`);
    if (!contract.status) errors.push(`${path}.status is required.`);
    if (contract.version === undefined) errors.push(`${path}.version is required.`);
    if (typeof contract.version !== 'number' || !Number.isInteger(contract.version) || contract.version <= 0) errors.push(`${path}.version must be a positive integer.`);
    if (!contract.book) errors.push(`${path}.book is required.`);
    if (!contract.createdAt) errors.push(`${path}.createdAt is required.`);

    if (typeof contract.id === 'string') {
      if (ids.has(contract.id)) errors.push(`${path}.id must be unique.`);
      ids.add(contract.id);
    }

    if (typeof contract.name === 'string') {
      if (names.has(contract.name)) errors.push(`${path}.name must be unique.`);
      names.add(contract.name);
    }

    if (typeof contract.type === 'string' && !validTypes.has(contract.type)) errors.push(`${path}.type must be a valid CoreContractType.`);
    if (typeof contract.status === 'string' && !validStatuses.has(contract.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (contract.metadata !== undefined && !isPlainObject(contract.metadata)) errors.push(`${path}.metadata must be a plain object.`);

    if (contract.dependencies !== undefined) {
      if (!Array.isArray(contract.dependencies)) {
        errors.push(`${path}.dependencies must be an array.`);
      } else {
        contract.dependencies.forEach((dependency, dependencyIndex) => {
          const dependencyPath = `${path}.dependencies[${dependencyIndex}]`;
          if (!isPlainObject(dependency)) {
            errors.push(`${dependencyPath} must be a plain object.`);
            return;
          }
          if (!dependency.id) errors.push(`${dependencyPath}.id is required.`);
          if (!dependency.type) errors.push(`${dependencyPath}.type is required.`);
          if (typeof dependency.type === 'string' && !validTypes.has(dependency.type)) errors.push(`${dependencyPath}.type must be a valid CoreContractType.`);
          if (typeof dependency.status === 'string' && !validStatuses.has(dependency.status)) errors.push(`${dependencyPath}.status must be a valid CoreContractStatus.`);
          if (typeof dependency.id === 'string' && !allIds.has(dependency.id) && !dependency.status) {
            errors.push(`${dependencyPath} must reference an in-index id or provide status for an external reference.`);
          }
        });
      }
    }
  });

  return errors;
}
