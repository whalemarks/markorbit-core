import { CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS } from '../services/workflow-contract/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreWorkflowContractServiceExecutionStructureFoundationFixture(
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
      code: 'core.workflow_contract_service.fixture_invalid',
      severity: 'error',
      message: 'Workflow Contract Service fixture must be an object.'
    });
    return createCoreValidationResult(issues);
  }
  const record = fixture as Record<string, unknown>;
  const operations = Array.isArray(record.implementedOperations)
    ? record.implementedOperations.map(String)
    : [];
  if (
    record.fixtureType !==
    'core_workflow_contract_service_execution_structure_foundation'
  )
    issues.push({
      code: 'core.workflow_contract_service.fixture_type',
      severity: 'error',
      message: 'Workflow Contract Service fixture type is invalid.',
      path: 'fixtureType'
    });
  if (
    JSON.stringify(operations) !==
    JSON.stringify(CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS)
  )
    issues.push({
      code: 'core.workflow_contract_service.operations',
      severity: 'error',
      message: 'Workflow Contract Service implemented operations drifted.',
      path: 'implementedOperations'
    });
  const expected = record.expected as Record<string, unknown> | undefined;
  if (
    !expected ||
    expected.operationCount !==
      CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS.length ||
    expected.statesTransitionsAndGuardsOwned !== true ||
    expected.transitionValidationDoesNotExecute !== true ||
    expected.permissionPolicyReviewApprovalPreserved !== true ||
    expected.applicabilityValidationRequired !== true ||
    expected.referenceValidationRequired !== true ||
    expected.eventTraceRequired !== true ||
    expected.eventRollbackRequired !== true ||
    expected.crossOrganizationNonEnumeration !== true ||
    expected.aiProposalRequiresGovernedActivation !== true ||
    expected.noTaskOrMatterExecution !== true ||
    expected.noWorkflowRuntimeEngine !== true
  )
    issues.push({
      code: 'core.workflow_contract_service.expectations',
      severity: 'error',
      message: 'Workflow Contract Service fixture expectations are incomplete.',
      path: 'expected'
    });
  return createCoreValidationResult(issues);
}
