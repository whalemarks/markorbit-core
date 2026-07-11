import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CANONICAL_LAYER_TARGETS,
  CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES,
  CORE_CONTRACT_GAP_INVENTORY,
  CORE_CONTRACT_INDEX,
  CORE_DOMAIN_CONTRACT_TARGETS,
  CORE_DOMAIN_REGISTRY,
  validateCoreContractGapInventory
} from '../../src/index.ts';

describe('Core Book 2 Contract Gap Inventory', () => {
  it('passes the canonical inventory lock validation', () => {
    assert.deepEqual(
      validateCoreContractGapInventory(CORE_CONTRACT_GAP_INVENTORY),
      []
    );
  });

  it('defines Object, Service, and API targets for every Domain', () => {
    assert.equal(CORE_DOMAIN_CONTRACT_TARGETS.length, 78);
    for (const domain of CORE_DOMAIN_REGISTRY) {
      const targets = CORE_DOMAIN_CONTRACT_TARGETS.filter(
        (target) => target.domainId === domain.id
      );
      assert.deepEqual(
        targets.map((target) => target.layer),
        ['object', 'service', 'api']
      );
    }
  });

  it('maps 22 existing Domain targets and locks 56 new targets', () => {
    assert.equal(
      CORE_DOMAIN_CONTRACT_TARGETS.filter(
        (target) => target.disposition === 'map_existing_skeleton'
      ).length,
      22
    );
    assert.equal(
      CORE_DOMAIN_CONTRACT_TARGETS.filter(
        (target) => target.disposition === 'add_canonical_skeleton'
      ).length,
      56
    );
    assert.equal(CORE_CONTRACT_GAP_INVENTORY.summary.newObjectTargetCount, 14);
    assert.equal(CORE_CONTRACT_GAP_INVENTORY.summary.newServiceTargetCount, 16);
    assert.equal(CORE_CONTRACT_GAP_INVENTORY.summary.newApiTargetCount, 26);
  });

  it('locks 10 Common, 8 Workflow, and 7 Test Contract targets', () => {
    assert.equal(
      CORE_CANONICAL_LAYER_TARGETS.filter((target) => target.layer === 'common')
        .length,
      10
    );
    assert.equal(
      CORE_CANONICAL_LAYER_TARGETS.filter(
        (target) => target.layer === 'workflow'
      ).length,
      8
    );
    assert.equal(
      CORE_CANONICAL_LAYER_TARGETS.filter((target) => target.layer === 'test')
        .length,
      7
    );
  });

  it('requires Common and Test contract types in follow-on work', () => {
    assert.deepEqual(
      CORE_CONTRACT_GAP_INVENTORY.requiredContractTypeAdditions,
      ['common', 'test']
    );
  });

  it('locks 81 unique new ids that do not exist in the current index', () => {
    const newTargets = [
      ...CORE_DOMAIN_CONTRACT_TARGETS.filter(
        (target) => target.disposition === 'add_canonical_skeleton'
      ),
      ...CORE_CANONICAL_LAYER_TARGETS
    ];
    const ids = newTargets.map((target) => target.targetContractId);
    const currentIds = new Set(
      CORE_CONTRACT_INDEX.map((contract) => contract.id)
    );
    assert.equal(ids.length, 81);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => !currentIds.has(id)));
  });

  it('sequences all additions into five controlled batches', () => {
    assert.deepEqual(
      CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES.map((batch) => [
        batch.id,
        batch.targetCount
      ]),
      [
        ['CORE-TASK-020', 17],
        ['CORE-TASK-021', 16],
        ['CORE-TASK-022', 18],
        ['CORE-TASK-023', 22],
        ['CORE-TASK-024', 8]
      ]
    );
    assert.equal(
      CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES.reduce(
        (total, batch) => total + batch.targetCount,
        0
      ),
      81
    );
  });

  it('retains Phase 2 API and Workflow scaffolds without claiming canonical coverage', () => {
    assert.deepEqual(
      CORE_CONTRACT_GAP_INVENTORY.retainedNoncanonicalScaffolds.map((entry) => [
        entry.family,
        entry.contractIds.length,
        entry.satisfiesCanonicalTargets
      ]),
      [
        ['api', 8, false],
        ['workflow', 8, false]
      ]
    );
  });

  it('does not change the current index and projects 187 after all batches', () => {
    assert.equal(CORE_CONTRACT_INDEX.length, 106);
    assert.equal(
      CORE_CONTRACT_GAP_INVENTORY.summary.currentIndexChangedByThisTask,
      false
    );
    assert.equal(
      CORE_CONTRACT_GAP_INVENTORY.summary.projectedIndexedContractCount,
      187
    );
  });
});
