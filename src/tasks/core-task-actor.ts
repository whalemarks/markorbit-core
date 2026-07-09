export const CORE_TASK_ACTOR_TYPES = {
  user: 'user',
  team: 'team',
  organization: 'organization',
  system: 'system',
  service: 'service',
  integration: 'integration',
  aiAssistant: 'ai_assistant',
  agent: 'agent'
} as const;

export type CoreTaskActorType = (typeof CORE_TASK_ACTOR_TYPES)[keyof typeof CORE_TASK_ACTOR_TYPES];

export interface CoreTaskActor {
  readonly actorType: CoreTaskActorType;
  readonly actorId: string;
  readonly actorLabel?: string;
}
