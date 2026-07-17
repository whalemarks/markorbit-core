import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_TASK_057C_API_BOUNDARY_SPECS,
  CORE_TASK_057C_API_BOUNDARY_EVIDENCE,
  CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
  validateCoreGovernedApiBoundarySpecs,
  validateCoreApiBoundaryEvidence
} from '../../src/index.ts';
describe('CORE-TASK-057C final API boundaries', () => {
  it('locks six owning-Service boundaries and prohibits mutation and emission', () => {
    assert.deepEqual(
      validateCoreGovernedApiBoundarySpecs(CORE_TASK_057C_API_BOUNDARY_SPECS),
      []
    );
    assert.deepEqual(validateCoreApiBoundaryEvidence(), []);
    assert.equal(CORE_TASK_057C_API_BOUNDARY_SPECS.length, 6);
    assert.equal(CORE_TASK_057C_API_BOUNDARY_EVIDENCE.length, 6);
    for (const entry of CORE_TASK_057C_API_BOUNDARY_EVIDENCE) {
      assert.deepEqual(
        entry.provenCapabilities,
        CORE_GOVERNED_API_REQUIRED_CAPABILITIES
      );
      assert.equal(entry.directDomainMutation, false);
      assert.equal(entry.directEventEmission, false);
      assert.ok(entry.operationCount >= 9);
    }
  });
  it('keeps Event references non-command and high-risk boundaries explicit', () => {
    const event = CORE_TASK_057C_API_BOUNDARY_SPECS.find(
      (entry) => entry.domainId === 'event'
    )!;
    assert.equal(
      event.operations.some((entry) =>
        /execute|command|trigger/.test(entry.apiOperation)
      ),
      false
    );
    const workflow = CORE_TASK_057C_API_BOUNDARY_SPECS.find(
      (entry) => entry.domainId === 'workflow-contract'
    )!;
    assert.equal(
      workflow.operations.some((entry) => entry.apiOperation === 'execute'),
      false
    );
    const communication = CORE_TASK_057C_API_BOUNDARY_SPECS.find(
      (entry) => entry.domainId === 'communication'
    )!;
    assert.equal(
      communication.operations.some((entry) => entry.apiOperation === 'send'),
      false
    );
  });
});
