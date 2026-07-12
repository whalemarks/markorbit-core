import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult
} from './core-safe-error.ts';

export const CORE_REFERENCE_STATUSES = [
  'Active',
  'Draft',
  'ReviewRequired',
  'Suspended',
  'Archived',
  'DeletedReferenceOnly',
  'Deprecated',
  'Revoked',
  'Invalid',
  'Unknown'
] as const;
export type CoreReferenceStatus = (typeof CORE_REFERENCE_STATUSES)[number];

export interface CoreReferenceRecord {
  readonly referenceId: string;
  readonly objectType: string;
  readonly referenceDomain: string;
  readonly status: CoreReferenceStatus;
  readonly safeLabel?: string | null;
}

const referenceIdPattern = /^[a-z0-9][a-z0-9:_-]{2,127}$/;
const domainIds = new Set<string>(
  CORE_DOMAIN_REGISTRY.map((entry) => entry.id)
);

export class CoreReferenceRegistry {
  readonly #records: ReadonlyMap<string, CoreReferenceRecord>;

  constructor(records: readonly CoreReferenceRecord[]) {
    const map = new Map<string, CoreReferenceRecord>();
    for (const record of records) {
      if (!referenceIdPattern.test(record.referenceId))
        throw new Error(
          'Reference fixture contains an invalid public reference id.'
        );
      if (map.has(record.referenceId))
        throw new Error(
          'Reference fixture contains a duplicate public reference id.'
        );
      map.set(record.referenceId, Object.freeze({ ...record }));
    }
    this.#records = map;
  }

  resolve(input: {
    readonly referenceId: string;
    readonly expectedObjectType: string;
    readonly expectedDomain: string;
    readonly allowDeletedReferenceOnly?: boolean;
  }): CoreBehaviorResult<CoreReferenceRecord> {
    if (!referenceIdPattern.test(input.referenceId))
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ReferenceInvalid',
          category: 'Reference',
          message: 'The provided reference is invalid.'
        })
      };
    if (!domainIds.has(input.expectedDomain))
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ReferenceDomainMismatch',
          category: 'Reference',
          message: 'The reference domain is invalid.'
        })
      };

    const record = this.#records.get(input.referenceId);
    if (record === undefined)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ReferenceNotFound',
          category: 'Reference',
          message: 'The requested reference was not found.'
        })
      };
    if (record.objectType !== input.expectedObjectType)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ReferenceTypeMismatch',
          category: 'Reference',
          message: 'The reference type does not match the required type.'
        })
      };
    if (record.referenceDomain !== input.expectedDomain)
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ReferenceDomainMismatch',
          category: 'Reference',
          message: 'The reference domain does not match the required domain.'
        })
      };
    if (
      record.status === 'Invalid' ||
      record.status === 'Revoked' ||
      record.status === 'Suspended'
    )
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ReferenceInvalid',
          category: 'Reference',
          message: 'The reference cannot be used in its current status.'
        })
      };
    if (
      record.status === 'DeletedReferenceOnly' &&
      input.allowDeletedReferenceOnly !== true
    )
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'ReferenceInvalid',
          category: 'Reference',
          message: 'The reference cannot be used for this operation.'
        })
      };
    return { ok: true, value: record };
  }
}
