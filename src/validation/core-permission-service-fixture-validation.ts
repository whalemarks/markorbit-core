import { CORE_PERMISSION_IMPLEMENTED_OPERATIONS } from '../services/permission/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCorePermissionServiceGovernedGrantFoundationFixture(
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
      code: 'core.permission_service.fixture_invalid',
      severity: 'error',
      message: 'Permission Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !== 'core_permission_service_governed_grant_foundation'
  )
    issues.push({
      code: 'core.permission_service.fixture_type',
      severity: 'error',
      message: 'Permission Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_PERMISSION_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.permission_service.operations',
      severity: 'error',
      message: 'Permission Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !== CORE_PERMISSION_IMPLEMENTED_OPERATIONS.length ||
    expected.permissionIsAuthorizationNotIdentityOrPolicy !== true ||
    expected.recognizedActorRequired !== true ||
    expected.explicitActorActionResourceScopeRequired !== true ||
    expected.deterministicDecisionPrecedence !== true ||
    expected.taskAssignmentDoesNotGrantPermission !== true ||
    expected.organizationMembershipDoesNotGrantPermission !== true ||
    expected.policyEvaluationExcludedWithHandoff !== true ||
    expected.aiSelfGrantProhibited !== true ||
    expected.highRiskHumanReviewRequired !== true ||
    expected.stableImmutablePermissionId !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.permission_service.expectations',
      severity: 'error',
      message: 'Permission Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
