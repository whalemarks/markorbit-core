import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOK_02_MVP_GAP_BASELINE,
  BOOK_02_POST_SERVICE_COMPLETION_AUDIT,
  CORE_API_BOUNDARY_EVIDENCE
} from '../../src/index.ts';

const completedDomains = [
  'identity',
  'organization',
  'user',
  'permission',
  'policy'
] as const;

describe('CORE-TASK-057A Book 02 API evidence', () => {
  it('promotes exactly five API requirements to validator and Service-delegation depth', () => {
    for (const domain of completedDomains) {
      const requirement = BOOK_02_MVP_GAP_BASELINE.requirements.find(
        (entry) => entry.id === `must-api-${domain}-api-contract`
      );
      const evidence = CORE_API_BOUNDARY_EVIDENCE.find(
        (entry) => entry.domainId === domain
      );
      assert.equal(requirement?.currentDisposition, 'meets_required_depth');
      assert.equal(requirement?.currentDepth, 'level_2');
      assert.deepEqual(requirement?.contractIds, [evidence?.apiContractId]);
      assert.deepEqual(
        requirement?.implementationFiles,
        evidence?.implementationFiles
      );
      assert.deepEqual(requirement?.testFiles, evidence?.testFiles);
      assert.deepEqual(requirement?.fixtureFiles, evidence?.fixtureFiles);
    }
  });

  it('confirms no Must Build API requirements remain structural', () => {
    const incomplete = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (entry) =>
        entry.layer === 'api' &&
        entry.category === 'must_build_now' &&
        entry.currentDisposition !== 'meets_required_depth'
    );
    assert.equal(incomplete.length, 0);
    assert.ok(
      incomplete.every(
        (entry) => entry.currentDisposition === 'validated_skeleton_only'
      )
    );
  });

  it('advances the baseline and completes the API acceptance criterion', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 88,
      partial_evidence: 3,
      validated_skeleton_only: 19,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 0,
      fixture_only: 0,
      missing: 0
    });
    const apiCriterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (entry) => entry.id === 'must-build-api-validators-exist'
    );
    assert.equal(apiCriterion?.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });

  it('closes API blockers and selects CORE-TASK-058C after Trademark Workflow correction', () => {
    assert.equal(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.unresolvedInventory.total,
      27
    );
    assert.equal(
      'api' in
        BOOK_02_POST_SERVICE_COMPLETION_AUDIT.unresolvedInventory.byLayer,
      false
    );
    assert.equal(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.completionSemantics
        .completionBlockingNonDomainRequirementIds.length,
      9
    );
    assert.equal(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.nextTask,
      'CORE-TASK-058C'
    );
  });
});
