import { CORE_MATTER_IMPLEMENTED_OPERATIONS } from '../services/matter/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreMatterServiceExecutionContainerFoundationFixture(
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
      code: 'core.matter_service.fixture_invalid',
      severity: 'error',
      message: 'Matter Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !== 'core_matter_service_execution_container_foundation'
  )
    issues.push({
      code: 'core.matter_service.fixture_type',
      severity: 'error',
      message: 'Matter Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_MATTER_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.matter_service.operations',
      severity: 'error',
      message: 'Matter Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !== CORE_MATTER_IMPLEMENTED_OPERATIONS.length ||
    expected.lifecycleLocked !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.matter_service.expectations',
      severity: 'error',
      message: 'Matter Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
