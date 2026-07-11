import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK,
  validateCoreContractCoverageAcceptanceLock
} from '../../src/index.ts';

describe('CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK', () => {
  it('accepts the complete Phase 3 structural state', () => {
    const lock = CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK;
    assert.equal(lock.acceptedState.indexedContractCount, 187);
    assert.equal(lock.acceptedState.structurallyCoveredContractFamilyCount, 12);
    assert.equal(lock.acceptedState.requiredLayerCompleteDomainCount, 26);
    assert.equal(lock.acceptedState.missingRequiredLayerSlotCount, 0);
    assert.equal(lock.acceptedState.completedCanonicalTargetCount, 81);
    assert.equal(lock.acceptedState.remainingCanonicalTargetCount, 0);
    assert.deepEqual(
      lock.acceptedState.implementationBatches.map((batch) => batch.id),
      [
        'CORE-TASK-020',
        'CORE-TASK-021',
        'CORE-TASK-022',
        'CORE-TASK-023',
        'CORE-TASK-024'
      ]
    );
    assert.ok(Object.values(lock.acceptanceChecks).every(Boolean));
  });

  it('does not accept runtime, behavior, or production readiness', () => {
    const boundary = CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK.assessmentBoundary;
    assert.equal(boundary.runtimeCoverageAccepted, false);
    assert.equal(boundary.behaviorCoverageAccepted, false);
    assert.equal(boundary.productionReadinessAccepted, false);
  });

  it('rejects drift in any accepted count', () => {
    const changed = structuredClone(CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK) as {
      acceptedState: { indexedContractCount: number };
    };
    changed.acceptedState.indexedContractCount = 188;
    assert.ok(validateCoreContractCoverageAcceptanceLock(changed).length > 0);
  });
});
