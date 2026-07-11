import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreWorkflowCatalogEntry } from './core-workflow-catalog-entry.ts';

const expectedCount = 16;
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validStatuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const registryDomainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
export const EXCLUDED_WORKFLOW_CONCEPTS = [
  'trademark-filing-workflow', 'matter-lifecycle-workflow', 'communication-runtime-workflow',
  'execution-runtime-workflow', 'execution-context-workflow', 'workflow-engine-runtime', 'task-runtime-workflow', 'event-bus-workflow',
  'artifact-render-workflow', 'publish-automation-workflow', 'distillery-runtime-workflow', 'ai-agent-execution-workflow',
  'autonomous-agent-workflow', 'workplace-workflow'
] as const;
const executableStepTerms = ['handler', 'executor', 'transitionFunction', 'runtimeState', 'currentStep', 'instanceId'] as const;
const existingWorkflowSkeletonCount = 8;
const canonicalWorkflowEntries = [
  ['customer-intake-workflow', 'Customer Intake Workflow'],
  ['trademark-application-workflow', 'Trademark Application Workflow'],
  ['office-action-response-workflow', 'Office Action Response Workflow'],
  ['provider-routing-workflow', 'Provider Routing Workflow'],
  ['communication-review-workflow', 'Communication Review Workflow'],
  ['renewal-workflow', 'Renewal Workflow'],
  ['assignment-workflow', 'Assignment Workflow'],
  ['evidence-review-workflow', 'Evidence Review Workflow']
] as const;
const canonicalWorkflowSourceRoot =
  'books/book-02-core-specification/core-specs/contracts/workflows/';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreWorkflowCatalogSkeletons(entries: readonly CoreWorkflowCatalogEntry[]): readonly string[] {
  if (!Array.isArray(entries)) return ['Core workflow catalog skeletons must be an array.'];
  const errors: string[] = [];
  const ids = new Set<string>();
  const workflowTypes = new Set<string>();
  if (entries.length !== expectedCount) errors.push(`Core workflow catalog skeletons must contain exactly ${expectedCount} entries.`);

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isPlainObject(entry)) { errors.push(`${path} must be a plain object.`); return; }
    if (!entry.id) errors.push(`${path}.id is required.`);
    if (!entry.workflowType) errors.push(`${path}.workflowType is required.`);
    if (!entry.domainId) errors.push(`${path}.domainId is required.`);
    if (!entry.name) errors.push(`${path}.name is required.`);
    if (!entry.description) errors.push(`${path}.description is required.`);
    if (!entry.status) errors.push(`${path}.status is required.`);
    if (!entry.book) errors.push(`${path}.book is required.`);
    if (!entry.purpose) errors.push(`${path}.purpose is required.`);
    if (!Array.isArray(entry.owns)) errors.push(`${path}.owns must be an array.`);
    if (!Array.isArray(entry.nonGoals)) errors.push(`${path}.nonGoals must be an array.`);
    if (typeof entry.id === 'string') { if (ids.has(entry.id)) errors.push(`${path}.id must be unique.`); ids.add(entry.id); }
    if (typeof entry.workflowType === 'string') { if (!kebabCasePattern.test(entry.workflowType)) errors.push(`${path}.workflowType must be kebab-case.`); if (workflowTypes.has(entry.workflowType)) errors.push(`${path}.workflowType must be unique.`); workflowTypes.add(entry.workflowType); }
    if (typeof entry.domainId === 'string' && !registryDomainIds.has(entry.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (typeof entry.status === 'string' && !validStatuses.has(entry.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (entry.metadata !== undefined && !isPlainObject(entry.metadata)) errors.push(`${path}.metadata must be a plain object.`);
    const canonicalEntry = canonicalWorkflowEntries[index - existingWorkflowSkeletonCount];
    if (canonicalEntry !== undefined) {
      const [workflowType, workflowName] = canonicalEntry;
      if (entry.id !== `core-workflow-${workflowType}-contract`) errors.push(`${path}.id must match the locked CORE-TASK-024 target.`);
      if (entry.workflowType !== workflowType) errors.push(`${path}.workflowType must match the locked CORE-TASK-024 target.`);
      if (entry.domainId !== 'workflow-contract') errors.push(`${path}.domainId must be workflow-contract for canonical Workflow Contracts.`);
      if (entry.name !== `Core ${workflowName} Contract Skeleton`) errors.push(`${path}.name must match the locked CORE-TASK-024 target.`);
      if (entry.sourcePath !== `${canonicalWorkflowSourceRoot}${workflowType}-contract.md`) errors.push(`${path}.sourcePath must match the locked Book 2 source.`);
      if (entry.implementationDepth !== 'validated_skeleton') errors.push(`${path}.implementationDepth must be validated_skeleton.`);
      if (!isPlainObject(entry.metadata)) {
        errors.push(`${path}.metadata must be present for canonical additions.`);
      } else {
        if (entry.metadata.specificationRepository !== 'whalemarks/markorbit-publication') errors.push(`${path}.metadata.specificationRepository must match the locked repository.`);
        if (entry.metadata.specificationCommit !== '3349ecb8955021a8714d023348f8b24f941eb98f') errors.push(`${path}.metadata.specificationCommit must match the locked commit.`);
        if (entry.metadata.specificationPath !== 'books/book-02-core-specification/') errors.push(`${path}.metadata.specificationPath must match the locked Book 2 path.`);
        if (entry.metadata.implementationTask !== 'CORE-TASK-024') errors.push(`${path}.metadata.implementationTask must be CORE-TASK-024.`);
      }
    }
    const searchable = JSON.stringify(entry).toLowerCase();
    for (const concept of EXCLUDED_WORKFLOW_CONCEPTS) if (searchable.includes(concept)) errors.push(`${path} must not include excluded workflow concept ${concept}.`);
    if (entry.stepTypes !== undefined) {
      if (!Array.isArray(entry.stepTypes)) errors.push(`${path}.stepTypes must be an array when present.`);
      else entry.stepTypes.forEach((stepType, stepIndex) => {
        if (typeof stepType !== 'string') errors.push(`${path}.stepTypes[${stepIndex}] must be textual only.`);
        for (const term of executableStepTerms) if (typeof stepType === 'string' && stepType.toLowerCase().includes(term.toLowerCase())) errors.push(`${path}.stepTypes[${stepIndex}] must not include executable workflow term ${term}.`);
      });
    }
  });
  return errors;
}
