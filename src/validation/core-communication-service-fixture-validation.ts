import { CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS } from '../services/communication/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreCommunicationServiceGovernedCommunicationFoundationFixture(
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
      code: 'core.communication_service.fixture_invalid',
      severity: 'error',
      message: 'Communication Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !==
    'core_communication_service_governed_communication_foundation'
  )
    issues.push({
      code: 'core.communication_service.fixture_type',
      severity: 'error',
      message: 'Communication Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.communication_service.operations',
      severity: 'error',
      message: 'Communication Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !==
      CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS.length ||
    expected.communicationIsNotNotificationOrEvent !== true ||
    expected.attachmentDoesNotBecomeDocumentAutomatically !== true ||
    expected.messageDoesNotBecomeEvidenceAutomatically !== true ||
    expected.externalGatewayDeliveryExcluded !== true ||
    expected.aiDraftRequiresGovernedReview !== true ||
    expected.permissionPolicyAndReviewPreserved !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true
  )
    issues.push({
      code: 'core.communication_service.expectations',
      severity: 'error',
      message: 'Communication Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
