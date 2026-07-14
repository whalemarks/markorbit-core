export const CORE_ERROR_CATEGORIES = [
  'Request',
  'Authentication',
  'Authorization',
  'Permission',
  'Policy',
  'Validation',
  'Reference',
  'State',
  'Conflict',
  'Idempotency',
  'Version',
  'RestrictedData',
  'HumanReview',
  'Agent',
  'Workflow',
  'Event',
  'Service',
  'ExternalDependency',
  'RateLimit',
  'Timeout',
  'Internal',
  'Unknown'
] as const;

export const CORE_ERROR_CODES = [
  'BadRequest',
  'Unauthorized',
  'Forbidden',
  'PermissionDenied',
  'PolicyRestricted',
  'ValidationFailed',
  'ReferenceInvalid',
  'ReferenceNotFound',
  'ReferenceTypeMismatch',
  'ReferenceDomainMismatch',
  'StateInvalid',
  'StateTransitionNotAllowed',
  'Conflict',
  'DuplicateRejected',
  'IdempotencyConflict',
  'IdempotencyKeyRequired',
  'IdempotencyKeyInvalid',
  'IdempotencyExpired',
  'VersionUnsupported',
  'RestrictedFieldViolation',
  'RestrictedDataRequested',
  'HumanReviewRequired',
  'AgentContractRequired',
  'AgentSuspended',
  'AgentRevoked',
  'CapabilityNotAllowed',
  'WorkflowReferenceInvalid',
  'TaskReferenceInvalid',
  'EventReferenceInvalid',
  'DownstreamServiceRequired',
  'ExternalDependencyFailed',
  'RateLimited',
  'Timeout',
  'InternalError',
  'CustomerAlreadyExists',
  'CustomerNotFound',
  'InvalidCustomerType',
  'InvalidCustomerStatus',
  'InvalidCustomerTransition',
  'InvalidCustomerReference',
  'CustomerNameRequired',
  'CustomerSourceReferenceRequired',
  'CustomerReasonReferenceRequired',
  'CustomerObjectMismatch',
  'BrandAlreadyExists',
  'BrandNotFound',
  'InvalidBrandType',
  'InvalidBrandStatus',
  'InvalidBrandTransition',
  'InvalidBrandReference',
  'InvalidBrandCustomerReference',
  'BrandNameRequired',
  'BrandSourceReferenceRequired',
  'BrandReasonReferenceRequired',
  'BrandObjectMismatch',
  'TrademarkAlreadyExists',
  'TrademarkNotFound',
  'InvalidTrademarkType',
  'InvalidTrademarkStatus',
  'InvalidTrademarkTransition',
  'InvalidTrademarkReference',
  'InvalidTrademarkBrandReference',
  'InvalidTrademarkJurisdictionReference',
  'TrademarkMarkRepresentationRequired',
  'TrademarkSourceReferenceRequired',
  'TrademarkReasonReferenceRequired',
  'TrademarkObjectMismatch',
  'JurisdictionAlreadyExists',
  'JurisdictionCodeAlreadyExists',
  'JurisdictionNotFound',
  'InvalidJurisdictionType',
  'InvalidJurisdictionStatus',
  'InvalidJurisdictionTransition',
  'InvalidJurisdictionReference',
  'InvalidJurisdictionCode',
  'JurisdictionNameRequired',
  'JurisdictionSourceReferenceRequired',
  'JurisdictionReasonReferenceRequired',
  'JurisdictionObjectMismatch',
  'ClassificationAlreadyExists',
  'ClassificationNotFound',
  'InvalidClassificationScheme',
  'InvalidClassificationStatus',
  'InvalidClassificationReviewStatus',
  'InvalidClassificationTransition',
  'InvalidClassificationReference',
  'InvalidClassificationTrademarkReference',
  'InvalidClassificationBrandReference',
  'InvalidClassificationJurisdictionReference',
  'ClassReferenceRequired',
  'GoodsServicesItemsRequired',
  'ClassNumberOnlyNotAllowed',
  'InvalidClassificationItemType',
  'InvalidClassificationItemReference',
  'ClassificationSourceReferenceRequired',
  'ClassificationReasonReferenceRequired',
  'ClassificationObjectMismatch',
  'AuditContextMissing',
  'EventTraceFailed',
  'UnknownError'
] as const;

export type CoreErrorCategory = (typeof CORE_ERROR_CATEGORIES)[number];
export type CoreErrorCode = (typeof CORE_ERROR_CODES)[number];

export interface CoreSafeError {
  readonly code: CoreErrorCode;
  readonly category: CoreErrorCategory;
  readonly message: string;
  readonly safeDetail: string | null;
  readonly retryable: boolean;
  readonly correlationId: string | null;
}

const unsafePatterns = [
  /\b(stack|stacktrace|traceback)\b/i,
  /\b(sql|select|insert|update|delete|postgres|mysql|sqlite)\b/i,
  /\b(api[-_ ]?key|authorization|bearer|password|secret|token)\b/i,
  /\b(system prompt|hidden instruction|model prompt|tool call)\b/i,
  /\b(database|primary key|internal id)\b/i,
  /\bat\s+\S+\s*\([^)]*:\d+:\d+\)/i
] as const;

function safeText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 500) return null;
  if (unsafePatterns.some((pattern) => pattern.test(normalized))) return null;
  return normalized;
}

export function createCoreSafeError(input: {
  readonly code: CoreErrorCode;
  readonly category: CoreErrorCategory;
  readonly message: string;
  readonly safeDetail?: string | null;
  readonly retryable?: boolean;
  readonly correlationId?: string | null;
}): CoreSafeError {
  const message =
    safeText(input.message) ?? 'The operation could not be completed safely.';
  return Object.freeze({
    code: input.code,
    category: input.category,
    message,
    safeDetail: safeText(input.safeDetail),
    retryable: input.retryable ?? false,
    correlationId: safeText(input.correlationId)
  });
}

export type CoreBehaviorResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CoreSafeError };
