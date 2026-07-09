import type { CoreContractId } from '../core-contract-id.ts';
import type { CoreContractStatus } from '../core-contract-status.ts';
import type { CoreDomainId } from '../../domains/index.ts';

export interface CoreDomainContract {
  readonly id: CoreContractId;
  readonly domainId: CoreDomainId;
  readonly name: string;
  readonly description: string;
  readonly status: CoreContractStatus;
  readonly book: string;
  readonly purpose: string;
  readonly owns: readonly string[];
  readonly consumes?: readonly string[];
  readonly produces?: readonly string[];
  readonly nonGoals: readonly string[];
  readonly futureExtensions?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
