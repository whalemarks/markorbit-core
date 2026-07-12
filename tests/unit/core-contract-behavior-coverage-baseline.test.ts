import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE,
  CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS,
  validateCoreContractBehaviorCoverageBaseline
} from '../../src/index.ts';

describe('Core Contract Behavior Coverage Baseline', () => {
  it('locks all 14 Book 2 governance-depth targets', () => {
    assert.equal(CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.length, 14);
    assert.equal(
      new Set(CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.map((entry) => entry.id))
        .size,
      14
    );
  });

  it('reports the current behavior depth without treating skeletons as behavior', () => {
    const summary = CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE.summary;
    assert.equal(summary.meetsMinimumDepthCount, 14);
    assert.equal(summary.partialTargetCount, 0);
    assert.equal(summary.notImplementedTargetCount, 0);
    assert.equal(summary.mustBuildNowMeetsMinimumDepthCount, 11);
    assert.equal(summary.behaviorAcceptanceReady, true);
  });

  it('credits only existing generic Event and Workflow validation evidence', () => {
    const events = CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.find(
      (entry) => entry.id === 'events'
    );
    const workflow = CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.find(
      (entry) => entry.id === 'workflow-engine'
    );
    assert.equal(events?.currentDepth, 2);
    assert.equal(events?.status, 'meets_minimum_depth');
    assert.equal(workflow?.currentDepth, 1);
    assert.equal(workflow?.status, 'meets_minimum_depth');
  });

  it('keeps Policy Engine document-only', () => {
    const policyEngine = CORE_CONTRACT_BEHAVIOR_COVERAGE_TARGETS.find(
      (entry) => entry.id === 'policy-engine'
    );
    assert.equal(policyEngine?.mvpCategory, 'document_only');
    assert.equal(policyEngine?.currentDepth, 0);
    assert.deepEqual(policyEngine?.missingBehavior, []);
  });

  it('rejects changed behavior depth claims', () => {
    const changed = structuredClone(
      CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE
    ) as { targets: { currentDepth: number }[] };
    changed.targets[0].currentDepth = 2;
    assert.ok(validateCoreContractBehaviorCoverageBaseline(changed).length > 0);
  });
});
