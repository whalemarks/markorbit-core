import { CORE_EVENT_IMPLEMENTED_OPERATIONS } from '../services/event/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreEventServiceGovernedOccurrenceFoundationFixture(
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
      code: 'core.event_service.fixture_invalid',
      severity: 'error',
      message: 'Event Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !== 'core_event_service_governed_occurrence_foundation'
  )
    issues.push({
      code: 'core.event_service.fixture_type',
      severity: 'error',
      message: 'Event Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_EVENT_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.event_service.operations',
      severity: 'error',
      message: 'Event Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !== CORE_EVENT_IMPLEMENTED_OPERATIONS.length ||
    expected.payloadContractRequired !== true ||
    expected.dispatchTraceRequired !== true ||
    expected.consumerLinkageReferenceOnly !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true ||
    expected.noEventBusRuntime !== true
  )
    issues.push({
      code: 'core.event_service.expectations',
      severity: 'error',
      message: 'Event Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
