import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { CORE_PERMISSION_CONTRACT_SKELETONS, EXCLUDED_CORE_PERMISSION_CONCEPTS } from '../../src/index.ts';

type CorePermissionContractSkeletonFixtureEntry = {
  readonly id: string;
  readonly permissionType: string;
  readonly name: string;
};

const fixture = JSON.parse(await readFile(new URL('../../fixtures/contracts/core-permission-contract-skeletons.fixture.json', import.meta.url), 'utf8')) as readonly CorePermissionContractSkeletonFixtureEntry[];
const forbiddenExecutableFields = ['evaluate', 'authorize', 'canAccess', 'checkPermission', 'permissionEngine'];
const forbiddenRbacFields = ['role', 'roles', 'rbac', 'roleBindings'];
const forbiddenAuthMiddlewareFields = ['middleware', 'guard', 'session', 'login', 'authenticator'];

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => collectKeys(entry));
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]);
}

describe('core-permission-contract-skeletons fixture', () => {
  it('fixture has exactly 8 entries', () => {
    assert.equal(fixture.length, 8);
  });

  it('fixture ids match CORE_PERMISSION_CONTRACT_SKELETONS ids exactly', () => {
    assert.deepEqual(fixture.map((entry) => entry.id), CORE_PERMISSION_CONTRACT_SKELETONS.map((entry) => entry.id));
  });

  it('fixture permissionTypes match CORE_PERMISSION_CONTRACT_SKELETONS permissionTypes exactly', () => {
    assert.deepEqual(fixture.map((entry) => entry.permissionType), CORE_PERMISSION_CONTRACT_SKELETONS.map((entry) => entry.permissionType));
  });

  it('fixture names match CORE_PERMISSION_CONTRACT_SKELETONS names exactly', () => {
    assert.deepEqual(fixture.map((entry) => entry.name), CORE_PERMISSION_CONTRACT_SKELETONS.map((entry) => entry.name));
  });

  it('fixture does not contain excluded permission concepts', () => {
    const serialized = JSON.stringify(fixture).toLowerCase();
    for (const concept of EXCLUDED_CORE_PERMISSION_CONCEPTS) assert.equal(serialized.includes(concept), false);
  });

  it('fixture does not contain executable permission logic', () => {
    const serialized = JSON.stringify(fixture);
    for (const field of forbiddenExecutableFields) assert.equal(serialized.includes(field), false);
  });

  it('fixture does not contain RBAC engine fields', () => {
    const keys = collectKeys(fixture);
    for (const field of forbiddenRbacFields) assert.equal(keys.includes(field), false);
  });

  it('fixture does not contain auth middleware fields', () => {
    const keys = collectKeys(fixture);
    for (const field of forbiddenAuthMiddlewareFields) assert.equal(keys.includes(field), false);
  });
});
