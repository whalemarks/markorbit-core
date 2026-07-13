import type { CoreDomainId } from '../domains/index.ts';
import { CORE_CUSTOMER_IMPLEMENTED_OPERATIONS, CORE_CUSTOMER_MINIMUM_CAPABILITIES } from '../services/customer/index.ts';

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
    sourcePath: 'books/book-02-core-specification/core-specs/services/customer-service.md',
    currentDepth: 'level_2_3',
    operations: CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
    provenMinimumCapabilities: CORE_CUSTOMER_MINIMUM_CAPABILITIES,
    unresolvedServiceOperations: ['updateCustomer', 'linkCustomerContact', 'unlinkCustomerContact', 'linkCustomerBrand', 'unlinkCustomerBrand', 'linkCustomerOpportunity', 'linkCustomerOrder', 'linkCustomerMatter'],
    implementationFiles: ['src/services/customer/core-customer-service.ts'],
    testFiles: ['tests/unit/core-customer-service-core-lifecycle.test.ts'],
    fixtureFiles: ['fixtures/services/core-customer-service-core-lifecycle.fixture.json']
  }
] as const satisfies readonly CoreServiceBehaviorEvidence[];
