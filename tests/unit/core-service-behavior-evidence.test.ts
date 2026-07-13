import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
      validateCoreServiceBehaviorEvidence({
        evidence: [{ ...entry, contractId: 'fake-contract' }]
      })[0]?.code,
      'core.service.contract_mismatch'
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [{ ...entry, domainId: 'brand' }]
      })[0]?.code,
      'core.service.domain_mismatch'
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [{ ...entry, operations: entry.operations.slice(1) }]
      }).some((issue) => issue.code === 'core.service.operation_missing'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          {
            ...entry,
            provenMinimumCapabilities:
              entry.provenMinimumCapabilities.slice(1)
          }
        ]
      }).some((issue) => issue.code === 'core.service.capability_missing'),
      true
    );
  });

  it('executes the fixture and rejects corrupted lifecycle expectations', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-customer-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as { expected: Record<string, unknown> };
    fixture.expected.eventTraceCountAfterStatusReplay = 999;
    const issues = validateCoreServiceBehaviorEvidence({
      customerFixture: fixture
    });
    assert.equal(
      issues.some((issue) => issue.code === 'core.service.fixture_invalid'),
      true
    );
  });
});
