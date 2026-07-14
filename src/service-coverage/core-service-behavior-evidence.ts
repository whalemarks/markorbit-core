import type { CoreDomainId } from '../domains/index.ts';
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
  }
] as const satisfies readonly CoreServiceBehaviorEvidence[];
