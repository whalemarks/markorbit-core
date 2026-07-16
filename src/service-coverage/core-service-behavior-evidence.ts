import type { CoreDomainId } from '../domains/index.ts';
import {
  CORE_IDENTITY_IMPLEMENTED_OPERATIONS,
  CORE_IDENTITY_MINIMUM_CAPABILITIES
} from '../services/identity/index.ts';
import {
  CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS,
  CORE_ORGANIZATION_MINIMUM_CAPABILITIES
} from '../services/organization/index.ts';
import {
  CORE_BRAND_IMPLEMENTED_OPERATIONS,
  CORE_BRAND_MINIMUM_CAPABILITIES
} from '../services/brand/index.ts';
import {
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES
} from '../services/customer/index.ts';
import {
  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,
  CORE_TRADEMARK_MINIMUM_CAPABILITIES
} from '../services/trademark/index.ts';
import {
  CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,
  CORE_JURISDICTION_MINIMUM_CAPABILITIES
} from '../services/jurisdiction/index.ts';
import {
  CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,
  CORE_CLASSIFICATION_MINIMUM_CAPABILITIES
} from '../services/classification/index.ts';
import {
  CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,
  CORE_DOCUMENT_MINIMUM_CAPABILITIES
} from '../services/document/index.ts';
import {
  CORE_EVIDENCE_IMPLEMENTED_OPERATIONS,
  CORE_EVIDENCE_MINIMUM_CAPABILITIES
} from '../services/evidence/index.ts';
import {
  CORE_MATTER_IMPLEMENTED_OPERATIONS,
  CORE_MATTER_MINIMUM_CAPABILITIES
} from '../services/matter/index.ts';
import {
  CORE_ORDER_IMPLEMENTED_OPERATIONS,
  CORE_ORDER_MINIMUM_CAPABILITIES
} from '../services/order/index.ts';
import {
  CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS,
  CORE_OPPORTUNITY_MINIMUM_CAPABILITIES
} from '../services/opportunity/index.ts';
import {
  CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS,
  CORE_WORKFLOW_CONTRACT_MINIMUM_CAPABILITIES
} from '../services/workflow-contract/index.ts';
import {
  CORE_TASK_IMPLEMENTED_OPERATIONS,
  CORE_TASK_MINIMUM_CAPABILITIES
} from '../services/task/index.ts';
import {
  CORE_EVENT_IMPLEMENTED_OPERATIONS,
  CORE_EVENT_MINIMUM_CAPABILITIES
} from '../services/event/index.ts';
import {
  CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS,
  CORE_COMMUNICATION_MINIMUM_CAPABILITIES
} from '../services/communication/index.ts';

export interface CoreServiceBehaviorEvidence {
  readonly requirementId: string;
  readonly serviceType: string;
  readonly domainId: CoreDomainId;
  readonly contractId: string;
  readonly sourcePath: string;
  readonly currentDepth: 'level_2_3';
  readonly operations: readonly string[];
  readonly provenMinimumCapabilities: readonly string[];
  readonly unresolvedServiceOperations: readonly string[];
  readonly implementationFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly fixtureFiles: readonly string[];
}

export const CORE_SERVICE_BEHAVIOR_EVIDENCE = [
  {
    requirementId: 'must-service-identity-service',
    serviceType: 'identity-resolution-service',
    domainId: 'identity',
    contractId: 'core-service-identity-resolution-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/identity-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_IDENTITY_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_IDENTITY_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: ['unlinkIdentity'],
    implementationFiles: ['src/services/identity/core-identity-service.ts'],
    testFiles: [
      'tests/unit/core-identity-service-authority-foundation.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-identity-service-authority-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-organization-service',
    serviceType: 'organization-service',
    domainId: 'organization',
    contractId: 'core-service-organization-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/organization-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_ORGANIZATION_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [],
    implementationFiles: [
      'src/services/organization/core-organization-service.ts'
    ],
    testFiles: [
      'tests/unit/core-organization-service-operating-context-foundation.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-organization-service-operating-context-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-customer-service',
    serviceType: 'customer-service',
    domainId: 'customer',
    contractId: 'core-service-customer-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/customer-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_CUSTOMER_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'updateCustomer',
      'linkCustomerContact',
      'unlinkCustomerContact',
      'linkCustomerBrand',
      'unlinkCustomerBrand',
      'linkCustomerOpportunity',
      'linkCustomerOrder',
      'linkCustomerMatter'
    ],
    implementationFiles: [
      'src/services/customer/core-customer-service.ts',
      'src/services/customer/core-customer-service-guarded.ts'
    ],
    testFiles: [
      'tests/unit/core-customer-service-core-lifecycle.test.ts',
      'tests/unit/core-customer-service-replay-evidence.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-customer-service-core-lifecycle.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-brand-service',
    serviceType: 'brand-service',
    domainId: 'brand',
    contractId: 'core-service-brand-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/brand-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_BRAND_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_BRAND_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'updateBrand',
      'linkBrandCustomer',
      'unlinkBrandCustomer',
      'linkBrandTrademark',
      'unlinkBrandTrademark',
      'linkBrandAsset',
      'unlinkBrandAsset'
    ],
    implementationFiles: ['src/services/brand/core-brand-service.ts'],
    testFiles: ['tests/unit/core-brand-service-core-lifecycle.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-brand-service-core-lifecycle.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-trademark-service',
    serviceType: 'trademark-service',
    domainId: 'trademark',
    contractId: 'core-service-trademark-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/trademark-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_TRADEMARK_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'updateTrademark',
      'linkTrademarkBrand',
      'unlinkTrademarkBrand',
      'linkTrademarkJurisdiction',
      'linkTrademarkClassification',
      'unlinkTrademarkClassification',
      'linkTrademarkDocument',
      'linkTrademarkEvidence',
      'updateOfficialReference',
      'archiveTrademark'
    ],
    implementationFiles: ['src/services/trademark/core-trademark-service.ts'],
    testFiles: ['tests/unit/core-trademark-service-core-lifecycle.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-trademark-service-core-lifecycle.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-jurisdiction-service',
    serviceType: 'jurisdiction-service',
    domainId: 'jurisdiction',
    contractId: 'core-service-jurisdiction-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/jurisdiction-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_JURISDICTION_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'updateJurisdiction',
      'linkJurisdictionOffice',
      'linkJurisdictionRuleReference',
      'linkJurisdictionServiceScope',
      'archiveJurisdiction'
    ],
    implementationFiles: [
      'src/services/jurisdiction/core-jurisdiction-service.ts'
    ],
    testFiles: ['tests/unit/core-jurisdiction-service-core-lifecycle.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-jurisdiction-service-core-lifecycle.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-classification-service',
    serviceType: 'classification-service',
    domainId: 'classification',
    contractId: 'core-service-classification-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/classification-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_CLASSIFICATION_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'updateClassification',
      'addClassificationItem',
      'updateClassificationItem',
      'removeClassificationItem',
      'linkClassificationTrademark',
      'linkClassificationJurisdiction',
      'recommendClassification',
      'reviewClassification',
      'archiveClassification'
    ],
    implementationFiles: [
      'src/services/classification/core-classification-service.ts'
    ],
    testFiles: [
      'tests/unit/core-classification-service-core-scope-validation.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-classification-service-core-scope-validation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-document-service',
    serviceType: 'document-service',
    domainId: 'document',
    contractId: 'core-service-document-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/document-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_DOCUMENT_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'updateDocument',
      'addDocumentVersion',
      'linkDocumentVersion',
      'linkDocumentTrademark',
      'linkDocumentMatter',
      'linkDocumentEvidence',
      'linkDocumentCommunication',
      'archiveDocument'
    ],
    implementationFiles: ['src/services/document/core-document-service.ts'],
    testFiles: [
      'tests/unit/core-document-service-governed-artifact-foundation.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-evidence-service',
    serviceType: 'evidence-service',
    domainId: 'evidence',
    contractId: 'core-service-evidence-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/evidence-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_EVIDENCE_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_EVIDENCE_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'unlinkEvidenceSource',
      'linkEvidenceMatter',
      'linkEvidenceJurisdiction'
    ],
    implementationFiles: [
      'src/services/evidence/core-evidence-service.ts',
      'src/services/evidence/core-evidence-service-complete.ts'
    ],
    testFiles: [
      'tests/unit/core-evidence-service-proof-layer-foundation.test.ts',
      'tests/unit/core-evidence-service-mvp-completion.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-evidence-service-proof-layer-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-matter-service',
    serviceType: 'matter-service',
    domainId: 'matter',
    contractId: 'core-service-matter-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/matter-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_MATTER_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_MATTER_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'linkMatterCommunication',
      'linkMatterJurisdiction',
      'linkMatterClassification',
      'linkMatterParticipant',
      'archiveMatter'
    ],
    implementationFiles: ['src/services/matter/core-matter-service.ts'],
    testFiles: ['tests/unit/core-matter-service-execution-container.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-matter-service-execution-container-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-order-service',
    serviceType: 'order-service',
    domainId: 'order',
    contractId: 'core-service-order-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/order-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_ORDER_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_ORDER_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'linkOrderJurisdiction',
      'linkOrderClassification',
      'linkOrderDocument',
      'linkOrderCommunication',
      'archiveOrder'
    ],
    implementationFiles: ['src/services/order/core-order-service.ts'],
    testFiles: ['tests/unit/core-order-service-commercial-request.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-order-service-commercial-request-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'stub-service-opportunity-service',
    serviceType: 'opportunity-service',
    domainId: 'opportunity',
    contractId: 'core-service-opportunity-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/opportunity-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_OPPORTUNITY_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'linkOpportunityJurisdiction',
      'linkOpportunityClassification',
      'linkOpportunityKnowledge',
      'linkOpportunityPartner',
      'scoreOpportunity',
      'forecastOpportunity'
    ],
    implementationFiles: [
      'src/services/opportunity/core-opportunity-service.ts'
    ],
    testFiles: ['tests/unit/core-opportunity-service-potential-demand.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-opportunity-service-potential-demand-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-workflow-contract-service',
    serviceType: 'workflow-contract-service',
    domainId: 'workflow-contract',
    contractId: 'core-service-workflow-contract-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/workflow-contract-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_WORKFLOW_CONTRACT_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [],
    implementationFiles: [
      'src/services/workflow-contract/core-workflow-contract-service.ts'
    ],
    testFiles: [
      'tests/unit/core-workflow-contract-service-execution-structure.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-workflow-contract-service-execution-structure-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-task-service',
    serviceType: 'task-service',
    domainId: 'task',
    contractId: 'core-service-task-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/task-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_TASK_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_TASK_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [],
    implementationFiles: ['src/services/task/core-task-service.ts'],
    testFiles: ['tests/unit/core-task-service-actionable-work.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-task-service-actionable-work-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-event-service',
    serviceType: 'event-service',
    domainId: 'event',
    contractId: 'core-service-event-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/event-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_EVENT_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_EVENT_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: ['replayEventReference'],
    implementationFiles: ['src/services/event/core-event-service.ts'],
    testFiles: ['tests/unit/core-event-service-governed-occurrence.test.ts'],
    fixtureFiles: [
      'fixtures/services/core-event-service-governed-occurrence-foundation.fixture.json'
    ]
  },
  {
    requirementId: 'must-service-communication-service',
    serviceType: 'communication-reference-service',
    domainId: 'communication',
    contractId: 'core-service-communication-reference-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/communication-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_COMMUNICATION_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: [
      'unlinkCommunicationParticipant',
      'linkCommunicationTask',
      'linkCommunicationEvidence'
    ],
    implementationFiles: [
      'src/services/communication/core-communication-service.ts'
    ],
    testFiles: [
      'tests/unit/core-communication-service-governed-communication.test.ts'
    ],
    fixtureFiles: [
      'fixtures/services/core-communication-service-governed-communication-foundation.fixture.json'
    ]
  }
] as const satisfies readonly CoreServiceBehaviorEvidence[];
