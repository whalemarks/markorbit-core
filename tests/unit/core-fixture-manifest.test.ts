import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_FIXTURE_MANIFEST, CORE_FIXTURE_TYPES } from '../../src/index.ts';

describe('CORE_FIXTURE_MANIFEST', () => {
  it('has exactly 49 entries', () => {
    assert.equal(CORE_FIXTURE_MANIFEST.length, 49);
  });

  it('includes permission_contract_skeletons type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('permission_contract_skeletons'),
      true
    );
  });

  it('includes policy_contract_skeletons type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('policy_contract_skeletons'),
      true
    );
  });

  it('includes ai_governance_contract_skeletons type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('ai_governance_contract_skeletons'),
      true
    );
  });

  it('includes contract_coverage_baseline type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('contract_coverage_baseline'),
      true
    );
  });

  it('includes contract_gap_inventory type', () => {
    assert.equal(CORE_FIXTURE_TYPES.includes('contract_gap_inventory'), true);
  });

  it('includes contract_coverage_acceptance_lock type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('contract_coverage_acceptance_lock'),
      true
    );
  });

  it('includes contract_behavior_coverage_baseline type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('contract_behavior_coverage_baseline'),
      true
    );
  });

  it('includes contract_behavior_gap_inventory type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('contract_behavior_gap_inventory'),
      true
    );
  });

  it('includes contract_behavior_acceptance_lock type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('contract_behavior_acceptance_lock'),
      true
    );
  });

  it('includes safety_boundary_foundations type', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('safety_boundary_foundations'),
      true
    );
  });

  it('includes idempotency_enforcement type', () => {
    assert.equal(CORE_FIXTURE_TYPES.includes('idempotency_enforcement'), true);
  });

  it('includes Common, Test, and MVP gap fixture types', () => {
    assert.equal(
      CORE_FIXTURE_TYPES.includes('common_contract_skeletons'),
      true
    );
    assert.equal(CORE_FIXTURE_TYPES.includes('test_contract_skeletons'), true);
    assert.equal(CORE_FIXTURE_TYPES.includes('book_02_mvp_gap_baseline'), true);
    assert.equal(
      CORE_FIXTURE_TYPES.includes('book_02_post_service_completion_audit'),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_mvp_object_public_reference_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes('core_identity_service_authority_foundation'),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_organization_service_operating_context_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_user_service_account_participant_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_permission_service_governed_grant_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_policy_service_contextual_decision_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes('core_customer_service_core_lifecycle'),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes('core_brand_service_core_lifecycle'),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes('core_trademark_service_core_lifecycle'),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes('core_jurisdiction_service_core_lifecycle'),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_classification_service_core_scope_validation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_document_service_governed_artifact_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_evidence_service_proof_layer_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_matter_service_execution_container_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_order_service_commercial_request_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_opportunity_service_potential_demand_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_communication_service_governed_communication_foundation'
      ),
      true
    );
    assert.equal(
      CORE_FIXTURE_TYPES.includes(
        'core_event_service_governed_occurrence_foundation'
      ),
      true
    );
  });

  it('ids are unique', () => {
    assert.equal(
      new Set(CORE_FIXTURE_MANIFEST.map((entry) => entry.id)).size,
      CORE_FIXTURE_MANIFEST.length
    );
  });

  it('paths are unique', () => {
    assert.equal(
      new Set(CORE_FIXTURE_MANIFEST.map((entry) => entry.path)).size,
      CORE_FIXTURE_MANIFEST.length
    );
  });

  it('all entries are required', () => {
    assert.ok(CORE_FIXTURE_MANIFEST.every((entry) => entry.required === true));
  });

  it('CoreFixtureType contains exactly the required fixture types', () => {
    assert.deepEqual(CORE_FIXTURE_TYPES, [
      'domain_registry',
      'object_base',
      'event_base',
      'task_base',
      'workflow_contract_base',
      'contract_index',
      'domain_contract_skeletons',
      'object_contract_skeletons',
      'service_contract_skeletons',
      'api_contract_skeletons',
      'event_catalog_skeletons',
      'core_mvp_event_contract_lock',
      'core_task_057a_api_boundaries',
      'workflow_catalog_skeletons',
      'permission_contract_skeletons',
      'policy_contract_skeletons',
      'ai_governance_contract_skeletons',
      'common_contract_skeletons',
      'test_contract_skeletons',
      'contract_coverage_baseline',
      'contract_gap_inventory',
      'contract_coverage_acceptance_lock',
      'contract_behavior_coverage_baseline',
      'contract_behavior_gap_inventory',
      'contract_behavior_acceptance_lock',
      'safety_boundary_foundations',
      'idempotency_enforcement',
      'book_02_mvp_gap_baseline',
      'book_02_post_service_completion_audit',
      'core_mvp_object_public_reference_foundation',
      'core_identity_service_authority_foundation',
      'core_organization_service_operating_context_foundation',
      'core_user_service_account_participant_foundation',
      'core_permission_service_governed_grant_foundation',
      'core_policy_service_contextual_decision_foundation',
      'core_customer_service_core_lifecycle',
      'core_brand_service_core_lifecycle',
      'core_trademark_service_core_lifecycle',
      'core_jurisdiction_service_core_lifecycle',
      'core_classification_service_core_scope_validation',
      'core_document_service_governed_artifact_foundation',
      'core_evidence_service_proof_layer_foundation',
      'core_matter_service_execution_container_foundation',
      'core_order_service_commercial_request_foundation',
      'core_opportunity_service_potential_demand_foundation',
      'core_task_service_actionable_work_foundation',
      'core_workflow_contract_service_execution_structure_foundation',
      'core_communication_service_governed_communication_foundation',
      'core_event_service_governed_occurrence_foundation'
    ]);
  });
});
