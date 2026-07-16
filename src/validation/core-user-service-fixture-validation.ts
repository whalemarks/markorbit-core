import { CORE_USER_IMPLEMENTED_OPERATIONS } from '../services/user/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreUserServiceAccountParticipantFoundationFixture(
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
      code: 'core.user_service.fixture_invalid',
      severity: 'error',
      message: 'User Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (record.fixtureType !== 'core_user_service_account_participant_foundation')
    issues.push({
      code: 'core.user_service.fixture_type',
      severity: 'error',
      message: 'User Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_USER_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.user_service.operations',
      severity: 'error',
      message: 'User Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !== CORE_USER_IMPLEMENTED_OPERATIONS.length ||
    expected.userIsAccountParticipantNotAuthorization !== true ||
    expected.identityRequired !== true ||
    expected.explicitOrganizationLinkage !== true ||
    expected.authenticationExcluded !== true ||
    expected.customerAgentProviderBoundariesPreserved !== true ||
    expected.inactiveAndArchivedReferencesRejected !== true ||
    expected.stableImmutableUserId !== true ||
    expected.permissionPolicyAndReviewPreserved !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.user_service.expectations',
      severity: 'error',
      message: 'User Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
