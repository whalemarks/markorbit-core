import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CANONICAL_LAYER_TARGETS,
  CORE_TEST_CONTRACT_SKELETONS,
  FORBIDDEN_CORE_TEST_EXECUTABLE_FIELDS,
  validateCoreTestContractSkeletons
} from '../../src/index.ts';

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => collectKeys(entry));
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested)
  ]);
}

describe('Core Test Contract Skeletons', () => {
  it('has exactly the 7 inventory-locked targets', () => {
    const targets = CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.layer === 'test'
    );
    assert.equal(CORE_TEST_CONTRACT_SKELETONS.length, 7);
    assert.deepEqual(
      CORE_TEST_CONTRACT_SKELETONS.map((entry) => entry.id),
      targets.map((target) => target.targetContractId)
    );
    assert.deepEqual(
      CORE_TEST_CONTRACT_SKELETONS.map((entry) => entry.name),
      targets.map((target) => target.targetName)
    );
  });

  it('passes Test Contract skeleton validation', () => {
    assert.deepEqual(
      validateCoreTestContractSkeletons(CORE_TEST_CONTRACT_SKELETONS),
      []
    );
  });

  it('uses unique Test types and exact Book 2 source paths', () => {
    const targets = CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.layer === 'test'
    );
    assert.equal(
      new Set(CORE_TEST_CONTRACT_SKELETONS.map((entry) => entry.testType)).size,
      7
    );
    assert.deepEqual(
      CORE_TEST_CONTRACT_SKELETONS.map((entry) => entry.sourcePath),
      targets.map((target) => target.sourcePath)
    );
  });

  it('declares subjects and fixture families without executable tests', () => {
    for (const entry of CORE_TEST_CONTRACT_SKELETONS) {
      assert.ok(entry.testSubjects.length > 0);
      assert.ok(entry.requiredFixtureFamilies.length > 0);
      assert.equal(entry.implementationDepth, 'validated_skeleton');
    }
    const keys = new Set(collectKeys(CORE_TEST_CONTRACT_SKELETONS));
    for (const field of FORBIDDEN_CORE_TEST_EXECUTABLE_FIELDS)
      assert.equal(keys.has(field), false);
  });

  it('locks the publication repository, commit, path, and implementation task', () => {
    for (const entry of CORE_TEST_CONTRACT_SKELETONS) {
      assert.equal(
        entry.metadata.specificationRepository,
        'whalemarks/markorbit-publication'
      );
      assert.equal(
        entry.metadata.specificationCommit,
        '3349ecb8955021a8714d023348f8b24f941eb98f'
      );
      assert.equal(
        entry.metadata.specificationPath,
        'books/book-02-core-specification/'
      );
      assert.equal(entry.metadata.implementationTask, 'CORE-TASK-020');
    }
  });

  it('rejects executable test fields', () => {
    const entries = structuredClone(
      CORE_TEST_CONTRACT_SKELETONS
    ) as unknown as Record<string, unknown>[];
    entries[0].assertions = ['not allowed'];
    assert.notDeepEqual(
      validateCoreTestContractSkeletons(entries as never),
      []
    );
  });
});
