import { existsSync, readFileSync } from 'node:fs';
import {
  CORE_IDENTITY_IMPLEMENTED_OPERATIONS,
  CORE_IDENTITY_MINIMUM_CAPABILITIES
} from '../services/identity/index.ts';
import {
  CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS,
  CORE_ORGANIZATION_MINIMUM_CAPABILITIES
} from '../services/organization/index.ts';
import {
  CORE_USER_IMPLEMENTED_OPERATIONS,
  CORE_USER_MINIMUM_CAPABILITIES
} from '../services/user/index.ts';
import {
  CORE_PERMISSION_IMPLEMENTED_OPERATIONS,
  CORE_PERMISSION_MINIMUM_CAPABILITIES
} from '../services/permission/index.ts';
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
import { validateCoreBrandServiceEvidenceFixture } from './core-brand-service-evidence-fixture.ts';
import { validateCoreCustomerServiceEvidenceFixture } from './core-customer-service-evidence-fixture.ts';
import { validateCoreTrademarkServiceEvidenceFixture } from './core-trademark-service-evidence-fixture.ts';
import { validateCoreJurisdictionServiceEvidenceFixture } from './core-jurisdiction-service-evidence-fixture.ts';
import { validateCoreClassificationServiceEvidenceFixture } from './core-classification-service-evidence-fixture.ts';
import { validateCoreDocumentServiceEvidenceFixture } from './core-document-service-evidence-fixture.ts';
import { validateCoreEvidenceServiceEvidenceFixture } from './core-evidence-service-evidence-fixture.ts';
import { validateCoreMatterServiceExecutionContainerFoundationFixture } from '../validation/core-matter-service-fixture-validation.ts';
import { validateCoreOrderServiceCommercialRequestFoundationFixture } from '../validation/core-order-service-fixture-validation.ts';
import { validateCoreOpportunityServicePotentialDemandFoundationFixture } from '../validation/core-opportunity-service-fixture-validation.ts';
import { validateCoreWorkflowContractServiceExecutionStructureFoundationFixture } from '../validation/core-workflow-contract-service-fixture-validation.ts';
import { validateCoreTaskServiceActionableWorkFoundationFixture } from '../validation/core-task-service-fixture-validation.ts';
import { validateCoreEventServiceGovernedOccurrenceFoundationFixture } from '../validation/core-event-service-fixture-validation.ts';
import { validateCoreCommunicationServiceGovernedCommunicationFoundationFixture } from '../validation/core-communication-service-fixture-validation.ts';
import { validateCoreIdentityServiceAuthorityFoundationFixture } from '../validation/core-identity-service-fixture-validation.ts';
import { validateCoreOrganizationServiceOperatingContextFoundationFixture } from '../validation/core-organization-service-fixture-validation.ts';
import { validateCoreUserServiceAccountParticipantFoundationFixture } from '../validation/core-user-service-fixture-validation.ts';
import { validateCorePermissionServiceGovernedGrantFoundationFixture } from '../validation/core-permission-service-fixture-validation.ts';
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
  readonly identityFixture?: unknown;
  readonly organizationFixture?: unknown;
  readonly userFixture?: unknown;
  readonly permissionFixture?: unknown;
  readonly customerFixture?: unknown;
  readonly brandFixture?: unknown;
  readonly trademarkFixture?: unknown;
  readonly jurisdictionFixture?: unknown;
  readonly classificationFixture?: unknown;
  readonly documentFixture?: unknown;
  readonly evidenceFixture?: unknown;
  readonly matterFixture?: unknown;
  readonly orderFixture?: unknown;
  readonly opportunityFixture?: unknown;
  readonly workflowContractFixture?: unknown;
  readonly taskFixture?: unknown;
  readonly eventFixture?: unknown;
  readonly communicationFixture?: unknown;
}

interface ExpectedServiceEvidence {
  readonly requirementId: string;
  readonly serviceType: string;
  readonly domainId:
    | 'identity'
    | 'organization'
    | 'user'
    | 'permission'
    | 'customer'
    | 'brand'
    | 'trademark'
    | 'jurisdiction'
    | 'classification'
    | 'document'
    | 'evidence'
    | 'matter'
    | 'order'
    | 'opportunity'
    | 'workflow-contract'
    | 'task'
    | 'event'
    | 'communication';
  readonly contractId: string;
  readonly sourcePath: string;
  readonly operations: readonly string[];
  readonly capabilities: readonly string[];
  readonly unresolved: readonly string[];
  readonly fixtureOverride:
    | 'identityFixture'
    | 'organizationFixture'
    | 'userFixture'
    | 'permissionFixture'
    | 'customerFixture'
    | 'brandFixture'
    | 'trademarkFixture'
    | 'jurisdictionFixture'
    | 'classificationFixture'
    | 'documentFixture'
    | 'evidenceFixture'
    | 'matterFixture'
    | 'orderFixture'
    | 'opportunityFixture'
    | 'workflowContractFixture'
    | 'taskFixture'
    | 'eventFixture'
    | 'communicationFixture';
  readonly fixtureValidator: (
    fixture: unknown
  ) => readonly { readonly code: string }[];
}

const expectedEvidence = [
  {
    requirementId: 'must-service-identity-service',
    serviceType: 'identity-resolution-service',
    domainId: 'identity',
    contractId: 'core-service-identity-resolution-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/identity-service.md',
    operations: CORE_IDENTITY_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_IDENTITY_MINIMUM_CAPABILITIES,
    unresolved: ['unlinkIdentity'],
    fixtureOverride: 'identityFixture',
    fixtureValidator: (fixture) =>
      validateCoreIdentityServiceAuthorityFoundationFixture(fixture).issues
  },
  {
    requirementId: 'must-service-organization-service',
    serviceType: 'organization-service',
    domainId: 'organization',
    contractId: 'core-service-organization-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/organization-service.md',
    operations: CORE_ORGANIZATION_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_ORGANIZATION_MINIMUM_CAPABILITIES,
    unresolved: [],
    fixtureOverride: 'organizationFixture',
    fixtureValidator: (fixture) =>
      validateCoreOrganizationServiceOperatingContextFoundationFixture(fixture)
        .issues
  },
  {
    requirementId: 'must-service-user-service',
    serviceType: 'user-service',
    domainId: 'user',
    contractId: 'core-service-user-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/user-service.md',
    operations: CORE_USER_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_USER_MINIMUM_CAPABILITIES,
    unresolved: ['unlinkUserIdentity'],
    fixtureOverride: 'userFixture',
    fixtureValidator: (fixture) =>
      validateCoreUserServiceAccountParticipantFoundationFixture(fixture).issues
  },
  {
    requirementId: 'must-service-permission-service',
    serviceType: 'permission-evaluation-service',
    domainId: 'permission',
    contractId: 'core-service-permission-evaluation-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/permission-service.md',
    operations: CORE_PERMISSION_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_PERMISSION_MINIMUM_CAPABILITIES,
    unresolved: [
      'actorGroupPermission',
      'fullRoleInheritance',
      'externalIamIntegration'
    ],
    fixtureOverride: 'permissionFixture',
    fixtureValidator: (fixture) =>
      validateCorePermissionServiceGovernedGrantFoundationFixture(fixture)
        .issues
  },
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
      'unlinkEvidenceSource',
      'linkEvidenceMatter',
      'linkEvidenceJurisdiction'
    ],
    fixtureOverride: 'evidenceFixture',
    fixtureValidator: validateCoreEvidenceServiceEvidenceFixture
  },
  {
    requirementId: 'must-service-matter-service',
    serviceType: 'matter-service',
    domainId: 'matter',
    contractId: 'core-service-matter-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/matter-service.md',
    operations: CORE_MATTER_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_MATTER_MINIMUM_CAPABILITIES,
    unresolved: [
      'linkMatterCommunication',
      'linkMatterJurisdiction',
      'linkMatterClassification',
      'linkMatterParticipant',
      'archiveMatter'
    ],
    fixtureOverride: 'matterFixture',
    fixtureValidator: (fixture) =>
      validateCoreMatterServiceExecutionContainerFoundationFixture(fixture)
        .issues
  },
  {
    requirementId: 'must-service-order-service',
    serviceType: 'order-service',
    domainId: 'order',
    contractId: 'core-service-order-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/order-service.md',
    operations: CORE_ORDER_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_ORDER_MINIMUM_CAPABILITIES,
    unresolved: [
      'linkOrderJurisdiction',
      'linkOrderClassification',
      'linkOrderDocument',
      'linkOrderCommunication',
      'archiveOrder'
    ],
    fixtureOverride: 'orderFixture',
    fixtureValidator: (fixture) =>
      validateCoreOrderServiceCommercialRequestFoundationFixture(fixture).issues
  },
  {
    requirementId: 'stub-service-opportunity-service',
    serviceType: 'opportunity-service',
    domainId: 'opportunity',
    contractId: 'core-service-opportunity-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/opportunity-service.md',
    operations: CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_OPPORTUNITY_MINIMUM_CAPABILITIES,
    unresolved: [
      'linkOpportunityJurisdiction',
      'linkOpportunityClassification',
      'linkOpportunityKnowledge',
      'linkOpportunityPartner',
      'scoreOpportunity',
      'forecastOpportunity'
    ],
    fixtureOverride: 'opportunityFixture',
    fixtureValidator: (fixture) =>
      validateCoreOpportunityServicePotentialDemandFoundationFixture(fixture)
        .issues
  },
  {
    requirementId: 'must-service-workflow-contract-service',
    serviceType: 'workflow-contract-service',
    domainId: 'workflow-contract',
    contractId: 'core-service-workflow-contract-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/workflow-contract-service.md',
    operations: CORE_WORKFLOW_CONTRACT_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_WORKFLOW_CONTRACT_MINIMUM_CAPABILITIES,
    unresolved: [],
    fixtureOverride: 'workflowContractFixture',
    fixtureValidator: (fixture) =>
      validateCoreWorkflowContractServiceExecutionStructureFoundationFixture(
        fixture
      ).issues
  },
  {
    requirementId: 'must-service-task-service',
    serviceType: 'task-service',
    domainId: 'task',
    contractId: 'core-service-task-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/task-service.md',
    operations: CORE_TASK_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_TASK_MINIMUM_CAPABILITIES,
    unresolved: [],
    fixtureOverride: 'taskFixture',
    fixtureValidator: (fixture) =>
      validateCoreTaskServiceActionableWorkFoundationFixture(fixture).issues
  },
  {
    requirementId: 'must-service-event-service',
    serviceType: 'event-service',
    domainId: 'event',
    contractId: 'core-service-event-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/event-service.md',
    operations: CORE_EVENT_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_EVENT_MINIMUM_CAPABILITIES,
    unresolved: ['replayEventReference'],
    fixtureOverride: 'eventFixture',
    fixtureValidator: (fixture) =>
      validateCoreEventServiceGovernedOccurrenceFoundationFixture(fixture)
        .issues
  },
  {
    requirementId: 'must-service-communication-service',
    serviceType: 'communication-reference-service',
    domainId: 'communication',
    contractId: 'core-service-communication-reference-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/services/communication-service.md',
    operations: CORE_COMMUNICATION_IMPLEMENTED_OPERATIONS,
    capabilities: CORE_COMMUNICATION_MINIMUM_CAPABILITIES,
    unresolved: [
      'unlinkCommunicationParticipant',
      'linkCommunicationTask',
      'linkCommunicationEvidence'
    ],
    fixtureOverride: 'communicationFixture',
    fixtureValidator: (fixture) =>
      validateCoreCommunicationServiceGovernedCommunicationFoundationFixture(
        fixture
      ).issues
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
        'Service behavior evidence must contain exactly Identity, Organization, User, Permission, Customer, Brand, Trademark, Jurisdiction, Classification, Document, Evidence, Matter, Order, Opportunity, Workflow Contract, Task, Event, and Communication entries in canonical order.',
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
