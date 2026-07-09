import { CORE_EVENT_ACTIONS, createCoreEventType } from '../../events/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreEventCatalogEntry } from './core-event-catalog-entry.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const nonGoals = [
  'Event bus, event stream, event sourcing, persistence, or runtime emission behavior.',
  'Book 03 Event Trace, Audit, Replay, workflow runtime, product UI, or database behavior.',
  'Concrete payload schemas or AI agent authority to independently emit governed Events.'
] as const;

const eventSkeleton = (
  eventType: string,
  domainId: CoreEventCatalogEntry['domainId'],
  name: string,
  description: string,
  purpose: string,
  action: CoreEventCatalogEntry['action'],
  subject: string
): CoreEventCatalogEntry => ({
  id: createCoreContractId(`core-event-${eventType}-contract`),
  eventType: createCoreEventType(eventType),
  domainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  action,
  subject,
  owns: [`Catalog skeleton boundary for ${name}.`],
  payloadShape: ['Textual placeholder only; concrete payload schema is intentionally not defined.'],
  nonGoals,
  createdAt
});

export const CORE_EVENT_CATALOG_SKELETONS = [
  eventSkeleton('core-object-created', 'event', 'Core Object Created Event Catalog Skeleton', 'Skeleton catalog entry for Core object creation events.', 'Names the baseline event concept for recording that a Core object has been created.', CORE_EVENT_ACTIONS.created, 'core-object'),
  eventSkeleton('core-object-updated', 'event', 'Core Object Updated Event Catalog Skeleton', 'Skeleton catalog entry for Core object update events.', 'Names the baseline event concept for recording that a Core object has been updated.', CORE_EVENT_ACTIONS.updated, 'core-object'),
  eventSkeleton('core-object-status-changed', 'event', 'Core Object Status Changed Event Catalog Skeleton', 'Skeleton catalog entry for Core object status change events.', 'Names the baseline event concept for recording that a Core object status has changed.', CORE_EVENT_ACTIONS.statusChanged, 'core-object'),
  eventSkeleton('core-object-archived', 'event', 'Core Object Archived Event Catalog Skeleton', 'Skeleton catalog entry for Core object archive events.', 'Names the baseline event concept for recording that a Core object has been archived.', CORE_EVENT_ACTIONS.archived, 'core-object'),
  eventSkeleton('core-task-created', 'task', 'Core Task Created Event Catalog Skeleton', 'Skeleton catalog entry for Core task creation events.', 'Names the baseline event concept for recording that a Core task has been created.', CORE_EVENT_ACTIONS.created, 'core-task'),
  eventSkeleton('core-task-status-changed', 'task', 'Core Task Status Changed Event Catalog Skeleton', 'Skeleton catalog entry for Core task status change events.', 'Names the baseline event concept for recording that a Core task status has changed.', CORE_EVENT_ACTIONS.statusChanged, 'core-task'),
  eventSkeleton('core-review-requested', 'task', 'Core Review Requested Event Catalog Skeleton', 'Skeleton catalog entry for Core review request events.', 'Names the baseline event concept for recording that a Core review has been requested.', CORE_EVENT_ACTIONS.requested, 'core-review'),
  eventSkeleton('core-review-completed', 'task', 'Core Review Completed Event Catalog Skeleton', 'Skeleton catalog entry for Core review completion events.', 'Names the baseline event concept for recording that a Core review has been completed.', CORE_EVENT_ACTIONS.completed, 'core-review'),
  eventSkeleton('core-workflow-contract-registered', 'workflow-contract', 'Core Workflow Contract Registered Event Catalog Skeleton', 'Skeleton catalog entry for Core workflow contract registration events.', 'Names the baseline event concept for recording that a Core workflow contract has been registered.', CORE_EVENT_ACTIONS.created, 'core-workflow-contract'),
  eventSkeleton('core-workflow-step-defined', 'workflow-contract', 'Core Workflow Step Defined Event Catalog Skeleton', 'Skeleton catalog entry for Core workflow step definition events.', 'Names the baseline event concept for recording that a Core workflow step has been defined.', CORE_EVENT_ACTIONS.created, 'core-workflow-step'),
  eventSkeleton('core-communication-draft-created', 'communication', 'Core Communication Draft Created Event Catalog Skeleton', 'Skeleton catalog entry for Core communication draft creation events.', 'Names the baseline event concept for recording that a Core communication draft has been created.', CORE_EVENT_ACTIONS.created, 'core-communication'),
  eventSkeleton('core-communication-approved', 'communication', 'Core Communication Approved Event Catalog Skeleton', 'Skeleton catalog entry for Core communication approval events.', 'Names the baseline event concept for recording that a Core communication has been approved.', CORE_EVENT_ACTIONS.approved, 'core-communication')
] as const satisfies readonly CoreEventCatalogEntry[];
