import {
  enforceCoreGovernedAction,
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext,
  type CorePolicyContext
} from '../behaviors/core-governance-behavior.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreErrorCategory,
  type CoreErrorCode,
  type CoreSafeError
} from '../behaviors/core-safe-error.ts';
import type { CoreDomainId } from '../domains/index.ts';

export const CORE_API_VERSION = 'v1' as const;
export const CORE_API_CONTRACT_VERSION = 'v0.1.0' as const;

export const CORE_GOVERNED_API_REQUIRED_CAPABILITIES = [
  'request validation',
  'response validation',
  'reference validation',
  'permission context validation',
  'policy context validation',
  'idempotency validation where duplicate-sensitive',
  'safe error behavior',
  'version validation',
  'owning Service delegation',
  'no direct Domain mutation',
  'no direct Event emission'
] as const;

export type CoreGovernedApiCapability =
  (typeof CORE_GOVERNED_API_REQUIRED_CAPABILITIES)[number];

export interface CoreGovernedApiContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreGovernedApiRequest {
  readonly apiVersion: string;
  readonly contractVersion: string;
  readonly correlationId: string;
  readonly operation: string;
  readonly idempotencyKey?: string | null;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly governance: CoreGovernedApiContext;
}

export interface CoreGovernedApiOperationSpec {
  readonly apiOperation: string;
  readonly serviceOperation: string;
  readonly governanceOperation: string;
  readonly operationCategory: string;
  readonly duplicateSensitive: boolean;
  readonly requiredPermissionKey: string;
  readonly requiredPolicyScope: string;
  readonly requiredPayloadFields: readonly string[];
  readonly referenceFields: readonly string[];
  readonly objectFields?: readonly string[];
  readonly arrayFields?: readonly string[];
  readonly booleanFields?: readonly string[];
  readonly allowedPayloadFields: readonly string[];
}

export interface CoreGovernedApiBoundarySpec {
  readonly domainId: CoreDomainId;
  readonly apiType: string;
  readonly apiContractId: string;
  readonly serviceContractId: string;
  readonly sourcePath: string;
  readonly implementationTask:
    'CORE-TASK-057A' | 'CORE-TASK-057B' | 'CORE-TASK-057C';
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
  readonly operations: readonly CoreGovernedApiOperationSpec[];
}

export interface CoreGovernedApiServiceInvocation {
  readonly serviceContractId: string;
  readonly serviceOperation: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly governance: CoreGovernedApiContext;
  readonly idempotencyKey: string | null;
  readonly correlationId: string;
}

export interface CoreGovernedApiServicePort {
  readonly serviceContractId: string;
  invoke(
    invocation: CoreGovernedApiServiceInvocation
  ): CoreBehaviorResult<unknown>;
}

export interface CoreGovernedApiSuccessResponse {
  readonly apiVersion: typeof CORE_API_VERSION;
  readonly contractVersion: typeof CORE_API_CONTRACT_VERSION;
  readonly correlationId: string;
  readonly operation: string;
  readonly result: unknown;
  readonly auditContext: {
    readonly owningServiceContractId: string;
    readonly serviceOperation: string;
    readonly auditContextReferenceId: string;
    readonly directDomainMutation: false;
    readonly directEventEmission: false;
  };
}

const opaqueReferencePattern = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const correlationPattern = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const idempotencyPattern = /^[A-Za-z0-9][A-Za-z0-9:_./-]{7,191}$/;
const operationPattern = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const serviceOperationPattern = /^[a-z][A-Za-z0-9]*$/;
const forbiddenKeys = new Set([
  'databaseId',
  ['raw', 'DatabaseId'].join(''),
  'primaryKey',
  'stack',
  'stackTrace',
  'traceback',
  'password',
  'secret',
  'token',
  'credential',
  'session',
  ['emit', 'Event'].join(''),
  'eventEmitter',
  ['domain', 'Mutation'].join(''),
  'domainStore',
  'repository',
  'sql'
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function immutable<T>(value: T): T {
  const cloned = structuredClone(value);
  const freeze = (candidate: unknown): void => {
    if (typeof candidate !== 'object' || candidate === null) return;
    for (const nested of Object.values(candidate)) freeze(nested);
    Object.freeze(candidate);
  };
  freeze(cloned);
  return cloned;
}

function safe<T>(
  code: CoreErrorCode,
  category: CoreErrorCategory,
  message: string,
  correlationId?: string | null
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({
      code,
      category,
      message,
      correlationId
    })
  };
}

function scanForbiddenKeys(value: unknown, path = 'value'): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = scanForbiddenKeys(value[index], `${path}[${index}]`);
      if (found) return found;
    }
    return null;
  }
  if (!isPlainObject(value)) return null;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) return `${path}.${key}`;
    const found = scanForbiddenKeys(nested, `${path}.${key}`);
    if (found) return found;
  }
  return null;
}

function validateSpec(spec: CoreGovernedApiBoundarySpec): readonly string[] {
  const errors: string[] = [];
  if (!operationPattern.test(spec.apiType))
    errors.push('apiType must be a controlled operation identifier.');
  if (!opaqueReferencePattern.test(spec.apiContractId))
    errors.push('apiContractId is invalid.');
  if (!opaqueReferencePattern.test(spec.serviceContractId))
    errors.push('serviceContractId is invalid.');
  if (spec.directDomainMutation !== false)
    errors.push('API boundary must not mutate Domain state directly.');
  if (spec.directEventEmission !== false)
    errors.push('API boundary must not emit Domain Events directly.');
  const apiOperations = new Set<string>();
  const serviceOperations = new Set<string>();
  for (const operation of spec.operations) {
    if (!operationPattern.test(operation.apiOperation))
      errors.push(`Invalid API operation ${operation.apiOperation}.`);
    if (!serviceOperationPattern.test(operation.serviceOperation))
      errors.push(`Invalid Service operation ${operation.serviceOperation}.`);
    if (apiOperations.has(operation.apiOperation))
      errors.push(`Duplicate API operation ${operation.apiOperation}.`);
    if (serviceOperations.has(operation.serviceOperation))
      errors.push(`Duplicate Service operation ${operation.serviceOperation}.`);
    apiOperations.add(operation.apiOperation);
    serviceOperations.add(operation.serviceOperation);
    const allowed = new Set(operation.allowedPayloadFields);
    for (const required of operation.requiredPayloadFields)
      if (!allowed.has(required))
        errors.push(
          `${operation.apiOperation} required field ${required} is not allowed.`
        );
    for (const reference of operation.referenceFields)
      if (!allowed.has(reference))
        errors.push(
          `${operation.apiOperation} reference field ${reference} is not allowed.`
        );
  }
  return errors;
}

export function validateCoreGovernedApiBoundarySpecs(
  specs: readonly CoreGovernedApiBoundarySpec[]
): readonly string[] {
  if (!Array.isArray(specs))
    return ['Governed API boundary specs must be an array.'];
  const errors: string[] = [];
  const domains = new Set<string>();
  const contracts = new Set<string>();
  for (const [index, spec] of specs.entries()) {
    for (const message of validateSpec(spec))
      errors.push(`specs[${index}]: ${message}`);
    if (domains.has(spec.domainId))
      errors.push(`specs[${index}].domainId must be unique.`);
    if (contracts.has(spec.apiContractId))
      errors.push(`specs[${index}].apiContractId must be unique.`);
    domains.add(spec.domainId);
    contracts.add(spec.apiContractId);
  }
  return errors;
}

function validateGovernance(
  request: CoreGovernedApiRequest,
  operation: CoreGovernedApiOperationSpec
): CoreBehaviorResult<null> {
  const { governance, correlationId } = request;
  if (
    governance.permission.correlationId !== correlationId ||
    governance.policy.correlationId !== correlationId ||
    governance.audit.correlationId !== correlationId ||
    governance.permission.intendedOperation !== operation.governanceOperation ||
    governance.policy.intendedOperation !== operation.governanceOperation ||
    governance.audit.operationName !== operation.governanceOperation ||
    !governance.permission.requiredPermissionKeys.includes(
      operation.requiredPermissionKey
    ) ||
    !governance.policy.requiredPolicyScopes.includes(
      operation.requiredPolicyScope
    ) ||
    governance.audit.operationCategory !== operation.operationCategory ||
    !opaqueReferencePattern.test(governance.auditContextReferenceId)
  )
    return safe(
      'ValidationFailed',
      'Validation',
      'API governance context does not match the requested operation.',
      correlationId
    );
  const governed = enforceCoreGovernedAction({
    permission: governance.permission,
    policy: governance.policy,
    review: governance.review,
    audit: governance.audit
  });
  return governed.ok ? { ok: true, value: null } : governed;
}

function validatePayload(
  payload: Readonly<Record<string, unknown>>,
  operation: CoreGovernedApiOperationSpec,
  correlationId: string
): CoreBehaviorResult<Readonly<Record<string, unknown>>> {
  const allowed = new Set(operation.allowedPayloadFields);
  for (const key of Object.keys(payload))
    if (!allowed.has(key))
      return safe(
        'BadRequest',
        'Request',
        'API request contains an unsupported field.',
        correlationId
      );
  for (const field of operation.requiredPayloadFields)
    if (
      !(field in payload) ||
      payload[field] === null ||
      payload[field] === undefined ||
      payload[field] === ''
    )
      return safe(
        'ValidationFailed',
        'Validation',
        `API request field ${field} is required.`,
        correlationId
      );
  for (const field of operation.referenceFields) {
    const value = payload[field];
    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== 'string' || !opaqueReferencePattern.test(value))
    )
      return safe(
        'ReferenceInvalid',
        'Reference',
        `API reference field ${field} is invalid.`,
        correlationId
      );
  }
  for (const field of operation.objectFields ?? []) {
    const value = payload[field];
    if (value !== undefined && value !== null && !isPlainObject(value))
      return safe(
        'ValidationFailed',
        'Validation',
        `API object field ${field} is invalid.`,
        correlationId
      );
  }
  for (const field of operation.arrayFields ?? []) {
    const value = payload[field];
    if (value !== undefined && value !== null && !Array.isArray(value))
      return safe(
        'ValidationFailed',
        'Validation',
        `API array field ${field} is invalid.`,
        correlationId
      );
  }
  for (const field of operation.booleanFields ?? []) {
    const value = payload[field];
    if (value !== undefined && typeof value !== 'boolean')
      return safe(
        'ValidationFailed',
        'Validation',
        `API boolean field ${field} is invalid.`,
        correlationId
      );
  }
  const forbidden = scanForbiddenKeys(payload, 'payload');
  if (forbidden)
    return safe(
      'RestrictedFieldViolation',
      'RestrictedData',
      'API request contains a forbidden internal field.',
      correlationId
    );
  return { ok: true, value: immutable(payload) };
}

function normalizeSafeError(
  error: CoreSafeError,
  correlationId: string
): CoreSafeError {
  return createCoreSafeError({
    code: error.code,
    category: error.category,
    message: error.message,
    safeDetail: error.safeDetail,
    retryable: error.retryable,
    correlationId: error.correlationId ?? correlationId
  });
}

export class CoreGovernedApiBoundary {
  readonly #operations: ReadonlyMap<string, CoreGovernedApiOperationSpec>;

  constructor(
    readonly spec: CoreGovernedApiBoundarySpec,
    readonly service: CoreGovernedApiServicePort
  ) {
    const errors = validateSpec(spec);
    if (errors.length > 0)
      throw new TypeError(`Invalid governed API boundary: ${errors.join(' ')}`);
    if (service.serviceContractId !== spec.serviceContractId)
      throw new TypeError(
        'Governed API boundary must delegate to its locked owning Service.'
      );
    this.#operations = new Map(
      spec.operations.map((operation) => [operation.apiOperation, operation])
    );
  }

  handle(
    request: CoreGovernedApiRequest
  ): CoreBehaviorResult<CoreGovernedApiSuccessResponse> {
    if (!isPlainObject(request))
      return safe('BadRequest', 'Request', 'API request must be an object.');
    if (request.apiVersion !== CORE_API_VERSION)
      return safe(
        'VersionUnsupported',
        'Version',
        'API version is unsupported.',
        request.correlationId
      );
    if (request.contractVersion !== CORE_API_CONTRACT_VERSION)
      return safe(
        'VersionUnsupported',
        'Version',
        'API contract version is unsupported.',
        request.correlationId
      );
    if (!correlationPattern.test(request.correlationId))
      return safe(
        'ValidationFailed',
        'Validation',
        'API correlation reference is invalid.'
      );
    const operation = this.#operations.get(request.operation);
    if (!operation)
      return safe(
        'BadRequest',
        'Request',
        'API operation is unsupported.',
        request.correlationId
      );
    if (!isPlainObject(request.payload))
      return safe(
        'BadRequest',
        'Request',
        'API payload must be an object.',
        request.correlationId
      );
    if (operation.duplicateSensitive) {
      if (
        typeof request.idempotencyKey !== 'string' ||
        !idempotencyPattern.test(request.idempotencyKey)
      )
        return safe(
          'IdempotencyKeyRequired',
          'Idempotency',
          'A valid idempotency key is required.',
          request.correlationId
        );
    } else if (
      request.idempotencyKey !== undefined &&
      request.idempotencyKey !== null &&
      (typeof request.idempotencyKey !== 'string' ||
        !idempotencyPattern.test(request.idempotencyKey))
    )
      return safe(
        'IdempotencyKeyInvalid',
        'Idempotency',
        'The idempotency key is invalid.',
        request.correlationId
      );
    const governance = validateGovernance(request, operation);
    if (!governance.ok) return governance;
    const payload = validatePayload(
      request.payload,
      operation,
      request.correlationId
    );
    if (!payload.ok) return payload;

    let delegated: CoreBehaviorResult<unknown>;
    try {
      delegated = this.service.invoke({
        serviceContractId: this.spec.serviceContractId,
        serviceOperation: operation.serviceOperation,
        payload: immutable({
          ...payload.value,
          idempotencyKey: request.idempotencyKey ?? null,
          governance: request.governance
        }),
        governance: request.governance,
        idempotencyKey: request.idempotencyKey ?? null,
        correlationId: request.correlationId
      });
    } catch {
      return safe(
        'DownstreamServiceRequired',
        'Service',
        'The owning Service could not complete the API operation.',
        request.correlationId
      );
    }
    if (!delegated.ok)
      return {
        ok: false,
        error: normalizeSafeError(delegated.error, request.correlationId)
      };
    const forbidden = scanForbiddenKeys(delegated.value, 'result');
    if (forbidden)
      return safe(
        'RestrictedFieldViolation',
        'RestrictedData',
        'The owning Service returned an unsafe API response.',
        request.correlationId
      );
    const response: CoreGovernedApiSuccessResponse = {
      apiVersion: CORE_API_VERSION,
      contractVersion: CORE_API_CONTRACT_VERSION,
      correlationId: request.correlationId,
      operation: operation.apiOperation,
      result: immutable(delegated.value),
      auditContext: {
        owningServiceContractId: this.spec.serviceContractId,
        serviceOperation: operation.serviceOperation,
        auditContextReferenceId: request.governance.auditContextReferenceId,
        directDomainMutation: false,
        directEventEmission: false
      }
    };
    return { ok: true, value: immutable(response) };
  }
}
