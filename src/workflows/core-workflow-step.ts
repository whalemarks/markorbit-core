import type { CoreEventType } from '../events/index.ts';
import type { CoreTaskPriority, CoreTaskStatus, CoreTaskType } from '../tasks/index.ts';

declare const coreWorkflowStepIdBrand: unique symbol;

export type CoreWorkflowStepId = string & { readonly [coreWorkflowStepIdBrand]: true };

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCoreWorkflowStepId(value: string): CoreWorkflowStepId {
  if (typeof value !== 'string') {
    throw new TypeError('CoreWorkflowStepId must be a string.');
  }

  if (value.length === 0) {
    throw new Error('CoreWorkflowStepId must be non-empty.');
  }

  if (/\s/.test(value)) {
    throw new Error('CoreWorkflowStepId must not contain spaces or other whitespace.');
  }

  if (value.length > 120) {
    throw new Error('CoreWorkflowStepId must not be longer than 120 characters.');
  }

  if (!kebabCasePattern.test(value)) {
    throw new Error('CoreWorkflowStepId must be kebab-case.');
  }

  return value as CoreWorkflowStepId;
}

export interface CoreWorkflowStep {
  readonly id: CoreWorkflowStepId;
  readonly name: string;
  readonly description?: string;
  readonly taskType?: CoreTaskType;
  readonly required?: boolean;
  readonly reviewRequired?: boolean;
  readonly protectedAction?: boolean;
  readonly expectedStatus?: CoreTaskStatus;
  readonly priority?: CoreTaskPriority;
  readonly emitsEventTypes?: readonly CoreEventType[];
  readonly metadata?: Record<string, unknown>;
}
