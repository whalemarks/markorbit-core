import {
  enforceCoreGovernedAction,
  type CoreBehaviorResult,
  type CoreReferenceRecord,
  createCoreSafeError
} from '../../behaviors/index.ts';
import {
  CoreCustomerService as BaseCoreCustomerService,
  type CoreCustomerGovernanceContext,
  type CoreCustomerServiceDependencies as BaseCoreCustomerServiceDependencies,
  type CoreCustomerServiceRecord,
  type CoreCustomerServiceStore as BaseCoreCustomerServiceStore
} from './core-customer-service.ts';

const CUSTOMER_SERVICE_CONTRACT_ID = 'core-service-customer-service-contract';
const CUSTOMER_OBJECT_TYPE = 'customer-record';
const CUSTOMER_DOMAIN = 'customer';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

export interface CoreCustomerServiceStore
  extends BaseCoreCustomerServiceStore {
  remove(customerReferenceId: string): CoreBehaviorResult<null>;
}

export interface CoreCustomerServiceDependencies
  extends Omit<BaseCoreCustomerServiceDependencies, 'store'> {
  readonly store: CoreCustomerServiceStore;
}

type CreateCustomerInput = Parameters<
  BaseCoreCustomerService['createCustomer']
>[0];
type ChangeCustomerStatusInput = Parameters<
  BaseCoreCustomerService['changeCustomerStatus']
>[0];

function internal<T>(correlationId?: string | null): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({
      code: 'InternalError',
      category: 'Internal',
      message: 'Customer Service dependency failed safely.',
      correlationId
    })
  };
}

function invalidReference<T>(
  correlationId?: string | null
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({
      code: 'InvalidCustomerReference',
      category: 'Reference',
      message: 'Customer reference is invalid.',
      correlationId
    })
  };
}

function policyRestricted<T>(
  correlationId?: string | null
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({
      code: 'PolicyRestricted',
      category: 'Policy',
      message: 'Customer organization scope is not authorized.',
      correlationId
    })
  };
}

interface GovernanceExpectation {
  readonly operation: string;
  readonly permission: string;
  readonly policyScope: string;
  readonly target: string;
}

function validateGovernance(
  context: CoreCustomerGovernanceContext,
  expected: GovernanceExpectation
): CoreBehaviorResult<null> {
  const correlationId = context.correlationId;
  if (
    context.permission.correlationId !== correlationId ||
    context.policy.correlationId !== correlationId ||
    context.audit.correlationId !== correlationId
  ) {
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'ValidationFailed',
        category: 'Validation',
        message: 'Correlation IDs must match.',
        correlationId
      })
    };
  }
  if (
    context.permission.intendedOperation !== expected.operation ||
    !context.permission.requiredPermissionKeys.includes(expected.permission)
  ) {
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'PermissionDenied',
        category: 'Permission',
        message: 'Required permission is missing.',
        correlationId
      })
    };
  }
  if (
    context.policy.intendedOperation !== expected.operation ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope)
  ) {
    return policyRestricted(correlationId);
  }
  if (
    context.permission.actorReferenceId !== context.audit.actorReferenceId ||
    context.permission.permissionDecisionReferenceId !==
      context.audit.permissionDecisionReferenceId ||
    context.policy.policyDecisionReferenceId !==
      context.audit.policyDecisionReferenceId
  ) {
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'AuditContextMissing',
        category: 'Validation',
        message: 'Governance audit linkage is invalid.',
        correlationId
      })
    };
  }
  if (
    context.review.targetObjectType !== CUSTOMER_OBJECT_TYPE ||
    context.review.targetObjectReferenceId !== expected.target
  ) {
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'HumanReviewRequired',
        category: 'HumanReview',
        message: 'Human Review target is invalid.',
        correlationId
      })
    };
  }
  if (
    context.review.humanReviewRequired &&
    context.review.humanReviewReferenceId !==
      context.audit.humanReviewReferenceId
  ) {
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'HumanReviewRequired',
        category: 'HumanReview',
        message: 'Human Review audit linkage is invalid.',
        correlationId
      })
    };
  }
  if (
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== CUSTOMER_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return {
      ok: false,
      error: createCoreSafeError({
        code: 'AuditContextMissing',
        category: 'Validation',
        message: 'Audit context is missing.',
        correlationId
      })
    };
  }
  const governed = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  return governed.ok ? { ok: true, value: null } : governed;
}

function organizationScopeOf(record: {
  readonly visibility?: {
    readonly organizationScopeReferenceId?: string | null;
  };
}): string | null {
  return record.visibility?.organizationScopeReferenceId ?? null;
}

function validateOrganizationScope(
  governance: CoreCustomerGovernanceContext,
  expectedScope: string | null
): CoreBehaviorResult<null> {
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return policyRestricted(governance.correlationId);
  }
  return { ok: true, value: null };
}

function referenceMatches(
  supplied: CoreReferenceRecord,
  registered: CoreReferenceRecord
): boolean {
  return (
    supplied.referenceId === registered.referenceId &&
    supplied.objectType === registered.objectType &&
    supplied.referenceDomain === registered.referenceDomain &&
    supplied.status === registered.status
  );
}

function idempotencyScope(
  governance: CoreCustomerGovernanceContext,
  operation: string
): string {
  return [
    `${CUSTOMER_SERVICE_CONTRACT_ID}:guarded`,
    operation,
    governance.authorizedOrganizationReferenceId ??
      governance.permission.actorReferenceId ??
      'anonymous'
  ].join('|');
}

export class CoreCustomerService extends BaseCoreCustomerService {
  constructor(dependencies: CoreCustomerServiceDependencies) {
    super(dependencies);
  }

  createCustomer(
    input: CreateCustomerInput
  ): CoreBehaviorResult<CoreCustomerServiceRecord> {
    const governance = validateGovernance(input.governance, {
      operation: 'customer.create',
      permission: 'customer:create',
      policyScope: 'customer.write',
      target: input.objectRecord.publicReferenceId
    });
    if (!governance.ok) return governance;

    const scope = validateOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;

    const dependencies = this.deps as CoreCustomerServiceDependencies;
    const registered = dependencies.relatedReferenceRegistry.resolve({
      referenceId: input.publicReferenceRecord.referenceId,
      expectedObjectType: CUSTOMER_OBJECT_TYPE,
      expectedDomain: CUSTOMER_DOMAIN
    });
    if (
      !registered.ok ||
      input.objectRecord.publicReferenceId !==
        input.publicReferenceRecord.referenceId ||
      !referenceMatches(input.publicReferenceRecord, registered.value)
    ) {
      return invalidReference(input.governance.correlationId);
    }

    const idempotent = dependencies.idempotencyRegistry.executeBehavior<
      {
        readonly objectRecord: CreateCustomerInput['objectRecord'];
        readonly publicReferenceRecord: CoreReferenceRecord;
        readonly customerType: CreateCustomerInput['customerType'];
        readonly customerStatus: CreateCustomerInput['customerStatus'];
        readonly nameReference: string;
        readonly sourceReference: string;
      },
      CoreCustomerServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'createCustomer'
        ),
        operationName: 'createCustomerGuarded',
        request: {
          objectRecord: input.objectRecord,
          publicReferenceRecord: input.publicReferenceRecord,
          customerType: input.customerType,
          customerStatus: input.customerStatus,
          nameReference: input.nameReference,
          sourceReference: input.sourceReference
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        try {
          return super.createCustomer(input);
        } catch {
          return internal<CoreCustomerServiceRecord>(
            input.governance.correlationId
          );
        }
      }
    );
    return idempotent.ok
      ? { ok: true, value: idempotent.value.result }
      : idempotent;
  }

  changeCustomerStatus(
    input: ChangeCustomerStatusInput
  ): CoreBehaviorResult<CoreCustomerServiceRecord> {
    const governance = validateGovernance(input.governance, {
      operation: 'customer.change_status',
      permission: 'customer:change_status',
      policyScope: 'customer.lifecycle',
      target: input.customerReferenceId
    });
    if (!governance.ok) return governance;

    const dependencies = this.deps as CoreCustomerServiceDependencies;
    const reference = dependencies.relatedReferenceRegistry.resolve({
      referenceId: input.customerReferenceId,
      expectedObjectType: CUSTOMER_OBJECT_TYPE,
      expectedDomain: CUSTOMER_DOMAIN
    });
    if (!reference.ok) {
      return invalidReference(input.governance.correlationId);
    }
    const existing = dependencies.store.get(input.customerReferenceId);
    if (!existing) {
      return {
        ok: false,
        error: createCoreSafeError({
          code: 'CustomerNotFound',
          category: 'Reference',
          message: 'Customer was not found.',
          correlationId: input.governance.correlationId
        })
      };
    }
    const scope = validateOrganizationScope(
      input.governance,
      organizationScopeOf(existing.objectRecord)
    );
    if (!scope.ok) return scope;

    const idempotent = dependencies.idempotencyRegistry.executeBehavior<
      {
        readonly customerReferenceId: string;
        readonly targetStatus: ChangeCustomerStatusInput['targetStatus'];
        readonly reasonReference: string | null;
      },
      CoreCustomerServiceRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'changeCustomerStatus'
        ),
        operationName: 'changeCustomerStatusGuarded',
        request: {
          customerReferenceId: input.customerReferenceId,
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        try {
          return super.changeCustomerStatus(input);
        } catch {
          return internal<CoreCustomerServiceRecord>(
            input.governance.correlationId
          );
        }
      }
    );
    return idempotent.ok
      ? { ok: true, value: idempotent.value.result }
      : idempotent;
  }
}
