import { CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK } from './core-contract-coverage-acceptance-lock.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreContractCoverageAcceptanceLock(
  value: unknown
): readonly string[] {
  if (!isPlainObject(value))
    return ['Core contract coverage acceptance lock must be a plain object.'];

  const errors: string[] = [];
  if (
    JSON.stringify(value) !==
    JSON.stringify(CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK)
  )
    errors.push(
      'Contract coverage acceptance lock must match the canonical accepted state exactly.'
    );

  if (value.scope !== 'phase_3_contract_structure_acceptance_only')
    errors.push('Acceptance lock scope must remain structural-only.');

  const checks = isPlainObject(value.acceptanceChecks)
    ? value.acceptanceChecks
    : undefined;
  if (
    checks === undefined ||
    Object.values(checks).some((check) => check !== true)
  )
    errors.push('Every Phase 3 contract coverage acceptance check must pass.');

  const boundary = isPlainObject(value.assessmentBoundary)
    ? value.assessmentBoundary
    : undefined;
  if (
    boundary === undefined ||
    boundary.runtimeCoverageAccepted !== false ||
    boundary.behaviorCoverageAccepted !== false ||
    boundary.productionReadinessAccepted !== false
  )
    errors.push(
      'Acceptance lock must not claim runtime, behavior, or production readiness.'
    );

  return errors;
}
