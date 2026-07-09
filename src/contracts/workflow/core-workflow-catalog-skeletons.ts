import { createCoreWorkflowContractType } from '../../workflows/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreWorkflowCatalogEntry } from './core-workflow-catalog-entry.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const nonGoals = [
  'Workflow engine, runtime execution, executable transitions, or running workflow instances.',
  'Book 03 Workflow Coordination Model, Execution System, task runtime, or database behavior.',
  'Product UI semantics or AI agent authority to advance, approve, complete, or execute workflows.'
] as const;

const workflowSkeleton = (
  workflowType: string,
  domainId: CoreWorkflowCatalogEntry['domainId'],
  name: string,
  description: string,
  purpose: string,
  stepTypes: readonly string[],
  flags: Pick<CoreWorkflowCatalogEntry, 'reviewRequired' | 'protectedAction'> = {}
): CoreWorkflowCatalogEntry => ({
  id: createCoreContractId(`core-workflow-${workflowType}-contract`),
  workflowType: createCoreWorkflowContractType(workflowType),
  domainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  stepTypes,
  ...flags,
  owns: [`Catalog skeleton boundary for ${name}.`],
  nonGoals,
  createdAt
});

export const CORE_WORKFLOW_CATALOG_SKELETONS = [
  workflowSkeleton('core-record-preparation-workflow', 'workflow-contract', 'Core Record Preparation Workflow Catalog Skeleton', 'Skeleton catalog entry for preparing Core records for review.', 'Names the baseline workflow concept for preparing Core records before governed review.', ['preparation placeholder', 'review readiness placeholder']),
  workflowSkeleton('core-record-review-workflow', 'workflow-contract', 'Core Record Review Workflow Catalog Skeleton', 'Skeleton catalog entry for reviewing Core records.', 'Names the baseline workflow concept for human review of Core records.', ['review request placeholder', 'review outcome placeholder'], { reviewRequired: true, protectedAction: true }),
  workflowSkeleton('core-document-reference-workflow', 'document', 'Core Document Reference Workflow Catalog Skeleton', 'Skeleton catalog entry for referencing Core documents.', 'Names the baseline workflow concept for associating document references with Core records.', ['document reference placeholder']),
  workflowSkeleton('core-evidence-reference-workflow', 'evidence', 'Core Evidence Reference Workflow Catalog Skeleton', 'Skeleton catalog entry for referencing Core evidence.', 'Names the baseline workflow concept for associating evidence references with Core records.', ['evidence reference placeholder']),
  workflowSkeleton('core-task-review-workflow', 'task', 'Core Task Review Workflow Catalog Skeleton', 'Skeleton catalog entry for reviewing Core tasks.', 'Names the baseline workflow concept for governed review of Core tasks.', ['task review placeholder'], { reviewRequired: true }),
  workflowSkeleton('core-communication-review-workflow', 'communication', 'Core Communication Review Workflow Catalog Skeleton', 'Skeleton catalog entry for reviewing Core communications.', 'Names the baseline workflow concept for governed review of Core communications.', ['communication review placeholder'], { reviewRequired: true, protectedAction: true }),
  workflowSkeleton('core-contract-registration-workflow', 'workflow-contract', 'Core Contract Registration Workflow Catalog Skeleton', 'Skeleton catalog entry for registering Core contracts.', 'Names the baseline workflow concept for registering Core contract definitions.', ['registration placeholder'], { protectedAction: true }),
  workflowSkeleton('core-validation-review-workflow', 'policy', 'Core Validation Review Workflow Catalog Skeleton', 'Skeleton catalog entry for reviewing Core validation results.', 'Names the baseline workflow concept for governed review of Core validation outcomes.', ['validation review placeholder'], { reviewRequired: true })
] as const satisfies readonly CoreWorkflowCatalogEntry[];
