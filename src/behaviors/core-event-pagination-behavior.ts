import { createHmac } from 'node:crypto';
import type { CoreEvent } from '../events/index.ts';
import { validateCoreEvent } from '../events/index.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult
} from './core-safe-error.ts';

export type CoreEventVisibility =
  | 'Internal'
  | 'CustomerVisible'
  | 'ProviderVisible'
  | 'PartnerVisible'
  | 'SystemOnly'
  | 'Restricted';
export interface CoreEventTraceRecord {
  readonly event: CoreEvent;
  readonly visibility: CoreEventVisibility;
  readonly auditContextReferenceId: string;
}

export class CoreEventTraceRegistry {
  readonly #records: CoreEventTraceRecord[] = [];

  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord> {
    if (
      validateCoreEvent(record.event).length > 0 ||
      !record.auditContextReferenceId.trim()
    )
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ValidationFailed',
          category: 'Event',
          message: 'Event trace is incomplete.',
          correlationId: record.event.correlationId
        })
      };
    if (this.#records.some(({ event }) => event.id === record.event.id))
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'DuplicateRejected',
          category: 'Event',
          message: 'Event trace already exists.',
          correlationId: record.event.correlationId
        })
      };
    const stored = Object.freeze({
      ...record,
      event: Object.freeze({ ...record.event })
    });
    this.#records.push(stored);
    return { ok: true, value: stored };
  }

  visibleTo(
    allowed: readonly CoreEventVisibility[]
  ): readonly CoreEventTraceRecord[] {
    const scope = new Set(allowed);
    return this.#records.filter((record) => scope.has(record.visibility));
  }
}

export interface CorePaginationRequest {
  readonly cursor?: string | null;
  readonly limit?: number | null;
  readonly sortField?: string | null;
  readonly sortDirection?: 'Asc' | 'Desc' | null;
  readonly includeTotalCount?: boolean | null;
}
export interface CorePaginationContext {
  readonly permissionAllowed: boolean;
  readonly policyAllowed: boolean;
  readonly actorReferenceId?: string | null;
  readonly agentReferenceId?: string | null;
  readonly allowedSortFields: readonly string[];
  readonly totalCountAllowed: boolean;
  readonly correlationId?: string | null;
}
export interface CorePaginatedResult<T> {
  readonly items: readonly T[];
  readonly pagination: {
    readonly nextCursor: string | null;
    readonly previousCursor: null;
    readonly limit: number;
    readonly returnedCount: number;
    readonly hasMore: boolean;
    readonly totalCount: number | null;
    readonly totalCountOmitted: boolean;
  };
  readonly restrictedFieldsOmitted: boolean;
  readonly correlationId: string | null;
}

function encodeCursor(
  offset: number,
  queryKey: string,
  secret: string
): string {
  const payload = Buffer.from(JSON.stringify({ offset, queryKey })).toString(
    'base64url'
  );
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function decodeCursor(
  cursor: string,
  queryKey: string,
  secret: string
): number | null {
  const [payload, signature, extra] = cursor.split('.');
  if (!payload || !signature || extra) return null;
  if (
    createHmac('sha256', secret).update(payload).digest('base64url') !==
    signature
  )
    return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString()
    ) as { offset?: unknown; queryKey?: unknown };
    return Number.isInteger(decoded.offset) &&
      (decoded.offset as number) >= 0 &&
      decoded.queryKey === queryKey
      ? (decoded.offset as number)
      : null;
  } catch {
    return null;
  }
}

export function paginateCoreItems<T extends Record<string, unknown>>(
  items: readonly T[],
  request: CorePaginationRequest,
  context: CorePaginationContext,
  options: {
    readonly queryKey: string;
    readonly cursorSecret: string;
    readonly visible: (item: T) => boolean;
    readonly redact?: (item: T) => T;
    readonly agentRequest?: boolean;
  }
): CoreBehaviorResult<CorePaginatedResult<T>> {
  if (!context.permissionAllowed)
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'PermissionDenied',
        category: 'Permission',
        message: 'Permission is required for list access.',
        correlationId: context.correlationId
      })
    };
  if (!context.policyAllowed)
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'PolicyRestricted',
        category: 'Policy',
        message: 'Policy restricts list access.',
        correlationId: context.correlationId
      })
    };
  if (!context.actorReferenceId && !context.agentReferenceId)
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Governed list context is required.',
        correlationId: context.correlationId
      })
    };
  const maximum = options.agentRequest ? 50 : 100;
  const limit = request.limit ?? 20;
  if (!Number.isInteger(limit) || limit <= 0 || limit > maximum)
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Pagination limit is invalid.',
        correlationId: context.correlationId
      })
    };
  const sortField = request.sortField ?? null;
  if (sortField && !context.allowedSortFields.includes(sortField))
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Pagination sort field is not allowed.',
        correlationId: context.correlationId
      })
    };
  const offset = request.cursor
    ? decodeCursor(request.cursor, options.queryKey, options.cursorSecret)
    : 0;
  if (offset === null)
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Pagination cursor is invalid.',
        correlationId: context.correlationId
      })
    };
  const visible = items.filter(options.visible);
  const sorted = sortField
    ? [...visible].sort(
        (a, b) =>
          String(a[sortField]).localeCompare(String(b[sortField])) *
          (request.sortDirection === 'Desc' ? -1 : 1)
      )
    : visible;
  const page = sorted
    .slice(offset, offset + limit)
    .map((item) => (options.redact ? options.redact(item) : item));
  const hasMore = offset + page.length < sorted.length;
  const returnTotal =
    request.includeTotalCount === true && context.totalCountAllowed;
  return {
    ok: true,
    value: {
      items: page,
      pagination: {
        nextCursor: hasMore
          ? encodeCursor(
              offset + page.length,
              options.queryKey,
              options.cursorSecret
            )
          : null,
        previousCursor: null,
        limit,
        returnedCount: page.length,
        hasMore,
        totalCount: returnTotal ? sorted.length : null,
        totalCountOmitted: !returnTotal
      },
      restrictedFieldsOmitted: Boolean(options.redact),
      correlationId: context.correlationId ?? null
    }
  };
}
