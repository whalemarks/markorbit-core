import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CANONICAL_LAYER_TARGETS,
  CORE_COMMON_CONTRACT_SKELETONS,
  FORBIDDEN_CORE_COMMON_EXECUTABLE_FIELDS,
  validateCoreCommonContractSkeletons
} from '../../src/index.ts';

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => collectKeys(entry));
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested)
  ]);
}

describe('Core Common Contract Skeletons', () => {
  it('has exactly the 10 inventory-locked targets', () => {
    const targets = CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.layer === 'common'
    );
    assert.equal(CORE_COMMON_CONTRACT_SKELETONS.length, 10);
    assert.deepEqual(
      CORE_COMMON_CONTRACT_SKELETONS.map((entry) => entry.id),
      targets.map((target) => target.targetContractId)
    );
    assert.deepEqual(
      CORE_COMMON_CONTRACT_SKELETONS.map((entry) => entry.name),
      targets.map((target) => target.targetName)
    );
  });

  it('passes Common Contract skeleton validation', () => {
    assert.deepEqual(
      validateCoreCommonContractSkeletons(CORE_COMMON_CONTRACT_SKELETONS),
      []
    );
  });

  it('uses unique Common types and exact Book 2 source paths', () => {
    const targets = CORE_CANONICAL_LAYER_TARGETS.filter(
      (target) => target.layer === 'common'
    );
    assert.equal(
      new Set(CORE_COMMON_CONTRACT_SKELETONS.map((entry) => entry.commonType))
        .size,
      10
    );
    assert.deepEqual(
      CORE_COMMON_CONTRACT_SKELETONS.map((entry) => entry.sourcePath),
      targets.map((target) => target.sourcePath)
    );
  });

  it('locks the publication repository, commit, path, and implementation task', () => {
    for (const entry of CORE_COMMON_CONTRACT_SKELETONS) {
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

  it('remains validated-skeleton depth without executable fields', () => {
    assert.ok(
      CORE_COMMON_CONTRACT_SKELETONS.every(
        (entry) => entry.implementationDepth === 'validated_skeleton'
      )
    );
    const keys = new Set(collectKeys(CORE_COMMON_CONTRACT_SKELETONS));
    for (const field of FORBIDDEN_CORE_COMMON_EXECUTABLE_FIELDS)
      assert.equal(keys.has(field), false);
  });

  it('rejects a changed locked source path', () => {
    const entries = structuredClone(
      CORE_COMMON_CONTRACT_SKELETONS
    ) as unknown as Record<string, unknown>[];
    entries[0].sourcePath = 'books/book-02-core-specification/wrong.md';
    assert.notDeepEqual(
      validateCoreCommonContractSkeletons(entries as never),
      []
    );
  });
});
