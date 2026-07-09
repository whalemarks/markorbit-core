import type { CoreDomainId } from '../domains/index.ts';
import type { CoreEventType } from '../events/index.ts';
import type { CoreObjectType } from '../objects/index.ts';
import type { CoreTaskType } from '../tasks/index.ts';
import type { CoreWorkflowContractType } from '../workflows/index.ts';

export interface CoreContractScope {
  readonly domainId?: CoreDomainId;
  readonly objectType?: CoreObjectType;
  readonly eventType?: CoreEventType;
  readonly taskType?: CoreTaskType;
  readonly workflowContractType?: CoreWorkflowContractType;
  readonly notes?: string;
}
