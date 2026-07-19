import {
  evaluateCoreNamedAgentBoundary,
  type CoreAgentBoundaryResult,
  type CoreAgentRequest,
  type CoreNamedAgentDefinition,
  type CoreNamedAgentId
} from './core-named-agent-boundary.ts';

export const CORE_NAMED_AGENT_DEFINITIONS = [
  {
    agentId: 'knowledge-agent',
    purpose:
      'Retrieve, organize, summarize and cite already-governed knowledge references.',
    allowedOperations: [
      'validate-references',
      'summarize-knowledge',
      'propose-follow-up-task'
    ],
    allowedCapabilities: [
      'validate-governed-references',
      'summarize-governed-content',
      'prepare-task-proposal'
    ],
    forbiddenCapabilities: [
      'legal-certification',
      'registrability-certification',
      'deadline-certification',
      'direct-domain-mutation',
      'direct-event-emission'
    ],
    permittedDelegationTargets: ['knowledge-api', 'task-api'],
    humanReviewRequiredForProtectedActions: true,
    book02RequirementId: 'must-agent-knowledge-agent'
  },
  {
    agentId: 'task-agent',
    purpose:
      'Recommend Task creation, priority, assignment criteria or follow-up.',
    allowedOperations: ['recommend-task', 'delegate-approved-task-mutation'],
    allowedCapabilities: ['prepare-task-proposal', 'delegate-task-api'],
    forbiddenCapabilities: [
      'direct-domain-mutation',
      'deadline-certification',
      'autonomous-scheduling',
      'changed-approved-plan'
    ],
    permittedDelegationTargets: ['task-api'],
    humanReviewRequiredForProtectedActions: true,
    book02RequirementId: 'must-agent-task-agent'
  },
  {
    agentId: 'communication-agent',
    purpose: 'Draft, summarize and prepare Communication review inputs.',
    allowedOperations: [
      'draft-communication',
      'summarize-communication',
      'delegate-review-workflow'
    ],
    allowedCapabilities: [
      'draft-communication',
      'delegate-communication-review-workflow'
    ],
    forbiddenCapabilities: [
      'external-send',
      'self-approval',
      'alter-approved-content',
      'direct-event-emission'
    ],
    permittedDelegationTargets: [
      'communication-review-workflow',
      'communication-api'
    ],
    humanReviewRequiredForProtectedActions: true,
    book02RequirementId: 'must-agent-communication-agent'
  },
  {
    agentId: 'workflow-agent',
    purpose:
      'Inspect registered Workflow contracts and prepare bounded preview requests.',
    allowedOperations: [
      'lookup-registered-workflow',
      'prepare-preview',
      'invoke-preview'
    ],
    allowedCapabilities: [
      'prepare-workflow-preview',
      'invoke-workflow-preview'
    ],
    forbiddenCapabilities: [
      'autonomous-apply',
      'generic-workflow',
      'provider-final-selection',
      'direct-event-emission'
    ],
    permittedDelegationTargets: ['workflow-preview-boundary'],
    humanReviewRequiredForProtectedActions: true,
    book02RequirementId: 'must-agent-workflow-agent'
  },
  {
    agentId: 'audit-agent',
    purpose:
      'Inspect immutable audit context, Event references and delegation traces.',
    allowedOperations: ['inspect-audit-trace', 'report-anomaly'],
    allowedCapabilities: ['inspect-audit-trace', 'prepare-task-proposal'],
    forbiddenCapabilities: [
      'audit-history-rewrite',
      'direct-event-emission',
      'event-command',
      'compliance-certification',
      'fabricated-completion'
    ],
    permittedDelegationTargets: ['audit-api', 'task-api'],
    humanReviewRequiredForProtectedActions: true,
    book02RequirementId: 'must-agent-audit-agent'
  }
] as const satisfies readonly CoreNamedAgentDefinition[];

export function getCoreNamedAgentDefinition(
  agentId: string
): CoreNamedAgentDefinition | null {
  return (
    CORE_NAMED_AGENT_DEFINITIONS.find((agent) => agent.agentId === agentId) ??
    null
  );
}
export function evaluateRegisteredCoreNamedAgent(
  request: CoreAgentRequest
): CoreAgentBoundaryResult {
  const definition = getCoreNamedAgentDefinition(request.agentId);
  if (!definition)
    return {
      ok: false,
      error: {
        code: 'AgentContractRequired',
        category: 'Agent',
        message: 'Unknown named Agent id.',
        safeDetail: null,
        retryable: false,
        correlationId: request.context?.correlationReferenceId ?? null
      }
    };
  return evaluateCoreNamedAgentBoundary(definition, request);
}
export const CORE_NAMED_AGENT_IDS = CORE_NAMED_AGENT_DEFINITIONS.map(
  (agent) => agent.agentId
) as readonly CoreNamedAgentId[];
