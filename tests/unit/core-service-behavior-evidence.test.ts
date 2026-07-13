import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_BRAND_IMPLEMENTED_OPERATIONS,
  CORE_BRAND_MINIMUM_CAPABILITIES,
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES,
  CORE_SERVICE_BEHAVIOR_EVIDENCE,
  validateCoreServiceBehaviorEvidence
} from '../../src/index.ts';

describe('Core Service behavior evidence', () => {
  it('validates exact Customer and Brand Service evidence in canonical order', () => {
    assert.deepEqual(validateCoreServiceBehaviorEvidence(), []);
    assert.equal(CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 2);
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE.map((entry) => entry.requirementId),
      ['must-service-customer-service', 'must-service-brand-service']
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[0]?.operations,
      CORE_CUSTOMER_IMPLEMENTED_OPERATIONS
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[0]?.provenMinimumCapabilities,
      CORE_CUSTOMER_MINIMUM_CAPABILITIES
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[1]?.operations,
      CORE_BRAND_IMPLEMENTED_OPERATIONS
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[1]?.provenMinimumCapabilities,
      CORE_BRAND_MINIMUM_CAPABILITIES
    );
  });

  it('rejects missing, duplicate, fake and cross-Service evidence', () => {
    const [customer, brand] = CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({ evidence: [customer] }).some(
        (issue) => issue.code === 'core.service.evidence_missing'
      ),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [customer, customer]
      }).some((issue) => issue.code === 'core.service.evidence_extra'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [{ ...customer, contractId: 'fake-contract' }, brand]
      }).some((issue) => issue.code === 'core.service.contract_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [customer, { ...brand, domainId: 'customer' }]
      }).some((issue) => issue.code === 'core.service.domain_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [customer, { ...brand, serviceType: 'customer-service' }]
      }).some((issue) => issue.code === 'core.service.cross_service_evidence'),
      true
    );
  });

  it('rejects missing Brand operations and minimum capabilities', () => {
    const [customer, brand] = CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          { ...brand, operations: brand.operations.slice(1) }
        ]
      }).some((issue) => issue.code === 'core.service.operation_missing'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          {
            ...brand,
            provenMinimumCapabilities: brand.provenMinimumCapabilities.slice(1)
          }
        ]
      }).some((issue) => issue.code === 'core.service.capability_missing'),
      true
    );
  });

  it('executes both fixtures and rejects corrupted lifecycle expectations', async () => {
    const customerFixture = JSON.parse(
      await readFile(
        'fixtures/services/core-customer-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as { expected: Record<string, unknown> };
    customerFixture.expected.eventTraceCountAfterStatusReplay = 999;
    assert.equal(
      validateCoreServiceBehaviorEvidence({ customerFixture }).some(
        (issue) => issue.code === 'core.service.fixture_invalid'
      ),
      true
    );

    const brandFixture = JSON.parse(
      await readFile(
        'fixtures/services/core-brand-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as { expected: Record<string, unknown> };
    brandFixture.expected.eventTraceCountAfterStatusReplay = 999;
    assert.equal(
      validateCoreServiceBehaviorEvidence({ brandFixture }).some(
        (issue) => issue.code === 'core.service.fixture_invalid'
      ),
      true
    );
  });
});
