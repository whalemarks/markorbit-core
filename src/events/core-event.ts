import type { CoreDomainId } from '../domains/index.ts';
import type { CoreObjectReference } from '../objects/index.ts';
import type { CoreEventAction } from './core-event-action.ts';
import type { CoreEventId } from './core-event-id.ts';
import type { CoreEventSource } from './core-event-source.ts';
import type { CoreEventType } from './core-event-type.ts';

export interface CoreEvent {
  readonly id: CoreEventId;
  readonly type: CoreEventType;
  readonly action: CoreEventAction;
  readonly domainId: CoreDomainId;
  readonly object?: CoreObjectReference;
  readonly source: CoreEventSource;
  readonly occurredAt: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly payload?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}
