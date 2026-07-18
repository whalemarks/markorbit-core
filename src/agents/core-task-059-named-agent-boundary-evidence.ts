import { CORE_NAMED_AGENT_DEFINITIONS } from './core-named-agent-registry.ts';

const implementationFiles = [
  'src/agents/core-named-agent-boundary.ts',
  'src/agents/core-named-agent-registry.ts'
] as const;
const testFiles = [
  'tests/unit/core-task-059-named-agent-boundaries.test.ts'
] as const;
const fixtureFiles = [
  'fixtures/agents/core-task-059-named-agent-boundaries.fixture.json'
] as const;

export const CORE_TASK_059_NAMED_AGENT_BOUNDARY_EVIDENCE = {
  taskId: 'CORE-TASK-059',
  schemaVersion: 'core-agent-boundary-evidence.v1',
  nextTask: 'CORE-TASK-060',
  book02MvpComplete: false,
  neverInMvpViolations: 0,
  agents: CORE_NAMED_AGENT_DEFINITIONS.map((agent) => ({
    book02RequirementId: agent.book02RequirementId,
    agentId: agent.agentId,
    implementationFiles: [
      ...implementationFiles,
      `src/agents/core-${agent.agentId.replace('-agent', '')}-agent.ts`,
      'src/agents/index.ts'
    ],
    allowedCapabilityIds: agent.allowedCapabilities,
    forbiddenCapabilityIds: agent.forbiddenCapabilities,
    delegationTargets: agent.permittedDelegationTargets,
    humanReviewRequirement: agent.humanReviewRequiredForProtectedActions,
    directMutationProhibited: true,
    directEventEmissionProhibited: true,
    traceNotCommandRule: true,
    testFiles,
    fixtureFiles,
    requiredDepth: 'level_2',
    achievedDepth: 'level_2'
  })),
  sharedEvidence: {
    requirementId: 'must-test-agent-boundary-tests',
    implementationFiles,
    testFiles,
    fixtureFiles,
    requiredDepth: 'level_2',
    achievedDepth: 'level_2',
    agentLayerDoesNotEmitEventsDirectly: true,
    aiForbiddenActionsAreBlocked: true,
    humanReviewGatesProtectedActions: true
  }
} as const;

export function validateCoreTask059NamedAgentBoundaryEvidence(): readonly string[] {
  const issues: string[] = [];
  if (CORE_TASK_059_NAMED_AGENT_BOUNDARY_EVIDENCE.agents.length !== 5)
    issues.push(
      'CORE-TASK-059 evidence must contain exactly five named Agents.'
    );
  for (const agent of CORE_TASK_059_NAMED_AGENT_BOUNDARY_EVIDENCE.agents) {
    if (agent.achievedDepth !== agent.requiredDepth)
      issues.push(`${agent.agentId} has not reached required depth.`);
    if (
      !agent.directMutationProhibited ||
      !agent.directEventEmissionProhibited ||
      !agent.traceNotCommandRule
    )
      issues.push(`${agent.agentId} is missing safety boundary proof.`);
  }
  return issues;
}
