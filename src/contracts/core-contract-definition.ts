import type { CoreContractId } from './core-contract-id.ts';
import type { CoreContractReference } from './core-contract-reference.ts';
import type { CoreContractScope } from './core-contract-scope.ts';
import type { CoreContractStatus } from './core-contract-status.ts';
import type { CoreContractType } from './core-contract-type.ts';

export interface CoreContractDefinition {
  readonly id: CoreContractId;
  readonly type: CoreContractType;
  readonly name: string;
  readonly description?: string;
  readonly status: CoreContractStatus;
  readonly scope?: CoreContractScope;
  readonly version: number;
  readonly book: string;
  readonly source?: string;
  readonly dependencies?: readonly CoreContractReference[];
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
