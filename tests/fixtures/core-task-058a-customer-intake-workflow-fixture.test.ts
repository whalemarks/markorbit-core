import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { validateCoreCustomerIntakeWorkflowFixture } from '../../src/index.ts';

describe('CORE-TASK-058A Customer Intake Workflow fixture', () => {
  it('validates all required preview/apply scenarios', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/workflows/core-task-058a-customer-intake-workflow.fixture.json',
        'utf8'
      )
    );
    const result = validateCoreCustomerIntakeWorkflowFixture(fixture);
    assert.equal(result.ok, true);
    assert.equal(result.issues.length, 0);
  });
});
