import {
  evaluateCoreNamedAgentBoundary,
  type CoreAgentBoundaryResult,
  type CoreAgentRequest
} from './core-named-agent-boundary.ts';
import { getCoreNamedAgentDefinition } from './core-named-agent-registry.ts';

export function evaluateCoreTaskAgent(
  request: CoreAgentRequest
): CoreAgentBoundaryResult {
  const definition = getCoreNamedAgentDefinition('task-agent');
  if (!definition) throw new Error('missing task-agent definition');
  return evaluateCoreNamedAgentBoundary(definition, request);
}
