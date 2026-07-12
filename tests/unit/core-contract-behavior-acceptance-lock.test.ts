import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
  deriveCoreContractBehaviorAcceptanceSummary,
  validateCoreContractBehaviorAcceptanceLock
} from '../../src/behavior-coverage/index.ts';
import { CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE } from '../../src/behavior-coverage/core-contract-behavior-coverage-baseline.ts';

describe('Core contract behavior acceptance lock', () => {
  it('accepts exactly the baseline targets in order at minimum depth', () => {
    assert.deepEqual(
      validateCoreContractBehaviorAcceptanceLock(
        CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK
      ),
      []
    );
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map((e) => e.behaviorId),
      CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.targets.map((t) => t.id)
    );
    const summary = deriveCoreContractBehaviorAcceptanceSummary(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK
    );
    assert.equal(summary.behaviorTargetsAccepted, 14);
    assert.equal(summary.mustBuildNowAccepted, 11);
    assert.equal(summary.implementedBatchTargets, 12);
    assert.equal(summary.preexistingMinimumTargets, 2);
  });

  it('keeps batch and preexisting minimum boundaries', () => {
    const byId = new Map(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map((entry) => [
        entry.behaviorId,
        entry
      ])
    );
    assert.equal(
      byId.get('workflow-engine')?.acceptanceBasis,
      'preexisting_minimum'
    );
    assert.deepEqual(byId.get('policy-engine')?.implementationTasks, []);
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.acceptedImplementationBatches,
      ['CORE-TASK-028', 'CORE-TASK-029', 'CORE-TASK-030', 'CORE-TASK-031']
    );
    for (const entry of CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence) {
      assert.ok(entry.sourceFiles.length > 0);
      assert.ok(entry.testFiles.length > 0);
    }
    assert.ok(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.nonGoals.includes(
        'production_ready'
      )
    );
  });

  it('rejects identity, batch, boundary, file, and depth drift', () => {
    const badId = {
      ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
      evidence: [
        {
          ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence[0],
          behaviorId: 'wrong'
        },
        ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.slice(1)
      ]
    };
    assert.notEqual(
      validateCoreContractBehaviorAcceptanceLock(badId).length,
      0
    );
    assert.notEqual(
      validateCoreContractBehaviorAcceptanceLock({
        ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
        evidence: CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.slice(1)
      }).length,
      0
    );
    const badBatch = {
      ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
      evidence: CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map((entry) =>
        entry.behaviorId === 'idempotency'
          ? { ...entry, implementationTasks: ['CORE-TASK-030'] }
          : entry
      )
    };
    assert.notEqual(
      validateCoreContractBehaviorAcceptanceLock(badBatch).length,
      0
    );
    const badWorkflow = {
      ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
      evidence: CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map((entry) =>
        entry.behaviorId === 'workflow-engine'
          ? {
              ...entry,
              acceptanceBasis: 'implemented_batch' as const,
              implementationTasks: ['CORE-TASK-031']
            }
          : entry
      )
    };
    assert.notEqual(
      validateCoreContractBehaviorAcceptanceLock(badWorkflow).length,
      0
    );
    const badPolicy = {
      ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
      evidence: CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map((entry) =>
        entry.behaviorId === 'policy-engine'
          ? {
              ...entry,
              evidenceDescription: ['complete Policy Engine accepted']
            }
          : entry
      )
    };
    assert.notEqual(
      validateCoreContractBehaviorAcceptanceLock(badPolicy).length,
      0
    );
    const badPath = {
      ...CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
      evidence: CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map(
        (entry, index) =>
          index === 0
            ? { ...entry, sourceFiles: ['/tmp/nope'], testFiles: ['../nope'] }
            : entry
      )
    };
    assert.notEqual(
      validateCoreContractBehaviorAcceptanceLock(badPath).length,
      0
    );
    const lowBaseline = {
      targets: CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.targets.map(
        (target, index) =>
          index === 0 ? { ...target, currentDepth: 0 as const } : target
      )
    };
    assert.notEqual(
      validateCoreContractBehaviorAcceptanceLock(
        CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
        lowBaseline
      ).length,
      0
    );
  });
});
