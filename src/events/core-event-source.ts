export const CORE_EVENT_SOURCE_ACTOR_TYPES = {
  user: 'user',
  system: 'system',
  service: 'service',
  integration: 'integration',
  aiAssistant: 'ai_assistant',
  agent: 'agent'
} as const;

export type CoreEventSourceActorType = (typeof CORE_EVENT_SOURCE_ACTOR_TYPES)[keyof typeof CORE_EVENT_SOURCE_ACTOR_TYPES];

export interface CoreEventSource {
  readonly actorType: CoreEventSourceActorType;
  readonly actorId: string;
  readonly actorLabel?: string;
}
