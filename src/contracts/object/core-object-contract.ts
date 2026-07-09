import type { CoreDomainId } from '../../domains/index.ts';
import type { CoreObjectType } from '../../objects/index.ts';
import type { CoreContractId } from '../core-contract-id.ts';
import type { CoreContractStatus } from '../core-contract-status.ts';

export interface CoreObjectContract {
  readonly id: CoreContractId;
  readonly objectType: CoreObjectType;
  readonly domainId: CoreDomainId;
  readonly name: string;
  readonly description: string;
  readonly status: CoreContractStatus;
  readonly book: string;
  readonly purpose: string;
  readonly base: string;
  readonly owns: readonly string[];
  readonly requiredBaseFields: readonly string[];
  readonly optionalBaseFields?: readonly string[];
  readonly nonGoals: readonly string[];
  readonly futureExtensions?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
