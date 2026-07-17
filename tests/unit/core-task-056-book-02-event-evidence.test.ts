import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BOOK_02_MVP_GAP_BASELINE,
  BOOK_02_POST_SERVICE_COMPLETION_AUDIT,
  CORE_MVP_EVENT_CONTRACT_LOCKS,
  CORE_MVP_EVENT_TYPES
} from '../../src/index.ts';

const eventRequirements = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
  (entry) => entry.layer === 'event' && entry.category === 'must_build_now'
);

describe('CORE-TASK-056 Book 02 exact Event evidence', () => {
  it('promotes all 18 Must Build Event requirements to exact required depth', () => {
    assert.equal(eventRequirements.length, 18);
    assert.deepEqual(
      eventRequirements.map((entry) => entry.id),
      CORE_MVP_EVENT_TYPES.map((eventType) => `must-event-${eventType}`)
    );
    assert.ok(
      eventRequirements.every(
        (entry) =>
          entry.currentDisposition === 'meets_required_depth' &&
          entry.currentDepth === 'level_1' &&
          entry.contractIds.length >= 1 &&
          entry.implementationFiles.includes(
            'src/contracts/event/core-mvp-event-contract-lock.ts'
          ) &&
          entry.testFiles.includes(
            'tests/unit/core-mvp-event-contract-lock.test.ts'
          ) &&
          entry.fixtureFiles.includes(
            'fixtures/contracts/core-mvp-event-contract-lock.fixture.json'
          )
      )
    );
  });

  it('locks 15 canonical records and exactly three validated aliases', () => {
    assert.equal(
      CORE_MVP_EVENT_CONTRACT_LOCKS.filter(
        (entry) => entry.resolution.kind === 'canonical'
      ).length,
      15
    );
    assert.deepEqual(
      CORE_MVP_EVENT_CONTRACT_LOCKS.filter(
        (entry) => entry.resolution.kind === 'validated_alias'
      ).map((entry) => String(entry.eventType)),
      [
        'document-attached',
        'communication-reviewed',
        'workflow-contract-previewed'
      ]
    );
  });

  it('updates the baseline without claiming execution-spine completion', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 87,
      partial_evidence: 3,
      validated_skeleton_only: 20,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 0,
      fixture_only: 0,
      missing: 0
    });
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      15
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });

  it('keeps Event blockers closed after CORE-TASK-057A', () => {
    assert.equal(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.unresolvedInventory.total,
      28
    );
    assert.equal(
      'event' in
        BOOK_02_POST_SERVICE_COMPLETION_AUDIT.unresolvedInventory.byLayer,
      false
    );
    assert.equal(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.completionSemantics
        .completionBlockingNonDomainRequirementIds.length,
      10
    );
    assert.equal(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.nextTask,
      'CORE-TASK-058B'
    );
  });
});
