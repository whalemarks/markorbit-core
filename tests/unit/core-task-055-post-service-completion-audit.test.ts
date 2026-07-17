import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOK_02_MVP_GAP_BASELINE,
  BOOK_02_POST_SERVICE_COMPLETION_AUDIT,
  isBook02MvpCompletionReady,
  validateBook02PostServiceCompletionAudit
} from '../../src/index.ts';

describe('CORE-TASK-055 post-service completion audit', () => {
  it('locks zero Service gaps without claiming full Book 02 completion', () => {
    const audit = BOOK_02_POST_SERVICE_COMPLETION_AUDIT;
    assert.deepEqual(validateBook02PostServiceCompletionAudit(audit), []);
    assert.deepEqual(audit.serviceClosure, {
      serviceRequirementCount: 18,
      meetsRequiredDepthCount: 18,
      unresolvedServiceRequirementIds: [],
      zeroServiceGap: true
    });
    assert.equal(audit.sourceBaseline.book02MvpComplete, false);
    assert.equal(audit.nextTask, 'CORE-TASK-058A');
  });

  it('records Event closure and the remaining 29 unresolved Must Build requirements', () => {
    const audit = BOOK_02_POST_SERVICE_COMPLETION_AUDIT;
    assert.equal(audit.unresolvedInventory.total, 29);
    assert.deepEqual(audit.unresolvedInventory.byLayer, {
      domain: 18,
      workflow: 3,
      agent: 5,
      test: 3
    });
    assert.deepEqual(audit.unresolvedInventory.byDisposition, {
      validated_skeleton_only: 21,
      boundary_scaffold_only: 5,
      partial_evidence: 3
    });
    assert.equal(
      audit.completionSemantics.completionBlockingNonDomainRequirementIds
        .length,
      11
    );
  });

  it('locks the five unresolved acceptance criteria exactly', () => {
    assert.deepEqual(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.unresolvedInventory
        .unresolvedAcceptanceCriterionIds,
      [
        'customer-intake-workflow-supports-preview-apply',
        'trademark-application-workflow-supports-preview-apply',
        'communication-review-workflow-supports-preview-apply',
        'workflow-layer-does-not-emit-events-directly',
        'agent-layer-does-not-emit-events-directly'
      ]
    );
  });

  it('locks dependency-ordered workstreams through final completion audit', () => {
    const workstreams =
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.executionWorkstreams;
    assert.deepEqual(
      workstreams.map((entry) => entry.id),
      [
        'exact-event-contracts',
        'api-validator-delegation',
        'workflow-preview-apply',
        'named-agent-boundaries',
        'final-completion-audit'
      ]
    );
    assert.deepEqual(
      workstreams.map((entry) => entry.taskIds),
      [
        ['CORE-TASK-056'],
        ['CORE-TASK-057A', 'CORE-TASK-057B', 'CORE-TASK-057C'],
        ['CORE-TASK-058A', 'CORE-TASK-058B', 'CORE-TASK-058C'],
        ['CORE-TASK-059'],
        ['CORE-TASK-060']
      ]
    );
    assert.deepEqual(workstreams[0]?.requirementIds, []);
    assert.deepEqual(workstreams[1]?.requirementIds, [
      'must-test-api-contract-tests'
    ]);
    assert.equal(workstreams[2]?.requirementIds.length, 4);
    assert.equal(workstreams[3]?.requirementIds.length, 6);
    assert.deepEqual(workstreams[4]?.requirementIds, []);
  });

  it('accepts Domain scaffolds for MVP completion semantics without weakening non-Domain depth', () => {
    const requirements = BOOK_02_MVP_GAP_BASELINE.requirements.map(
      (requirement) =>
        requirement.category === 'must_build_now' &&
        requirement.layer !== 'domain'
          ? {
              ...requirement,
              currentDisposition: 'meets_required_depth' as const
            }
          : requirement
    );
    const accepted = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.map(
      (criterion) => ({
        ...criterion,
        satisfied: true,
        unresolvedReasons: []
      })
    );
    assert.equal(isBook02MvpCompletionReady(requirements, accepted), true);

    const withApiGap = requirements.map((requirement) =>
      requirement.id === 'must-api-identity-api-contract'
        ? {
            ...requirement,
            currentDisposition: 'validated_skeleton_only' as const
          }
        : requirement
    );
    assert.equal(isBook02MvpCompletionReady(withApiGap, accepted), false);

    const domainCriterionOpen = accepted.map((criterion) =>
      criterion.id === 'must-build-domains-implemented-or-scaffolded-with-tests'
        ? {
            ...criterion,
            satisfied: false,
            unresolvedReasons: ['Domain scaffold tests missing.']
          }
        : criterion
    );
    assert.equal(
      isBook02MvpCompletionReady(requirements, domainCriterionOpen),
      false
    );
  });

  it('rejects audit drift and false completion claims', () => {
    const drifted = structuredClone(
      BOOK_02_POST_SERVICE_COMPLETION_AUDIT
    ) as unknown as Record<string, unknown>;
    const sourceBaseline = drifted.sourceBaseline as Record<string, unknown>;
    sourceBaseline.book02MvpComplete = true;
    const codes = validateBook02PostServiceCompletionAudit(drifted).map(
      (issue) => issue.code
    );
    assert.ok(codes.includes('book02.post_service_audit.baseline_drift'));
    assert.ok(codes.includes('book02.post_service_audit.false_completion'));
  });
});
