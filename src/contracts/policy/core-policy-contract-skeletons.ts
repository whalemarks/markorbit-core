import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CorePolicyContract } from './core-policy-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-10T00:00:00.000Z';
const policyDomainId = 'policy' as CoreDomainId;

const policyNonGoals = [
  'Executable policy evaluation, policy engine behavior, rule evaluation, compliance decisions, or runtime enforcement.',
  'Book 03 execution runtime, product UI behavior, database schema, API server behavior, or AI agent policy authority.'
] as const;

const policySkeleton = (policyType: string, name: string, description: string, purpose: string, requiresHumanReview: boolean): CorePolicyContract => ({
  id: createCoreContractId(`core-policy-${policyType}-contract`),
  policyType,
  domainId: policyDomainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  appliesTo: ['Textual Core policy contract boundary only.'],
  protectedAction: true,
  requiresHumanReview,
  owns: [`${policyType} skeleton boundary`],
  nonGoals: policyNonGoals,
  createdAt
});

export const CORE_POLICY_CONTRACT_SKELETONS = [
  policySkeleton('core-data-access-policy', 'Core Data Access Policy Contract Skeleton', 'Skeleton contract for Core data access policy boundaries.', 'Defines the placeholder boundary for Core data access policy semantics without evaluating access.', false),
  policySkeleton('core-data-retention-policy', 'Core Data Retention Policy Contract Skeleton', 'Skeleton contract for Core data retention policy boundaries.', 'Defines the placeholder boundary for Core data retention policy semantics without applying retention decisions.', false),
  policySkeleton('core-review-policy', 'Core Review Policy Contract Skeleton', 'Skeleton contract for Core review policy boundaries.', 'Defines the placeholder boundary for Core review policy semantics as a human-reviewed protected action flag only.', true),
  policySkeleton('core-approval-policy', 'Core Approval Policy Contract Skeleton', 'Skeleton contract for Core approval policy boundaries.', 'Defines the placeholder boundary for Core approval policy semantics as a human-reviewed protected action flag only.', true),
  policySkeleton('core-communication-policy', 'Core Communication Policy Contract Skeleton', 'Skeleton contract for Core communication policy boundaries.', 'Defines the placeholder boundary for Core communication policy semantics as a human-reviewed protected action flag only.', true),
  policySkeleton('core-ai-assistance-policy', 'Core AI Assistance Policy Contract Skeleton', 'Skeleton contract for Core AI assistance policy boundaries.', 'Defines the placeholder boundary for Core AI assistance policy semantics without granting AI agent policy authority.', true),
  policySkeleton('core-audit-policy', 'Core Audit Policy Contract Skeleton', 'Skeleton contract for Core audit policy boundaries.', 'Defines the placeholder boundary for Core audit policy semantics without enforcing audit workflows.', false),
  policySkeleton('core-change-control-policy', 'Core Change Control Policy Contract Skeleton', 'Skeleton contract for Core change control policy boundaries.', 'Defines the placeholder boundary for Core change control policy semantics as a human-reviewed protected action flag only.', true)
] as const satisfies readonly CorePolicyContract[];
