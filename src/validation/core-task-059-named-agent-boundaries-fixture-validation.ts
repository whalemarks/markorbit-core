import {
  createCoreValidationResult,
  type CoreValidationResult
} from './core-validation-result.ts';

const agentIds = [
  'knowledge-agent',
  'task-agent',
  'communication-agent',
  'workflow-agent',
  'audit-agent'
] as const;
function rec(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}
export function validateCoreTask059NamedAgentBoundariesFixture(
  fixture: unknown
): CoreValidationResult {
  const issues = [];
  const r = rec(fixture);
  if (!r)
    return createCoreValidationResult([
      {
        code: 'core_task_059.fixture.invalid',
        message: 'CORE-TASK-059 fixture must be an object.',
        severity: 'error'
      }
    ]);
  for (const [key, value] of Object.entries({
    fixtureType: 'core_task_059_named_agent_boundaries',
    taskId: 'CORE-TASK-059',
    schemaVersion: 'core-agent-boundary-fixture.v1'
  }))
    if (r[key] !== value)
      issues.push({
        code: 'core_task_059.fixture.drift',
        message: `${key} drifted.`,
        severity: 'error' as const,
        path: key
      });
  const agents = Array.isArray(r.agents) ? r.agents : [];
  if (
    agents.length !== 5 ||
    [...agents].sort().join('|') !== [...agentIds].sort().join('|')
  )
    issues.push({
      code: 'core_task_059.fixture.agent_count',
      message: 'Fixture must contain exactly five named Agents.',
      severity: 'error' as const,
      path: 'agents'
    });
  for (const key of ['positiveScenarioInventory', 'negativeScenarioInventory'])
    if (!Array.isArray(r[key]) || r[key].length === 0)
      issues.push({
        code: 'core_task_059.fixture.scenarios',
        message: `${key} must be populated.`,
        severity: 'error' as const,
        path: key
      });
  for (const key of [
    'delegationAllowlists',
    'forbiddenOperationLists',
    'expectedBook02AfterState'
  ])
    if (!rec(r[key]))
      issues.push({
        code: 'core_task_059.fixture.section_missing',
        message: `${key} must be an object.`,
        severity: 'error' as const,
        path: key
      });
  if (r.productionOrExternalIntegrationData !== false)
    issues.push({
      code: 'core_task_059.fixture.external_data',
      message:
        'Fixture must not contain production or external integration data.',
      severity: 'error' as const
    });
  const after = rec(r.expectedBook02AfterState);
  if (
    after &&
    (after.nextTask !== 'CORE-TASK-060' ||
      after.book02MvpComplete !== false ||
      after.neverInMvpViolations !== 0)
  )
    issues.push({
      code: 'core_task_059.fixture.after_state',
      message: 'Expected Book 02 after-state drifted.',
      severity: 'error' as const,
      path: 'expectedBook02AfterState'
    });
  return createCoreValidationResult(issues);
}
