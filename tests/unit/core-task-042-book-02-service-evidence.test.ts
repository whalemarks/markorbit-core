import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';

const implementedServiceIds = [
  'must-service-identity-service',
  'must-service-organization-service',
  'must-service-user-service',
  'must-service-permission-service',
  'must-service-policy-service',
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
  it('promotes all Must Build Services through Policy in dependency order', () => {
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
      0
    );
  });

  it('derives 73 / 3 / 34 and satisfies global Service behavior acceptance', () => {
    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {
      total: 115,
      meets_required_depth: 73,
      partial_evidence: 3,
      validated_skeleton_only: 34,
      boundary_scaffold_only: 5,
      semantic_overlap_only: 0,
      fixture_only: 0,
      missing: 0
    });
    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(
      (entry) => entry.id === 'must-build-services-own-behavior'
    );
    assert.equal(criterion?.satisfied, true);
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,
      12
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
  });
});
