import { existsSync, readFileSync } from 'node:fs';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../contracts/index.ts';
import {
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES
} from '../services/customer/index.ts';
import { validateCoreCustomerServiceEvidenceFixture } from './core-customer-service-evidence-fixture.ts';
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
}

const expectedUnresolved = [
  'updateCustomer',
  'linkCustomerContact',
  'unlinkCustomerContact',
  'linkCustomerBrand',
  'unlinkCustomerBrand',
  'linkCustomerOpportunity',
  'linkCustomerOrder',
  'linkCustomerMatter'
] as const;

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

function readCustomerFixture(path: string):
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false } {
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
  if (evidence.length === 0) {
    return [
      issue(
        'core.service.evidence_missing',
        'Customer Service behavior evidence is missing.'
      )
    ];
  }
  if (evidence.length !== 1) {
    issues.push(
      issue(
        'core.service.evidence_extra',
        'Exactly one CORE-TASK-036 Service behavior evidence entry is allowed.',
        'evidence'
      )
    );
  }

  const entry = evidence[0];
  if (!entry) return issues;
  const contract = CORE_SERVICE_CONTRACT_SKELETONS.find(
    (candidate) => candidate.id === entry.contractId
  );
  if (
    entry.requirementId !== 'must-service-customer-service' ||
    entry.contractId !== 'core-service-customer-service-contract' ||
    !contract
  ) {
    issues.push(
      issue(
        'core.service.contract_mismatch',
        'Customer Service evidence must use the real Customer Service requirement and contract.',
        'contractId'
      )
    );
  }
  if (entry.domainId !== 'customer' || contract?.domainId !== 'customer') {
    issues.push(
      issue(
        'core.service.domain_mismatch',
        'Customer Service evidence Domain must be customer.',
        'domainId'
      )
    );
  }
  if (
    entry.serviceType !== 'customer-service' ||
    contract?.serviceType !== 'customer-service'
  ) {
    issues.push(
      issue(
        'core.service.cross_service_evidence',
        'Customer Service evidence must not be reused by another Service.',
        'serviceType'
      )
    );
  }
  if (
    entry.sourcePath !==
    'books/book-02-core-specification/core-specs/services/customer-service.md'
  ) {
    issues.push(
      issue(
        'core.service.contract_mismatch',
        'Customer Service evidence source path is incorrect.',
        'sourcePath'
      )
    );
  }
  if (entry.currentDepth !== 'level_2_3') {
    issues.push(
      issue(
        'core.service.depth_mismatch',
        'Customer Service evidence depth must be level_2_3.',
        'currentDepth'
      )
    );
  }
  if (!sameValues(entry.operations, CORE_CUSTOMER_IMPLEMENTED_OPERATIONS)) {
    issues.push(
      issue(
        'core.service.operation_missing',
        'Customer Service operations must exactly match the locked five operations.',
        'operations'
      )
    );
  }
  if (
    !sameValues(
      entry.provenMinimumCapabilities,
      CORE_CUSTOMER_MINIMUM_CAPABILITIES
    )
  ) {
    issues.push(
      issue(
        'core.service.capability_missing',
        'Customer Service capabilities must exactly match Section 5.3 minimum capabilities.',
        'provenMinimumCapabilities'
      )
    );
  }
  if (!sameValues(entry.unresolvedServiceOperations, expectedUnresolved)) {
    issues.push(
      issue(
        'core.service.operation_extra',
        'Customer unresolved operations must exactly match the locked unresolved set.',
        'unresolvedServiceOperations'
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
          `Evidence ${field} must exist.`,
          field
        )
      );
    }
  }

  const fixturePath = entry.fixtureFiles[0];
  if (!fixturePath) {
    issues.push(
      issue(
        'core.service.fixture_invalid',
        'Customer Service fixture is missing.',
        'fixtureFiles'
      )
    );
    return issues;
  }

  const fixtureResult =
    options.customerFixture === undefined
      ? readCustomerFixture(fixturePath)
      : { ok: true as const, value: options.customerFixture };
  if (!fixtureResult.ok) {
    issues.push(
      issue(
        'core.service.fixture_invalid',
        'Customer Service fixture cannot be parsed safely.',
        'fixtureFiles[0]'
      )
    );
    return issues;
  }

  const fixtureIssues = validateCoreCustomerServiceEvidenceFixture(
    fixtureResult.value
  );
  if (fixtureIssues.length > 0) {
    issues.push(
      issue(
        'core.service.fixture_invalid',
        `Customer Service executable fixture failed: ${fixtureIssues
          .map((entry) => entry.code)
          .join(', ')}`,
        'fixtureFiles[0]'
      )
    );
  }

  return issues;
}
