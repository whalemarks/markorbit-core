import {
  createCoreSafeError,
  type CoreBehaviorResult
} from './core-safe-error.ts';

export const CORE_AGENT_ALLOWED_CAPABILITIES = [
  'Read',
  'Summarize',
  'Classify',
  'Extract',
  'ValidateReference',
  'Draft',
  'Suggest',
  'PrepareAction',
  'PrepareTask',
  'PrepareCommunication',
  'PrepareWorkflow',
  'PrepareRouting',
  'RequestKnowledge',
  'ExplainTrace'
] as const;
export const CORE_AGENT_FORBIDDEN_ACTIONS = [
  'Approve',
  'Send',
  'Select',
  'Submit',
  'Certify',
  'Complete',
  'MutateProtectedState',
  'EmitEvent'
] as const;

export interface CoreAgentRegistryEntry {
  readonly agentReferenceId: string;
  readonly registryKey: string;
  readonly status: 'Active' | 'Suspended' | 'Revoked';
  readonly allowedCapabilities: readonly string[];
  readonly contractVersion: string;
}

export class CoreAgentBoundaryRegistry {
  readonly #entries: ReadonlyMap<string, CoreAgentRegistryEntry>;

  constructor(entries: readonly CoreAgentRegistryEntry[]) {
    this.#entries = new Map(
      entries.map((entry) => [entry.registryKey, Object.freeze({ ...entry })])
    );
  }

  evaluate(input: {
    readonly agentReferenceId: string;
    readonly registryKey: string;
    readonly capability: string;
  }): CoreBehaviorResult<{
    readonly requiresPermissionPolicyEvaluation: true;
  }> {
    const entry = this.#entries.get(input.registryKey);
    if (
      entry === undefined ||
      entry.agentReferenceId !== input.agentReferenceId
    )
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'AgentContractRequired',
          category: 'Agent',
          message: 'The Agent registry context is invalid.'
        })
      };
    if (entry.status === 'Suspended')
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'AgentSuspended',
          category: 'Agent',
          message: 'The Agent is suspended.'
        })
      };
    if (entry.status === 'Revoked')
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'AgentRevoked',
          category: 'Agent',
          message: 'The Agent is revoked.'
        })
      };
    if (
      CORE_AGENT_FORBIDDEN_ACTIONS.includes(input.capability as never) ||
      !CORE_AGENT_ALLOWED_CAPABILITIES.includes(input.capability as never) ||
      !entry.allowedCapabilities.includes(input.capability)
    )
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'CapabilityNotAllowed',
          category: 'Agent',
          message: 'The requested Agent capability is not allowed.'
        })
      };
    return { ok: true, value: { requiresPermissionPolicyEvaluation: true } };
  }
}
