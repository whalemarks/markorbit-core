import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
  validateCoreApiBoundaryEvidence
} from '../../src/index.ts';
const domainIds = new Set([
  'customer',
  'brand',
  'trademark',
  'jurisdiction',
  'classification',
  'document',
  'evidence'
]);
describe('CORE-TASK-057B governed API boundaries', () => {
  it('locks seven executable API boundaries with owning-Service delegation', () => {
    assert.deepEqual(validateCoreApiBoundaryEvidence(), []);
    const evidence = CORE_API_BOUNDARY_EVIDENCE.filter((entry) =>
      domainIds.has(entry.domainId)
    );
    assert.equal(evidence.length, 7);
    for (const entry of evidence) {
      assert.equal(entry.currentDepth, 'level_2');
      assert.deepEqual(
        entry.provenCapabilities,
        CORE_GOVERNED_API_REQUIRED_CAPABILITIES
      );
      assert.deepEqual(entry.unresolvedCapabilities, []);
      assert.equal(entry.directDomainMutation, false);
      assert.equal(entry.directEventEmission, false);
    }
  });
});
