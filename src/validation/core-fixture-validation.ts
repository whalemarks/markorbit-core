import { CORE_CONTRACT_INDEX, validateCoreContractIndex, validateCoreDomainContractSkeletons, validateCoreObjectContractSkeletons, validateCoreServiceContractSkeletons, validateCoreApiContractSkeletons, validateCoreEventCatalogSkeletons, validateCoreWorkflowCatalogSkeletons, validateCorePermissionContractSkeletons, validateCorePolicyContractSkeletons, validateCoreAiGovernanceContractSkeletons, validateCoreCommonContractSkeletons, validateCoreTestContractSkeletons, type CoreApiContract, type CoreDomainContract, type CoreObjectContract, type CoreServiceContract, type CoreEventCatalogEntry, type CoreWorkflowCatalogEntry, type CorePermissionContract, type CorePolicyContract, type CoreAiGovernanceContract, type CoreCommonContract, type CoreTestContract } from '../contracts/index.ts';
import { validateCoreContractCoverageBaseline, validateCoreContractCoverageAcceptanceLock } from '../contract-coverage/index.ts';
import { validateCoreContractGapInventory } from '../contract-coverage/index.ts';
import { validateCoreContractBehaviorCoverageBaseline, validateCoreContractBehaviorAcceptanceLock } from '../behavior-coverage/index.ts';
import { validateCoreContractBehaviorGapInventory } from '../behavior-coverage/index.ts';
import { validateBook02MvpFixture } from '../mvp-coverage/index.ts';
import { CORE_IDEMPOTENCY_FIXTURE, CORE_SAFETY_BOUNDARY_FIXTURE, CoreAgentBoundaryRegistry, CoreIdempotencyRegistry, CoreReferenceRegistry, validateCoreAiContext, validateCoreVersion } from '../behaviors/index.ts';
import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import { CORE_OBJECT_STATUSES } from '../objects/index.ts';
import { CORE_MVP_OBJECT_PROFILE_ORDER } from '../objects/core-mvp-object-profiles.ts';
import { validateCoreMvpObjectBaseRecord } from '../objects/core-mvp-object-validation.ts';
import type { CoreEvent } from '../events/index.ts';
import { validateCoreEvent } from '../events/index.ts';
import type { CoreTask } from '../tasks/index.ts';
import { validateCoreTask } from '../tasks/index.ts';
import type { CoreWorkflowContract } from '../workflows/index.ts';
import { validateCoreWorkflowContract } from '../workflows/index.ts';
import type { CoreValidationIssue, CoreValidationResult } from './core-validation-result.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

const domainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const objectStatuses = new Set<string>(Object.values(CORE_OBJECT_STATUSES));
const objectBusinessFields = ['goods', 'services', 'filingDate', 'registrationNumber', 'clientInstruction', 'legalOpinion', 'workflowState'];
const eventForbiddenFields = ['eventBus', 'streamName', 'aggregateVersion', 'persistence'];
const eventCatalogFields = ['catalogId', 'canonicalEventId', 'eventCatalog', 'catalogMetadata'];
const taskForbiddenFields = ['runtimeState', 'transitionHistory', 'executionContext', 'workflowRuntime'];
const taskCatalogFields = ['catalogId', 'canonicalTaskId', 'taskCatalog', 'catalogMetadata'];
const workflowForbiddenFields = ['runtimeState', 'executionState', 'executionContext', 'executionRuntime', 'currentStep', 'runningInstance'];
const workflowCatalogForbiddenFields = ['engine', 'workflowEngine', 'runtimeState', 'executionState', 'executionContext', 'executionRuntime', 'currentStep', 'runningInstance', 'instanceId', 'transitionFunction'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function error(code: string, message: string, path?: string): CoreValidationIssue {
  return { code, severity: 'error', message, path };
}

function nonArrayResult(fixture: unknown, source: string): CoreValidationResult | undefined {
  if (!Array.isArray(fixture)) {
    return createCoreValidationResult([error('core.fixture.not_array', `${source} fixture must be an array.`, source)]);
  }
  return undefined;
}

function pushForbiddenFields(issues: CoreValidationIssue[], entry: Record<string, unknown>, fields: readonly string[], path: string, code: string): void {
  for (const field of fields) {
    if (field in entry) {
      issues.push(error(code, `Field ${field} is not allowed in this Core fixture.`, `${path}.${field}`));
    }
  }
}

function pushDomainIssue(issues: CoreValidationIssue[], entry: Record<string, unknown>, path: string): void {
  if (typeof entry.domainId !== 'string' || !domainIds.has(entry.domainId)) {
    issues.push(error('core.fixture.unknown_domain', 'domainId must exist in CORE_DOMAIN_REGISTRY.', `${path}.domainId`));
  }
}

export function validateCoreDomainRegistryFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'domain_registry');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];

  const issues: CoreValidationIssue[] = [];
  if (array.length !== CORE_DOMAIN_REGISTRY.length) {
    issues.push(error('core.domain_registry.invalid_count', `Domain registry fixture must contain exactly ${CORE_DOMAIN_REGISTRY.length} entries.`, 'domain_registry'));
  }

  CORE_DOMAIN_REGISTRY.forEach((domain, index) => {
    const entry = array[index];
    if (!isRecord(entry)) {
      issues.push(error('core.domain_registry.invalid_entry', 'Domain registry entry must be an object.', `domain_registry[${index}]`));
      return;
    }
    if (entry.id !== domain.id) issues.push(error('core.domain_registry.id_mismatch', 'Domain id must match CORE_DOMAIN_REGISTRY exactly.', `domain_registry[${index}].id`));
    if (entry.name !== domain.name) issues.push(error('core.domain_registry.name_mismatch', 'Domain name must match CORE_DOMAIN_REGISTRY exactly.', `domain_registry[${index}].name`));
    if (entry.category !== domain.category) issues.push(error('core.domain_registry.category_mismatch', 'Domain category must match CORE_DOMAIN_REGISTRY exactly.', `domain_registry[${index}].category`));
  });

  return createCoreValidationResult(issues);
}

export function validateCoreObjectBaseFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'object_base');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];
  const issues: CoreValidationIssue[] = [];
  if (array.length !== 3) issues.push(error('core.object_base.invalid_count', 'Object base fixture must contain exactly 3 entries.', 'object_base'));
  array.forEach((entry, index) => {
    const path = `object_base[${index}]`;
    if (!isRecord(entry)) { issues.push(error('core.object_base.invalid_entry', 'Object base entry must be an object.', path)); return; }
    for (const field of ['id', 'type', 'domainId', 'status', 'version', 'metadata']) if (!(field in entry)) issues.push(error('core.object_base.missing_field', `${field} is required.`, `${path}.${field}`));
    pushDomainIssue(issues, entry, path);
    if (typeof entry.status !== 'string' || !objectStatuses.has(entry.status)) issues.push(error('core.object_base.invalid_status', 'status must be a valid CoreObjectStatus.', `${path}.status`));
    pushForbiddenFields(issues, entry, objectBusinessFields, path, 'core.object_base.business_field');
  });
  return createCoreValidationResult(issues);
}

export function validateCoreEventBaseFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'event_base');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];
  const issues: CoreValidationIssue[] = [];
  if (array.length !== 3) issues.push(error('core.event_base.invalid_count', 'Event base fixture must contain exactly 3 entries.', 'event_base'));
  array.forEach((entry, index) => {
    const path = `event_base[${index}]`;
    if (!isRecord(entry)) { issues.push(error('core.event_base.invalid_entry', 'Event base entry must be an object.', path)); return; }
    validateCoreEvent(entry as unknown as CoreEvent).forEach((message) => issues.push(error('core.event_base.invalid_event', message, path)));
    pushDomainIssue(issues, entry, path);
    pushForbiddenFields(issues, entry, eventCatalogFields, path, 'core.event_base.catalog_metadata');
    pushForbiddenFields(issues, entry, eventForbiddenFields, path, 'core.event_base.runtime_field');
  });
  return createCoreValidationResult(issues);
}

export function validateCoreTaskBaseFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'task_base');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];
  const issues: CoreValidationIssue[] = [];
  if (array.length !== 3) issues.push(error('core.task_base.invalid_count', 'Task base fixture must contain exactly 3 entries.', 'task_base'));
  array.forEach((entry, index) => {
    const path = `task_base[${index}]`;
    if (!isRecord(entry)) { issues.push(error('core.task_base.invalid_entry', 'Task base entry must be an object.', path)); return; }
    validateCoreTask(entry as unknown as CoreTask).forEach((message) => issues.push(error('core.task_base.invalid_task', message, path)));
    pushDomainIssue(issues, entry, path);
    pushForbiddenFields(issues, entry, taskCatalogFields, path, 'core.task_base.catalog_metadata');
    pushForbiddenFields(issues, entry, taskForbiddenFields, path, 'core.task_base.runtime_field');
  });
  return createCoreValidationResult(issues);
}

export function validateCoreWorkflowContractBaseFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'workflow_contract_base');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];
  const issues: CoreValidationIssue[] = [];
  if (array.length !== 2) issues.push(error('core.workflow_contract_base.invalid_count', 'Workflow contract base fixture must contain exactly 2 entries.', 'workflow_contract_base'));
  array.forEach((entry, index) => {
    const path = `workflow_contract_base[${index}]`;
    if (!isRecord(entry)) { issues.push(error('core.workflow_contract_base.invalid_entry', 'Workflow contract base entry must be an object.', path)); return; }
    validateCoreWorkflowContract(entry as unknown as CoreWorkflowContract).forEach((message) => issues.push(error('core.workflow_contract_base.invalid_contract', message, path)));
    pushDomainIssue(issues, entry, path);
    pushForbiddenFields(issues, entry, workflowForbiddenFields, path, 'core.workflow_contract_base.runtime_field');
  });
  return createCoreValidationResult(issues);
}



export function validateCoreDomainContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'domain_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreDomainContractSkeletons(fixture as readonly CoreDomainContract[]).map((message) =>
    error('core.domain_contract_skeletons.invalid_contract', message, 'domain_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}


export function validateCoreObjectContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'object_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreObjectContractSkeletons(fixture as readonly CoreObjectContract[]).map((message) =>
    error('core.object_contract_skeletons.invalid_contract', message, 'object_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreServiceContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'service_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreServiceContractSkeletons(fixture as readonly CoreServiceContract[]).map((message) =>
    error('core.service_contract_skeletons.invalid_contract', message, 'service_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}


export function validateCoreApiContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'api_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreApiContractSkeletons(fixture as readonly CoreApiContract[]).map((message) =>
    error('core.api_contract_skeletons.invalid_contract', message, 'api_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}


export function validateCoreEventCatalogSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'event_catalog_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreEventCatalogSkeletons(fixture as readonly CoreEventCatalogEntry[]).map((message) =>
    error('core.event_catalog_skeletons.invalid_entry', message, 'event_catalog_skeletons')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreWorkflowCatalogSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'workflow_catalog_skeletons');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];
  const issues = validateCoreWorkflowCatalogSkeletons(fixture as readonly CoreWorkflowCatalogEntry[]).map((message) =>
    error('core.workflow_catalog_skeletons.invalid_entry', message, 'workflow_catalog_skeletons')
  );
  array.forEach((entry, index) => {
    if (isRecord(entry)) pushForbiddenFields(issues, entry, workflowCatalogForbiddenFields, `workflow_catalog_skeletons[${index}]`, 'core.workflow_catalog_skeletons.runtime_field');
  });
  return createCoreValidationResult(issues);
}


export function validateCorePermissionContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'permission_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCorePermissionContractSkeletons(fixture as readonly CorePermissionContract[]).map((message) =>
    error('core.permission_contract_skeletons.invalid_contract', message, 'permission_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}


export function validateCorePolicyContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'policy_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCorePolicyContractSkeletons(fixture as readonly CorePolicyContract[]).map((message) =>
    error('core.policy_contract_skeletons.invalid_contract', message, 'policy_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreAiGovernanceContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'ai_governance_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreAiGovernanceContractSkeletons(fixture as readonly CoreAiGovernanceContract[]).map((message) =>
    error('core.ai_governance_contract_skeletons.invalid_contract', message, 'ai_governance_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreCommonContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'common_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreCommonContractSkeletons(fixture as readonly CoreCommonContract[]).map((message) =>
    error('core.common_contract_skeletons.invalid_contract', message, 'common_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreTestContractSkeletonsFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'test_contract_skeletons');
  if (nonArray) return nonArray;
  const issues = validateCoreTestContractSkeletons(fixture as readonly CoreTestContract[]).map((message) =>
    error('core.test_contract_skeletons.invalid_contract', message, 'test_contract_skeletons')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreContractCoverageBaselineFixture(fixture: unknown): CoreValidationResult {
  const issues = validateCoreContractCoverageBaseline(fixture).map((message) =>
    error('core.contract_coverage_baseline.invalid', message, 'contract_coverage_baseline')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreContractGapInventoryFixture(fixture: unknown): CoreValidationResult {
  const issues = validateCoreContractGapInventory(fixture).map((message) =>
    error('core.contract_gap_inventory.invalid', message, 'contract_gap_inventory')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreContractCoverageAcceptanceLockFixture(fixture: unknown): CoreValidationResult {
  const issues = validateCoreContractCoverageAcceptanceLock(fixture).map((message) =>
    error('core.contract_coverage_acceptance_lock.invalid', message, 'contract_coverage_acceptance_lock')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreContractBehaviorCoverageBaselineFixture(fixture: unknown): CoreValidationResult {
  const issues = validateCoreContractBehaviorCoverageBaseline(fixture).map((message) =>
    error('core.contract_behavior_coverage_baseline.invalid', message, 'contract_behavior_coverage_baseline')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreContractBehaviorAcceptanceLockFixture(fixture: unknown): CoreValidationResult {
  const issues = validateCoreContractBehaviorAcceptanceLock(fixture).map((message) =>
    error('core.contract_behavior_acceptance_lock.invalid', message, 'contract_behavior_acceptance_lock')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreContractBehaviorGapInventoryFixture(fixture: unknown): CoreValidationResult {
  const issues = validateCoreContractBehaviorGapInventory(fixture).map((message) =>
    error('core.contract_behavior_gap_inventory.invalid', message, 'contract_behavior_gap_inventory')
  );
  return createCoreValidationResult(issues);
}

export function validateCoreSafetyBoundaryFoundationsFixture(fixture: unknown): CoreValidationResult {
  const issues: CoreValidationIssue[] = [];
  if (JSON.stringify(fixture) !== JSON.stringify(CORE_SAFETY_BOUNDARY_FIXTURE)) {
    issues.push(error('core.safety_boundary_foundations.fixture_mismatch', 'Safety boundary fixture must match the canonical deterministic fixture.', 'safety_boundary_foundations'));
    return createCoreValidationResult(issues);
  }
  const value = fixture as typeof CORE_SAFETY_BOUNDARY_FIXTURE;
  const references = new CoreReferenceRegistry(value.referenceRecords);
  const agents = new CoreAgentBoundaryRegistry(value.agentRegistry);
  if (!references.resolve({ referenceId: 'brand:alpha', expectedObjectType: 'Brand', expectedDomain: 'brand' }).ok)
    issues.push(error('core.safety_boundary_foundations.reference_failed', 'Canonical reference behavior must pass.', 'safety_boundary_foundations.referenceRecords'));
  if (!validateCoreAiContext(value.validAiContext, agents).ok)
    issues.push(error('core.safety_boundary_foundations.ai_context_failed', 'Canonical AI context behavior must pass.', 'safety_boundary_foundations.validAiContext'));
  if (!validateCoreVersion({ contractVersion: 'v0.1.0' }, value.supportedContractVersions).ok)
    issues.push(error('core.safety_boundary_foundations.version_failed', 'Canonical version behavior must pass.', 'safety_boundary_foundations.supportedContractVersions'));
  return createCoreValidationResult(issues);
}

export function validateCoreIdempotencyEnforcementFixture(fixture: unknown): CoreValidationResult {
  const issues: CoreValidationIssue[] = [];
  if (JSON.stringify(fixture) !== JSON.stringify(CORE_IDEMPOTENCY_FIXTURE)) {
    issues.push(error('core.idempotency_enforcement.fixture_mismatch', 'Idempotency fixture must match the canonical deterministic fixture.', 'idempotency_enforcement'));
    return createCoreValidationResult(issues);
  }
  const registry = new CoreIdempotencyRegistry(() => 1_000);
  let effects = 0;
  const value = fixture as typeof CORE_IDEMPOTENCY_FIXTURE;
  if (!registry.execute(value, () => ++effects).ok || !registry.execute(value, () => ++effects).ok || effects !== 1) {
    issues.push(error('core.idempotency_enforcement.replay_failed', 'Canonical replay must prevent duplicate effects.', 'idempotency_enforcement'));
  }
  return createCoreValidationResult(issues);
}

export function validateCoreContractIndexFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'contract_index');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];
  const issues: CoreValidationIssue[] = [];

  if (array.length !== CORE_CONTRACT_INDEX.length) {
    issues.push(error('core.contract_index.invalid_count', `Contract index fixture must contain exactly ${CORE_CONTRACT_INDEX.length} entries.`, 'contract_index'));
  }

  CORE_CONTRACT_INDEX.forEach((contract, index) => {
    const entry = array[index];
    if (!isRecord(entry)) {
      issues.push(error('core.contract_index.invalid_entry', 'Contract index entry must be an object.', `contract_index[${index}]`));
      return;
    }
    if (entry.id !== contract.id) issues.push(error('core.contract_index.id_mismatch', 'Contract id must match CORE_CONTRACT_INDEX exactly.', `contract_index[${index}].id`));
    if (entry.name !== contract.name) issues.push(error('core.contract_index.name_mismatch', 'Contract name must match CORE_CONTRACT_INDEX exactly.', `contract_index[${index}].name`));
    if (entry.type !== contract.type) issues.push(error('core.contract_index.type_mismatch', 'Contract type must match CORE_CONTRACT_INDEX exactly.', `contract_index[${index}].type`));
    if (entry.status !== contract.status) issues.push(error('core.contract_index.status_mismatch', 'Contract status must match CORE_CONTRACT_INDEX exactly.', `contract_index[${index}].status`));
  });

  validateCoreContractIndex(array as never).forEach((message) => issues.push(error('core.contract_index.invalid_contract', message, 'contract_index')));
  return createCoreValidationResult(issues);
}


export function validateCoreMvpObjectPublicReferenceFoundationFixture(fixture: unknown): CoreValidationResult {
  const nonArray = nonArrayResult(fixture, 'core_mvp_object_public_reference_foundation');
  if (nonArray) return nonArray;
  const array = fixture as readonly unknown[];
  const issues: CoreValidationIssue[] = [];
  if (array.length !== CORE_MVP_OBJECT_PROFILE_ORDER.length) issues.push(error('core.object.fixture_invalid_count', 'Object public-reference fixture must contain exactly 18 entries.', 'core_mvp_object_public_reference_foundation'));
  array.forEach((entry, index) => {
    const expectedDomain = CORE_MVP_OBJECT_PROFILE_ORDER[index];
    if (!isRecord(entry)) { issues.push(error('core.object.fixture_invalid_entry', 'Object fixture entry must be an object.', `core_mvp_object_public_reference_foundation[${index}]`)); return; }
    if (entry.domainId !== expectedDomain) issues.push(error('core.object.fixture_order_changed', 'Object fixture canonical order changed.', `core_mvp_object_public_reference_foundation[${index}].domainId`));
    for (const validationIssue of validateCoreMvpObjectBaseRecord(entry).issues) issues.push(error(validationIssue.code, validationIssue.message, `core_mvp_object_public_reference_foundation[${index}]${validationIssue.path ? `.${validationIssue.path}` : ''}`));
  });
  return createCoreValidationResult(issues);
}

export function validateBook02MvpGapBaselineFixture(fixture: unknown): CoreValidationResult {
  return createCoreValidationResult(
    validateBook02MvpFixture(fixture).map((bookIssue) =>
      error(bookIssue.code, bookIssue.message, bookIssue.path)
    )
  );
}
