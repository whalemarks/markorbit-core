import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

const implementedServiceIds = [
  'must-service-identity-service',
  'must-service-organization-service',
  'must-service-customer-service',
  'must-service-brand-service',
  'must-service-trademark-service',
  'must-service-jurisdiction-service',
  'must-service-classification-service',
  'must-service-document-service',
  'must-service-evidence-service',
  'must-service-matter-service',
  'must-service-order-service',
  'must-service-workflow-contract-service',
  'must-service-task-service',
  'must-service-event-service',
  'must-service-communication-service'
];

describe('CORE-TASK-042 Book 02 Service evidence', () => {
  it('promotes Customer through Event in dependency order', () => {
    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter(
      (requirement) => requirement.layer === 'service'
    );
    const implemented = services.filter(
      (requirement) => requirement.currentDisposition === 'meets_required_depth'
    );
    assert.deepEqual(
      implemented.map((requirement) => requirement.id),
      implementedServiceIds
    );
    assert.ok(
      implemented.every(
        (requirement) => requirement.currentDepth === 'level_2_3'
      )
    );
    assert.equal(
      services.filter(
        (requirement) =>
          requirement.currentDisposition === 'validated_skeleton_only'
      ).length,
      3
    );
  });

  it('derives 47 / 3 / 42 and leaves global Service acceptance unresolved', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 47,
      partial_evidence: 3,
      validated_skeleton_only: 42,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 18,
      fixture_only: 0,
      missing: 0
    });
    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (entry) => entry.id === 'must-build-services-own-behavior'
    );
    assert.equal(criterion?.satisfied, false);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      11
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
