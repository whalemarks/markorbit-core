import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { validateCoreCommunicationReviewWorkflowFixture } from '../../src/index.ts';

const fixture = JSON.parse(
  readFileSync(
    'fixtures/workflows/core-task-058c-communication-review-workflow.fixture.json',
    'utf8'
  )
);

describe('CORE-TASK-058C Communication Review Workflow fixture', () => {
  it('validates the required preview/apply workflow evidence', () => {
    const result = validateCoreCommunicationReviewWorkflowFixture(fixture);
    assert.equal(result.ok, true);
    assert.equal(fixture.nextTask, 'CORE-TASK-059');
    assert.equal(fixture.mvpComplete, false);
  });
});
