import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { validateCoreTrademarkApplicationWorkflowFixture } from '../../src/index.ts';

describe('CORE-TASK-058B Trademark Application Workflow fixture', () => {
  it('validates declared scenarios and executable evidence traceability', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/workflows/core-task-058b-trademark-application-workflow.fixture.json',
        'utf8'
      )
    );
    assert.equal(
      validateCoreTrademarkApplicationWorkflowFixture(fixture).ok,
      true
    );
    assert.equal(fixture.declaredScenarios.length, 57);
    assert.equal(fixture.executedScenarioEvidence.length, 57);
  });
});
