import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_BEHAVIOR_ACCEPTANCE_EXPECTED_IMPLEMENTATION_BATCHES,
  CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS,
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
  deriveCoreContractBehaviorAcceptanceSummary,
  validateCoreContractBehaviorAcceptanceLock,
  type CoreBehaviorAcceptanceEvidence
} from '../../src/behavior-coverage/index.ts';
import { CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE } from '../../src/behavior-coverage/core-contract-behavior-coverage-baseline.ts';

type MutableAcceptanceLock = {
  id: string;
  version: string;
  task: string;
  scope: string;
  authority: Record<string, string>;
  evidence: CoreBehaviorAcceptanceEvidence[];
  acceptedImplementationBatches: string[];
  nonGoals: string[];
};

function mutableLock(): MutableAcceptanceLock {
  return structuredClone(
    CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK
  ) as unknown as MutableAcceptanceLock;
}

function assertInvalid(value: unknown): void {
  assert.notEqual(validateCoreContractBehaviorAcceptanceLock(value).length, 0);
}

describe('Core contract behavior acceptance lock', () => {
  it('validates the canonical lock and derives the accepted summary', () => {
    assert.deepEqual(
      validateCoreContractBehaviorAcceptanceLock(
        CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK
      ),
      []
    );
    const summary = deriveCoreContractBehaviorAcceptanceSummary(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK
    );
    assert.equal(summary.behaviorTargetsAccepted, 14);
    assert.equal(summary.mustBuildNowAccepted, 11);
    assert.equal(summary.implementedBatchTargets, 12);
    assert.equal(summary.preexistingMinimumTargets, 2);
    assert.equal(summary.implementationBatchesAccepted, 4);
  });

  it('contains exactly 14 ordered behavior IDs matching the coverage baseline', () => {
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.map(
        (entry) => entry.behaviorId
      ),
      CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.targets.map(
        (target) => target.id
      )
    );
  });

  it('derives implementation batches independently from the gap inventory', () => {
    assert.deepEqual(CORE_BEHAVIOR_ACCEPTANCE_EXPECTED_IMPLEMENTATION_BATCHES, [
      'CORE-TASK-028',
      'CORE-TASK-029',
      'CORE-TASK-030',
      'CORE-TASK-031'
    ]);
  });

  it('rejects duplicate, missing, and extra behavior IDs', () => {
    const duplicate = mutableLock();
    duplicate.evidence[1] = {
      ...duplicate.evidence[1],
      behaviorId: 'references'
    };
    assertInvalid(duplicate);

    const missing = mutableLock();
    missing.evidence.splice(1, 1);
    assertInvalid(missing);

    const extra = mutableLock();
    extra.evidence.push({ ...extra.evidence[0], behaviorId: 'extra-behavior' });
    assertInvalid(extra);
  });

  it('rejects wrong, missing, added, and reordered accepted batches', () => {
    const wrongTargetBatch = mutableLock();
    wrongTargetBatch.evidence[4] = {
      ...wrongTargetBatch.evidence[4],
      implementationTasks: ['CORE-TASK-030']
    };
    assertInvalid(wrongTargetBatch);

    const missingBatch = mutableLock();
    missingBatch.acceptedImplementationBatches.pop();
    assertInvalid(missingBatch);

    const addedBatch = mutableLock();
    addedBatch.acceptedImplementationBatches.push('CORE-TASK-999');
    assertInvalid(addedBatch);

    const reorderedBatch = mutableLock();
    reorderedBatch.acceptedImplementationBatches = [
      'CORE-TASK-029',
      'CORE-TASK-028',
      'CORE-TASK-030',
      'CORE-TASK-031'
    ];
    assertInvalid(reorderedBatch);
  });

  it('rejects preexisting minimum targets that claim implementation or complete engines', () => {
    const workflowImplemented = mutableLock();
    workflowImplemented.evidence[12] = {
      ...workflowImplemented.evidence[12],
      acceptanceBasis: 'implemented_batch',
      implementationTasks: ['CORE-TASK-031']
    };
    assertInvalid(workflowImplemented);

    const policyComplete = mutableLock();
    policyComplete.evidence[13] = {
      ...policyComplete.evidence[13],
      evidenceDescription: ['complete Policy Engine accepted']
    };
    assertInvalid(policyComplete);
  });

  it('rejects missing source/test evidence and unsafe paths', () => {
    const missingSource = mutableLock();
    missingSource.evidence[0] = {
      ...missingSource.evidence[0],
      sourceFiles: []
    };
    assertInvalid(missingSource);

    const missingTest = mutableLock();
    missingTest.evidence[0] = { ...missingTest.evidence[0], testFiles: [] };
    assertInvalid(missingTest);

    const absolutePath = mutableLock();
    absolutePath.evidence[0] = {
      ...absolutePath.evidence[0],
      sourceFiles: ['/tmp/core-reference-behavior.ts']
    };
    assertInvalid(absolutePath);

    const parentTraversal = mutableLock();
    parentTraversal.evidence[0] = {
      ...parentTraversal.evidence[0],
      testFiles: ['../tests/unit/core-safety-boundary-foundations.test.ts']
    };
    assertInvalid(parentTraversal);
  });

  it('rejects depth below the baseline minimum', () => {
    const lowBaseline = {
      targets: CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.targets.map(
        (target, index) =>
          index === 0 ? { ...target, currentDepth: 0 as const } : target
      )
    };
    assertInvalidWithBaseline(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
      lowBaseline
    );
  });

  it('rejects missing, replaced, added, and reordered non-goals', () => {
    assert.deepEqual(
      CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.nonGoals,
      CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS
    );

    const missingNonGoal = mutableLock();
    missingNonGoal.nonGoals.pop();
    assertInvalid(missingNonGoal);

    const replacedNonGoal = mutableLock();
    replacedNonGoal.nonGoals[0] = 'runtime_complete';
    assertInvalid(replacedNonGoal);

    const addedNonGoal = mutableLock();
    addedNonGoal.nonGoals.push('extra_boundary');
    assertInvalid(addedNonGoal);

    const reorderedNonGoal = mutableLock();
    reorderedNonGoal.nonGoals = [
      CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS[1],
      CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS[0],
      ...CORE_BEHAVIOR_ACCEPTANCE_REQUIRED_NON_GOALS.slice(2)
    ];
    assertInvalid(reorderedNonGoal);
  });

  it('rejects changed canonical metadata', () => {
    for (const [key, value] of [
      ['id', 'wrong-id'],
      ['version', '9.9.9'],
      ['task', 'CORE-TASK-999'],
      ['scope', 'wrong_scope']
    ] as const) {
      const lock = mutableLock();
      lock[key] = value;
      assertInvalid(lock);
    }
  });

  it('rejects changed authority data', () => {
    for (const key of [
      'specificationRepository',
      'specificationCommit',
      'mvpCut',
      'traceability',
      'validation'
    ] as const) {
      const lock = mutableLock();
      lock.authority[key] = 'wrong';
      assertInvalid(lock);
    }
  });
});

function assertInvalidWithBaseline(
  value: unknown,
  baseline: Parameters<typeof validateCoreContractBehaviorAcceptanceLock>[1]
): void {
  assert.notEqual(
    validateCoreContractBehaviorAcceptanceLock(value, baseline).length,
    0
  );
}
