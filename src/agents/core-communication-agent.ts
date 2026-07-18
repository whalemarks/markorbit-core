import {
  evaluateCoreNamedAgentBoundary,
  type CoreAgentBoundaryResult,
  type CoreAgentRequest
} from './core-named-agent-boundary.ts';
import { getCoreNamedAgentDefinition } from './core-named-agent-registry.ts';

export function evaluateCoreCommunicationAgent(
  request: CoreAgentRequest
): CoreAgentBoundaryResult {
  const definition = getCoreNamedAgentDefinition('communication-agent');
  if (!definition) throw new Error('missing communication-agent definition');
  return evaluateCoreNamedAgentBoundary(definition, request);
}
