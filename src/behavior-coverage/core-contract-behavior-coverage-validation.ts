import { CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE } from './core-contract-behavior-coverage-baseline.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateCoreContractBehaviorCoverageBaseline(
  value: unknown
): readonly string[] {
  if (!isPlainObject(value))
    return ['Core contract behavior coverage baseline must be a plain object.'];

  const errors: string[] = [];
  if (
    JSON.stringify(value) !==
    JSON.stringify(CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE)
  )
    errors.push(
      'Contract behavior coverage baseline must match the canonical assessment exactly.'
    );

  if (value.scope !== 'contract_behavior_depth_assessment_only')
    errors.push(
      'Behavior coverage baseline scope must remain assessment-only.'
    );

  const boundary = isPlainObject(value.assessmentBoundary)
    ? value.assessmentBoundary
    : undefined;
  if (
    boundary === undefined ||
    boundary.behaviorImplementedByThisTask !== false ||
    boundary.executionSystemImplemented !== false ||
    boundary.productionReadinessAssessed !== false
  )
    errors.push(
      'Behavior baseline must not claim implementation, Execution System, or production readiness.'
    );

  return errors;
}
