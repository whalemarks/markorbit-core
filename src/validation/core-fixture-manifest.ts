export const CORE_FIXTURE_TYPES = [
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
] as const;

export type CoreFixtureType = (typeof CORE_FIXTURE_TYPES)[number];

export interface CoreFixtureManifestEntry {
  readonly id: string;
  readonly type: CoreFixtureType;
  readonly path: string;
  readonly description?: string;
  readonly required?: boolean;
}

export const CORE_FIXTURE_MANIFEST = [
  {
    id: 'core-domain-registry',
    type: 'domain_registry',
    path: 'fixtures/domains/core-domain-registry.fixture.json',
    required: true
  },
  {
    id: 'core-object-base',
    type: 'object_base',
    path: 'fixtures/objects/core-object-base.fixture.json',
    required: true
  },
  {
    id: 'core-event-base',
    type: 'event_base',
    path: 'fixtures/events/core-event-base.fixture.json',
    required: true
  },
  {
    id: 'core-task-base',
    type: 'task_base',
    path: 'fixtures/tasks/core-task-base.fixture.json',
    required: true
  },
  {
    id: 'core-workflow-contract-base',
    type: 'workflow_contract_base',
    path: 'fixtures/workflows/core-workflow-contract-base.fixture.json',
    required: true
  },
  {
    id: 'core-contract-index',
    type: 'contract_index',
    path: 'fixtures/contracts/core-contract-index.fixture.json',
    required: true
  },
  {
    id: 'core-domain-contract-skeletons',
    type: 'domain_contract_skeletons',
    path: 'fixtures/contracts/core-domain-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-object-contract-skeletons',
    type: 'object_contract_skeletons',
    path: 'fixtures/contracts/core-object-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-service-contract-skeletons',
    type: 'service_contract_skeletons',
    path: 'fixtures/contracts/core-service-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-api-contract-skeletons',
    type: 'api_contract_skeletons',
    path: 'fixtures/contracts/core-api-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-event-catalog-skeletons',
    type: 'event_catalog_skeletons',
    path: 'fixtures/contracts/core-event-catalog-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-mvp-event-contract-lock',
    type: 'core_mvp_event_contract_lock',
    path: 'fixtures/contracts/core-mvp-event-contract-lock.fixture.json',
    required: true
  },
  {
    id: 'core-task-057a-api-boundaries',
    type: 'core_task_057a_api_boundaries',
    path: 'fixtures/api/core-task-057a-api-boundaries.fixture.json',
    required: true
  },
  {
    id: 'core-workflow-catalog-skeletons',
    type: 'workflow_catalog_skeletons',
    path: 'fixtures/contracts/core-workflow-catalog-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-permission-contract-skeletons',
    type: 'permission_contract_skeletons',
    path: 'fixtures/contracts/core-permission-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-policy-contract-skeletons',
    type: 'policy_contract_skeletons',
    path: 'fixtures/contracts/core-policy-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-ai-governance-contract-skeletons',
    type: 'ai_governance_contract_skeletons',
    path: 'fixtures/contracts/core-ai-governance-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-common-contract-skeletons',
    type: 'common_contract_skeletons',
    path: 'fixtures/contracts/core-common-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-test-contract-skeletons',
    type: 'test_contract_skeletons',
    path: 'fixtures/contracts/core-test-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-contract-coverage-baseline',
    type: 'contract_coverage_baseline',
    path: 'fixtures/contract-coverage/core-contract-coverage-baseline.fixture.json',
    required: true
  },
  {
    id: 'core-contract-gap-inventory',
    type: 'contract_gap_inventory',
    path: 'fixtures/contract-coverage/core-contract-gap-inventory.fixture.json',
    required: true
  },
  {
    id: 'core-contract-coverage-acceptance-lock',
    type: 'contract_coverage_acceptance_lock',
    path: 'fixtures/contract-coverage/core-contract-coverage-acceptance-lock.fixture.json',
    required: true
  },
  {
    id: 'core-contract-behavior-coverage-baseline',
    type: 'contract_behavior_coverage_baseline',
    path: 'fixtures/behavior-coverage/core-contract-behavior-coverage-baseline.fixture.json',
    required: true
  },
  {
    id: 'core-contract-behavior-gap-inventory',
    type: 'contract_behavior_gap_inventory',
    path: 'fixtures/behavior-coverage/core-contract-behavior-gap-inventory.fixture.json',
    required: true
  },
  {
    id: 'core-contract-behavior-acceptance-lock',
    type: 'contract_behavior_acceptance_lock',
    path: 'fixtures/behavior-coverage/core-contract-behavior-acceptance-lock.fixture.json',
    required: true
  },
  {
    id: 'core-safety-boundary-foundations',
    type: 'safety_boundary_foundations',
    path: 'fixtures/behaviors/core-safety-boundary-foundations.fixture.json',
    required: true
  },
  {
    id: 'core-idempotency-enforcement',
    type: 'idempotency_enforcement',
    path: 'fixtures/behaviors/core-idempotency-enforcement.fixture.json',
    required: true
  },
  {
    id: 'core-mvp-object-public-reference-foundation',
    type: 'core_mvp_object_public_reference_foundation',
    path: 'fixtures/objects/core-mvp-object-public-reference-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-identity-service-authority-foundation',
    type: 'core_identity_service_authority_foundation',
    path: 'fixtures/services/core-identity-service-authority-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-organization-service-operating-context-foundation',
    type: 'core_organization_service_operating_context_foundation',
    path: 'fixtures/services/core-organization-service-operating-context-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-user-service-account-participant-foundation',
    type: 'core_user_service_account_participant_foundation',
    path: 'fixtures/services/core-user-service-account-participant-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-permission-service-governed-grant-foundation',
    type: 'core_permission_service_governed_grant_foundation',
    path: 'fixtures/services/core-permission-service-governed-grant-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-policy-service-contextual-decision-foundation',
    type: 'core_policy_service_contextual_decision_foundation',
    path: 'fixtures/services/core-policy-service-contextual-decision-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-customer-service-core-lifecycle',
    type: 'core_customer_service_core_lifecycle',
    path: 'fixtures/services/core-customer-service-core-lifecycle.fixture.json',
    required: true
  },
  {
    id: 'core-brand-service-core-lifecycle',
    type: 'core_brand_service_core_lifecycle',
    path: 'fixtures/services/core-brand-service-core-lifecycle.fixture.json',
    required: true
  },
  {
    id: 'core-trademark-service-core-lifecycle',
    type: 'core_trademark_service_core_lifecycle',
    path: 'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',
    required: true
  },
  {
    id: 'core-jurisdiction-service-core-lifecycle',
    type: 'core_jurisdiction_service_core_lifecycle',
    path: 'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',
    required: true
  },
  {
    id: 'core-classification-service-core-scope-validation',
    type: 'core_classification_service_core_scope_validation',
    path: 'fixtures/services/core-classification-service-core-scope-validation.fixture.json',
    required: true
  },
  {
    id: 'core-document-service-governed-artifact-foundation',
    type: 'core_document_service_governed_artifact_foundation',
    path: 'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-evidence-service-proof-layer-foundation',
    type: 'core_evidence_service_proof_layer_foundation',
    path: 'fixtures/services/core-evidence-service-proof-layer-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-matter-service-execution-container-foundation',
    type: 'core_matter_service_execution_container_foundation',
    path: 'fixtures/services/core-matter-service-execution-container-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-order-service-commercial-request-foundation',
    type: 'core_order_service_commercial_request_foundation',
    path: 'fixtures/services/core-order-service-commercial-request-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-opportunity-service-potential-demand-foundation',
    type: 'core_opportunity_service_potential_demand_foundation',
    path: 'fixtures/services/core-opportunity-service-potential-demand-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-task-service-actionable-work-foundation',
    type: 'core_task_service_actionable_work_foundation',
    path: 'fixtures/services/core-task-service-actionable-work-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-workflow-contract-service-execution-structure-foundation',
    type: 'core_workflow_contract_service_execution_structure_foundation',
    path: 'fixtures/services/core-workflow-contract-service-execution-structure-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-communication-service-governed-communication-foundation',
    type: 'core_communication_service_governed_communication_foundation',
    path: 'fixtures/services/core-communication-service-governed-communication-foundation.fixture.json',
    required: true
  },
  {
    id: 'core-event-service-governed-occurrence-foundation',
    type: 'core_event_service_governed_occurrence_foundation',
    path: 'fixtures/services/core-event-service-governed-occurrence-foundation.fixture.json',
    required: true
  },
  {
    id: 'book-02-post-service-completion-audit',
    type: 'book_02_post_service_completion_audit',
    path: 'fixtures/mvp-coverage/book-02-post-service-completion-audit.fixture.json',
    required: true
  },
  {
    id: 'book-02-mvp-gap-baseline',
    type: 'book_02_mvp_gap_baseline',
    path: 'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
    required: true
  }
] as const satisfies readonly CoreFixtureManifestEntry[];
