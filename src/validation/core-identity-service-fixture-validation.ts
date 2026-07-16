import { CORE_IDENTITY_IMPLEMENTED_OPERATIONS } from '../services/identity/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreIdentityServiceAuthorityFoundationFixture(
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
      code: 'core.identity_service.fixture_invalid',
      severity: 'error',
      message: 'Identity Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (record.fixtureType !== 'core_identity_service_authority_foundation')
    issues.push({
      code: 'core.identity_service.fixture_type',
      severity: 'error',
      message: 'Identity Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_IDENTITY_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.identity_service.operations',
      severity: 'error',
      message: 'Identity Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !== CORE_IDENTITY_IMPLEMENTED_OPERATIONS.length ||
    expected.identityIsRecognitionNotAuthorization !== true ||
    expected.userAndOrganizationBoundariesPreserved !== true ||
    expected.authenticationAndCredentialStorageExcluded !== true ||
    expected.suspendedAndArchivedReferencesRejected !== true ||
    expected.stableImmutableIdentityId !== true ||
    expected.permissionPolicyAndReviewPreserved !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.identity_service.expectations',
      severity: 'error',
      message: 'Identity Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
