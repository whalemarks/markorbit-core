import {
  CORE_AGENT_ALLOWED_CAPABILITIES,
  type CoreAgentBoundaryRegistry
} from './core-agent-boundary.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult
} from './core-safe-error.ts';

export const CORE_AI_DATA_ACCESS_SCOPES = [
  'NoAccess',
  'MetadataOnly',
  'SafeSummaryOnly',
  'PolicyFilteredContent',
  'RestrictedContentWithHumanApproval',
  'Unknown'
] as const;
export const CORE_AI_OUTPUT_MODES = [
  'SafeSummary',
  'Draft',
  'Suggestion',
  'ValidationResult',
  'ExtractionResult',
  'ClassificationResult',
  'Recommendation',
  'PreparationResult',
  'TraceExplanation',
  'Unknown'
] as const;

export interface CoreAiContext {
  readonly aiAssisted: boolean;
  readonly agentReferenceId: string | null;
  readonly agentRegistryKey: string | null;
  readonly capabilityUsed: string | null;
  readonly dataAccessScope: string | null;
  readonly outputMode: string | null;
  readonly aiGenerated: boolean;
  readonly humanReviewRequired: boolean | null;
  readonly sourceReferenceIds: readonly string[];
  readonly restrictedFieldsOmitted: boolean;
}

export function validateCoreAiContext(
  context: CoreAiContext,
  registry: CoreAgentBoundaryRegistry
): CoreBehaviorResult<CoreAiContext> {
  if (!context.aiAssisted) {
    if (context.aiGenerated)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ValidationFailed',
          category: 'Agent',
          message: 'AI-generated output must disclose AI assistance.'
        })
      };
    return { ok: true, value: Object.freeze({ ...context }) };
  }

  if (
    context.agentReferenceId === null ||
    context.agentRegistryKey === null ||
    context.capabilityUsed === null
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'AgentContractRequired',
        category: 'Agent',
        message: 'Governed AI assistance requires Agent registry context.'
      })
    };
  if (
    !CORE_AGENT_ALLOWED_CAPABILITIES.includes(context.capabilityUsed as never)
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'CapabilityNotAllowed',
        category: 'Agent',
        message: 'The requested AI capability is not allowed.'
      })
    };
  if (
    context.dataAccessScope === null ||
    !CORE_AI_DATA_ACCESS_SCOPES.includes(context.dataAccessScope as never) ||
    context.outputMode === null ||
    !CORE_AI_OUTPUT_MODES.includes(context.outputMode as never)
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Agent',
        message: 'The AI access scope or output mode is invalid.'
      })
    };
  if (!context.aiGenerated || context.humanReviewRequired === null)
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'HumanReviewRequired',
        category: 'HumanReview',
        message: 'AI output marking and review requirements must be explicit.'
      })
    };

  const boundary = registry.evaluate({
    agentReferenceId: context.agentReferenceId,
    registryKey: context.agentRegistryKey,
    capability: context.capabilityUsed
  });
  if (!boundary.ok) return boundary;

  if (
    new Set(context.sourceReferenceIds).size !==
    context.sourceReferenceIds.length
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ReferenceInvalid',
        category: 'Reference',
        message: 'AI source references must be unique.'
      })
    };
  return {
    ok: true,
    value: Object.freeze({
      ...context,
      sourceReferenceIds: Object.freeze([...context.sourceReferenceIds])
    })
  };
}
