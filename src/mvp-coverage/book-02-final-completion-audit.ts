import { existsSync } from 'node:fs';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  validateCoreApiBoundaryEvidence
} from '../api-coverage/index.ts';
import {
  CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE,
  CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE,
  CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE
} from '../workflows/index.ts';
import { BOOK_02_MVP_GAP_BASELINE } from './book-02-mvp-gap-baseline.ts';
import {
  CORE_TASK_060_FINAL_COMPLETION_LOCK,
  validateCoreTask060FinalCompletionLock
} from './core-task-060-final-completion-lock.ts';

export const BOOK_02_FINAL_COMPLETION_AUDIT_TASK = 'CORE-TASK-060' as const;

const API_TEST_FILES = [
  'tests/unit/core-task-057a-api-boundary-foundation.test.ts',
  'tests/unit/core-task-057b-api-boundary-foundation.test.ts',
  'tests/unit/core-task-057c-api-boundary-foundation.test.ts'
] as const;
const WORKFLOW_TEST_FILES = [
  'tests/unit/core-task-058a-customer-intake-workflow.test.ts',
  'tests/unit/core-task-058b-trademark-application-workflow.test.ts',
  'tests/unit/core-task-058c-communication-review-workflow.test.ts'
] as const;

export interface Book02FinalCompletionAudit {
  readonly fixtureType: 'book_02_final_completion_audit';
  readonly auditTask: typeof BOOK_02_FINAL_COMPLETION_AUDIT_TASK;
  readonly authority: typeof BOOK_02_MVP_GAP_BASELINE.authority;
  readonly lockVersion: string;
  readonly closureEvidence: {
    readonly staleRequirementIdsClosed: readonly string[];
    readonly staleAcceptanceCriterionIdsClosed: readonly string[];
    readonly apiBoundaryCount: number;
    readonly apiEvidenceValid: boolean;
    readonly apiExecutableTestsPresent: boolean;
    readonly workflowEvidenceValid: boolean;
    readonly workflowExecutableTestsPresent: boolean;
    readonly workflowNoDirectEventProof: boolean;
  };
  readonly gates: {
    readonly acceptanceCriteriaSatisfied: number;
    readonly acceptanceCriteriaTotal: number;
    readonly allAcceptanceCriteriaSatisfied: boolean;
    readonly domainCriterionSatisfied: boolean;
    readonly unresolvedNonDomainMustBuildRequirementIds: readonly string[];
    readonly allNonDomainMustBuildRequirementsMeetDepth: boolean;
    readonly guardInspectionIncompleteRequirementIds: readonly string[];
    readonly allGuardInspectionsComplete: boolean;
    readonly neverInMvpViolationCount: number;
    readonly documentOnlyUnexpectedImplementationCount: number;
    readonly deferredUnexpectedBlockingImplementationCount: number;
    readonly stubProductionDepthViolationCount: number;
    readonly finalCompletionLockValid: boolean;
  };
  readonly unresolvedAcceptanceCriterionIds: readonly string[];
  readonly completionStatus: 'complete' | 'incomplete';
  readonly book02MvpComplete: boolean;
  readonly nextProgram: 'BOOK-03-ENGINEERING-TRANSFORMATION';
  readonly exclusionsPreserved: readonly string[];
}

export function deriveBook02FinalCompletionAudit(): Book02FinalCompletionAudit {
  const baseline = BOOK_02_MVP_GAP_BASELINE;
  const apiEvidenceValid =
    CORE_API_BOUNDARY_EVIDENCE.length === 18 &&
    validateCoreApiBoundaryEvidence().length === 0 &&
    CORE_API_BOUNDARY_EVIDENCE.every(
      (entry) =>
        entry.currentDepth === 'level_2' &&
        entry.unresolvedCapabilities.length === 0 &&
        !entry.directDomainMutation &&
        !entry.directEventEmission
    );
  const apiExecutableTestsPresent = API_TEST_FILES.every(existsSync);
  const workflowEvidenceValid =
    CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.previewSupported &&
    CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.applySupported &&
    !CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.directDomainMutation &&
    !CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.directEventEmission &&
    CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.previewSupported &&
    CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.applySupported &&
    CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.previewValidationPlan &&
    CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE.applyMutationPlan &&
    CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.previewSupported &&
    CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.applySupported &&
    CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.separatedPreviewValidationAndApplyMutationPlans;
  const workflowExecutableTestsPresent = WORKFLOW_TEST_FILES.every(existsSync);
  const workflowNoDirectEventProof =
    !CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE.directEventEmission &&
    CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.noDirectEventEmission &&
    CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE.eventReferencesTraceOnly;
  const apiTestClosure = apiEvidenceValid && apiExecutableTestsPresent;
  const workflowTestClosure =
    workflowEvidenceValid &&
    workflowExecutableTestsPresent &&
    workflowNoDirectEventProof;
  const staleRequirementIdsClosed = [
    ...(apiTestClosure ? ['must-test-api-contract-tests'] : []),
    ...(workflowTestClosure ? ['must-test-workflow-contract-tests'] : [])
  ].sort();
  const staleAcceptanceCriterionIdsClosed = workflowTestClosure
    ? ['workflow-layer-does-not-emit-events-directly']
    : [];
  const baselineUnresolvedAcceptance = baseline.acceptanceCriteria
    .filter((criterion) => !criterion.satisfied)
    .map((criterion) => criterion.id);
  const unresolvedAcceptanceCriterionIds = baselineUnresolvedAcceptance.filter(
    (id) => !staleAcceptanceCriterionIdsClosed.includes(id)
  );
  const domainCriterionSatisfied = baseline.acceptanceCriteria.some(
    (criterion) =>
      criterion.id === 'must-build-domains-implemented-or-scaffolded-with-tests' &&
      criterion.satisfied
  );
  const unresolvedNonDomainMustBuildRequirementIds = baseline.requirements
    .filter(
      (requirement) =>
        requirement.category === 'must_build_now' &&
        requirement.layer !== 'domain' &&
        requirement.currentDisposition !== 'meets_required_depth' &&
        !staleRequirementIdsClosed.includes(requirement.id)
    )
    .map((requirement) => requirement.id)
    .sort();
  const guardInspectionIncompleteRequirementIds = baseline.requirements
    .filter(
      (requirement) =>
        requirement.layer === 'guard' && requirement.inspectionStatus !== 'complete'
    )
    .map((requirement) => requirement.id)
    .sort();
  const finalCompletionLockValid = validateCoreTask060FinalCompletionLock().length === 0;
  const acceptanceCriteriaSatisfied =
    baseline.summary.acceptance.acceptanceCriteriaSatisfied +
    staleAcceptanceCriterionIdsClosed.length;
  const gates = {
    acceptanceCriteriaSatisfied,
    acceptanceCriteriaTotal: baseline.summary.acceptance.acceptanceCriteriaTotal,
    allAcceptanceCriteriaSatisfied: unresolvedAcceptanceCriterionIds.length === 0,
    domainCriterionSatisfied,
    unresolvedNonDomainMustBuildRequirementIds,
    allNonDomainMustBuildRequirementsMeetDepth:
      unresolvedNonDomainMustBuildRequirementIds.length === 0,
    guardInspectionIncompleteRequirementIds,
    allGuardInspectionsComplete: guardInspectionIncompleteRequirementIds.length === 0,
    neverInMvpViolationCount: baseline.summary.neverInMvp.violationCount,
    documentOnlyUnexpectedImplementationCount:
      baseline.summary.documentOnly.unexpectedImplementationCount,
    deferredUnexpectedBlockingImplementationCount:
      baseline.summary.defer.unexpectedBlockingImplementationCount,
    stubProductionDepthViolationCount:
      baseline.summary.stubNow.productionDepthViolations,
    finalCompletionLockValid
  } as const;
  const book02MvpComplete =
    gates.acceptanceCriteriaSatisfied === CORE_TASK_060_FINAL_COMPLETION_LOCK.requiredAcceptanceCriteria &&
    gates.acceptanceCriteriaTotal === CORE_TASK_060_FINAL_COMPLETION_LOCK.requiredAcceptanceCriteria &&
    gates.allAcceptanceCriteriaSatisfied &&
    gates.domainCriterionSatisfied &&
    gates.allNonDomainMustBuildRequirementsMeetDepth &&
    gates.allGuardInspectionsComplete &&
    gates.neverInMvpViolationCount === 0 &&
    gates.documentOnlyUnexpectedImplementationCount === 0 &&
    gates.deferredUnexpectedBlockingImplementationCount === 0 &&
    gates.stubProductionDepthViolationCount === 0 &&
    gates.finalCompletionLockValid;
  return {
    fixtureType: 'book_02_final_completion_audit',
    auditTask: BOOK_02_FINAL_COMPLETION_AUDIT_TASK,
    authority: baseline.authority,
    lockVersion: CORE_TASK_060_FINAL_COMPLETION_LOCK.lockVersion,
    closureEvidence: {
      staleRequirementIdsClosed,
      staleAcceptanceCriterionIdsClosed,
      apiBoundaryCount: CORE_API_BOUNDARY_EVIDENCE.length,
      apiEvidenceValid,
      apiExecutableTestsPresent,
      workflowEvidenceValid,
      workflowExecutableTestsPresent,
      workflowNoDirectEventProof
    },
    gates,
    unresolvedAcceptanceCriterionIds,
    completionStatus: book02MvpComplete ? 'complete' : 'incomplete',
    book02MvpComplete,
    nextProgram: 'BOOK-03-ENGINEERING-TRANSFORMATION',
    exclusionsPreserved: [
      'no full workflow engine',
      'no full agent runtime',
      'no external protected action authorization',
      'no official filing integration',
      'no autonomous professional legal judgment'
    ]
  };
}

export const BOOK_02_FINAL_COMPLETION_AUDIT = deriveBook02FinalCompletionAudit();

export function validateBook02FinalCompletionAudit(
  audit: Book02FinalCompletionAudit = BOOK_02_FINAL_COMPLETION_AUDIT
): readonly string[] {
  const errors: string[] = [];
  if (audit.auditTask !== 'CORE-TASK-060') errors.push('unexpected audit task');
  if (!audit.closureEvidence.apiEvidenceValid)
    errors.push('all 18 API boundary evidence records must validate');
  if (!audit.closureEvidence.apiExecutableTestsPresent)
    errors.push('API family executable tests are incomplete');
  if (!audit.closureEvidence.workflowEvidenceValid)
    errors.push('three Workflow preview/apply evidence records are incomplete');
  if (!audit.closureEvidence.workflowExecutableTestsPresent)
    errors.push('Workflow family executable tests are incomplete');
  if (!audit.closureEvidence.workflowNoDirectEventProof)
    errors.push('Workflow no-direct-Event proof is incomplete');
  if (audit.gates.acceptanceCriteriaTotal !== 19)
    errors.push('Book 02 must retain exactly 19 acceptance criteria');
  if (!audit.gates.allAcceptanceCriteriaSatisfied)
    errors.push('not all Book 02 acceptance criteria are satisfied');
  if (!audit.gates.domainCriterionSatisfied)
    errors.push('Domain skeleton completion criterion is not satisfied');
  if (!audit.gates.allNonDomainMustBuildRequirementsMeetDepth)
    errors.push('non-Domain Must Build requirements remain unresolved');
  if (!audit.gates.allGuardInspectionsComplete)
    errors.push('one or more guard inspections are incomplete');
  if (audit.gates.neverInMvpViolationCount !== 0)
    errors.push('Never in MVP violations are present');
  if (audit.gates.documentOnlyUnexpectedImplementationCount !== 0)
    errors.push('document-only implementation overreach is present');
  if (audit.gates.deferredUnexpectedBlockingImplementationCount !== 0)
    errors.push('deferred blocking implementation is present');
  if (audit.gates.stubProductionDepthViolationCount !== 0)
    errors.push('stub production-depth violations are present');
  if (!audit.gates.finalCompletionLockValid)
    errors.push('CORE-TASK-060 final completion lock is invalid');
  if (!audit.book02MvpComplete || audit.completionStatus !== 'complete')
    errors.push('Book 02 MVP final completion was not proven');
  return errors;
}
