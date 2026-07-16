import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_BRAND_IMPLEMENTED_OPERATIONS,
  CORE_BRAND_MINIMUM_CAPABILITIES,
  CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,
  CORE_CLASSIFICATION_MINIMUM_CAPABILITIES,
  CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS,
  CORE_COMMUNICATION_MINIMUM_CAPABILITIES,
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES,
  CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,
  CORE_DOCUMENT_MINIMUM_CAPABILITIES,
  CORE_EVIDENCE_IMPLEMENTED_OPERATIONS,
  CORE_EVIDENCE_MINIMUM_CAPABILITIES,
  CORE_EVENT_IMPLEMENTED_OPERATIONS,
  CORE_EVENT_MINIMUM_CAPABILITIES,
  CORE_IDENTITY_IMPLEMENTED_OPERATIONS,
  CORE_IDENTITY_MINIMUM_CAPABILITIES,
  CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,
  CORE_JURISDICTION_MINIMUM_CAPABILITIES,
  CORE_MATTER_IMPLEMENTED_OPERATIONS,
  CORE_MATTER_MINIMUM_CAPABILITIES,
  CORE_ORDER_IMPLEMENTED_OPERATIONS,
  CORE_ORDER_MINIMUM_CAPABILITIES,
  CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS,
  CORE_OPPORTUNITY_MINIMUM_CAPABILITIES,
  CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS,
  CORE_ORGANIZATION_MINIMUM_CAPABILITIES,
  CORE_USER_IMPLEMENTED_OPERATIONS,
  CORE_USER_MINIMUM_CAPABILITIES,
  CORE_PERMISSION_IMPLEMENTED_OPERATIONS,
  CORE_PERMISSION_MINIMUM_CAPABILITIES,
  CORE_SERVICE_BEHAVIOR_EVIDENCE,
  CORE_TASK_IMPLEMENTED_OPERATIONS,
  CORE_TASK_MINIMUM_CAPABILITIES,
  CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS,
  CORE_WORKFLOW_CONTRACT_MINIMUM_CAPABILITIES,
  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,
  CORE_TRADEMARK_MINIMUM_CAPABILITIES,
  validateCoreServiceBehaviorEvidence
} from '../../src/index.ts';

const expectedRequirements = [
  'must-service-identity-service',
  'must-service-organization-service',
  'must-service-user-service',
  'must-service-permission-service',
  'must-service-customer-service',
  'must-service-brand-service',
  'must-service-trademark-service',
  'must-service-jurisdiction-service',
  'must-service-classification-service',
  'must-service-document-service',
  'must-service-evidence-service',
  'must-service-matter-service',
  'must-service-order-service',
  'stub-service-opportunity-service',
  'must-service-workflow-contract-service',
  'must-service-task-service',
  'must-service-event-service',
  'must-service-communication-service'
];

describe('Core Service behavior evidence', () => {
  it('validates exact dependency-first Service evidence in canonical order', () => {
    assert.deepEqual(validateCoreServiceBehaviorEvidence(), []);
    assert.equal(CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 18);
    assert.deepEqual(
      CORE_SERVICE_BEHAVIOR_EVIDENCE.map((entry) => entry.requirementId),
      expectedRequirements
    );
    const expectations = [
      [
        CORE_IDENTITY_IMPLEMENTED_OPERATIONS,
        CORE_IDENTITY_MINIMUM_CAPABILITIES
      ],
      [
        CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS,
        CORE_ORGANIZATION_MINIMUM_CAPABILITIES
      ],
      [CORE_USER_IMPLEMENTED_OPERATIONS, CORE_USER_MINIMUM_CAPABILITIES],
      [
        CORE_PERMISSION_IMPLEMENTED_OPERATIONS,
        CORE_PERMISSION_MINIMUM_CAPABILITIES
      ],
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
      [
        CORE_EVIDENCE_IMPLEMENTED_OPERATIONS,
        CORE_EVIDENCE_MINIMUM_CAPABILITIES
      ],
      [CORE_MATTER_IMPLEMENTED_OPERATIONS, CORE_MATTER_MINIMUM_CAPABILITIES],
      [CORE_ORDER_IMPLEMENTED_OPERATIONS, CORE_ORDER_MINIMUM_CAPABILITIES],
      [
        CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS,
        CORE_OPPORTUNITY_MINIMUM_CAPABILITIES
      ],
      [
        CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS,
        CORE_WORKFLOW_CONTRACT_MINIMUM_CAPABILITIES
      ],
      [CORE_TASK_IMPLEMENTED_OPERATIONS, CORE_TASK_MINIMUM_CAPABILITIES],
      [CORE_EVENT_IMPLEMENTED_OPERATIONS, CORE_EVENT_MINIMUM_CAPABILITIES],
      [
        CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS,
        CORE_COMMUNICATION_MINIMUM_CAPABILITIES
      ]
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
      identity,
      organization,
      user,
      permission,
      customer,
      brand,
      trademark,
      jurisdiction,
      classification,
      document,
      evidence,
      matter,
      order,
      opportunity,
      workflowContract,
      task,
      event,
      communication
    ] = CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          identity,
          organization,
          user,
          permission,
          customer,
          brand,
          trademark,
          jurisdiction,
          classification,
          document,
          evidence
        ]
      }).some((entry) => entry.code === 'core.service.evidence_missing'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          identity,
          organization,
          user,
          permission,
          customer,
          customer,
          trademark,
          jurisdiction,
          classification,
          document,
          evidence,
          matter,
          order,
          opportunity,
          workflowContract,
          task,
          event,
          communication
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
          evidence,
          matter,
          order,
          opportunity,
          workflowContract,
          task,
          event,
          communication
        ]
      }).some((entry) => entry.code === 'core.service.contract_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          identity,
          organization,
          user,
          permission,
          customer,
          { ...brand, domainId: 'customer' },
          trademark,
          jurisdiction,
          classification,
          document,
          evidence,
          matter,
          order,
          opportunity,
          workflowContract,
          task,
          event,
          communication
        ]
      }).some((entry) => entry.code === 'core.service.domain_mismatch'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          identity,
          organization,
          user,
          permission,
          customer,
          { ...brand, serviceType: 'customer-service' },
          trademark,
          jurisdiction,
          classification,
          document,
          evidence,
          matter,
          order,
          opportunity,
          workflowContract,
          task,
          event,
          communication
        ]
      }).some((entry) => entry.code === 'core.service.cross_service_evidence'),
      true
    );
  });

  it('rejects missing operations and minimum capabilities', () => {
    const [
      identity,
      organization,
      user,
      permission,
      customer,
      brand,
      trademark,
      jurisdiction,
      classification,
      document,
      evidence,
      matter,
      order,
      opportunity,
      workflowContract,
      task,
      event,
      communication
    ] = CORE_SERVICE_BEHAVIOR_EVIDENCE;
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          identity,
          organization,
          user,
          permission,
          customer,
          brand,
          trademark,
          jurisdiction,
          classification,
          document,
          { ...evidence, operations: evidence.operations.slice(1) },
          matter,
          order,
          opportunity,
          workflowContract,
          task,
          event,
          communication
        ]
      }).some((entry) => entry.code === 'core.service.operation_missing'),
      true
    );
    assert.equal(
      validateCoreServiceBehaviorEvidence({
        evidence: [
          identity,
          organization,
          user,
          permission,
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
          },
          matter,
          order,
          opportunity,
          workflowContract,
          task,
          event,
          communication
        ]
      }).some((entry) => entry.code === 'core.service.capability_missing'),
      true
    );
  });

  it('executes all eighteen fixtures and rejects corrupted expectations', async () => {
    const fixtures = [
      [
        'identityFixture',
        'fixtures/services/core-identity-service-authority-foundation.fixture.json',
        'operationCount'
      ],
      [
        'organizationFixture',
        'fixtures/services/core-organization-service-operating-context-foundation.fixture.json',
        'operationCount'
      ],
      [
        'userFixture',
        'fixtures/services/core-user-service-account-participant-foundation.fixture.json',
        'operationCount'
      ],
      [
        'permissionFixture',
        'fixtures/services/core-permission-service-governed-grant-foundation.fixture.json',
        'operationCount'
      ],
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
      ],
      [
        'matterFixture',
        'fixtures/services/core-matter-service-execution-container-foundation.fixture.json',
        'operationCount'
      ],
      [
        'orderFixture',
        'fixtures/services/core-order-service-commercial-request-foundation.fixture.json',
        'operationCount'
      ],
      [
        'opportunityFixture',
        'fixtures/services/core-opportunity-service-potential-demand-foundation.fixture.json',
        'operationCount'
      ],
      [
        'workflowContractFixture',
        'fixtures/services/core-workflow-contract-service-execution-structure-foundation.fixture.json',
        'operationCount'
      ],
      [
        'taskFixture',
        'fixtures/services/core-task-service-actionable-work-foundation.fixture.json',
        'operationCount'
      ],
      [
        'eventFixture',
        'fixtures/services/core-event-service-governed-occurrence-foundation.fixture.json',
        'operationCount'
      ],
      [
        'communicationFixture',
        'fixtures/services/core-communication-service-governed-communication-foundation.fixture.json',
        'operationCount'
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
