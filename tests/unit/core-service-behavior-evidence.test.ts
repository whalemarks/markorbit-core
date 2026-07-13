import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES,
  CORE_SERVICE_BEHAVIOR_EVIDENCE,
  validateCoreServiceBehaviorEvidence
} from '../../src/index.ts';

describe('Core Service behavior evidence', () => {
  it('validates the exact Customer Service CORE-TASK-036 evidence entry', () => {
    assert.deepEqual(validateCoreServiceBehaviorEvidence(), []);
    assert.equal(CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 1);
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[0]?.operations,
      CORE_CUSTOMER_IMPLEMENTED_OPERATIONS
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[0]?.provenMinimumCapabilities,
      CORE_CUSTOMER_MINIMUM_CAPABILITIES
    );
  });

  it('rejects fake contract, wrong domain, missing operation and missing capability', () => {
    const [entry] = CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence([{ ...entry, contractId: 'fake-contract' }])[0]?.code,
      'core.service.contract_mismatch'
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence([{ ...entry, domainId: 'brand' }])[0]?.code,
      'core.service.domain_mismatch'
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence([{ ...entry, operations: entry.operations.slice(1) }]).some(
        (issue) => issue.code === 'core.service.operation_missing'
      ),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence([
        { ...entry, provenMinimumCapabilities: entry.provenMinimumCapabilities.slice(1) }
      ]).some((issue) => issue.code === 'core.service.capability_missing'),
      true
    );
  });
});
