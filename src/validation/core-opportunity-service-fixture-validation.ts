import { CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS } from '../services/opportunity/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreOpportunityServicePotentialDemandFoundationFixture(
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
      code: 'core.opportunity_service.fixture_invalid',
      severity: 'error',
      message: 'Opportunity Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !==
    'core_opportunity_service_potential_demand_foundation'
  )
    issues.push({
      code: 'core.opportunity_service.fixture_type',
      severity: 'error',
      message: 'Opportunity Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.opportunity_service.operations',
      severity: 'error',
      message: 'Opportunity Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !==
      CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS.length ||
    expected.partialImplementBoundary !== true ||
    expected.aiSuggestionRequiresReview !== true ||
    expected.conversionDelegatesToOrderService !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.opportunity_service.expectations',
      severity: 'error',
      message: 'Opportunity Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
