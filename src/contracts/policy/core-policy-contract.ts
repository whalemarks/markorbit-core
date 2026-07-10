import type { CoreDomainId } from '../../domains/index.ts';
import type { CoreContractId } from '../core-contract-id.ts';
import type { CoreContractStatus } from '../core-contract-status.ts';

export interface CorePolicyContract {
  readonly id: CoreContractId;
  readonly policyType: string;
  readonly domainId: CoreDomainId;
  readonly name: string;
  readonly description: string;
  readonly status: CoreContractStatus;
  readonly book: string;
  readonly purpose: string;
  readonly appliesTo?: readonly string[];
  readonly protectedAction?: boolean;
  readonly requiresHumanReview?: boolean;
  readonly owns: readonly string[];
  readonly consumes?: readonly string[];
  readonly produces?: readonly string[];
  readonly nonGoals: readonly string[];
  readonly futureExtensions?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
