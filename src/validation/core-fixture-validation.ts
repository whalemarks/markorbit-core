import { CORE_CONTRACT_INDEX, validateCoreContractIndex, validateCoreDomainContractSkeletons, validateCoreObjectContractSkeletons, validateCoreServiceContractSkeletons, validateCoreApiContractSkeletons, type CoreApiContract, type CoreDomainContract, type CoreObjectContract, type CoreServiceContract } from '../contracts/index.ts';
import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import { CORE_OBJECT_STATUSES } from '../objects/index.ts';
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
