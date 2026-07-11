import type { CoreContractId } from '../core-contract-id.ts';
import type { CoreContractStatus } from '../core-contract-status.ts';

export interface CoreTestContract {
  readonly id: CoreContractId;
  readonly testType: string;
  readonly name: string;
  readonly description: string;
  readonly status: CoreContractStatus;
  readonly book: string;
  readonly sourcePath: string;
  readonly purpose: string;
  readonly testSubjects: readonly string[];
  readonly requiredFixtureFamilies: readonly string[];
  readonly nonGoals: readonly string[];
  readonly implementationDepth: 'validated_skeleton';
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata: Record<string, unknown>;
}
