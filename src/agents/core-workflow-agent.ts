import {
  evaluateCoreNamedAgentBoundary,
  type CoreAgentBoundaryResult,
  type CoreAgentRequest
} from './core-named-agent-boundary.ts';
import { getCoreNamedAgentDefinition } from './core-named-agent-registry.ts';

export function evaluateCoreWorkflowAgent(
  request: CoreAgentRequest
): CoreAgentBoundaryResult {
  const definition = getCoreNamedAgentDefinition('workflow-agent');
  if (!definition) throw new Error('missing workflow-agent definition');
  return evaluateCoreNamedAgentBoundary(definition, request);
}
