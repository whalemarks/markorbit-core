import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreTestContract } from './core-test-contract.ts';

const statuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sourceRoot =
  'books/book-02-core-specification/core-specs/contracts/tests/';

const lockedEntries = [
  [
    'common-contract-tests',
    'Core Common Contract Test Skeleton',
    'common-contract-tests.md'
  ],
  [
    'api-contract-tests',
    'Core API Contract Test Skeleton',
    'api-contract-tests.md'
  ],
  [
    'workflow-contract-tests',
    'Core Workflow Contract Test Skeleton',
    'workflow-contract-tests.md'
  ],
  [
    'agent-boundary-tests',
    'Core Agent Boundary Test Skeleton',
    'agent-boundary-tests.md'
  ],
  [
    'permission-policy-tests',
    'Core Permission Policy Test Skeleton',
    'permission-policy-tests.md'
  ],
  [
    'idempotency-event-tests',
    'Core Idempotency Event Test Skeleton',
    'idempotency-event-tests.md'
  ],
  [
    'error-versioning-tests',
    'Core Error Versioning Test Skeleton',
    'error-versioning-tests.md'
  ]
] as const;

export const FORBIDDEN_CORE_TEST_EXECUTABLE_FIELDS = [
  'execute',
  'run',
  'handler',
  'testCases',
  'assertions',
  'fixtureData',
  'setup',
  'teardown',
  'mock',
  'request',
  'response',
  'expectedResult',
  'runtimeState',
  'coverageResult',
  'permissionDecision',
  'policyDecision',
  'reviewDecision'
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)
  );
}

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => collectKeys(entry));
  if (!isPlainObject(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested)
  ]);
}

export function validateCoreTestContractSkeletons(
  entries: readonly CoreTestContract[]
): readonly string[] {
  if (!Array.isArray(entries))
    return ['Core Test Contract skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const testTypes = new Set<string>();
  const names = new Set<string>();

  if (entries.length !== lockedEntries.length)
    errors.push(
      `Core Test Contract skeletons must contain exactly ${lockedEntries.length} entries.`
    );

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    const locked = lockedEntries[index];
    if (locked !== undefined) {
      if (entry.id !== `core-test-${locked[0]}-contract`)
        errors.push(`${path}.id must match the locked Book 2 target.`);
      if (entry.testType !== locked[0])
        errors.push(`${path}.testType must match the locked Book 2 target.`);
      if (entry.name !== locked[1])
        errors.push(`${path}.name must match the locked Book 2 target.`);
      if (entry.sourcePath !== `${sourceRoot}${locked[2]}`)
        errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
    }

    if (!entry.id) errors.push(`${path}.id is required.`);
    if (!entry.testType) errors.push(`${path}.testType is required.`);
    if (!entry.name) errors.push(`${path}.name is required.`);
    if (!entry.description) errors.push(`${path}.description is required.`);
    if (!entry.status) errors.push(`${path}.status is required.`);
    if (!entry.book) errors.push(`${path}.book is required.`);
    if (!entry.sourcePath) errors.push(`${path}.sourcePath is required.`);
    if (!entry.purpose) errors.push(`${path}.purpose is required.`);
    if (!isNonEmptyStringArray(entry.testSubjects))
      errors.push(`${path}.testSubjects must be a non-empty string array.`);
    if (!isNonEmptyStringArray(entry.requiredFixtureFamilies))
      errors.push(
        `${path}.requiredFixtureFamilies must be a non-empty string array.`
      );
    if (!isNonEmptyStringArray(entry.nonGoals))
      errors.push(`${path}.nonGoals must be a non-empty string array.`);
    if (entry.implementationDepth !== 'validated_skeleton')
      errors.push(`${path}.implementationDepth must be validated_skeleton.`);
    if (!entry.createdAt) errors.push(`${path}.createdAt is required.`);

    if (typeof entry.id === 'string') {
      if (ids.has(entry.id)) errors.push(`${path}.id must be unique.`);
      ids.add(entry.id);
    }
    if (typeof entry.testType === 'string') {
      if (!kebabCasePattern.test(entry.testType))
        errors.push(`${path}.testType must be kebab-case.`);
      if (testTypes.has(entry.testType))
        errors.push(`${path}.testType must be unique.`);
      testTypes.add(entry.testType);
    }
    if (typeof entry.name === 'string') {
      if (names.has(entry.name)) errors.push(`${path}.name must be unique.`);
      names.add(entry.name);
    }
    if (typeof entry.status === 'string' && !statuses.has(entry.status))
      errors.push(`${path}.status must be a valid CoreContractStatus.`);

    if (!isPlainObject(entry.metadata)) {
      errors.push(`${path}.metadata must be a plain object.`);
    } else {
      if (
        entry.metadata.specificationRepository !==
        'whalemarks/markorbit-publication'
      )
        errors.push(
          `${path}.metadata.specificationRepository must match the locked repository.`
        );
      if (
        entry.metadata.specificationCommit !==
        '3349ecb8955021a8714d023348f8b24f941eb98f'
      )
        errors.push(
          `${path}.metadata.specificationCommit must match the locked commit.`
        );
      if (
        entry.metadata.specificationPath !== 'books/book-02-core-specification/'
      )
        errors.push(
          `${path}.metadata.specificationPath must match the locked Book 2 path.`
        );
      if (entry.metadata.implementationTask !== 'CORE-TASK-020')
        errors.push(
          `${path}.metadata.implementationTask must be CORE-TASK-020.`
        );
    }

    const keys = new Set(collectKeys(entry));
    for (const field of FORBIDDEN_CORE_TEST_EXECUTABLE_FIELDS)
      if (keys.has(field))
        errors.push(`${path} must not include executable field ${field}.`);
  });

  return errors;
}
