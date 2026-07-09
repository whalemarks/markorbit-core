import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_EVENT_ACTIONS } from '../../events/index.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreEventCatalogEntry } from './core-event-catalog-entry.ts';

const expectedCount = 12;
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validActions = new Set<string>(Object.values(CORE_EVENT_ACTIONS));
const validStatuses = new Set<string>(Object.values(CORE_CONTRACT_STATUSES));
const registryDomainIds = new Set<string>(CORE_DOMAIN_REGISTRY.map((domain) => domain.id));
const excludedConcepts = [
  'event-bus-created',
  'event-stream-appended',
  'event-sourced-aggregate-updated',
  'execution-runtime-started',
  'execution-context-created',
  'workflow-runtime-advanced',
  'task-runtime-completed',
  'ai-agent-emitted-event',
  'autonomous-agent-approved',
  'product-ui-event',
  'artifact-rendered',
  'publish-automated',
  'distillery-output-published'
] as const;
const schemaKeywords = ['required', 'properties', 'jsonSchema', 'zodSchema'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreEventCatalogSkeletons(entries: readonly CoreEventCatalogEntry[]): readonly string[] {
  if (!Array.isArray(entries)) return ['Core event catalog skeletons must be an array.'];

  const errors: string[] = [];
  const ids = new Set<string>();
  const eventTypes = new Set<string>();

  if (entries.length !== expectedCount) errors.push(`Core event catalog skeletons must contain exactly ${expectedCount} entries.`);

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${path} must be a plain object.`);
      return;
    }

    if (!entry.id) errors.push(`${path}.id is required.`);
    if (!entry.eventType) errors.push(`${path}.eventType is required.`);
    if (!entry.domainId) errors.push(`${path}.domainId is required.`);
    if (!entry.name) errors.push(`${path}.name is required.`);
    if (!entry.description) errors.push(`${path}.description is required.`);
    if (!entry.status) errors.push(`${path}.status is required.`);
    if (!entry.book) errors.push(`${path}.book is required.`);
    if (!entry.purpose) errors.push(`${path}.purpose is required.`);
    if (!entry.action) errors.push(`${path}.action is required.`);
    if (!Array.isArray(entry.owns)) errors.push(`${path}.owns must be an array.`);
    if (!Array.isArray(entry.nonGoals)) errors.push(`${path}.nonGoals must be an array.`);

    if (typeof entry.id === 'string') {
      if (ids.has(entry.id)) errors.push(`${path}.id must be unique.`);
      ids.add(entry.id);
    }
    if (typeof entry.eventType === 'string') {
      if (!kebabCasePattern.test(entry.eventType)) errors.push(`${path}.eventType must be kebab-case.`);
      if (eventTypes.has(entry.eventType)) errors.push(`${path}.eventType must be unique.`);
      eventTypes.add(entry.eventType);
    }
    if (typeof entry.domainId === 'string' && !registryDomainIds.has(entry.domainId)) errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (typeof entry.action === 'string' && !validActions.has(entry.action)) errors.push(`${path}.action must be a valid CoreEventAction.`);
    if (typeof entry.status === 'string' && !validStatuses.has(entry.status)) errors.push(`${path}.status must be a valid CoreContractStatus.`);
    if (entry.metadata !== undefined && !isPlainObject(entry.metadata)) errors.push(`${path}.metadata must be a plain object.`);

    const searchable = JSON.stringify(entry).toLowerCase();
    for (const concept of excludedConcepts) if (searchable.includes(concept)) errors.push(`${path} must not include excluded event concept ${concept}.`);

    if (entry.payloadShape !== undefined) {
      if (!Array.isArray(entry.payloadShape)) {
        errors.push(`${path}.payloadShape must be an array when present.`);
      } else {
        entry.payloadShape.forEach((item, itemIndex) => {
          if (typeof item !== 'string') errors.push(`${path}.payloadShape[${itemIndex}] must be textual only.`);
          for (const keyword of schemaKeywords) if (typeof item === 'string' && item.toLowerCase().includes(keyword.toLowerCase())) errors.push(`${path}.payloadShape[${itemIndex}] must not include concrete schema keyword ${keyword}.`);
        });
      }
    }
  });

  return errors;
}
