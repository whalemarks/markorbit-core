import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CORE_FIXTURE_MANIFEST,
  validateCoreDomainRegistryFixture,
  validateCoreEventBaseFixture,
  validateCoreObjectBaseFixture,
  validateCoreTaskBaseFixture,
  validateCoreWorkflowContractBaseFixture,
  validateCoreContractIndexFixture,
  validateCoreDomainContractSkeletonsFixture,
  validateCoreObjectContractSkeletonsFixture,
  validateCoreServiceContractSkeletonsFixture,
  validateCoreApiContractSkeletonsFixture,
  validateCoreEventCatalogSkeletonsFixture,
  validateCoreWorkflowCatalogSkeletonsFixture,
  validateCorePermissionContractSkeletonsFixture,
  validateCorePolicyContractSkeletonsFixture,
  validateCoreAiGovernanceContractSkeletonsFixture,
  validateCoreCommonContractSkeletonsFixture,
  validateCoreTestContractSkeletonsFixture,
  validateCoreContractCoverageBaselineFixture,
  validateCoreContractGapInventoryFixture,
  validateCoreContractCoverageAcceptanceLockFixture,
  validateCoreContractBehaviorCoverageBaselineFixture,
  validateCoreContractBehaviorGapInventoryFixture,
  validateCoreContractBehaviorAcceptanceLockFixture,
  validateCoreSafetyBoundaryFoundationsFixture,
  validateCoreIdempotencyEnforcementFixture,
  validateBook02MvpGapBaselineFixture,
  validateCoreMvpObjectPublicReferenceFoundationFixture,
  validateCoreCustomerServiceCoreLifecycleFixture
} from '../src/validation/index.ts';
import { validateCoreBrandServiceCoreLifecycleFixture } from '../src/validation/core-brand-service-fixture-validation.ts';
import { validateCoreTrademarkServiceCoreLifecycleFixture } from '../src/validation/core-trademark-service-fixture-validation.ts';
import { validateCoreJurisdictionServiceCoreLifecycleFixture } from '../src/validation/core-jurisdiction-service-fixture-validation.ts';
import { validateCoreClassificationServiceCoreScopeValidationFixture } from '../src/validation/core-classification-service-fixture-validation.ts';
import { validateCoreDocumentServiceGovernedArtifactFoundationFixture } from '../src/validation/core-document-service-fixture-validation.ts';

const validators = {
  domain_registry: validateCoreDomainRegistryFixture,
  object_base: validateCoreObjectBaseFixture,
  event_base: validateCoreEventBaseFixture,
  task_base: validateCoreTaskBaseFixture,
  workflow_contract_base: validateCoreWorkflowContractBaseFixture,
  contract_index: validateCoreContractIndexFixture,
  domain_contract_skeletons: validateCoreDomainContractSkeletonsFixture,
  object_contract_skeletons: validateCoreObjectContractSkeletonsFixture,
  service_contract_skeletons: validateCoreServiceContractSkeletonsFixture,
  api_contract_skeletons: validateCoreApiContractSkeletonsFixture,
  event_catalog_skeletons: validateCoreEventCatalogSkeletonsFixture,
  workflow_catalog_skeletons: validateCoreWorkflowCatalogSkeletonsFixture,
  permission_contract_skeletons: validateCorePermissionContractSkeletonsFixture,
  policy_contract_skeletons: validateCorePolicyContractSkeletonsFixture,
  ai_governance_contract_skeletons:
    validateCoreAiGovernanceContractSkeletonsFixture,
  common_contract_skeletons: validateCoreCommonContractSkeletonsFixture,
  test_contract_skeletons: validateCoreTestContractSkeletonsFixture,
  contract_coverage_baseline: validateCoreContractCoverageBaselineFixture,
  contract_gap_inventory: validateCoreContractGapInventoryFixture,
  contract_coverage_acceptance_lock:
    validateCoreContractCoverageAcceptanceLockFixture,
  contract_behavior_coverage_baseline:
    validateCoreContractBehaviorCoverageBaselineFixture,
  contract_behavior_gap_inventory:
    validateCoreContractBehaviorGapInventoryFixture,
  contract_behavior_acceptance_lock:
    validateCoreContractBehaviorAcceptanceLockFixture,
  safety_boundary_foundations: validateCoreSafetyBoundaryFoundationsFixture,
  idempotency_enforcement: validateCoreIdempotencyEnforcementFixture,
  book_02_mvp_gap_baseline: validateBook02MvpGapBaselineFixture,
  core_mvp_object_public_reference_foundation:
    validateCoreMvpObjectPublicReferenceFoundationFixture,
  core_customer_service_core_lifecycle:
    validateCoreCustomerServiceCoreLifecycleFixture,
  core_brand_service_core_lifecycle:
    validateCoreBrandServiceCoreLifecycleFixture,
  core_trademark_service_core_lifecycle:
    validateCoreTrademarkServiceCoreLifecycleFixture,
  core_jurisdiction_service_core_lifecycle:
    validateCoreJurisdictionServiceCoreLifecycleFixture,
  core_classification_service_core_scope_validation:
    validateCoreClassificationServiceCoreScopeValidationFixture,
  core_document_service_governed_artifact_foundation:
    validateCoreDocumentServiceGovernedArtifactFoundationFixture
};

let hasErrors = false;

console.log('Core fixture validation summary');
console.log('===============================');

for (const entry of CORE_FIXTURE_MANIFEST) {
  const validator = validators[entry.type];
  const fixturePath = resolve(entry.path);
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  const result = validator(fixture);
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  hasErrors ||= errors.length > 0 || (entry.required === true && !result.ok);

  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${entry.id} (${entry.path})`);

  for (const issue of result.issues) {
    console.log(
      `  [${issue.severity}] ${issue.code}: ${issue.message}${issue.path ? ` (${issue.path})` : ''}`
    );
  }
}

if (hasErrors) process.exitCode = 1;
