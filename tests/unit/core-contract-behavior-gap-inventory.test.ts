import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY,
  CORE_CONTRACT_BEHAVIOR_GAP_TARGETS,
  CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES,
  validateCoreContractBehaviorGapInventory
} from '../../src/index.ts';

describe('Core Contract Behavior Gap Inventory', () => {
  it('locks 12 minimum-depth gaps totaling 22 depth increments', () => {
    assert.equal(CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.length, 12);
    assert.equal(
      CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY.summary.totalDepthIncrement,
      22
    );
    assert.equal(
      new Set(
        CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.map((entry) => entry.behaviorId)
      ).size,
      12
    );
    assert.ok(
      CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.every(
        (entry) => entry.depthIncrement > 0
      )
    );
  });

  it('locks four dependency-ordered implementation batches', () => {
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES.map((entry) => entry.id),
      ['CORE-TASK-028', 'CORE-TASK-029', 'CORE-TASK-030', 'CORE-TASK-031']
    );
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES.map(
        (entry) => entry.targetCount
      ),
      [5, 1, 4, 2]
    );
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES[3].dependsOn,
      ['CORE-TASK-029', 'CORE-TASK-030']
    );
  });

  it('excludes only minimum-satisfied Workflow and Policy Engine targets', () => {
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY.excludedFromMinimumDepthWork.map(
        (entry) => entry.behaviorId
      ),
      ['workflow-engine', 'policy-engine']
    );
  });

  it('does not implement behavior in the inventory task', () => {
    assert.equal(
      CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY.summary
        .behaviorImplementedByThisTask,
      false
    );
    assert.equal(
      CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY.scope,
      'behavior_gap_inventory_lock_only'
    );
  });

  it('rejects changed batch assignments', () => {
    const changed = structuredClone(CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY) as {
      targets: { implementationBatch: string }[];
    };
    changed.targets[0].implementationBatch = 'CORE-TASK-999';
    assert.ok(validateCoreContractBehaviorGapInventory(changed).length > 0);
  });
});
