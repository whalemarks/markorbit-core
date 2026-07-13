export {
  CORE_CUSTOMER_COLLECTION_TARGET,
  CORE_CUSTOMER_IMPLEMENTED_OPERATIONS,
  CORE_CUSTOMER_MINIMUM_CAPABILITIES,
  CORE_CUSTOMER_STATUSES,
  CORE_CUSTOMER_STATUS_TO_OBJECT_STATUS,
  CORE_CUSTOMER_TYPES,
  CoreInMemoryCustomerServiceStore
} from './core-customer-service.ts';
export type {
  CoreCustomerEventTracePort,
  CoreCustomerGovernanceContext,
  CoreCustomerListSummary,
  CoreCustomerReferenceValidationResult,
  CoreCustomerServiceRecord,
  CoreCustomerStatus,
  CoreCustomerType
} from './core-customer-service.ts';
export {
  CoreCustomerService
} from './core-customer-service-guarded.ts';
export type {
  CoreCustomerServiceDependencies,
  CoreCustomerServiceStore
} from './core-customer-service-guarded.ts';
