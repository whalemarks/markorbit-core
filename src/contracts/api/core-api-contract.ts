import type { CoreDomainId } from '../../domains/index.ts';
import type { CoreContractId } from '../core-contract-id.ts';
import type { CoreContractStatus } from '../core-contract-status.ts';

export interface CoreApiContract {
  readonly id: CoreContractId;
  readonly apiType: string;
  readonly domainId?: CoreDomainId;
  readonly name: string;
  readonly description: string;
  readonly status: CoreContractStatus;
  readonly book: string;
  readonly purpose: string;
  readonly owns: readonly string[];
  readonly consumes?: readonly string[];
  readonly produces?: readonly string[];
  readonly allowedOperations?: readonly string[];
  readonly nonGoals: readonly string[];
  readonly futureExtensions?: readonly string[];
  readonly sourcePath?: string;
  readonly implementationDepth?: 'validated_skeleton';
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
