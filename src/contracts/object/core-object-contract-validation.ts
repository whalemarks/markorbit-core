import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreObjectContract } from './core-object-contract.ts';
import {
  CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS,
  CORE_STUB_OBJECT_CONTRACT_SKELETONS
} from './core-object-contract-skeletons.ts';
import {
  CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS,
  CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS
} from '../../objects/core-mvp-object-base-record.ts';

const excludedObjectConcepts = [
  'execution-context',
  'execution-runtime',
  'artifact',
  'render-job',
  'publish-package',
  'distillery-output',
  'workplace-item',
  'lite-record',
  'markreg-case',
  'product-screen',
  'workflow-runtime-instance',
  'task-runtime-instance',
  'ai-agent-session'
] as const;
const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const expectedContracts = [
  ...CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS,
  ...CORE_STUB_OBJECT_CONTRACT_SKELETONS
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreObjectContractSkeletons(contracts: readonly CoreObjectContract[]): readonly string[] {
  if (!Array.isArray(contracts)) return ['Core object contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const objectTypes = new Set<string>();
  const domains = new Set<string>();

  if (contracts.length !== 26) errors.push('Core object contract skeletons must contain exactly 26 entries.');

  contracts.forEach((contract, index) => {
    const path = `contracts[${index}]`;
    if (!isPlainObject(contract)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!contract.id) errors.push(`${path}.id is required.`);
    if (!contract.objectType) errors.push(`${path}.objectType is required.`);
    if (!contract.domainId) errors.push(`${path}.domainId is required.`);
    if (!contract.name) errors.push(`${path}.name is required.`);
    if (!contract.description) errors.push(`${path}.description is required.`);
    if (!contract.status) errors.push(`${path}.status is required.`);
    if (!contract.book) errors.push(`${path}.book is required.`);
    if (!contract.purpose) errors.push(`${path}.purpose is required.`);
    if (contract.base !== 'CoreMvpObjectBaseRecord') errors.push(`${path}.base must equal CoreMvpObjectBaseRecord.`);
    if (!Array.isArray(contract.requiredBaseFields)) errors.push(`${path}.requiredBaseFields must be an array.`);
    if (!Array.isArray(contract.optionalBaseFields)) errors.push(`${path}.optionalBaseFields must be an array.`);
    if (!Array.isArray(contract.owns)) errors.push(`${path}.owns must be an array.`);
    if (!Array.isArray(contract.nonGoals)) errors.push(`${path}.nonGoals must be an array.`);

    if (typeof contract.id === 'string') {
      if (ids.has(contract.id)) errors.push(`${path}.id must be unique.`);
      ids.add(contract.id);
    }
    if (typeof contract.objectType === 'string') {
      if (objectTypes.has(contract.objectType)) errors.push(`${path}.objectType must be unique.`);
      objectTypes.add(contract.objectType);
    }
    if (typeof contract.domainId === 'string') {
      if (domains.has(contract.domainId)) errors.push(`${path}.domainId must be unique.`);
      domains.add(contract.domainId);
      if (!domainIds.has(contract.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    }
    if (typeof contract.status === 'string' && !statuses.has(contract.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (contract.metadata !== undefined && !isPlainObject(contract.metadata)) errors.push(`${path}.metadata must be a plain object.`);

    const expected = expectedContracts[index];
    if (expected === undefined) return;
    if (contract.id !== expected.id) errors.push(`${path}.id must match the locked Object contract identity.`);
    if (contract.objectType !== expected.objectType) errors.push(`${path}.objectType must match the locked Object contract identity.`);
    if (contract.domainId !== expected.domainId) errors.push(`${path}.domainId must match the locked Object contract identity.`);
    if (contract.name !== expected.name) errors.push(`${path}.name must match the locked Object contract identity.`);
    if (contract.sourcePath !== expected.sourcePath) errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
    if (contract.implementationDepth !== 'validated_skeleton') errors.push(`${path}.implementationDepth must be validated_skeleton.`);
    if (JSON.stringify(contract.requiredBaseFields) !== JSON.stringify(CORE_MVP_OBJECT_BASE_RECORD_REQUIRED_FIELDS)) errors.push(`${path}.requiredBaseFields must match CoreMvpObjectBaseRecord required fields.`);
    if (JSON.stringify(contract.optionalBaseFields) !== JSON.stringify(CORE_MVP_OBJECT_BASE_RECORD_OPTIONAL_FIELDS)) errors.push(`${path}.optionalBaseFields must match CoreMvpObjectBaseRecord optional fields.`);
    if (!Array.isArray(contract.owns) || !contract.owns.some((entry) => typeof entry === 'string' && entry.includes('Public Object reference'))) errors.push(`${path}.owns must declare the public Object reference boundary.`);
    if (!isPlainObject(contract.metadata)) {
      errors.push(`${path}.metadata must be present for canonical Object skeletons.`);
    } else {
      if (contract.metadata.specificationRepository !== 'whalemarks/markorbit-publication') errors.push(`${path}.metadata.specificationRepository must match the locked repository.`);
      if (contract.metadata.specificationCommit !== '3349ecb8955021a8714d023348f8b24f941eb98f') errors.push(`${path}.metadata.specificationCommit must match the locked commit.`);
      if (contract.metadata.specificationPath !== 'books/book-02-core-specification/') errors.push(`${path}.metadata.specificationPath must match the locked Book 2 path.`);
      const expectedRequirement = index < CORE_MUST_BUILD_OBJECT_CONTRACT_SKELETONS.length ? 'must_build_now' : 'stub_now';
      if (contract.metadata.mvpRequirement !== expectedRequirement) errors.push(`${path}.metadata.mvpRequirement must be ${expectedRequirement}.`);
    }

    const serialized = JSON.stringify(contract).toLowerCase();
    for (const concept of excludedObjectConcepts) {
      if (serialized.includes(concept)) errors.push(`${path} must not include excluded object concept ${concept}.`);
    }
  });

  return errors;
}
