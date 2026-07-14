import { existsSync, readFileSync } from 'node:fs';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../contracts/index.ts';
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
import { validateCoreBrandServiceEvidenceFixture } from './core-brand-service-evidence-fixture.ts';
import { validateCoreCustomerServiceEvidenceFixture } from './core-customer-service-evidence-fixture.ts';
import { validateCoreTrademarkServiceEvidenceFixture } from './core-trademark-service-evidence-fixture.ts';
import { validateCoreJurisdictionServiceEvidenceFixture } from './core-jurisdiction-service-evidence-fixture.ts';
import { validateCoreClassificationServiceEvidenceFixture } from './core-classification-service-evidence-fixture.ts';
import { validateCoreDocumentServiceEvidenceFixture } from './core-document-service-evidence-fixture.ts';
import { validateCoreEvidenceServiceEvidenceFixture } from './core-evidence-service-evidence-fixture.ts';
import {
  CORE_SERVICE_BEHAVIOR_EVIDENCE,
  type CoreServiceBehaviorEvidence
} from './core-service-behavior-evidence.ts';

export interface CoreServiceBehaviorValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface CoreServiceBehaviorValidationOptions {
  readonly evidence?: readonly CoreServiceBehaviorEvidence[];
  readonly customerFixture?: unknown;
  readonly brandFixture?: unknown;
  readonly trademarkFixture?: unknown;
  readonly jurisdictionFixture?: unknown;
  readonly classificationFixture?: unknown;
  readonly documentFixture?: unknown;
  readonly evidenceFixture?: unknown;
}

interface ExpectedServiceEvidence {
  readonly requirementId: string;
  readonly serviceType: string;
  readonly domainId:
    | 'customer'
    | 'brand'
    | 'trademark'
    | 'jurisdiction'
    | 'classification'
    | 'document'
    | 'evidence';
  readonly contractId: string;
  readonly sourcePath: string;
  readonly operations: readonly string[];
  readonly capabilities: readonly string[];
  readonly unresolved: readonly string[];
  readonly fixtureOverride:
    | 'customerFixture'
    | 'brandFixture'
    | 'trademarkFixture'
    | 'jurisdictionFixture'
    | 'classificationFixture'
    | 'documentFixture'
    | 'evidenceFixture';
  readonly fixtureValidator: (
    fixture: unknown
  ) => readonly { readonly code: string }[];
}

const expectedEvidence = [
  {
    requirementId: 'must-service-customer-service',
    serviceType: 'customer-service',
    domainId: 'customer',
    contractId: 'core-service-customer-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/customer-service.md',
    operations: CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_CUSTOMER_MINIMUM_CAPABILITIES,
    unresolved: [
      'updateCustomer',
      'linkCustomerContact',
      'unlinkCustomerContact',
      'linkCustomerBrand',
      'unlinkCustomerBrand',
      'linkCustomerOpportunity',
      'linkCustomerOrder',
      'linkCustomerMatter'
    ],
    fixtureOverride: 'customerFixture',
    fixtureValidator: validateCoreCustomerServiceEvidenceFixture
  },
  {
    requirementId: 'must-service-brand-service',
    serviceType: 'brand-service',
    domainId: 'brand',
    contractId: 'core-service-brand-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/brand-service.md',
    operations: CORE_BRAND_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_BRAND_MINIMUM_CAPABILITIES,
    unresolved: [
      'updateBrand',
      'linkBrandCustomer',
      'unlinkBrandCustomer',
      'linkBrandTrademark',
      'unlinkBrandTrademark',
      'linkBrandAsset',
      'unlinkBrandAsset'
    ],
    fixtureOverride: 'brandFixture',
    fixtureValidator: validateCoreBrandServiceEvidenceFixture
  },
  {
    requirementId: 'must-service-trademark-service',
    serviceType: 'trademark-service',
    domainId: 'trademark',
    contractId: 'core-service-trademark-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/trademark-service.md',
    operations: CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_TRADEMARK_MINIMUM_CAPABILITIES,
    unresolved: [
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
    fixtureOverride: 'trademarkFixture',
    fixtureValidator: validateCoreTrademarkServiceEvidenceFixture
  },
  {
    requirementId: 'must-service-jurisdiction-service',
    serviceType: 'jurisdiction-service',
    domainId: 'jurisdiction',
    contractId: 'core-service-jurisdiction-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/jurisdiction-service.md',
    operations: CORE_JURISDICTION_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_JURISDICTION_MINIMUM_CAPABILITIES,
    unresolved: [
      'updateJurisdiction',
      'linkJurisdictionOffice',
      'linkJurisdictionRuleReference',
      'linkJurisdictionServiceScope',
      'archiveJurisdiction'
    ],
    fixtureOverride: 'jurisdictionFixture',
    fixtureValidator: validateCoreJurisdictionServiceEvidenceFixture
  },
  {
    requirementId: 'must-service-classification-service',
    serviceType: 'classification-service',
    domainId: 'classification',
    contractId: 'core-service-classification-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/classification-service.md',
    operations: CORE_CLASSIFICATION_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_CLASSIFICATION_MINIMUM_CAPABILITIES,
    unresolved: [
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
    fixtureOverride: 'classificationFixture',
    fixtureValidator: validateCoreClassificationServiceEvidenceFixture
  },
  {
    requirementId: 'must-service-document-service',
    serviceType: 'document-service',
    domainId: 'document',
    contractId: 'core-service-document-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/document-service.md',
    operations: CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_DOCUMENT_MINIMUM_CAPABILITIES,
    unresolved: [
      'updateDocument',
      'addDocumentVersion',
      'linkDocumentVersion',
      'linkDocumentTrademark',
      'linkDocumentMatter',
      'linkDocumentEvidence',
      'linkDocumentCommunication',
      'archiveDocument'
    ],
    fixtureOverride: 'documentFixture',
    fixtureValidator: validateCoreDocumentServiceEvidenceFixture
  },
  {
    requirementId: 'must-service-evidence-service',
    serviceType: 'evidence-service',
    domainId: 'evidence',
    contractId: 'core-service-evidence-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/evidence-service.md',
    operations: CORE_EVIDENCE_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_EVIDENCE_MINIMUM_CAPABILITIES,
    unresolved: [
      'updateEvidence',
      'unlinkEvidenceSource',
      'linkEvidenceTrademark',
      'linkEvidenceBrand',
      'linkEvidenceClassification',
      'linkEvidenceMatter',
      'linkEvidenceJurisdiction',
      'archiveEvidence'
    ],
    fixtureOverride: 'evidenceFixture',
    fixtureValidator: validateCoreEvidenceServiceEvidenceFixture
  }
] as const satisfies readonly ExpectedServiceEvidence[];

function issue(
  code: string,
  message: string,
  path?: string
): CoreServiceBehaviorValidationIssue {
  return { code, message, path };
}

function sameValues(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  return (
    actual.length === expected.length &&
    expected.every((value, index) => actual[index] === value)
  );
}

function readFixture(
  path: string
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync(path, 'utf8')) as unknown
    };
  } catch {
    return { ok: false };
  }
}

export function validateCoreServiceBehaviorEvidence(
  options: CoreServiceBehaviorValidationOptions = {}
): readonly CoreServiceBehaviorValidationIssue[] {
  const evidence = options.evidence ?? CORE_SERVICE_BEHAVIOR_EVIDENCE;
  const issues: CoreServiceBehaviorValidationIssue[] = [];
  const actualRequirementIds = evidence.map((entry) => entry.requirementId);
  const expectedRequirementIds = expectedEvidence.map(
    (entry) => entry.requirementId
  );
  if (!sameValues(actualRequirementIds, expectedRequirementIds)) {
    issues.push(
      issue(
        evidence.length < expectedEvidence.length
          ? 'core.service.evidence_missing'
          : 'core.service.evidence_extra',
        'Service behavior evidence must contain exactly Customer, Brand, Trademark, Jurisdiction, Classification, Document, and Evidence entries in canonical order.',
        'evidence'
      )
    );
  }
  if (new Set(actualRequirementIds).size !== actualRequirementIds.length) {
    issues.push(
      issue(
        'core.service.evidence_extra',
        'Service behavior evidence requirement IDs must be unique.',
        'evidence'
      )
    );
  }

  expectedEvidence.forEach((expected, index) => {
    const entry = evidence[index];
    if (!entry) return;
    const contract = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (candidate) => candidate.id === entry.contractId
    );
    if (
      entry.requirementId !== expected.requirementId ||
      entry.contractId !== expected.contractId ||
      !contract
    ) {
      issues.push(
        issue(
          'core.service.contract_mismatch',
          `${expected.serviceType} evidence must use its real requirement and contract.`,
          `evidence[${index}].contractId`
        )
      );
    }
    if (
      entry.domainId !== expected.domainId ||
      contract?.domainId !== expected.domainId
    ) {
      issues.push(
        issue(
          'core.service.domain_mismatch',
          `${expected.serviceType} evidence Domain is incorrect.`,
          `evidence[${index}].domainId`
        )
      );
    }
    if (
      entry.serviceType !== expected.serviceType ||
      contract?.serviceType !== expected.serviceType
    ) {
      issues.push(
        issue(
          'core.service.cross_service_evidence',
          `${expected.serviceType} evidence must not be reused by another Service.`,
          `evidence[${index}].serviceType`
        )
      );
    }
    if (entry.sourcePath !== expected.sourcePath) {
      issues.push(
        issue(
          'core.service.contract_mismatch',
          `${expected.serviceType} evidence source path is incorrect.`,
          `evidence[${index}].sourcePath`
        )
      );
    }
    if (entry.currentDepth !== 'level_2_3') {
      issues.push(
        issue(
          'core.service.depth_mismatch',
          `${expected.serviceType} evidence depth must be level_2_3.`,
          `evidence[${index}].currentDepth`
        )
      );
    }
    if (!sameValues(entry.operations, expected.operations)) {
      issues.push(
        issue(
          'core.service.operation_missing',
          `${expected.serviceType} operations must exactly match the locked operations.`,
          `evidence[${index}].operations`
        )
      );
    }
    if (!sameValues(entry.provenMinimumCapabilities, expected.capabilities)) {
      issues.push(
        issue(
          'core.service.capability_missing',
          `${expected.serviceType} capabilities must exactly match Section 5.3 minimum capabilities.`,
          `evidence[${index}].provenMinimumCapabilities`
        )
      );
    }
    if (!sameValues(entry.unresolvedServiceOperations, expected.unresolved)) {
      issues.push(
        issue(
          'core.service.operation_extra',
          `${expected.serviceType} unresolved operations must match the locked set.`,
          `evidence[${index}].unresolvedServiceOperations`
        )
      );
    }

    for (const [field, paths] of [
      ['implementationFiles', entry.implementationFiles],
      ['testFiles', entry.testFiles],
      ['fixtureFiles', entry.fixtureFiles]
    ] as const) {
      if (paths.length === 0 || paths.some((path) => !existsSync(path))) {
        issues.push(
          issue(
            'core.service.evidence_missing',
            `${expected.serviceType} evidence ${field} must exist.`,
            `evidence[${index}].${field}`
          )
        );
      }
    }

    const fixturePath = entry.fixtureFiles[0];
    if (!fixturePath) {
      issues.push(
        issue(
          'core.service.fixture_invalid',
          `${expected.serviceType} fixture is missing.`,
          `evidence[${index}].fixtureFiles`
        )
      );
      return;
    }
    const override = options[expected.fixtureOverride];
    const fixtureResult =
      override === undefined
        ? readFixture(fixturePath)
        : { ok: true as const, value: override };
    if (!fixtureResult.ok) {
      issues.push(
        issue(
          'core.service.fixture_invalid',
          `${expected.serviceType} fixture cannot be parsed safely.`,
          `evidence[${index}].fixtureFiles[0]`
        )
      );
      return;
    }
    const fixtureIssues = expected.fixtureValidator(fixtureResult.value);
    if (fixtureIssues.length > 0) {
      issues.push(
        issue(
          'core.service.fixture_invalid',
          `${expected.serviceType} executable fixture failed: ${fixtureIssues
            .map((entry) => entry.code)
            .join(', ')}`,
          `evidence[${index}].fixtureFiles[0]`
        )
      );
    }
  });

  return issues;
}
