import type { CoreEventAction } from '../events/index.ts';
import type { CoreWorkflowStepId } from './core-workflow-step.ts';

export interface CoreWorkflowTransition {
  readonly fromStepId: CoreWorkflowStepId;
  readonly toStepId: CoreWorkflowStepId;
  readonly condition?: string;
  readonly blockedByReview?: boolean;
  readonly blockedByPolicy?: boolean;
  readonly emitsEventAction?: CoreEventAction;
  readonly metadata?: Record<string, unknown>;
}
