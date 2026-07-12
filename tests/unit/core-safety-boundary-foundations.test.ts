import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_SAFETY_BOUNDARY_FIXTURE,
  CoreAgentBoundaryRegistry,
  CoreReferenceRegistry,
  createCoreSafeError,
  validateCoreAiContext,
  validateCoreVersion
} from '../../src/index.ts';

const references = new CoreReferenceRegistry(
  CORE_SAFETY_BOUNDARY_FIXTURE.referenceRecords
);
const agents = new CoreAgentBoundaryRegistry(
  CORE_SAFETY_BOUNDARY_FIXTURE.agentRegistry
);

describe('CORE-TASK-028 Safety and Boundary Foundations', () => {
  it('resolves a valid typed reference without exposing storage identifiers', () => {
    const result = references.resolve({
      referenceId: 'brand:alpha',
      expectedObjectType: 'Brand',
      expectedDomain: 'brand'
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal('databaseId' in result.value, false);
  });

  it('fails closed for invalid, missing, mismatched, and deleted references', () => {
    const invalid = references.resolve({
      referenceId: 'x',
      expectedObjectType: 'Brand',
      expectedDomain: 'brand'
    });
    const missing = references.resolve({
      referenceId: 'brand:missing',
      expectedObjectType: 'Brand',
      expectedDomain: 'brand'
    });
    const mismatch = references.resolve({
      referenceId: 'brand:alpha',
      expectedObjectType: 'Trademark',
      expectedDomain: 'brand'
    });
    const deleted = references.resolve({
      referenceId: 'document:deleted',
      expectedObjectType: 'Document',
      expectedDomain: 'document'
    });
    assert.deepEqual(
      [invalid, missing, mismatch, deleted].map((entry) => entry.ok),
      [false, false, false, false]
    );
  });

  it('returns controlled errors and removes unsafe detail', () => {
    const error = createCoreSafeError({
      code: 'ExternalDependencyFailed',
      category: 'ExternalDependency',
      message: 'SELECT password FROM users',
      safeDetail: 'Bearer secret-token',
      correlationId: 'request:one'
    });
    assert.equal(error.message, 'The operation could not be completed safely.');
    assert.equal(error.safeDetail, null);
    assert.equal(error.correlationId, 'request:one');
  });

  it('accepts supported semantic versions and fails closed otherwise', () => {
    assert.equal(
      validateCoreVersion({ contractVersion: 'v0.1.0' }, ['v0.1.0']).ok,
      true
    );
    assert.equal(
      validateCoreVersion({ contractVersion: '0.1.0' }, ['v0.1.0']).ok,
      false
    );
    assert.equal(
      validateCoreVersion({ contractVersion: 'v1.0.0' }, ['v0.1.0']).ok,
      false
    );
  });

  it('validates governed AI context and preserves the downstream governance requirement', () => {
    const result = validateCoreAiContext(
      CORE_SAFETY_BOUNDARY_FIXTURE.validAiContext,
      agents
    );
    assert.equal(result.ok, true);
    const boundary = agents.evaluate({
      agentReferenceId: 'agent:knowledge',
      registryKey: 'knowledge-agent-v0-1',
      capability: 'Summarize'
    });
    assert.deepEqual(boundary, {
      ok: true,
      value: { requiresPermissionPolicyEvaluation: true }
    });
  });

  it('blocks forbidden, out-of-scope, suspended, and undisclosed AI behavior', () => {
    assert.equal(
      agents.evaluate({
        agentReferenceId: 'agent:knowledge',
        registryKey: 'knowledge-agent-v0-1',
        capability: 'Send'
      }).ok,
      false
    );
    assert.equal(
      agents.evaluate({
        agentReferenceId: 'agent:knowledge',
        registryKey: 'knowledge-agent-v0-1',
        capability: 'Draft'
      }).ok,
      false
    );
    assert.equal(
      agents.evaluate({
        agentReferenceId: 'agent:suspended',
        registryKey: 'suspended-agent-v0-1',
        capability: 'Read'
      }).ok,
      false
    );
    const hidden = {
      ...CORE_SAFETY_BOUNDARY_FIXTURE.validAiContext,
      aiAssisted: false,
      aiGenerated: true
    };
    assert.equal(validateCoreAiContext(hidden, agents).ok, false);
  });
});
