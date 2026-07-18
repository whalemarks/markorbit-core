import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CORE_NAMED_AGENT_IDS,
  validateCoreTask059NamedAgentBoundariesFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  readFileSync(
    'fixtures/agents/core-task-059-named-agent-boundaries.fixture.json',
    'utf8'
  )
) as Record<string, unknown>;

describe('CORE-TASK-059 named Agent boundary fixture', () => {
  it('validates exactly five named Agents and deterministic scenario inventories', () => {
    const result = validateCoreTask059NamedAgentBoundariesFixture(fixture);
    assert.equal(result.ok, true);
    assert.deepEqual(
      [...(fixture.agents as string[])].sort(),
      [...CORE_NAMED_AGENT_IDS].sort()
    );
    assert.equal(fixture.productionOrExternalIntegrationData, false);
  });

  it('rejects fixture drift', () => {
    const result = validateCoreTask059NamedAgentBoundariesFixture({
      ...fixture,
      agents: ['knowledge-agent']
    });
    assert.equal(result.ok, false);
  });
});
