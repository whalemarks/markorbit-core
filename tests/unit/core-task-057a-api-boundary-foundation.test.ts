import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  CORE_API_CONTRACT_VERSION,
  CORE_API_VERSION,
  CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
  CORE_TASK_057A_API_BOUNDARY_SPECS,
  CoreGovernedApiBoundary,
  validateCoreApiBoundaryEvidence,
  validateCoreGovernedApiBoundarySpecs,
  type CoreGovernedApiBoundarySpec,
  type CoreGovernedApiOperationSpec,
  type CoreGovernedApiRequest,
  type CoreGovernedApiServiceInvocation,
  type CoreGovernedApiServicePort
} from '../../src/index.ts';
import type { CoreBehaviorResult } from '../../src/behaviors/core-safe-error.ts';

const correlationId = 'corr-core-task-057a-001';

function valueFor(field: string): unknown {
  if (field === 'objectRecord') return { publicReferenceId: 'object-ref-001' };
  if (field === 'publicReferenceRecord')
    return { referenceId: 'public-ref-001' };
  if (
    field === 'metadata' ||
    field === 'permissionDecision' ||
    field === 'aiContext'
  )
    return {};
  if (
    field === 'organizationLinks' ||
    field === 'restrictedFields' ||
    field === 'requiredPolicyScopes'
  )
    return ['scope-ref-001'];
  if (
    field.startsWith('include') ||
    field.endsWith('Required') ||
    field === 'aiInitiated'
  )
    return false;
  if (field.toLowerCase().includes('reference'))
    return `${field.replaceAll(/[^A-Za-z0-9]/g, '-').toLowerCase()}-001`;
  if (field === 'actorType') return 'Identity';
  if (field === 'identityType') return 'Human';
  if (field === 'organizationType') return 'InternalOrganization';
  if (field === 'userType') return 'InternalUser';
  if (field === 'permissionType') return 'ActionPermission';
  if (field === 'policyType') return 'OperationPolicy';
  if (
    field === 'identityStatus' ||
    field === 'organizationStatus' ||
    field === 'policyStatus' ||
    field === 'status' ||
    field === 'targetStatus' ||
    field === 'nextStatus'
  )
    return 'Active';
  if (field === 'linkType') return 'Member';
  if (field === 'action') return 'Read';
  if (field === 'effect') return 'Allow';
  if (field === 'resourceType' || field === 'targetObjectType')
    return 'identity';
  if (field === 'requestingDomain') return 'identity';
  if (field === 'requestingService')
    return 'core-service-identity-resolution-service-contract';
  if (field === 'intendedOperation') return 'identity.read';
  return `${field}-value`;
}

function payloadFor(
  operation: CoreGovernedApiOperationSpec
): Record<string, unknown> {
  return Object.fromEntries(
    operation.requiredPayloadFields.map((field) => [field, valueFor(field)])
  );
}

function requestFor(
  spec: CoreGovernedApiBoundarySpec,
  operation: CoreGovernedApiOperationSpec,
  payload = payloadFor(operation)
): CoreGovernedApiRequest {
  const targetReference =
    operation.referenceFields
      .map((field) => payload[field])
      .find((value): value is string => typeof value === 'string') ??
    `${spec.domainId}-target-ref-001`;
  return {
    apiVersion: CORE_API_VERSION,
    contractVersion: CORE_API_CONTRACT_VERSION,
    correlationId,
    operation: operation.apiOperation,
    idempotencyKey: operation.duplicateSensitive
      ? `idem-${spec.domainId}-${operation.apiOperation}-001`
      : null,
    payload,
    governance: {
      permission: {
        actorReferenceId: 'identity-actor-ref-001',
        intendedOperation: operation.governanceOperation,
        requiredPermissionKeys: [operation.requiredPermissionKey],
        permissionDecisionReferenceId: 'permission-decision-ref-001',
        permissionDecision: 'Allowed',
        correlationId
      },
      policy: {
        intendedOperation: operation.governanceOperation,
        requiredPolicyScopes: [operation.requiredPolicyScope],
        policyDecisionReferenceId: 'policy-decision-ref-001',
        policyDecision: 'Allowed',
        restrictedFieldsOmitted: true,
        correlationId
      },
      review: {
        humanReviewRequired: false,
        humanReviewReferenceId: null,
        reviewStatus: null,
        reviewScope: null,
        reviewDecision: null,
        reviewerUserReferenceId: null,
        targetObjectType: `${spec.domainId}-record`,
        targetObjectReferenceId: targetReference
      },
      audit: {
        operationName: operation.governanceOperation,
        operationCategory: operation.operationCategory,
        actorReferenceId: 'identity-actor-ref-001',
        targetObjectType: `${spec.domainId}-record`,
        targetObjectReferenceId: targetReference,
        permissionDecisionReferenceId: 'permission-decision-ref-001',
        policyDecisionReferenceId: 'policy-decision-ref-001',
        humanReviewReferenceId: null,
        correlationId
      },
      auditContextReferenceId: 'audit-context-ref-001',
      authorizedOrganizationReferenceId: 'organization-ref-001'
    }
  };
}

class RecordingService implements CoreGovernedApiServicePort {
  readonly invocations: CoreGovernedApiServiceInvocation[] = [];

  constructor(
    readonly serviceContractId: string,
    readonly result: CoreBehaviorResult<unknown> = {
      ok: true,
      value: { publicReferenceId: 'safe-result-ref-001' }
    }
  ) {}

  invoke(invocation: CoreGovernedApiServiceInvocation) {
    this.invocations.push(invocation);
    return this.result;
  }
}

describe('CORE-TASK-057A governed API boundaries', () => {
  it('locks five exact API boundaries and all required capabilities', () => {
    assert.deepEqual(
      validateCoreGovernedApiBoundarySpecs(CORE_TASK_057A_API_BOUNDARY_SPECS),
      []
    );
    assert.deepEqual(validateCoreApiBoundaryEvidence(), []);
    assert.equal(CORE_TASK_057A_API_BOUNDARY_SPECS.length, 5);
    const evidence057a = CORE_API_BOUNDARY_EVIDENCE.filter((entry) =>
      CORE_TASK_057A_API_BOUNDARY_SPECS.some(
        (spec) => spec.domainId === entry.domainId
      )
    );
    assert.equal(evidence057a.length, 5);
    for (const evidence of evidence057a) {
      assert.deepEqual(
        evidence.provenCapabilities,
        CORE_GOVERNED_API_REQUIRED_CAPABILITIES
      );
      assert.deepEqual(evidence.unresolvedCapabilities, []);
      assert.equal(evidence.directDomainMutation, false);
      assert.equal(evidence.directEventEmission, false);
    }
  });

  it('validates and delegates every locked operation only to its owning Service', () => {
    for (const spec of CORE_TASK_057A_API_BOUNDARY_SPECS) {
      const service = new RecordingService(spec.serviceContractId);
      const api = new CoreGovernedApiBoundary(spec, service);
      for (const operation of spec.operations) {
        const result = api.handle(requestFor(spec, operation));
        assert.equal(
          result.ok,
          true,
          `${spec.apiType}:${operation.apiOperation}`
        );
        if (!result.ok) continue;
        const invocation = service.invocations.at(-1);
        assert.equal(invocation?.serviceContractId, spec.serviceContractId);
        assert.equal(invocation?.serviceOperation, operation.serviceOperation);
        assert.equal(result.value.auditContext.directDomainMutation, false);
        assert.equal(result.value.auditContext.directEventEmission, false);
        assert.equal(Object.isFrozen(result.value), true);
      }
      assert.equal(service.invocations.length, spec.operations.length);
    }
  });

  it('fails closed for unsupported versions, operations and missing idempotency', () => {
    const spec = CORE_TASK_057A_API_BOUNDARY_SPECS[0];
    const create = spec.operations.find(
      (entry) => entry.apiOperation === 'create'
    )!;
    const service = new RecordingService(spec.serviceContractId);
    const api = new CoreGovernedApiBoundary(spec, service);
    const unsupported = api.handle({
      ...requestFor(spec, create),
      apiVersion: 'v2'
    });
    assert.equal(unsupported.ok, false);
    if (!unsupported.ok)
      assert.equal(unsupported.error.code, 'VersionUnsupported');
    const noIdempotency = api.handle({
      ...requestFor(spec, create),
      idempotencyKey: null
    });
    assert.equal(noIdempotency.ok, false);
    if (!noIdempotency.ok)
      assert.equal(noIdempotency.error.code, 'IdempotencyKeyRequired');
    const unsupportedOperation = api.handle({
      ...requestFor(spec, create),
      operation: 'emit-event'
    });
    assert.equal(unsupportedOperation.ok, false);
    assert.equal(service.invocations.length, 0);
  });

  it('rejects permission, policy and governance mismatches before Service delegation', () => {
    const spec = CORE_TASK_057A_API_BOUNDARY_SPECS[2];
    const get = spec.operations.find((entry) => entry.apiOperation === 'get')!;
    const service = new RecordingService(spec.serviceContractId);
    const api = new CoreGovernedApiBoundary(spec, service);
    const denied = requestFor(spec, get);
    const result = api.handle({
      ...denied,
      governance: {
        ...denied.governance,
        permission: {
          ...denied.governance.permission,
          permissionDecision: 'Denied'
        }
      }
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, 'PermissionDenied');
    assert.equal(service.invocations.length, 0);
  });

  it('proves API payloads cannot request direct Domain mutation or Event emission', () => {
    const spec = CORE_TASK_057A_API_BOUNDARY_SPECS[1];
    const get = spec.operations.find((entry) => entry.apiOperation === 'get')!;
    const service = new RecordingService(spec.serviceContractId);
    const api = new CoreGovernedApiBoundary(spec, service);
    for (const forbidden of ['domainMutation', 'emitEvent']) {
      const base = requestFor(spec, get);
      const result = api.handle({
        ...base,
        payload: { ...base.payload, [forbidden]: true }
      });
      assert.equal(result.ok, false);
    }
    assert.equal(service.invocations.length, 0);
  });

  it('rejects unsafe Service responses and normalizes safe Service errors', () => {
    const spec = CORE_TASK_057A_API_BOUNDARY_SPECS[4];
    const get = spec.operations.find((entry) => entry.apiOperation === 'get')!;
    const unsafe = new RecordingService(spec.serviceContractId, {
      ok: true,
      value: { stackTrace: 'internal details' }
    });
    const unsafeResult = new CoreGovernedApiBoundary(spec, unsafe).handle(
      requestFor(spec, get)
    );
    assert.equal(unsafeResult.ok, false);
    if (!unsafeResult.ok)
      assert.equal(unsafeResult.error.code, 'RestrictedFieldViolation');

    const failed = new RecordingService(spec.serviceContractId, {
      ok: false,
      error: {
        code: 'PolicyRestricted',
        category: 'Policy',
        message: 'Policy restricts this operation.',
        safeDetail: null,
        retryable: false,
        correlationId: null
      }
    });
    const failedResult = new CoreGovernedApiBoundary(spec, failed).handle(
      requestFor(spec, get)
    );
    assert.equal(failedResult.ok, false);
    if (!failedResult.ok) {
      assert.equal(failedResult.error.code, 'PolicyRestricted');
      assert.equal(failedResult.error.correlationId, correlationId);
      assert.equal('stack' in failedResult.error, false);
    }
  });

  it('cannot be configured with a foreign Service, direct mutation or direct emission', () => {
    const spec = CORE_TASK_057A_API_BOUNDARY_SPECS[0];
    assert.throws(
      () =>
        new CoreGovernedApiBoundary(
          spec,
          new RecordingService(
            'core-service-policy-evaluation-service-contract'
          )
        ),
      /owning Service/
    );
    const unsafeMutation = {
      ...spec,
      directDomainMutation: true
    } as unknown as CoreGovernedApiBoundarySpec;
    assert.throws(
      () =>
        new CoreGovernedApiBoundary(
          unsafeMutation,
          new RecordingService(spec.serviceContractId)
        ),
      /must not mutate Domain state/
    );
    const unsafeEmission = {
      ...spec,
      directEventEmission: true
    } as unknown as CoreGovernedApiBoundarySpec;
    assert.throws(
      () =>
        new CoreGovernedApiBoundary(
          unsafeEmission,
          new RecordingService(spec.serviceContractId)
        ),
      /must not emit Domain Events/
    );
  });
});
