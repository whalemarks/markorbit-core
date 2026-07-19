import {
  evaluateCoreNamedAgentBoundary,
  type CoreAgentBoundaryResult,
  type CoreAgentRequest
} from './core-named-agent-boundary.ts';
import { getCoreNamedAgentDefinition } from './core-named-agent-registry.ts';

export function evaluateCoreAuditAgent(
  request: CoreAgentRequest
): CoreAgentBoundaryResult {
  const definition = getCoreNamedAgentDefinition('audit-agent');
  if (!definition) throw new Error('missing audit-agent definition');
  return evaluateCoreNamedAgentBoundary(definition, request);
}
