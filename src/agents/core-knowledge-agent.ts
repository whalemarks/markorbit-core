import {
  evaluateCoreNamedAgentBoundary,
  type CoreAgentBoundaryResult,
  type CoreAgentRequest
} from './core-named-agent-boundary.ts';
import { getCoreNamedAgentDefinition } from './core-named-agent-registry.ts';

export function evaluateCoreKnowledgeAgent(
  request: CoreAgentRequest
): CoreAgentBoundaryResult {
  const definition = getCoreNamedAgentDefinition('knowledge-agent');
  if (!definition) throw new Error('missing knowledge-agent definition');
  return evaluateCoreNamedAgentBoundary(definition, request);
}
