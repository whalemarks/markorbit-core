import type { CoreDomainId } from '../domains/index.ts';
import type { CoreObjectReference } from '../objects/index.ts';
import type { CoreWorkflowContractId } from './core-workflow-contract-id.ts';
import type { CoreWorkflowContractStatus } from './core-workflow-contract-status.ts';
import type { CoreWorkflowContractType } from './core-workflow-contract-type.ts';
import type { CoreWorkflowStep } from './core-workflow-step.ts';
import type { CoreWorkflowTransition } from './core-workflow-transition.ts';

export interface CoreWorkflowContract {
  readonly id: CoreWorkflowContractId;
  readonly type: CoreWorkflowContractType;
  readonly name: string;
  readonly description?: string;
  readonly domainId: CoreDomainId;
  readonly object?: CoreObjectReference;
  readonly status: CoreWorkflowContractStatus;
  readonly version: number;
  readonly steps: readonly CoreWorkflowStep[];
  readonly transitions?: readonly CoreWorkflowTransition[];
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
