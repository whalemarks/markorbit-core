import type { CoreContractId, CoreContractStatus } from '../index.ts';
import type { CoreDomainId } from '../../domains/index.ts';
import type { CoreEventAction, CoreEventType } from '../../events/index.ts';

export interface CoreEventCatalogEntry {
  readonly id: CoreContractId;
  readonly eventType: CoreEventType;
  readonly domainId: CoreDomainId;
  readonly name: string;
  readonly description: string;
  readonly status: CoreContractStatus;
  readonly book: string;
  readonly purpose: string;
  readonly action: CoreEventAction;
  readonly subject?: string;
  readonly owns: readonly string[];
  readonly payloadShape?: readonly string[];
  readonly nonGoals: readonly string[];
  readonly futureExtensions?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly metadata?: Record<string, unknown>;
}
