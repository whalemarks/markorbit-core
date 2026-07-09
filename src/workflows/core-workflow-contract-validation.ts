import type { CoreWorkflowContract } from './core-workflow-contract.ts';
import type { CoreWorkflowStep } from './core-workflow-step.ts';
import type { CoreWorkflowTransition } from './core-workflow-transition.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function validateStep(step: CoreWorkflowStep, index: number, errors: string[]): void {
  if (!step.id) errors.push(`CoreWorkflowContract.steps[${index}].id is required.`);
  if (!step.name) errors.push(`CoreWorkflowContract.steps[${index}].name is required.`);

  if (step.metadata !== undefined && !isPlainObject(step.metadata)) {
    errors.push(`CoreWorkflowContract.steps[${index}].metadata must be a plain object when present.`);
  }
}

function validateTransition(
  transition: CoreWorkflowTransition,
  index: number,
  stepIds: ReadonlySet<string>,
  errors: string[]
): void {
  if (!transition.fromStepId) errors.push(`CoreWorkflowContract.transitions[${index}].fromStepId is required.`);
  if (!transition.toStepId) errors.push(`CoreWorkflowContract.transitions[${index}].toStepId is required.`);

  if (transition.fromStepId && !stepIds.has(transition.fromStepId)) {
    errors.push(`CoreWorkflowContract.transitions[${index}].fromStepId must reference an existing step.`);
  }

  if (transition.toStepId && !stepIds.has(transition.toStepId)) {
    errors.push(`CoreWorkflowContract.transitions[${index}].toStepId must reference an existing step.`);
  }

  if (transition.metadata !== undefined && !isPlainObject(transition.metadata)) {
    errors.push(`CoreWorkflowContract.transitions[${index}].metadata must be a plain object when present.`);
  }
}

export function validateCoreWorkflowContract(contract: CoreWorkflowContract): readonly string[] {
  const errors: string[] = [];

  if (!contract.id) errors.push('CoreWorkflowContract.id is required.');
  if (!contract.type) errors.push('CoreWorkflowContract.type is required.');
  if (!contract.name) errors.push('CoreWorkflowContract.name is required.');
  if (!contract.domainId) errors.push('CoreWorkflowContract.domainId is required.');
  if (!contract.status) errors.push('CoreWorkflowContract.status is required.');

  if (!Number.isInteger(contract.version) || contract.version <= 0) {
    errors.push('CoreWorkflowContract.version must be a positive integer.');
  }

  if (!Array.isArray(contract.steps)) {
    errors.push('CoreWorkflowContract.steps must be an array.');
  } else if (contract.steps.length === 0) {
    errors.push('CoreWorkflowContract.steps must contain at least one step.');
  }

  if (contract.metadata !== undefined && !isPlainObject(contract.metadata)) {
    errors.push('CoreWorkflowContract.metadata must be a plain object when present.');
  }

  const stepIds = new Set<string>();

  if (Array.isArray(contract.steps)) {
    contract.steps.forEach((step, index) => {
      validateStep(step, index, errors);
      if (step.id) stepIds.add(step.id);
    });
  }

  if (contract.transitions !== undefined) {
    if (Array.isArray(contract.transitions)) {
      contract.transitions.forEach((transition, index) => validateTransition(transition, index, stepIds, errors));
    } else {
      errors.push('CoreWorkflowContract.transitions must be an array when present.');
    }
  }

  return errors;
}
