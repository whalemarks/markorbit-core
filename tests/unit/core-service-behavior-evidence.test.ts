import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_BRAND_IMPLEMENTED_OPERATIONS,
  CORE_BRAND_MINIMUM_CAPABILITIES,
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES,
  CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,
  CORE_JURISDICTION_MINIMUM_CAPABILITIES,
  CORE_SERVICE_BEHAVIOR_EVIDENCE,
  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,
  CORE_TRADEMARK_MINIMUM_CAPABILITIES,
  validateCoreServiceBehaviorEvidence
} from '../../src/index.ts';

describe('Core Service behavior evidence', () => {
  it('validates exact Customer, Brand, Trademark, and Jurisdiction Service evidence in canonical order', () => {
    assert.deepEqual(validateCoreServiceBehaviorEvidence(), []);
    assert.equal(CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 4);
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE.map((entry) => entry.requirementId),
      [
        'must-service-customer-service',
        'must-service-brand-service',
        'must-service-trademark-service',
        'must-service-jurisdiction-service'
      ]
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
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[2]?.operations,
      CORE_TRADEMARK_IMPLEMENTED_OPERATIONS
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[2]?.provenMinimumCapabilities,
      CORE_TRADEMARK_MINIMUM_CAPABILITIES
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[3]?.operations,
      CORE_JURISDICTION_IMPLEMENTED_OPERATIONS
    );
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE[3]?.provenMinimumCapabilities,
      CORE_JURISDICTION_MINIMUM_CAPABILITIES
    );
  });

  it('rejects missing, duplicate, fake and cross-Service evidence', () => {
    const [customer, brand, trademark, jurisdiction] =
      CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [customer, brand, trademark]
      }).some((issue) => issue.code === 'core.service.evidence_missing'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [customer, customer, trademark, jurisdiction]
      }).some((issue) => issue.code === 'core.service.evidence_extra'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          { ...customer, contractId: 'fake-contract' },
          brand,
          trademark,
          jurisdiction
        ]
      }).some((issue) => issue.code === 'core.service.contract_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          { ...brand, domainId: 'customer' },
          trademark,
          jurisdiction
        ]
      }).some((issue) => issue.code === 'core.service.domain_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          { ...brand, serviceType: 'customer-service' },
          trademark,
          jurisdiction
        ]
      }).some((issue) => issue.code === 'core.service.cross_service_evidence'),
      true
    );
  });

  it('rejects missing Brand operations and minimum capabilities', () => {
    const [customer, brand, trademark, jurisdiction] =
      CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          { ...brand, operations: brand.operations.slice(1) },
          trademark,
          jurisdiction
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
          },
          trademark,
          jurisdiction
        ]
      }).some((issue) => issue.code === 'core.service.capability_missing'),
      true
    );
  });

  it('executes all four fixtures and rejects corrupted lifecycle expectations', async () => {
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

    const trademarkFixture = JSON.parse(
      await readFile(
        'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as { expected: Record<string, unknown> };
    trademarkFixture.expected.eventTraceCountAfterStatusReplay = 999;
    assert.equal(
      validateCoreServiceBehaviorEvidence({ trademarkFixture }).some(
        (issue) => issue.code === 'core.service.fixture_invalid'
      ),
      true
    );

    const jurisdictionFixture = JSON.parse(
      await readFile(
        'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as { expected: Record<string, unknown> };
    jurisdictionFixture.expected.eventTraceCountAfterStatusReplay = 999;
    assert.equal(
      validateCoreServiceBehaviorEvidence({ jurisdictionFixture }).some(
        (issue) => issue.code === 'core.service.fixture_invalid'
      ),
      true
    );
  });
});
