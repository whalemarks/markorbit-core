import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreAiGovernanceContract } from './core-ai-governance-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-10T00:00:00.000Z';
const agentDomainId = 'agent' as CoreDomainId;
const sourceBookPath = 'books/book-02-core-specification/';
const sourceInventory =
  'docs/architecture/core-ai-governance-contract-inventory.md';

const sharedNonGoals = [
  'AI model or prompt execution, agent runtime, orchestration, autonomous authority, or self-escalation.',
  'Permission grants or evaluation, policy authoring or enforcement, human review decisions, or approval execution.',
  'Service, API, workflow, event bus, database, Product UI, professional truth, legal conclusion, compliance decision, routing selection, filing, payment, sending, task completion, or state mutation.',
  'Production data, restricted data, credentials, model or provider integration, RAG, vector stores, or AI infrastructure.'
] as const;

const metadata = {
  specificationRepository: 'whalemarks/markorbit-publication',
  specificationPath: sourceBookPath,
  sourceInventory
} as const;

const aiGovernanceSkeleton = (
  id: string,
  governanceType: string,
  name: string,
  description: string,
  sourceReferences: readonly string[],
  purpose: string,
  appliesTo: string,
  owns: readonly string[],
  specificNonGoals: readonly string[],
  requiresHumanReview?: boolean
): CoreAiGovernanceContract => ({
  id: createCoreContractId(id),
  governanceType,
  domainId: agentDomainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  sourceReferences,
  purpose,
  appliesTo: [appliesTo],
  protectedAction: false,
  requiresHumanReview,
  owns,
  nonGoals: [...sharedNonGoals, ...specificNonGoals],
  createdAt,
  metadata
});

export const CORE_AI_GOVERNANCE_CONTRACT_SKELETONS = [
  aiGovernanceSkeleton(
    'core-ai-governance-ai-agent-contract',
    'ai-agent',
    'Core AI Agent Governance Contract Skeleton',
    'Skeleton contract for the governed AI actor boundary.',
    ['B02-APP-C §11.1', 'B02-CH-26 §§7, 11'],
    'Defines the placeholder boundary for AI Agent identity, purpose, bounded role, and governance references without implementing an agent runtime.',
    'Textual governed AI actor boundary only.',
    [
      'AI Agent identity, purpose, bounded role, and governance-reference boundary.'
    ],
    ['Duplicate Agent object schemas or Agent Registry implementation.']
  ),
  aiGovernanceSkeleton(
    'core-ai-governance-agent-contract',
    'agent-contract',
    'Core AI Agent Contract Skeleton',
    'Skeleton contract for the mandatory Agent Contract boundary.',
    ['B02-APP-C §11.2', 'B02-CH-26 §8'],
    'Defines the placeholder agreement for allowed and prohibited capabilities, authorized knowledge, access, outputs, risk, review, audit, failure, and consumers.',
    'Textual mandatory Agent Contract boundary only.',
    ['Required Agent Contract governance boundary.'],
    [
      'Executable authorization, service access enforcement, dynamic contract generation, or agent delegation runtime.'
    ]
  ),
  aiGovernanceSkeleton(
    'core-ai-governance-ai-capability-contract',
    'ai-capability',
    'Core AI Capability Governance Contract Skeleton',
    'Skeleton contract for declared AI assistance capability boundaries.',
    ['B02-APP-C §11.3', 'B02-CH-26 §§6, 9'],
    'Defines capability eligibility and prohibited-capability boundaries under an Agent Contract without implying authorization.',
    'Textual AI assistance capability boundary only.',
    ['Declared AI capability eligibility and prohibited-capability boundary.'],
    [
      'Capability engines, tool execution, runtime authorization, marketplaces, scoring, or any implication that capability equals permission.'
    ]
  ),
  aiGovernanceSkeleton(
    'core-ai-governance-ai-output-contract',
    'ai-output',
    'Core AI Output Governance Contract Skeleton',
    'Skeleton contract for controlled AI-produced output boundaries.',
    ['B02-APP-C §11.4', 'B02-CH-26 §16'],
    'Defines output classification, AI-origin disclosure, source scope, risk, review, downstream-use, and storage-boundary expectations without generating output.',
    'Textual controlled AI-produced output boundary only.',
    [
      'AI output classification, origin, source, risk, review, downstream-use, and storage-boundary metadata.'
    ],
    [
      'Content generation, output approval, professional truth, Product UI display, state mutation, or AI Output service implementation.'
    ]
  ),
  aiGovernanceSkeleton(
    'core-ai-governance-ai-recommendation-contract',
    'ai-recommendation',
    'Core AI Recommendation Governance Contract Skeleton',
    'Skeleton contract for advisory AI recommendation boundaries.',
    ['B02-APP-C §11.5', 'B02-CH-26 §17'],
    'Defines basis, confidence or uncertainty, knowledge reference, risk, review, and consumer-boundary expectations for advisory recommendations.',
    'Textual advisory AI recommendation boundary only.',
    [
      'AI recommendation basis, uncertainty, knowledge reference, risk, review, and consumer-boundary requirements.'
    ],
    [
      'Final professional judgment, routing selection, filing decisions, provider selection, task completion, or automatic downstream action.'
    ],
    true
  ),
  aiGovernanceSkeleton(
    'core-ai-governance-ai-audit-record-contract',
    'ai-audit-record',
    'Core AI Audit Record Governance Contract Skeleton',
    'Skeleton contract for AI invocation and governance trace boundaries.',
    ['B02-APP-C §11.6', 'B02-CH-26 §21'],
    'Defines trace expectations for agent, contract version, context, sources, access, output, risk, review, events, actor, failure, and timestamp.',
    'Textual AI invocation and governance trace boundary only.',
    ['AI invocation and governance trace requirements.'],
    [
      'Audit engines, compliance conclusions, event emission, log infrastructure, model evaluation platforms, or event-history mutation.'
    ]
  ),
  aiGovernanceSkeleton(
    'core-ai-governance-structured-context-contract',
    'structured-context',
    'Core Structured Context Governance Contract Skeleton',
    'Skeleton contract for authorized and bounded AI input context.',
    [
      'B02-APP-C §11.7',
      'B02-CH-26 §§12–15',
      'B02-CONTRACT-COMMON-AI-CONTEXT §§6–8'
    ],
    'Defines authorized knowledge, object and service access declarations, missing-context disclosure, restricted-field omission, and least-authorized-context boundaries.',
    'Textual authorized and bounded AI input-context boundary only.',
    [
      'Authorized AI context, access declaration, missing-context disclosure, and restricted-field omission boundary.'
    ],
    [
      'Prompt construction runtime, RAG or vector architecture, unrestricted content access, credential access, source validation, or context assembly services.'
    ]
  ),
  aiGovernanceSkeleton(
    'core-ai-governance-human-review-requirement-contract',
    'human-review-requirement',
    'Core Human Review Requirement Governance Contract Skeleton',
    'Skeleton contract for risk-based AI human-review requirements.',
    ['B02-APP-C §11.8', 'B02-CH-26 §§18–19', 'B02-AGENT-AI-GOVERNANCE §18'],
    'Defines review levels, protected-use triggers, reviewer-reference requirements, and downstream-use restrictions without performing review.',
    'Textual risk-based AI review-requirement boundary only.',
    ['AI human-review requirement and downstream-use restriction boundary.'],
    [
      'Review Record execution, approval decisions, review routing, workflow gates, or protected action execution.'
    ],
    true
  )
] as const satisfies readonly CoreAiGovernanceContract[];
