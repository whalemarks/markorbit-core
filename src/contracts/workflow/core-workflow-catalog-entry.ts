import type { CoreDomainId } from '../../domains/index.ts';
import type { CoreWorkflowContractType } from '../../workflows/index.ts';
import type { CoreContractId } from '../core-contract-id.ts';
import type { CoreContractStatus } from '../core-contract-status.ts';

export interface CoreWorkflowCatalogEntry {
  readonly id: CoreContractId;
  readonly workflowType: CoreWorkflowContractType;
  readonly domainId: CoreDomainId;
  readonly name: string;
  readonly description: string;
  readonly status: CoreContractStatus;
  readonly book: string;
  readonly purpose: string;
  readonly stepTypes?: readonly string[];
  readonly reviewRequired?: boolean;
  readonly protectedAction?: boolean;
  readonly owns: readonly string[];
  readonly consumes?: readonly string[];
  readonly produces?: readonly string[];
  readonly nonGoals: readonly string[];
  readonly futureExtensions?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
