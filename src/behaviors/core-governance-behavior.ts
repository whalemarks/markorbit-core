import {
  createCoreSafeError,
  type CoreBehaviorResult
} from './core-safe-error.ts';

export interface CorePermissionContext {
  readonly actorReferenceId: string | null;
  readonly intendedOperation: string;
  readonly requiredPermissionKeys: readonly string[];
  readonly permissionDecisionReferenceId: string | null;
  readonly permissionDecision: 'Allowed' | 'Denied' | null;
  readonly correlationId?: string | null;
}

export interface CorePolicyContext {
  readonly intendedOperation: string;
  readonly requiredPolicyScopes: readonly string[];
  readonly policyDecisionReferenceId: string | null;
  readonly policyDecision:
    | 'Allowed'
    | 'Restricted'
    | 'HumanReviewRequired'
    | null;
  readonly restrictedFieldsOmitted: boolean;
  readonly correlationId?: string | null;
}

export interface CoreHumanReviewContext {
  readonly humanReviewRequired: boolean;
  readonly humanReviewReferenceId: string | null;
  readonly reviewStatus:
    | 'Requested'
    | 'InProgress'
    | 'Completed'
    | 'Expired'
    | null;
  readonly reviewScope: string | null;
  readonly reviewDecision: 'Approved' | 'Rejected' | 'RevisionRequested' | null;
  readonly reviewerUserReferenceId: string | null;
  readonly targetObjectType: string;
  readonly targetObjectReferenceId: string;
}

export interface CoreAuditContext {
  readonly operationName: string;
  readonly operationCategory: string;
  readonly actorReferenceId: string;
  readonly targetObjectType: string;
  readonly targetObjectReferenceId: string;
  readonly permissionDecisionReferenceId: string;
  readonly policyDecisionReferenceId: string;
  readonly humanReviewReferenceId: string | null;
  readonly correlationId: string;
}

function present(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function enforceCorePermission(
  context: CorePermissionContext
): CoreBehaviorResult<{ readonly permissionDecisionReferenceId: string }> {
  if (
    !present(context.actorReferenceId) ||
    !present(context.intendedOperation) ||
    context.requiredPermissionKeys.length === 0 ||
    !context.requiredPermissionKeys.every(present)
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Permission context is incomplete.',
        correlationId: context.correlationId
      })
    };
  if (
    context.permissionDecision !== 'Allowed' ||
    !present(context.permissionDecisionReferenceId)
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'PermissionDenied',
        category: 'Permission',
        message: 'Permission does not allow this protected operation.',
        correlationId: context.correlationId
      })
    };
  return {
    ok: true,
    value: {
      permissionDecisionReferenceId: context.permissionDecisionReferenceId
    }
  };
}

export function validateCorePolicyContext(
  context: CorePolicyContext
): CoreBehaviorResult<{
  readonly policyDecisionReferenceId: string;
  readonly humanReviewRequired: boolean;
}> {
  if (
    !present(context.intendedOperation) ||
    context.requiredPolicyScopes.length === 0 ||
    !context.requiredPolicyScopes.every(present) ||
    !present(context.policyDecisionReferenceId) ||
    context.policyDecision === null
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Policy context is incomplete.',
        correlationId: context.correlationId
      })
    };
  if (context.policyDecision === 'Restricted')
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'PolicyRestricted',
        category: 'Policy',
        message: 'Policy restricts this protected operation.',
        correlationId: context.correlationId
      })
    };
  return {
    ok: true,
    value: {
      policyDecisionReferenceId: context.policyDecisionReferenceId,
      humanReviewRequired: context.policyDecision === 'HumanReviewRequired'
    }
  };
}

export function enforceCoreHumanReview(
  context: CoreHumanReviewContext
): CoreBehaviorResult<{ readonly humanReviewReferenceId: string | null }> {
  if (!context.humanReviewRequired)
    return { ok: true, value: { humanReviewReferenceId: null } };
  if (
    !present(context.humanReviewReferenceId) ||
    context.reviewStatus !== 'Completed' ||
    context.reviewDecision !== 'Approved' ||
    !present(context.reviewerUserReferenceId) ||
    !present(context.reviewScope) ||
    !present(context.targetObjectType) ||
    !present(context.targetObjectReferenceId)
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'HumanReviewRequired',
        category: 'HumanReview',
        message:
          'Completed human review is required for this protected operation.'
      })
    };
  return {
    ok: true,
    value: { humanReviewReferenceId: context.humanReviewReferenceId }
  };
}

export function createCoreAuditContext(
  input: CoreAuditContext
): CoreBehaviorResult<Readonly<CoreAuditContext>> {
  if (
    ![
      input.operationName,
      input.operationCategory,
      input.actorReferenceId,
      input.targetObjectType,
      input.targetObjectReferenceId,
      input.permissionDecisionReferenceId,
      input.policyDecisionReferenceId,
      input.correlationId
    ].every(present)
  )
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Audit context is incomplete.',
        correlationId: input.correlationId
      })
    };
  return { ok: true, value: Object.freeze({ ...input }) };
}

export function enforceCoreGovernedAction(input: {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
}): CoreBehaviorResult<{ readonly auditContext: Readonly<CoreAuditContext> }> {
  const permission = enforceCorePermission(input.permission);
  if (!permission.ok) return permission;
  const policy = validateCorePolicyContext(input.policy);
  if (!policy.ok) return policy;
  if (policy.value.humanReviewRequired && !input.review.humanReviewRequired)
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'HumanReviewRequired',
        category: 'HumanReview',
        message: 'Policy requires explicit human review.'
      })
    };
  const review = enforceCoreHumanReview(input.review);
  if (!review.ok) return review;
  const audit = createCoreAuditContext(input.audit);
  if (!audit.ok) return audit;
  return { ok: true, value: { auditContext: audit.value } };
}
