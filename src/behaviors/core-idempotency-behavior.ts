import { createHash } from 'node:crypto';
import {
  createCoreSafeError,
  type CoreBehaviorResult
} from './core-safe-error.ts';

export type CoreIdempotencyStatus = 'New' | 'ExistingReplayed';
export interface CoreIdempotencyRequest<T> {
  readonly idempotencyKey: string | null | undefined;
  readonly idempotencyScope: string;
  readonly operationName: string;
  readonly request: T;
  readonly permissionAllowed: boolean;
  readonly policyAllowed: boolean;
  readonly correlationId?: string | null;
  readonly ttlMilliseconds?: number;
}
export interface CoreIdempotencyOutcome<T> {
  readonly status: CoreIdempotencyStatus;
  readonly replayed: boolean;
  readonly requestFingerprint: string;
  readonly result: T;
}
interface StoredOutcome<T> {
  readonly fingerprint: string;
  readonly result: T;
  readonly expiresAt: number;
}
const opaqueKey = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const restrictedKeyContent =
  /(password|secret|token|bearer|authorization|api[-_]?key|@|\s)/i;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value);
    if (serialized === undefined)
      throw new TypeError('Request is not serializable.');
    return serialized;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
}

export function createCoreRequestFingerprint(request: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalJson(request)).digest('hex')}`;
}

export class CoreIdempotencyRegistry {
  readonly #records = new Map<string, StoredOutcome<unknown>>();
  readonly #now: () => number;

  constructor(now: () => number = Date.now) {
    this.#now = now;
  }

  execute<TRequest, TResult>(
    input: CoreIdempotencyRequest<TRequest>,
    effect: () => TResult
  ): CoreBehaviorResult<CoreIdempotencyOutcome<TResult>> {
    const correlationId = input.correlationId ?? null;
    if (!input.permissionAllowed)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'PermissionDenied',
          category: 'Permission',
          message: 'Permission is required for this operation.',
          correlationId
        })
      };
    if (!input.policyAllowed)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'PolicyRestricted',
          category: 'Policy',
          message: 'Policy does not allow this operation.',
          correlationId
        })
      };
    if (!input.idempotencyKey)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'IdempotencyKeyRequired',
          category: 'Idempotency',
          message: 'An idempotency key is required.',
          correlationId
        })
      };
    if (
      !opaqueKey.test(input.idempotencyKey) ||
      restrictedKeyContent.test(input.idempotencyKey)
    )
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'IdempotencyKeyInvalid',
          category: 'Idempotency',
          message: 'The idempotency key is invalid.',
          correlationId
        })
      };
    let fingerprint: string;
    try {
      fingerprint = createCoreRequestFingerprint(input.request);
    } catch {
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ValidationFailed',
          category: 'Validation',
          message: 'The request cannot be fingerprinted safely.',
          correlationId
        })
      };
    }
    const recordKey = `${input.idempotencyScope}\u0000${input.operationName}\u0000${input.idempotencyKey}`;
    const existing = this.#records.get(recordKey) as
      | StoredOutcome<TResult>
      | undefined;
    if (existing) {
      if (this.#now() >= existing.expiresAt)
        return {
          ok: false,
          error: createCoreSafeError({
            code: 'IdempotencyExpired',
            category: 'Idempotency',
            message: 'The idempotency record has expired.',
            correlationId
          })
        };
      if (existing.fingerprint !== fingerprint)
        return {
          ok: false,
          error: createCoreSafeError({
            code: 'IdempotencyConflict',
            category: 'Idempotency',
            message:
              'The idempotency key was already used for a different request.',
            correlationId
          })
        };
      return {
        ok: true,
        value: {
          status: 'ExistingReplayed',
          replayed: true,
          requestFingerprint: fingerprint,
          result: existing.result
        }
      };
    }
    const result = effect();
    this.#records.set(recordKey, {
      fingerprint,
      result,
      expiresAt: this.#now() + Math.max(1, input.ttlMilliseconds ?? 86_400_000)
    });
    return {
      ok: true,
      value: {
        status: 'New',
        replayed: false,
        requestFingerprint: fingerprint,
        result
      }
    };
  }
  executeBehavior<TRequest, TResult>(
    input: CoreIdempotencyRequest<TRequest>,
    effect: () => CoreBehaviorResult<TResult>
  ): CoreBehaviorResult<CoreIdempotencyOutcome<TResult>> {
    const correlationId = input.correlationId ?? null;
    if (!input.permissionAllowed)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'PermissionDenied',
          category: 'Permission',
          message: 'Permission is required for this operation.',
          correlationId
        })
      };
    if (!input.policyAllowed)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'PolicyRestricted',
          category: 'Policy',
          message: 'Policy does not allow this operation.',
          correlationId
        })
      };
    if (!input.idempotencyKey)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'IdempotencyKeyRequired',
          category: 'Idempotency',
          message: 'An idempotency key is required.',
          correlationId
        })
      };
    if (
      !opaqueKey.test(input.idempotencyKey) ||
      restrictedKeyContent.test(input.idempotencyKey)
    )
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'IdempotencyKeyInvalid',
          category: 'Idempotency',
          message: 'The idempotency key is invalid.',
          correlationId
        })
      };
    let fingerprint: string;
    try {
      fingerprint = createCoreRequestFingerprint(input.request);
    } catch {
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ValidationFailed',
          category: 'Validation',
          message: 'The request cannot be fingerprinted safely.',
          correlationId
        })
      };
    }
    const recordKey = `${input.idempotencyScope}\u0000${input.operationName}\u0000${input.idempotencyKey}`;
    const existing = this.#records.get(recordKey) as
      | StoredOutcome<TResult>
      | undefined;
    if (existing) {
      if (this.#now() >= existing.expiresAt)
        return {
          ok: false,
          error: createCoreSafeError({
            code: 'IdempotencyExpired',
            category: 'Idempotency',
            message: 'The idempotency record has expired.',
            correlationId
          })
        };
      if (existing.fingerprint !== fingerprint)
        return {
          ok: false,
          error: createCoreSafeError({
            code: 'IdempotencyConflict',
            category: 'Idempotency',
            message:
              'The idempotency key was already used for a different request.',
            correlationId
          })
        };
      return {
        ok: true,
        value: {
          status: 'ExistingReplayed',
          replayed: true,
          requestFingerprint: fingerprint,
          result: existing.result
        }
      };
    }
    const result = effect();
    if (!result.ok) return result;
    this.#records.set(recordKey, {
      fingerprint,
      result: result.value,
      expiresAt: this.#now() + Math.max(1, input.ttlMilliseconds ?? 86_400_000)
    });
    return {
      ok: true,
      value: {
        status: 'New',
        replayed: false,
        requestFingerprint: fingerprint,
        result: result.value
      }
    };
  }

}
