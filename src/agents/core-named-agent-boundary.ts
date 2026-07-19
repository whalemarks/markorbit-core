import { CoreAgentBoundaryRegistry } from '../behaviors/core-agent-boundary.ts';
import {
  enforceCoreGovernedAction,
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext,
  type CorePolicyContext
} from '../behaviors/core-governance-behavior.ts';
import {
  createCoreSafeError,
  type CoreSafeError
} from '../behaviors/core-safe-error.ts';

export type CoreNamedAgentId =
  | 'knowledge-agent'
  | 'task-agent'
  | 'communication-agent'
  | 'workflow-agent'
  | 'audit-agent';
export type CoreAgentCapability =
  | 'validate-governed-references'
  | 'summarize-governed-content'
  | 'prepare-task-proposal'
  | 'delegate-task-api'
  | 'draft-communication'
  | 'delegate-communication-review-workflow'
  | 'prepare-workflow-preview'
  | 'invoke-workflow-preview'
  | 'inspect-audit-trace';
export type CoreAgentDelegationPort =
  | 'task-api'
  | 'communication-api'
  | 'communication-review-workflow'
  | 'workflow-preview-boundary'
  | 'knowledge-api'
  | 'audit-api';

export interface CoreAgentEvidenceRecord {
  readonly referenceId: string;
  readonly referenceType: string;
  readonly organizationReferenceId: string;
  readonly digest?: string;
  readonly traceOnly?: boolean;
}
export interface CoreAgentProposedAction {
  readonly actionId: string;
  readonly capabilityId: CoreAgentCapability | string;
  readonly protected: boolean;
  readonly delegationTarget?: CoreAgentDelegationPort | string;
  readonly requiresApprovalLevel:
    'none' | 'human-review' | 'external-protected-action';
  readonly planDigest?: string;
  readonly approvedPlanDigest?: string;
}
export interface CoreAgentRecommendation {
  readonly agentId: CoreNamedAgentId;
  readonly operation: string;
  readonly normalizedSummary: string;
  readonly sourceReferenceIds: readonly string[];
  readonly proposedActions: readonly CoreAgentProposedAction[];
  readonly delegationIntent: readonly {
    readonly target: string;
    readonly actionId: string;
    readonly execution: 'not-executed' | 'delegated';
  }[];
  readonly eventReferences: readonly string[];
  readonly advisory: true;
  readonly schemaVersion: 'core-agent-boundary.v1';
}
export type CoreAgentSafeFailure = CoreSafeError;
export interface CoreAgentContext {
  readonly organizationReferenceId: string;
  readonly actorReferenceId: string;
  readonly authorizedOrganizationReferenceId: string;
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly humanReview: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly correlationReferenceId: string;
  readonly idempotencyKey?: string;
}
export interface CoreAgentRequest {
  readonly schemaVersion: 'core-agent-boundary.v1' | string;
  readonly agentId: CoreNamedAgentId | string;
  readonly operation: string;
  readonly capabilityId: CoreAgentCapability | string;
  readonly context: CoreAgentContext;
  readonly inputReferences: readonly CoreAgentEvidenceRecord[];
  readonly proposedActions?: readonly CoreAgentProposedAction[];
  readonly eventReferences?: readonly string[];
  readonly requestedDelegationTarget?: string;
  readonly canonicalInput?: Record<string, unknown>;
}
export type CoreAgentBoundaryResult =
  | { readonly ok: true; readonly value: CoreAgentRecommendation }
  | { readonly ok: false; readonly error: CoreAgentSafeFailure };

export interface CoreNamedAgentDefinition {
  readonly agentId: CoreNamedAgentId;
  readonly purpose: string;
  readonly allowedOperations: readonly string[];
  readonly allowedCapabilities: readonly CoreAgentCapability[];
  readonly forbiddenCapabilities: readonly string[];
  readonly permittedDelegationTargets: readonly CoreAgentDelegationPort[];
  readonly humanReviewRequiredForProtectedActions: boolean;
  readonly book02RequirementId: string;
}

const runtimeCapability = (capability: string) =>
  capability.includes('draft')
    ? 'Draft'
    : capability.includes('summarize') || capability.includes('inspect')
      ? 'Summarize'
      : capability.includes('validate')
        ? 'ValidateReference'
        : capability.includes('delegate') ||
            capability.includes('prepare') ||
            capability.includes('invoke')
          ? 'PrepareAction'
          : 'Suggest';
const present = (v: string | null | undefined) =>
  typeof v === 'string' && v.trim().length > 0;
const sorted = (values: readonly string[]) => [...values].sort();

function fail(
  code: CoreSafeError['code'],
  category: CoreSafeError['category'],
  message: string,
  correlationId?: string
): CoreAgentBoundaryResult {
  return {
    ok: false,
    error: createCoreSafeError({ code, category, message, correlationId })
  };
}

export function evaluateCoreNamedAgentBoundary(
  definition: CoreNamedAgentDefinition,
  request: CoreAgentRequest
): CoreAgentBoundaryResult {
  const correlationId = request.context?.correlationReferenceId;
  if (request.schemaVersion !== 'core-agent-boundary.v1')
    return fail(
      'VersionUnsupported',
      'Version',
      'Unsupported Agent boundary schema version.',
      correlationId
    );
  if (request.agentId !== definition.agentId)
    return fail(
      'AgentContractRequired',
      'Agent',
      'Unknown or mismatched named Agent identity.',
      correlationId
    );
  if (
    !definition.allowedOperations.includes(request.operation) ||
    !definition.allowedCapabilities.includes(
      request.capabilityId as CoreAgentCapability
    ) ||
    definition.forbiddenCapabilities.includes(request.capabilityId)
  )
    return fail(
      'CapabilityNotAllowed',
      'Agent',
      'The named Agent operation is outside its allowlist.',
      correlationId
    );
  if (
    request.context.organizationReferenceId !==
    request.context.authorizedOrganizationReferenceId
  )
    return fail(
      'ReferenceDomainMismatch',
      'Reference',
      'Agent organization context is inconsistent.',
      correlationId
    );
  if (
    request.context.actorReferenceId !==
    request.context.permission.actorReferenceId
  )
    return fail(
      'PermissionDenied',
      'Permission',
      'Agent actor context is inconsistent.',
      correlationId
    );
  const registered = new CoreAgentBoundaryRegistry([
    {
      agentReferenceId: definition.agentId,
      registryKey: definition.agentId,
      status: 'Active',
      allowedCapabilities: [runtimeCapability(request.capabilityId)],
      contractVersion: 'core-agent-boundary.v1'
    }
  ]).evaluate({
    agentReferenceId: definition.agentId,
    registryKey: definition.agentId,
    capability: runtimeCapability(request.capabilityId)
  });
  if (!registered.ok) return registered;
  const governed = enforceCoreGovernedAction({
    permission: request.context.permission,
    policy: request.context.policy,
    review: request.context.humanReview,
    audit: request.context.audit
  });
  if (!governed.ok) return governed;
  if (
    !request.inputReferences.every(
      (ref) =>
        present(ref.referenceId) &&
        ref.organizationReferenceId === request.context.organizationReferenceId
    )
  )
    return fail(
      'ReferenceInvalid',
      'Reference',
      'Agent input references must be governed and organization-scoped.',
      correlationId
    );
  if (
    request.inputReferences.some((ref) =>
      ref.referenceId.startsWith('fabricated:')
    )
  )
    return fail(
      'ReferenceInvalid',
      'Reference',
      'Agent input references must not be fabricated.',
      correlationId
    );
  if (
    request.requestedDelegationTarget &&
    !definition.permittedDelegationTargets.includes(
      request.requestedDelegationTarget as CoreAgentDelegationPort
    )
  )
    return fail(
      'DownstreamServiceRequired',
      'Service',
      'Delegation target is not permitted for this named Agent.',
      correlationId
    );
  const actions = request.proposedActions ?? [];
  if (
    actions.some((a) =>
      [
        'direct-domain-mutation',
        'direct-event-emission',
        'external-send',
        'external-protected-action',
        'legal-certification',
        'registrability-certification',
        'provider-final-selection',
        'audit-history-rewrite',
        'self-approval',
        'alter-approved-content',
        'changed-approved-plan',
        'event-command'
      ].includes(a.capabilityId)
    )
  )
    return fail(
      'CapabilityNotAllowed',
      'Agent',
      'Forbidden Agent action rejected by boundary.',
      correlationId
    );
  if (
    actions.some(
      (a) =>
        a.protected &&
        a.requiresApprovalLevel !== 'human-review' &&
        a.requiresApprovalLevel !== 'external-protected-action'
    )
  )
    return fail(
      'HumanReviewRequired',
      'HumanReview',
      'Protected Agent proposals require Human Review evidence.',
      correlationId
    );
  if (
    actions.some((a) => a.protected) &&
    request.context.humanReview.reviewDecision !== 'Approved'
  )
    return fail(
      'HumanReviewRequired',
      'HumanReview',
      'Protected Agent proposals are blocked without approved Human Review.',
      correlationId
    );
  if (
    actions.some(
      (a) =>
        a.delegationTarget &&
        !definition.permittedDelegationTargets.includes(
          a.delegationTarget as CoreAgentDelegationPort
        )
    )
  )
    return fail(
      'DownstreamServiceRequired',
      'Service',
      'Proposed delegation target is outside the Agent allowlist.',
      correlationId
    );
  if (
    actions.some(
      (a) =>
        a.approvedPlanDigest &&
        a.planDigest &&
        a.approvedPlanDigest !== a.planDigest
    )
  )
    return fail(
      'Conflict',
      'Conflict',
      'Agent cannot alter an approved plan digest.',
      correlationId
    );
  const sourceReferenceIds = sorted(
    request.inputReferences.map((ref) => ref.referenceId)
  );
  const eventReferences = sorted([
    ...(request.eventReferences ?? []),
    ...request.inputReferences
      .filter((ref) => ref.traceOnly || ref.referenceType === 'event')
      .map((ref) => ref.referenceId)
  ]);
  return {
    ok: true,
    value: {
      agentId: definition.agentId,
      operation: request.operation,
      normalizedSummary: `${definition.agentId}:${request.operation}:${sourceReferenceIds.join('|')}`,
      sourceReferenceIds,
      proposedActions: actions,
      delegationIntent: actions
        .filter((a) => a.delegationTarget)
        .map((a) => ({
          target: String(a.delegationTarget),
          actionId: a.actionId,
          execution:
            request.requestedDelegationTarget === a.delegationTarget
              ? 'delegated'
              : ('not-executed' as const)
        })),
      eventReferences,
      advisory: true,
      schemaVersion: 'core-agent-boundary.v1'
    }
  };
}
