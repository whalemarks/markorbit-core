import { existsSync } from 'node:fs';
import {
  createCoreValidationResult,
  type CoreValidationResult
} from './core-validation-result.ts';

const requiredScenarioIds = [
  'deterministic-preview',
  'canonical-change-changes-digest',
  'customer-reference-validation',
  'brand-reference-validation',
  'customer-brand-relationship-mismatch',
  'jurisdiction-reference-validation',
  'valid-single-class-application-preview',
  'valid-multi-class-application-preview',
  'duplicate-class-rejection',
  'empty-classification-scope-rejection',
  'malformed-goods-services-scope-rejection',
  'document-reference-validation',
  'evidence-reference-validation',
  'optional-matter-reference-validation',
  'optional-order-reference-validation',
  'preview-without-task-plan',
  'task-plan-with-configured-task-api',
  'task-plan-without-task-api-rejection',
  'successful-apply',
  'correct-owning-api-order',
  'authoritative-trademark-reference-propagation',
  'authoritative-matter-reference-propagation',
  'conflicting-propagated-reference-rejection',
  'idempotent-replay',
  'replay-makes-no-second-mutation',
  'conflicting-idempotency-replay',
  'altered-digest-rejection',
  'stale-version-rejection',
  'unsupported-workflow-version-rejection',
  'expired-preview-rejection',
  'organization-mismatch',
  'actor-mismatch',
  'permission-rejection',
  'policy-rejection',
  'missing-human-review',
  'rejected-human-review',
  'consumed-preview-rejection',
  'malformed-plan-rejection',
  'duplicate-plan-step-rejection',
  'unavailable-owning-api-rejection',
  'plan-input-mismatch-rejection',
  'downstream-api-failure-after-earlier-success',
  'safe-partial-execution-evidence',
  'genuine-event-reference-aggregation',
  'absent-event-references-produce-empty-list',
  'audit-context-excluded-from-event-references',
  'no-direct-domain-mutation',
  'no-direct-event-emission',
  'no-external-filing-connector',
  'event-references-remain-trace-only'
] as const;

const validOutcomes = new Set([
  'success',
  'safe_error',
  'trace_only',
  'boundary_assertion'
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function validateCoreTrademarkApplicationWorkflowFixture(
  fixture: unknown
): CoreValidationResult {
  const issues = [];
  const record = asRecord(fixture);
  if (!record)
    return createCoreValidationResult([
      {
        code: 'core_task_058b.fixture.invalid',
        message: 'CORE-TASK-058B fixture must be an object.',
        severity: 'error'
      }
    ]);
  for (const [key, value] of Object.entries({
    fixtureType: 'core_task_058b_trademark_application_workflow',
    requirementId: 'trademark-application-workflow-supports-preview-apply',
    workflowId: 'must-workflow-trademark-application-workflow',
    workflowType: 'bounded-trademark-application-workflow',
    workflowContractId: 'core-workflow-trademark-application-workflow-contract',
    implementationTask: 'CORE-TASK-058B',
    currentDepth: 'meets_required_depth'
  }))
    if (record[key] !== value)
      issues.push({
        code: 'core_task_058b.fixture.drift',
        message: `${key} drifted from CORE-TASK-058B evidence.`,
        severity: 'error' as const,
        path: key
      });
  for (const key of [
    'previewSupported',
    'applySupported',
    'deterministicPreview',
    'previewDigestRequired',
    'previewVersionRequired',
    'humanReviewRequired',
    'permissionPolicyPreserved',
    'idempotencyRequired'
  ])
    if (record[key] !== true)
      issues.push({
        code: 'core_task_058b.fixture.missing_capability',
        message: `${key} must be true.`,
        severity: 'error' as const,
        path: key
      });
  if (
    record.directDomainMutation !== false ||
    record.directEventEmission !== false
  )
    issues.push({
      code: 'core_task_058b.fixture.boundary',
      message:
        'Workflow fixture must prove no direct Domain mutation or Event emission.',
      severity: 'error' as const
    });

  const declared = Array.isArray(record.declaredScenarios)
    ? record.declaredScenarios
    : [];
  const executed = Array.isArray(record.executedScenarioEvidence)
    ? record.executedScenarioEvidence
    : [];
  const declaredIds = new Set<string>();
  const executedIds = new Set<string>();
  for (const scenario of declared) {
    const scenarioRecord = asRecord(scenario);
    const scenarioId = scenarioRecord?.scenarioId;
    const expectedOutcome = scenarioRecord?.expectedOutcome;
    if (typeof scenarioId !== 'string') continue;
    if (declaredIds.has(scenarioId))
      issues.push({
        code: 'core_task_058b.fixture.duplicate_scenario',
        message: `Duplicate declared scenario: ${scenarioId}.`,
        severity: 'error' as const,
        path: 'declaredScenarios'
      });
    declaredIds.add(scenarioId);
    if (
      typeof expectedOutcome !== 'string' ||
      !validOutcomes.has(expectedOutcome)
    )
      issues.push({
        code: 'core_task_058b.fixture.invalid_expected_outcome',
        message: `Invalid expected outcome for scenario: ${scenarioId}.`,
        severity: 'error' as const,
        path: 'declaredScenarios'
      });
  }
  for (const scenarioId of requiredScenarioIds)
    if (!declaredIds.has(scenarioId))
      issues.push({
        code: 'core_task_058b.fixture.missing_scenario',
        message: `Missing scenario: ${scenarioId}.`,
        severity: 'error' as const,
        path: 'declaredScenarios'
      });

  for (const evidence of executed) {
    const evidenceRecord = asRecord(evidence);
    if (!evidenceRecord) continue;
    const scenarioId = evidenceRecord?.scenarioId;
    const expectedOutcome = evidenceRecord?.expectedOutcome;
    if (typeof scenarioId !== 'string') continue;
    if (executedIds.has(scenarioId))
      issues.push({
        code: 'core_task_058b.fixture.duplicate_executable_evidence',
        message: `Duplicate executed scenario evidence: ${scenarioId}.`,
        severity: 'error' as const,
        path: 'executedScenarioEvidence'
      });
    executedIds.add(scenarioId);
    for (const field of ['testFile', 'testName', 'caseId'])
      if (
        typeof evidenceRecord[field] !== 'string' ||
        evidenceRecord[field].length === 0
      )
        issues.push({
          code: 'core_task_058b.fixture.missing_executable_link',
          message: `${field} is required for executed scenario: ${scenarioId}.`,
          severity: 'error' as const,
          path: 'executedScenarioEvidence'
        });
    if (
      typeof evidenceRecord.testFile === 'string' &&
      !existsSync(evidenceRecord.testFile)
    )
      issues.push({
        code: 'core_task_058b.fixture.missing_test_file',
        message: `Executable scenario test file does not exist: ${evidenceRecord.testFile}.`,
        severity: 'error' as const,
        path: 'executedScenarioEvidence'
      });
    if (
      typeof expectedOutcome !== 'string' ||
      !validOutcomes.has(expectedOutcome)
    )
      issues.push({
        code: 'core_task_058b.fixture.invalid_expected_outcome',
        message: `Invalid expected outcome for executed scenario: ${scenarioId}.`,
        severity: 'error' as const,
        path: 'executedScenarioEvidence'
      });
    if (
      expectedOutcome === 'safe_error' &&
      typeof evidenceRecord.safeErrorCode !== 'string'
    )
      issues.push({
        code: 'core_task_058b.fixture.missing_safe_error_code',
        message: `Safe-error scenario must identify a safe error code: ${scenarioId}.`,
        severity: 'error' as const,
        path: 'executedScenarioEvidence'
      });
  }
  for (const scenarioId of requiredScenarioIds)
    if (!executedIds.has(scenarioId))
      issues.push({
        code: 'core_task_058b.fixture.missing_executable_evidence',
        message: `Missing executable evidence for scenario: ${scenarioId}.`,
        severity: 'error' as const,
        path: 'executedScenarioEvidence'
      });

  return createCoreValidationResult(issues);
}
