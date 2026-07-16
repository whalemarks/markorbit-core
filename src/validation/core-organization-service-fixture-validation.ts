import { CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS } from '../services/organization/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreOrganizationServiceOperatingContextFoundationFixture(
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
      code: 'core.organization_service.fixture_invalid',
      severity: 'error',
      message: 'Organization Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !==
    'core_organization_service_operating_context_foundation'
  )
    issues.push({
      code: 'core.organization_service.fixture_type',
      severity: 'error',
      message: 'Organization Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.organization_service.operations',
      severity: 'error',
      message: 'Organization Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !==
      CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS.length ||
    expected.organizationIsOperatingContextNotAuthorization !== true ||
    expected.customerPartnerAgentProviderBoundariesPreserved !== true ||
    expected.billingAndAuthenticationExcluded !== true ||
    expected.inactiveAndArchivedReferencesRejected !== true ||
    expected.stableImmutableOrganizationId !== true ||
    expected.explicitUserLinkage !== true ||
    expected.permissionPolicyAndReviewPreserved !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.organization_service.expectations',
      severity: 'error',
      message: 'Organization Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
