import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_BRAND_IMPLEMENTED_OPERATIONS,
  CORE_BRAND_MINIMUM_CAPABILITIES,
  CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,
  CORE_CLASSIFICATION_MINIMUM_CAPABILITIES,
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES,
  CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,
  CORE_DOCUMENT_MINIMUM_CAPABILITIES,
  CORE_EVIDENCE_IMPLEMENTED_OPERATIONS,
  CORE_EVIDENCE_MINIMUM_CAPABILITIES,
  CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,
  CORE_JURISDICTION_MINIMUM_CAPABILITIES,
  CORE_SERVICE_BEHAVIOR_EVIDENCE,
  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,
  CORE_TRADEMARK_MINIMUM_CAPABILITIES,
  validateCoreServiceBehaviorEvidence
} from '../../src/index.ts';

const expectedRequirements = [
  'must-service-customer-service',
  'must-service-brand-service',
  'must-service-trademark-service',
  'must-service-jurisdiction-service',
  'must-service-classification-service',
  'must-service-document-service',
  'must-service-evidence-service'
];

describe('Core Service behavior evidence', () => {
  it('validates exact dependency-first Service evidence in canonical order', () => {
    assert.deepEqual(validateCoreServiceBehaviorEvidence(), []);
    assert.equal(CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 7);
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE.map((entry) => entry.requirementId),
      expectedRequirements
    );
    const expectations = [
      [
        CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
        CORE_CUSTOMER_MINIMUM_CAPABILITIES
      ],
      [CORE_BRAND_IMPLEMENTED_OPERATIONS, CORE_BRAND_MINIMUM_CAPABILITIES],
      [
        CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,
        CORE_TRADEMARK_MINIMUM_CAPABILITIES
      ],
      [
        CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,
        CORE_JURISDICTION_MINIMUM_CAPABILITIES
      ],
      [
        CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,
        CORE_CLASSIFICATION_MINIMUM_CAPABILITIES
      ],
      [
        CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,
        CORE_DOCUMENT_MINIMUM_CAPABILITIES
      ],
      [CORE_EVIDENCE_IMPLEMENTED_OPERATIONS, CORE_EVIDENCE_MINIMUM_CAPABILITIES]
    ] as const;
    for (const [index, [operations, capabilities]] of expectations.entries()) {
      assert.deepEqual(
        CORE_SERVICE_BEHAVIOR_EVIDENCE[index]?.operations,
        operations
      );
      assert.deepEqual(
        CORE_SERVICE_BEHAVIOR_EVIDENCE[index]?.provenMinimumCapabilities,
        capabilities
      );
    }
  });

  it('rejects missing, duplicate, fake and cross-Service evidence', () => {
    const [
      customer,
      brand,
      trademark,
      jurisdiction,
      classification,
      document,
      evidence
    ] = CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          brand,
          trademark,
          jurisdiction,
          classification,
          document
        ]
      }).some((entry) => entry.code === 'core.service.evidence_missing'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          customer,
          trademark,
          jurisdiction,
          classification,
          document,
          evidence
        ]
      }).some((entry) => entry.code === 'core.service.evidence_extra'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          { ...customer, contractId: 'fake-contract' },
          brand,
          trademark,
          jurisdiction,
          classification,
          document,
          evidence
        ]
      }).some((entry) => entry.code === 'core.service.contract_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          { ...brand, domainId: 'customer' },
          trademark,
          jurisdiction,
          classification,
          document,
          evidence
        ]
      }).some((entry) => entry.code === 'core.service.domain_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          { ...brand, serviceType: 'customer-service' },
          trademark,
          jurisdiction,
          classification,
          document,
          evidence
        ]
      }).some((entry) => entry.code === 'core.service.cross_service_evidence'),
      true
    );
  });

  it('rejects missing operations and minimum capabilities', () => {
    const [
      customer,
      brand,
      trademark,
      jurisdiction,
      classification,
      document,
      evidence
    ] = CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          brand,
          trademark,
          jurisdiction,
          classification,
          document,
          { ...evidence, operations: evidence.operations.slice(1) }
        ]
      }).some((entry) => entry.code === 'core.service.operation_missing'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          customer,
          brand,
          trademark,
          jurisdiction,
          classification,
          document,
          {
            ...evidence,
            provenMinimumCapabilities:
              evidence.provenMinimumCapabilities.slice(1)
          }
        ]
      }).some((entry) => entry.code === 'core.service.capability_missing'),
      true
    );
  });

  it('executes all seven fixtures and rejects corrupted expectations', async () => {
    const fixtures = [
      [
        'customerFixture',
        'fixtures/services/core-customer-service-core-lifecycle.fixture.json',
        'eventTraceCountAfterStatusReplay'
      ],
      [
        'brandFixture',
        'fixtures/services/core-brand-service-core-lifecycle.fixture.json',
        'eventTraceCountAfterStatusReplay'
      ],
      [
        'trademarkFixture',
        'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',
        'eventTraceCountAfterStatusReplay'
      ],
      [
        'jurisdictionFixture',
        'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json',
        'eventTraceCountAfterStatusReplay'
      ],
      [
        'classificationFixture',
        'fixtures/services/core-classification-service-core-scope-validation.fixture.json',
        'eventTraceCountAfterApprovalReplay'
      ],
      [
        'documentFixture',
        'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json',
        'eventTraceCountAfterArchiveReplay'
      ],
      [
        'evidenceFixture',
        'fixtures/services/core-evidence-service-proof-layer-foundation.fixture.json',
        'eventTraceCountAfterArchiveReplay'
      ]
    ] as const;

    for (const [option, path, expectation] of fixtures) {
      const fixture = JSON.parse(await readFile(path, 'utf8')) as {
        expected: Record<string, unknown>;
      };
      fixture.expected[expectation] = 999;
      const result = validateCoreServiceBehaviorEvidence({ [option]: fixture });
      assert.equal(
        result.some((entry) => entry.code === 'core.service.fixture_invalid'),
        true
      );
    }
  });
});
