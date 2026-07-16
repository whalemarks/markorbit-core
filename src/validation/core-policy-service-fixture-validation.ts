import { CORE_POLICY_IMPLEMENTED_OPERATIONS } from '../services/policy/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCorePolicyServiceContextualDecisionFoundationFixture(
  fixture: unknown
) {
  const issues: {
    code: string;
    severity: 'error';
    message: string;
    path?: string;
  }[] = [];
  if (
    typeof fixture !== 'object' ||
    fixture === null ||
    Array.isArray(fixture)
  ) {
    issues.push({
      code: 'core.policy_service.fixture_invalid',
      severity: 'error',
      message: 'Policy Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !== 'core_policy_service_contextual_decision_foundation'
  )
    issues.push({
      code: 'core.policy_service.fixture_type',
      severity: 'error',
      message: 'Policy Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_POLICY_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.policy_service.operations',
      severity: 'error',
      message: 'Policy Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !== CORE_POLICY_IMPLEMENTED_OPERATIONS.length ||
    expected.policyIsContextualConstraintNotPermission !== true ||
    expected.permissionDecisionRequired !== true ||
    expected.permissionDenialFailsClosed !== true ||
    expected.deterministicDecisionPrecedence !== true ||
    expected.missingPolicyFailsClosedForControlledBehavior !== true ||
    expected.redactionGuidanceSupported !== true ||
    expected.nonDisclosureGuidanceSupported !== true ||
    expected.reviewAndApprovalAreRequirementsNotExecution !== true ||
    expected.protectedAiActionsRequirePolicy !== true ||
    expected.professionalJudgmentExcluded !== true ||
    expected.legalRuleEngineExcluded !== true ||
    expected.stableImmutablePolicyId !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.policy_service.expectations',
      severity: 'error',
      message: 'Policy Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
