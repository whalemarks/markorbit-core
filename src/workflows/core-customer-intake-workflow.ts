import { createHash } from 'node:crypto';
import {
  CORE_API_CONTRACT_VERSION,
  CORE_API_VERSION,
  CoreGovernedApiBoundary,
  type CoreGovernedApiContext,
  type CoreGovernedApiSuccessResponse
} from '../api/index.ts';
import { CORE_GOVERNED_API_BOUNDARY_SPECS } from '../api/core-governed-api-specs.ts';
import { CORE_TASK_057C_API_BOUNDARY_SPECS } from '../api/core-governed-api-specs-057c.ts';
import { enforceCoreGovernedAction } from '../behaviors/core-governance-behavior.ts';
import { CoreIdempotencyRegistry } from '../behaviors/core-idempotency-behavior.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreErrorCode
} from '../behaviors/core-safe-error.ts';

export const CORE_CUSTOMER_INTAKE_WORKFLOW_ID =
  'must-workflow-customer-intake-workflow' as const;
export const CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_ID =
  'core-workflow-customer-intake-workflow-contract' as const;
export const CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_VERSION = 'v0.1.0' as const;
export const CORE_CUSTOMER_INTAKE_WORKFLOW_PLAN_VERSION =
  'customer-intake-preview-plan:v1' as const;

export interface CustomerIntakeGovernanceContext extends CoreGovernedApiContext {
  readonly correlationId: string;
}
export interface CustomerIntakeInput {
  readonly customer: Readonly<Record<string, unknown>>;
  readonly brand?: Readonly<Record<string, unknown>> | null;
  readonly taskPlan?: Readonly<Record<string, unknown>> | null;
  readonly organizationReferenceId: string;
  readonly actorReferenceId: string;
}
export interface CustomerIntakePreviewRequest {
  readonly workflowContractVersion: string;
  readonly input: CustomerIntakeInput;
  readonly governance: CustomerIntakeGovernanceContext;
  readonly validUntil: string;
}
export interface CustomerIntakeApplyRequest {
  readonly previewId: string;
  readonly previewVersion: string;
  readonly previewDigest: string;
  readonly governance: CustomerIntakeGovernanceContext;
  readonly idempotencyKey: string;
}
export interface CustomerIntakePlanStep {
  readonly order: number;
  readonly owningApiOperation:
    'customer.create' | 'brand.create' | 'task.create';
  readonly serviceOperation: string;
  readonly requiresMutation: boolean;
}
export interface CustomerIntakePreview {
  readonly previewId: string;
  readonly workflowId: typeof CORE_CUSTOMER_INTAKE_WORKFLOW_ID;
  readonly workflowContractId: typeof CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_ID;
  readonly workflowContractVersion: typeof CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_VERSION;
  readonly planVersion: typeof CORE_CUSTOMER_INTAKE_WORKFLOW_PLAN_VERSION;
  readonly previewDigest: string;
  readonly validUntil: string;
  readonly requiredHumanReviewCheckpoints: readonly string[];
  readonly orderedExecutionPlan: readonly CustomerIntakePlanStep[];
  readonly owningApiOperations: readonly string[];
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface CustomerIntakeApplyResult {
  readonly previewId: string;
  readonly replayed: boolean;
  readonly consumed: boolean;
  readonly delegationOrder: readonly string[];
  readonly eventTraceReferences: readonly unknown[];
  readonly customerResult: unknown;
  readonly brandResult?: unknown;
  readonly taskPlanResult?: unknown;
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface CustomerIntakePreviewRecord extends CustomerIntakePreview {
  readonly canonicalInputDigest: string;
  readonly governanceDigest: string;
  readonly input: CustomerIntakeInput;
  readonly governance: CustomerIntakeGovernanceContext;
  readonly approvalState: 'Pending' | 'Approved' | 'Rejected';
  readonly consumed: boolean;
  readonly applyResult?: CustomerIntakeApplyResult;
}
export interface CustomerIntakePlanRegistry {
  register(
    record: CustomerIntakePreviewRecord
  ): CoreBehaviorResult<CustomerIntakePreviewRecord>;
  get(previewId: string): CustomerIntakePreviewRecord | undefined;
  approve(previewId: string): CoreBehaviorResult<CustomerIntakePreviewRecord>;
  reject(previewId: string): CoreBehaviorResult<CustomerIntakePreviewRecord>;
  consume(
    previewId: string,
    result: CustomerIntakeApplyResult
  ): CoreBehaviorResult<CustomerIntakePreviewRecord>;
}

type ApiPort = ConstructorParameters<typeof CoreGovernedApiBoundary>[1];
export interface CustomerIntakeWorkflowDeps {
  readonly customerApiService: ApiPort;
  readonly brandApiService: ApiPort;
  readonly taskApiService?: ApiPort;
  readonly planRegistry: CustomerIntakePlanRegistry;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly now: () => string;
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object')
    return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
    .join(',')}}`;
}
function digest(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`;
}
function safe<T>(
  code: CoreErrorCode,
  message: string,
  correlationId?: string | null
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({
      code,
      category:
        code === 'PermissionDenied'
          ? 'Permission'
          : code === 'PolicyRestricted'
            ? 'Policy'
            : code.startsWith('Idempotency')
              ? 'Idempotency'
              : code === 'HumanReviewRequired'
                ? 'HumanReview'
                : code.includes('Reference')
                  ? 'Reference'
                  : code.includes('Version')
                    ? 'Version'
                    : 'Validation',
      message,
      correlationId
    })
  };
}
function assertInput(
  input: CustomerIntakeInput,
  correlationId: string
): CoreBehaviorResult<null> {
  if (
    !input ||
    typeof input !== 'object' ||
    !input.customer ||
    typeof input.customer !== 'object'
  )
    return safe(
      'ValidationFailed',
      'Customer intake input is required.',
      correlationId
    );
  if (
    input.brand !== undefined &&
    input.brand !== null &&
    typeof input.brand !== 'object'
  )
    return safe(
      'ValidationFailed',
      'Brand intake input is invalid.',
      correlationId
    );
  if (
    input.organizationReferenceId !==
    (
      (input.customer.objectRecord as Record<string, unknown>).visibility as
        Record<string, unknown> | undefined
    )?.organizationScopeReferenceId
  )
    return safe(
      'ValidationFailed',
      'Organization scope does not match Customer intake.',
      correlationId
    );
  return { ok: true, value: null };
}
function validatePreviewGovernance(
  request: CustomerIntakePreviewRequest
): CoreBehaviorResult<null> {
  if (
    request.governance.authorizedOrganizationReferenceId !==
    request.input.organizationReferenceId
  )
    return safe(
      'PolicyRestricted',
      'Organization scope is not authorized.',
      request.governance.correlationId
    );
  if (
    request.governance.permission.actorReferenceId !==
    request.input.actorReferenceId
  )
    return safe(
      'PermissionDenied',
      'Actor scope does not match Permission context.',
      request.governance.correlationId
    );
  const governed = enforceCoreGovernedAction(request.governance);
  return governed.ok ? { ok: true, value: null } : governed;
}
function plan(input: CustomerIntakeInput): readonly CustomerIntakePlanStep[] {
  const steps: CustomerIntakePlanStep[] = [
    {
      order: 1,
      owningApiOperation: 'customer.create',
      serviceOperation: 'createCustomer',
      requiresMutation: true
    }
  ];
  if (input.brand)
    steps.push({
      order: 2,
      owningApiOperation: 'brand.create',
      serviceOperation: 'createBrand',
      requiresMutation: true
    });
  if (input.taskPlan)
    steps.push({
      order: steps.length + 1,
      owningApiOperation: 'task.create',
      serviceOperation: 'createTask',
      requiresMutation: false
    });
  return Object.freeze(steps);
}

export class CoreInMemoryCustomerIntakePlanRegistry implements CustomerIntakePlanRegistry {
  readonly #records = new Map<string, CustomerIntakePreviewRecord>();
  register(record: CustomerIntakePreviewRecord) {
    const existing = this.#records.get(record.previewId);
    if (existing)
      return existing.previewDigest === record.previewDigest
        ? { ok: true as const, value: existing }
        : safe<CustomerIntakePreviewRecord>(
            'IdempotencyConflict',
            'Preview was already registered.',
            record.governance.correlationId
          );
    const frozen = structuredClone(record);
    this.#records.set(record.previewId, frozen);
    return { ok: true as const, value: frozen };
  }
  get(previewId: string) {
    return this.#records.get(previewId);
  }
  approve(previewId: string) {
    const record = this.get(previewId);
    if (!record)
      return safe<CustomerIntakePreviewRecord>(
        'ReferenceNotFound',
        'Preview was not found.'
      );
    const next = { ...record, approvalState: 'Approved' as const };
    this.#records.set(previewId, next);
    return { ok: true as const, value: next };
  }
  reject(previewId: string) {
    const record = this.get(previewId);
    if (!record)
      return safe<CustomerIntakePreviewRecord>(
        'ReferenceNotFound',
        'Preview was not found.'
      );
    const next = { ...record, approvalState: 'Rejected' as const };
    this.#records.set(previewId, next);
    return { ok: true as const, value: next };
  }
  consume(previewId: string, result: CustomerIntakeApplyResult) {
    const record = this.get(previewId);
    if (!record)
      return safe<CustomerIntakePreviewRecord>(
        'ReferenceNotFound',
        'Preview was not found.'
      );
    if (record.consumed)
      return safe<CustomerIntakePreviewRecord>(
        'IdempotencyConflict',
        'Preview was already consumed.',
        record.governance.correlationId
      );
    const next = { ...record, consumed: true, applyResult: result };
    this.#records.set(previewId, next);
    return { ok: true as const, value: next };
  }
}

export class CustomerIntakeWorkflow {
  readonly #customerApi: CoreGovernedApiBoundary;
  readonly #brandApi: CoreGovernedApiBoundary;
  readonly #taskApi?: CoreGovernedApiBoundary;
  constructor(readonly deps: CustomerIntakeWorkflowDeps) {
    const customerSpec = CORE_GOVERNED_API_BOUNDARY_SPECS.find(
      (s) => s.domainId === 'customer'
    )!;
    const brandSpec = CORE_GOVERNED_API_BOUNDARY_SPECS.find(
      (s) => s.domainId === 'brand'
    )!;
    const taskSpec = CORE_TASK_057C_API_BOUNDARY_SPECS.find(
      (s) => s.domainId === 'task'
    )!;
    this.#customerApi = new CoreGovernedApiBoundary(
      customerSpec,
      deps.customerApiService
    );
    this.#brandApi = new CoreGovernedApiBoundary(
      brandSpec,
      deps.brandApiService
    );
    if (deps.taskApiService)
      this.#taskApi = new CoreGovernedApiBoundary(
        taskSpec,
        deps.taskApiService
      );
  }
  previewCustomerIntake(
    request: CustomerIntakePreviewRequest
  ): CoreBehaviorResult<CustomerIntakePreview> {
    if (
      request.workflowContractVersion !==
      CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_VERSION
    )
      return safe(
        'VersionUnsupported',
        'Workflow contract version is unsupported.',
        request.governance?.correlationId
      );
    const inputOk = assertInput(
      request.input,
      request.governance.correlationId
    );
    if (!inputOk.ok) return inputOk;
    const gov = validatePreviewGovernance(request);
    if (!gov.ok) return gov;
    const expires = Date.parse(request.validUntil);
    if (!Number.isFinite(expires) || expires <= Date.parse(this.deps.now()))
      return safe(
        'ValidationFailed',
        'Preview validity boundary must be in the future.',
        request.governance.correlationId
      );
    const steps = plan(request.input);
    const body = {
      input: request.input,
      governance: request.governance,
      steps,
      validUntil: request.validUntil,
      version: CORE_CUSTOMER_INTAKE_WORKFLOW_PLAN_VERSION
    };
    const previewDigest = digest(body);
    const previewId = `preview:${previewDigest.slice(7, 31)}`;
    const preview: CustomerIntakePreviewRecord = {
      previewId,
      workflowId: CORE_CUSTOMER_INTAKE_WORKFLOW_ID,
      workflowContractId: CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_ID,
      workflowContractVersion: CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_VERSION,
      planVersion: CORE_CUSTOMER_INTAKE_WORKFLOW_PLAN_VERSION,
      previewDigest,
      validUntil: request.validUntil,
      requiredHumanReviewCheckpoints: request.governance.review
        .humanReviewRequired
        ? ['customer-intake.apply']
        : [],
      orderedExecutionPlan: steps,
      owningApiOperations: steps.map((s) => s.owningApiOperation),
      directDomainMutation: false,
      directEventEmission: false,
      canonicalInputDigest: digest(request.input),
      governanceDigest: digest(request.governance),
      input: request.input,
      governance: request.governance,
      approvalState: request.governance.review.humanReviewRequired
        ? 'Pending'
        : 'Approved',
      consumed: false
    };
    const stored = this.deps.planRegistry.register(preview);
    return stored.ok
      ? {
          ok: true,
          value: (({
            canonicalInputDigest: _a,
            governanceDigest: _b,
            input: _c,
            governance: _d,
            approvalState: _e,
            consumed: _f,
            applyResult: _g,
            ...publicPreview
          }) => publicPreview)(stored.value)
        }
      : stored;
  }
  applyCustomerIntake(
    request: CustomerIntakeApplyRequest
  ): CoreBehaviorResult<CustomerIntakeApplyResult> {
    const record = this.deps.planRegistry.get(request.previewId);
    if (!record)
      return safe(
        'ReferenceNotFound',
        'Preview was not found.',
        request.governance.correlationId
      );
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: request.idempotencyKey,
        idempotencyScope: `${record.input.organizationReferenceId}:customer-intake`,
        operationName: 'applyCustomerIntake',
        request: {
          previewId: request.previewId,
          previewVersion: request.previewVersion,
          previewDigest: request.previewDigest,
          governanceDigest: digest(request.governance)
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: request.governance.correlationId
      },
      () => this.#applyOnce(record, request)
    );
    return run.ok
      ? {
          ok: true,
          value: { ...run.value.result, replayed: run.value.replayed }
        }
      : run;
  }
  #applyOnce(
    record: CustomerIntakePreviewRecord,
    request: CustomerIntakeApplyRequest
  ): CoreBehaviorResult<CustomerIntakeApplyResult> {
    if (record.consumed)
      return safe(
        'IdempotencyConflict',
        'Preview was already consumed.',
        request.governance.correlationId
      );
    if (request.previewVersion !== record.planVersion)
      return safe(
        'VersionUnsupported',
        'Preview version is stale or unsupported.',
        request.governance.correlationId
      );
    if (request.previewDigest !== record.previewDigest)
      return safe(
        'ValidationFailed',
        'Preview digest does not match.',
        request.governance.correlationId
      );
    if (Date.parse(record.validUntil) <= Date.parse(this.deps.now()))
      return safe(
        'ValidationFailed',
        'Preview has expired.',
        request.governance.correlationId
      );
    if (record.governanceDigest !== digest(request.governance))
      return safe(
        'ValidationFailed',
        'Governance context differs from preview.',
        request.governance.correlationId
      );
    if (record.approvalState !== 'Approved')
      return safe(
        'HumanReviewRequired',
        record.approvalState === 'Rejected'
          ? 'Human review was rejected.'
          : 'Human review approval is required.',
        request.governance.correlationId
      );
    const delegationOrder: string[] = [];
    const eventTraceReferences: unknown[] = [];
    const call = (
      api: CoreGovernedApiBoundary,
      domain: 'customer' | 'brand' | 'task',
      operation: 'create',
      payload: Readonly<Record<string, unknown>>,
      key: string
    ): CoreBehaviorResult<CoreGovernedApiSuccessResponse> => {
      const objectRecord = payload.objectRecord as
        { readonly publicReferenceId?: string } | undefined;
      const target = objectRecord?.publicReferenceId ?? `${domain}:pending`;
      const governance = {
        ...request.governance,
        permission: {
          ...request.governance.permission,
          intendedOperation: `${domain}.create`,
          requiredPermissionKeys: [`${domain}:create`]
        },
        policy: {
          ...request.governance.policy,
          intendedOperation: `${domain}.create`,
          requiredPolicyScopes: [`${domain}.write`]
        },
        review: {
          ...request.governance.review,
          targetObjectType: `${domain}-record`,
          targetObjectReferenceId: target
        },
        audit: {
          ...request.governance.audit,
          operationName: `${domain}.create`,
          operationCategory: 'Create',
          targetObjectType: `${domain}-record`,
          targetObjectReferenceId: target
        }
      };
      return api.handle({
        apiVersion: CORE_API_VERSION,
        contractVersion: CORE_API_CONTRACT_VERSION,
        correlationId: request.governance.correlationId,
        operation,
        idempotencyKey: key,
        payload,
        governance
      });
    };
    const customer = call(
      this.#customerApi,
      'customer',
      'create',
      record.input.customer,
      `${request.idempotencyKey}:customer`
    );
    if (!customer.ok) return customer;
    delegationOrder.push('customer.create');
    eventTraceReferences.push(customer.value.auditContext);
    let brandResult: unknown;
    if (record.input.brand) {
      const brand = call(
        this.#brandApi,
        'brand',
        'create',
        record.input.brand,
        `${request.idempotencyKey}:brand`
      );
      if (!brand.ok) return brand;
      delegationOrder.push('brand.create');
      eventTraceReferences.push(brand.value.auditContext);
      brandResult = brand.value.result;
    }
    let taskPlanResult: unknown;
    if (record.input.taskPlan && this.#taskApi) {
      const task = call(
        this.#taskApi,
        'task',
        'create',
        record.input.taskPlan,
        `${request.idempotencyKey}:task`
      );
      if (!task.ok) return task;
      delegationOrder.push('task.create');
      eventTraceReferences.push(task.value.auditContext);
      taskPlanResult = task.value.result;
    }
    const result: CustomerIntakeApplyResult = {
      previewId: record.previewId,
      replayed: false,
      consumed: true,
      delegationOrder,
      eventTraceReferences,
      customerResult: customer.value.result,
      brandResult,
      taskPlanResult,
      directDomainMutation: false,
      directEventEmission: false
    };
    const consumed = this.deps.planRegistry.consume(record.previewId, result);
    return consumed.ok ? { ok: true, value: result } : consumed;
  }
}

export const CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE = Object.freeze({
  requirementId: 'customer-intake-workflow-supports-preview-apply',
  workflowId: CORE_CUSTOMER_INTAKE_WORKFLOW_ID,
  workflowType: 'bounded-customer-intake-workflow',
  workflowContractId: CORE_CUSTOMER_INTAKE_WORKFLOW_CONTRACT_ID,
  implementationTask: 'CORE-TASK-058A',
  sourcePath: 'src/workflows/core-customer-intake-workflow.ts',
  currentDepth: 'meets_required_depth',
  previewSupported: true,
  applySupported: true,
  deterministicPreview: true,
  previewDigestRequired: true,
  previewVersionRequired: true,
  humanReviewRequired: true,
  permissionPolicyPreserved: true,
  idempotencyRequired: true,
  owningApiDelegation: ['customer.create', 'brand.create', 'task.create'],
  directDomainMutation: false,
  directEventEmission: false,
  implementationFiles: ['src/workflows/core-customer-intake-workflow.ts'],
  testFiles: [
    'tests/unit/core-task-058a-customer-intake-workflow.test.ts',
    'tests/unit/core-task-058a-book-02-workflow-evidence.test.ts',
    'tests/fixtures/core-task-058a-customer-intake-workflow-fixture.test.ts'
  ],
  fixtureFiles: [
    'fixtures/workflows/core-task-058a-customer-intake-workflow.fixture.json'
  ],
  provenCapabilities: [
    'preview',
    'apply',
    'deterministic digest',
    'human review gate',
    'idempotency replay',
    'owning API delegation',
    'trace-only event references'
  ],
  unresolvedCapabilities: [
    'trademark-application-workflow',
    'communication-review-workflow',
    'production preview persistence'
  ]
});
