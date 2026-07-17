import { createHash } from 'node:crypto';
import {
  CORE_API_CONTRACT_VERSION,
  CORE_API_VERSION,
  CoreGovernedApiBoundary,
  type CoreGovernedApiContext
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

export const CORE_TRADEMARK_APPLICATION_WORKFLOW_ID =
  'must-workflow-trademark-application-workflow' as const;
export const CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_ID =
  'core-workflow-trademark-application-workflow-contract' as const;
export const CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_VERSION =
  'v0.1.0' as const;
export const CORE_TRADEMARK_APPLICATION_WORKFLOW_PLAN_VERSION =
  'trademark-application-preview-plan:v1' as const;

export interface TrademarkApplicationGovernanceContext extends CoreGovernedApiContext {
  readonly correlationId: string;
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
export type TrademarkApplicationStepOperation =
  | 'customer.validate-reference'
  | 'brand.validate-reference'
  | 'jurisdiction.validate-reference'
  | 'classification.validate-items'
  | 'document.validate-reference'
  | 'evidence.validate-reference'
  | 'matter.validate-reference'
  | 'order.validate-reference'
  | 'trademark.create'
  | 'trademark.link-classifications'
  | 'trademark.link-documents'
  | 'trademark.link-evidence'
  | 'matter.create'
  | 'matter.link-trademark'
  | 'matter.link-order'
  | 'task.create';

export interface TrademarkApplicationInput {
  readonly customerReferenceId: string;
  readonly brandReferenceId: string;
  readonly brandCustomerReferenceId?: string | null;
  readonly jurisdictionReferenceId: string;
  readonly classificationItems: readonly {
    readonly classificationReferenceId: string;
    readonly classNumber: number;
    readonly goodsServices: readonly string[];
  }[];
  readonly trademark?: Readonly<Record<string, unknown>> | null;
  readonly existingTrademarkReferenceId?: string | null;
  readonly documentReferenceIds: readonly string[];
  readonly evidenceReferenceIds: readonly string[];
  readonly matter?: Readonly<Record<string, unknown>> | null;
  readonly existingMatterReferenceId?: string | null;
  readonly orderReferenceId?: string | null;
  readonly taskPlan?: Readonly<Record<string, unknown>> | null;
  readonly organizationReferenceId: string;
  readonly actorReferenceId: string;
}

export interface TrademarkApplicationPlanStep {
  readonly order: number;
  readonly owningApiOperation: TrademarkApplicationStepOperation;
  readonly serviceOperation: string;
  readonly requiresMutation: boolean;
}
export interface TrademarkApplicationPreview {
  readonly previewId: string;
  readonly workflowId: typeof CORE_TRADEMARK_APPLICATION_WORKFLOW_ID;
  readonly workflowContractId: typeof CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_ID;
  readonly workflowContractVersion: typeof CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_VERSION;
  readonly planVersion: typeof CORE_TRADEMARK_APPLICATION_WORKFLOW_PLAN_VERSION;
  readonly previewDigest: string;
  readonly validUntil: string;
  readonly requiredHumanReviewCheckpoints: readonly string[];
  readonly orderedExecutionPlan: readonly TrademarkApplicationPlanStep[];
  readonly owningApiOperations: readonly string[];
  readonly validationOnlyOperations: readonly string[];
  readonly mutationOperations: readonly string[];
  readonly optionalSkippedOperations: readonly string[];
  readonly planExecutionInvariant: string;
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface TrademarkApplicationApplyResult {
  readonly previewId: string;
  readonly replayed: boolean;
  readonly consumed: boolean;
  readonly delegationOrder: readonly string[];
  readonly eventTraceReferences: readonly string[];
  readonly completedDelegationTrace: readonly string[];
  readonly trademarkReferenceId?: string;
  readonly matterReferenceId?: string;
  readonly trademarkResult?: unknown;
  readonly matterResult?: unknown;
  readonly taskPlanResult?: unknown;
  readonly safePartialFailure?: boolean;
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface TrademarkApplicationPreviewRequest {
  readonly workflowContractVersion: string;
  readonly input: TrademarkApplicationInput;
  readonly governance: TrademarkApplicationGovernanceContext;
  readonly validUntil: string;
}
export interface TrademarkApplicationApplyRequest {
  readonly previewId: string;
  readonly previewVersion: string;
  readonly previewDigest: string;
  readonly governance: TrademarkApplicationGovernanceContext;
  readonly idempotencyKey: string;
}
export interface TrademarkApplicationPreviewRecord extends TrademarkApplicationPreview {
  readonly canonicalInputDigest: string;
  readonly governanceDigest: string;
  readonly input: TrademarkApplicationInput;
  readonly governance: TrademarkApplicationGovernanceContext;
  readonly approvalState: 'Pending' | 'Approved' | 'Rejected';
  readonly consumed: boolean;
  readonly applyResult?: TrademarkApplicationApplyResult;
}
export interface TrademarkApplicationPlanRegistry {
  register(
    record: TrademarkApplicationPreviewRecord
  ): CoreBehaviorResult<TrademarkApplicationPreviewRecord>;
  get(previewId: string): TrademarkApplicationPreviewRecord | undefined;
  approve(
    previewId: string
  ): CoreBehaviorResult<TrademarkApplicationPreviewRecord>;
  reject(
    previewId: string
  ): CoreBehaviorResult<TrademarkApplicationPreviewRecord>;
  consume(
    previewId: string,
    result: TrademarkApplicationApplyResult
  ): CoreBehaviorResult<TrademarkApplicationPreviewRecord>;
}

type ApiPort = ConstructorParameters<typeof CoreGovernedApiBoundary>[1];
export interface TrademarkApplicationWorkflowDeps {
  readonly customerApiService: ApiPort;
  readonly brandApiService: ApiPort;
  readonly jurisdictionApiService: ApiPort;
  readonly classificationApiService: ApiPort;
  readonly documentApiService: ApiPort;
  readonly evidenceApiService: ApiPort;
  readonly trademarkApiService: ApiPort;
  readonly matterApiService?: ApiPort;
  readonly orderApiService?: ApiPort;
  readonly taskApiService?: ApiPort;
  readonly planRegistry: TrademarkApplicationPlanRegistry;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly now: () => string;
}

const svc: Record<TrademarkApplicationStepOperation, string> = {
  'customer.validate-reference': 'validateCustomerReference',
  'brand.validate-reference': 'validateBrandReference',
  'jurisdiction.validate-reference': 'validateJurisdictionReference',
  'classification.validate-items': 'validateClassificationItems',
  'document.validate-reference': 'validateDocumentReference',
  'evidence.validate-reference': 'validateEvidenceReference',
  'matter.validate-reference': 'validateMatterReference',
  'order.validate-reference': 'validateOrderReference',
  'trademark.create': 'createTrademark',
  'trademark.link-classifications': 'linkTrademarkClassifications',
  'trademark.link-documents': 'linkTrademarkDocuments',
  'trademark.link-evidence': 'linkTrademarkEvidence',
  'matter.create': 'createMatter',
  'matter.link-trademark': 'linkMatterTrademark',
  'matter.link-order': 'linkMatterOrder',
  'task.create': 'createTask'
};
function ref(v: unknown) {
  return (
    typeof v === 'string' &&
    /^[A-Za-z][A-Za-z0-9:_./-]{2,127}$/.test(v) &&
    !/database|raw|primary/i.test(v)
  );
}
function assertInput(
  input: TrademarkApplicationInput,
  c: string
): CoreBehaviorResult<null> {
  if (!input || typeof input !== 'object')
    return safe(
      'ValidationFailed',
      'Trademark Application input is required.',
      c
    );
  for (const f of [
    'customerReferenceId',
    'brandReferenceId',
    'jurisdictionReferenceId',
    'organizationReferenceId',
    'actorReferenceId'
  ] as const)
    if (!ref(input[f]))
      return safe(
        'ReferenceInvalid',
        `${f} must be a governed public reference.`,
        c
      );
  if (
    input.brandCustomerReferenceId &&
    input.brandCustomerReferenceId !== input.customerReferenceId
  )
    return safe(
      'InvalidBrandCustomerReference',
      'Brand reference is not valid for the Customer reference.',
      c
    );
  if (
    !Array.isArray(input.classificationItems) ||
    input.classificationItems.length === 0
  )
    return safe(
      'ReferenceInvalid',
      'Classification scope must not be empty.',
      c
    );
  const classes = new Set<number>();
  for (const item of input.classificationItems) {
    if (
      !ref(item.classificationReferenceId) ||
      !Number.isInteger(item.classNumber) ||
      item.classNumber < 1 ||
      item.classNumber > 45 ||
      !Array.isArray(item.goodsServices) ||
      item.goodsServices.length === 0 ||
      item.goodsServices.some(
        (x: unknown) => typeof x !== 'string' || x.trim() === ''
      )
    )
      return safe('ReferenceInvalid', 'Classification item is malformed.', c);
    if (classes.has(item.classNumber))
      return safe(
        'ValidationFailed',
        'Classification classes must be unique.',
        c
      );
    classes.add(item.classNumber);
  }
  for (const f of ['documentReferenceIds', 'evidenceReferenceIds'] as const)
    if (!Array.isArray(input[f]) || input[f].some((x: unknown) => !ref(x)))
      return safe(
        'ReferenceInvalid',
        `${f} must contain governed references.`,
        c
      );
  if (input.existingMatterReferenceId && !ref(input.existingMatterReferenceId))
    return safe('ReferenceInvalid', 'Matter reference is invalid.', c);
  if (input.orderReferenceId && !ref(input.orderReferenceId))
    return safe('ReferenceInvalid', 'Order reference is invalid.', c);
  if (
    input.existingTrademarkReferenceId &&
    !ref(input.existingTrademarkReferenceId)
  )
    return safe('ReferenceInvalid', 'Trademark reference is invalid.', c);
  if (
    !input.existingTrademarkReferenceId &&
    (!input.trademark || typeof input.trademark !== 'object')
  )
    return safe(
      'ValidationFailed',
      'Trademark creation payload is required when no existing Trademark reference is supplied.',
      c
    );
  return { ok: true, value: null };
}
function validatePreviewGovernance(
  request: TrademarkApplicationPreviewRequest
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
function plan(
  input: TrademarkApplicationInput
): readonly TrademarkApplicationPlanStep[] {
  const ops: TrademarkApplicationStepOperation[] = [
    'customer.validate-reference',
    'brand.validate-reference',
    'jurisdiction.validate-reference',
    'classification.validate-items',
    ...input.documentReferenceIds.map(
      () => 'document.validate-reference' as const
    ),
    ...input.evidenceReferenceIds.map(
      () => 'evidence.validate-reference' as const
    )
  ];
  if (input.existingTrademarkReferenceId)
    ops.push('trademark.link-classifications');
  else ops.push('trademark.create', 'trademark.link-classifications');
  if (input.documentReferenceIds.length) ops.push('trademark.link-documents');
  if (input.evidenceReferenceIds.length) ops.push('trademark.link-evidence');
  if (input.existingMatterReferenceId)
    ops.push('matter.validate-reference', 'matter.link-trademark');
  else if (input.matter) ops.push('matter.create', 'matter.link-trademark');
  if (input.orderReferenceId)
    ops.push(
      'order.validate-reference',
      ...(input.matter || input.existingMatterReferenceId
        ? ['matter.link-order' as const]
        : [])
    );
  if (input.taskPlan) ops.push('task.create');
  return ops.map((op, i) => ({
    order: i + 1,
    owningApiOperation: op,
    serviceOperation: svc[op],
    requiresMutation:
      !op.includes('validate') && !op.includes('classification.validate-items')
  }));
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readString(value: unknown, field: string): string | null {
  return isRecord(value) && typeof value[field] === 'string'
    ? value[field]
    : null;
}
function extractPublicReference(
  result: unknown,
  domain: string
): string | null {
  if (!isRecord(result)) return null;
  return (
    readString(result, `${domain}ReferenceId`) ??
    readString(result, 'publicReferenceId') ??
    readString(result.objectRecord, 'publicReferenceId') ??
    readString(
      isRecord(result.record) ? result.record.objectRecord : null,
      'publicReferenceId'
    )
  );
}
function extractEventTraceReferences(result: unknown): readonly string[] {
  if (!isRecord(result)) return [];
  const refs: string[] = [];
  const single = readString(result, 'eventReferenceId');
  if (single) refs.push(single);
  for (const field of ['eventReferences', 'eventTraceReferences'] as const) {
    const values = result[field];
    if (Array.isArray(values))
      refs.push(...values.filter((v): v is string => typeof v === 'string'));
  }
  return [...new Set(refs)];
}
export class CoreInMemoryTrademarkApplicationPlanRegistry implements TrademarkApplicationPlanRegistry {
  readonly #records = new Map<string, TrademarkApplicationPreviewRecord>();
  register(record: TrademarkApplicationPreviewRecord) {
    const existing = this.#records.get(record.previewId);
    if (existing)
      return existing.previewDigest === record.previewDigest
        ? { ok: true as const, value: existing }
        : safe<TrademarkApplicationPreviewRecord>(
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
      return safe<TrademarkApplicationPreviewRecord>(
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
      return safe<TrademarkApplicationPreviewRecord>(
        'ReferenceNotFound',
        'Preview was not found.'
      );
    const next = { ...record, approvalState: 'Rejected' as const };
    this.#records.set(previewId, next);
    return { ok: true as const, value: next };
  }
  consume(previewId: string, result: TrademarkApplicationApplyResult) {
    const record = this.get(previewId);
    if (!record)
      return safe<TrademarkApplicationPreviewRecord>(
        'ReferenceNotFound',
        'Preview was not found.'
      );
    if (record.consumed)
      return safe<TrademarkApplicationPreviewRecord>(
        'IdempotencyConflict',
        'Preview was already consumed.',
        record.governance.correlationId
      );
    const next = { ...record, consumed: true, applyResult: result };
    this.#records.set(previewId, next);
    return { ok: true as const, value: next };
  }
}

export class TrademarkApplicationWorkflow {
  readonly #apis = new Map<string, CoreGovernedApiBoundary>();
  constructor(readonly deps: TrademarkApplicationWorkflowDeps) {
    const all = [
      ...CORE_GOVERNED_API_BOUNDARY_SPECS,
      ...CORE_TASK_057C_API_BOUNDARY_SPECS
    ];
    for (const [domain, port] of Object.entries({
      customer: deps.customerApiService,
      brand: deps.brandApiService,
      jurisdiction: deps.jurisdictionApiService,
      classification: deps.classificationApiService,
      document: deps.documentApiService,
      evidence: deps.evidenceApiService,
      trademark: deps.trademarkApiService,
      matter: deps.matterApiService,
      order: deps.orderApiService,
      task: deps.taskApiService
    }))
      if (port) {
        const spec = all.find((s) => s.domainId === domain)!;
        this.#apis.set(domain, new CoreGovernedApiBoundary(spec, port));
      }
  }
  previewTrademarkApplication(
    request: TrademarkApplicationPreviewRequest
  ): CoreBehaviorResult<TrademarkApplicationPreview> {
    if (
      request.workflowContractVersion !==
      CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_VERSION
    )
      return safe(
        'VersionUnsupported',
        'Workflow contract version is unsupported.',
        request.governance?.correlationId
      );
    const ok = assertInput(request.input, request.governance.correlationId);
    if (!ok.ok) return ok;
    const gov = validatePreviewGovernance(request);
    if (!gov.ok) return gov;
    const steps = plan(request.input);
    for (const step of steps) {
      const domain = step.owningApiOperation.split('.')[0]!;
      if (!this.#apis.has(domain))
        return safe(
          'DownstreamServiceRequired',
          `Required ${domain} API boundary is unavailable.`,
          request.governance.correlationId
        );
    }
    const expires = Date.parse(request.validUntil);
    if (!Number.isFinite(expires) || expires <= Date.parse(this.deps.now()))
      return safe(
        'ValidationFailed',
        'Preview validity boundary must be in the future.',
        request.governance.correlationId
      );
    const body = {
      input: request.input,
      governance: request.governance,
      steps,
      validUntil: request.validUntil,
      version: CORE_TRADEMARK_APPLICATION_WORKFLOW_PLAN_VERSION
    };
    const previewDigest = digest(body);
    const previewId = `preview:${previewDigest.slice(7, 31)}`;
    const rec: TrademarkApplicationPreviewRecord = {
      previewId,
      workflowId: CORE_TRADEMARK_APPLICATION_WORKFLOW_ID,
      workflowContractId: CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_ID,
      workflowContractVersion:
        CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_VERSION,
      planVersion: CORE_TRADEMARK_APPLICATION_WORKFLOW_PLAN_VERSION,
      previewDigest,
      validUntil: request.validUntil,
      requiredHumanReviewCheckpoints: ['trademark-application.apply'],
      orderedExecutionPlan: steps,
      owningApiOperations: steps.map((s) => s.owningApiOperation),
      validationOnlyOperations: steps
        .filter((s) => !s.requiresMutation)
        .map((s) => s.owningApiOperation),
      mutationOperations: steps
        .filter((s) => s.requiresMutation)
        .map((s) => s.owningApiOperation),
      optionalSkippedOperations: [
        ...(request.input.taskPlan ? [] : ['task.create']),
        ...(request.input.matter || request.input.existingMatterReferenceId
          ? []
          : ['matter.create', 'matter.link-trademark'])
      ],
      planExecutionInvariant:
        'stored ordered Trademark Application plan equals canonical input plan and configured owning API boundaries before mutation and after delegation',
      directDomainMutation: false as const,
      directEventEmission: false as const,
      canonicalInputDigest: digest(request.input),
      governanceDigest: digest(request.governance),
      input: request.input,
      governance: request.governance,
      approvalState: 'Pending',
      consumed: false
    };
    const stored = this.deps.planRegistry.register(rec);
    if (!stored.ok) return stored;
    const {
      canonicalInputDigest: _,
      governanceDigest: __,
      input: ___,
      governance: ____,
      approvalState: _____,
      consumed: ______,
      applyResult: _______,
      ...pub
    } = stored.value;
    return { ok: true, value: pub };
  }
  applyTrademarkApplication(
    request: TrademarkApplicationApplyRequest
  ): CoreBehaviorResult<TrademarkApplicationApplyResult> {
    const record = this.deps.planRegistry.get(request.previewId);
    if (!record)
      return safe(
        'ReferenceNotFound',
        'Preview was not found.',
        request.governance.correlationId
      );
    const gov = validatePreviewGovernance({
      workflowContractVersion:
        CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_VERSION,
      input: record.input,
      governance: request.governance,
      validUntil: record.validUntil
    });
    if (!gov.ok) return gov;
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: request.idempotencyKey,
        idempotencyScope: `${record.input.organizationReferenceId}:trademark-application`,
        operationName: 'applyTrademarkApplication',
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
  #assertPlanCanExecute(
    record: TrademarkApplicationPreviewRecord,
    request: TrademarkApplicationApplyRequest
  ): CoreBehaviorResult<null> {
    const expected = plan(record.input);
    if (record.orderedExecutionPlan.length !== expected.length)
      return safe(
        'ValidationFailed',
        'Stored Trademark Application plan does not match preview input.',
        request.governance.correlationId
      );
    const seen = new Set<string>();
    for (let i = 0; i < expected.length; i++) {
      const a = record.orderedExecutionPlan[i],
        e = expected[i];
      if (
        !a ||
        a.order !== i + 1 ||
        a.owningApiOperation !== e.owningApiOperation ||
        a.serviceOperation !== e.serviceOperation ||
        a.requiresMutation !== e.requiresMutation
      )
        return safe(
          'ValidationFailed',
          'Stored Trademark Application plan order is malformed or unsupported.',
          request.governance.correlationId
        );
      const unique = `${a.order}:${a.owningApiOperation}`;
      if (
        seen.has(unique) ||
        (seen.has(a.owningApiOperation) &&
          !a.owningApiOperation.endsWith('validate-reference'))
      )
        return safe(
          'ValidationFailed',
          'Stored Trademark Application plan contains duplicate steps.',
          request.governance.correlationId
        );
      seen.add(unique);
      if (!this.#apis.has(a.owningApiOperation.split('.')[0]!))
        return safe(
          'DownstreamServiceRequired',
          'Stored Trademark Application plan requires an unavailable owning API boundary.',
          request.governance.correlationId
        );
    }
    return { ok: true, value: null };
  }
  #applyOnce(
    record: TrademarkApplicationPreviewRecord,
    request: TrademarkApplicationApplyRequest
  ): CoreBehaviorResult<TrademarkApplicationApplyResult> {
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
    const inv = this.#assertPlanCanExecute(record, request);
    if (!inv.ok) return inv;
    if (record.approvalState !== 'Approved')
      return safe(
        'HumanReviewRequired',
        record.approvalState === 'Rejected'
          ? 'Human review was rejected.'
          : 'Human review approval is required.',
        request.governance.correlationId
      );
    const delegationOrder: string[] = [];
    const events: string[] = [];
    let trademarkReferenceId =
      record.input.existingTrademarkReferenceId ?? undefined;
    let matterReferenceId = record.input.existingMatterReferenceId ?? undefined;
    let trademarkResult: unknown;
    let matterResult: unknown;
    let taskPlanResult: unknown;
    const call = (
      op: TrademarkApplicationStepOperation,
      payload: Readonly<Record<string, unknown>>
    ) => {
      const domain = op.split('.')[0]!;
      const api = this.#apis.get(domain)!;
      const apiOp = op.split('.')[1]!;
      const spec = [
        ...CORE_GOVERNED_API_BOUNDARY_SPECS,
        ...CORE_TASK_057C_API_BOUNDARY_SPECS
      ].find((entry) => entry.domainId === domain)!;
      const opSpec = spec.operations.find(
        (entry) => entry.apiOperation === apiOp
      )!;
      const governance = {
        ...request.governance,
        permission: {
          ...request.governance.permission,
          intendedOperation: opSpec.governanceOperation,
          requiredPermissionKeys: [opSpec.requiredPermissionKey]
        },
        policy: {
          ...request.governance.policy,
          intendedOperation: opSpec.governanceOperation,
          requiredPolicyScopes: [opSpec.requiredPolicyScope]
        },
        review: {
          ...request.governance.review,
          targetObjectType: `${domain}-record`,
          targetObjectReferenceId:
            (Object.values(payload).find(
              (v) => typeof v === 'string'
            ) as string) ?? `${domain}:pending`
        },
        audit: {
          ...request.governance.audit,
          operationName: opSpec.governanceOperation,
          operationCategory:
            apiOp.startsWith('validate') || apiOp === 'validate-items'
              ? 'Validate'
              : apiOp === 'create'
                ? 'Create'
                : 'Link',
          targetObjectType: `${domain}-record`,
          targetObjectReferenceId:
            (Object.values(payload).find(
              (v) => typeof v === 'string'
            ) as string) ?? `${domain}:pending`
        }
      };
      return api.handle({
        apiVersion: CORE_API_VERSION,
        contractVersion: CORE_API_CONTRACT_VERSION,
        correlationId: request.governance.correlationId,
        operation: apiOp,
        idempotencyKey: `${request.idempotencyKey}:${op}:${delegationOrder.length}`,
        payload,
        governance
      });
    };
    for (const step of record.orderedExecutionPlan) {
      let payload: Record<string, unknown>;
      const i = record.input;
      switch (step.owningApiOperation) {
        case 'customer.validate-reference':
          payload = {
            customerReferenceId: i.customerReferenceId,
            requestingDomain: 'workflow',
            requestingService: 'trademark-application'
          };
          break;
        case 'brand.validate-reference':
          payload = {
            brandReferenceId: i.brandReferenceId,
            requestingDomain: 'workflow',
            requestingService: 'trademark-application'
          };
          break;
        case 'jurisdiction.validate-reference':
          payload = {
            jurisdictionReferenceId: i.jurisdictionReferenceId,
            requestingDomain: 'workflow',
            requestingService: 'trademark-application'
          };
          break;
        case 'classification.validate-items':
          payload = {
            jurisdictionReferenceId: i.jurisdictionReferenceId,
            items: i.classificationItems
          };
          break;
        case 'document.validate-reference':
          payload = {
            documentReferenceId:
              i.documentReferenceIds[
                delegationOrder.filter(
                  (x) => x === 'document.validate-reference'
                ).length
              ],
            requestingDomain: 'workflow',
            requestingService: 'trademark-application'
          };
          break;
        case 'evidence.validate-reference':
          payload = {
            evidenceReferenceId:
              i.evidenceReferenceIds[
                delegationOrder.filter(
                  (x) => x === 'evidence.validate-reference'
                ).length
              ],
            requestingDomain: 'workflow',
            requestingService: 'trademark-application'
          };
          break;
        case 'matter.validate-reference':
          payload = {
            matterReferenceId: i.existingMatterReferenceId!,
            requestingDomain: 'workflow',
            requestingService: 'trademark-application'
          };
          break;
        case 'order.validate-reference':
          payload = {
            orderReferenceId: i.orderReferenceId!,
            requestingDomain: 'workflow',
            requestingService: 'trademark-application'
          };
          break;
        case 'trademark.create':
          payload = {
            ...i.trademark,
            sourceReference: 'trademark-application-workflow'
          } as Record<string, unknown>;
          break;
        case 'trademark.link-classifications':
          payload = {
            trademarkReferenceId: trademarkReferenceId!,
            classificationReferenceIds: i.classificationItems.map(
              (x) => x.classificationReferenceId
            )
          };
          break;
        case 'trademark.link-documents':
          payload = {
            trademarkReferenceId: trademarkReferenceId!,
            documentReferenceIds: i.documentReferenceIds
          };
          break;
        case 'trademark.link-evidence':
          payload = {
            trademarkReferenceId: trademarkReferenceId!,
            evidenceReferenceIds: i.evidenceReferenceIds
          };
          break;
        case 'matter.create':
          payload = {
            ...i.matter,
            sourceReference: 'trademark-application-workflow'
          } as Record<string, unknown>;
          break;
        case 'matter.link-trademark':
          payload = {
            matterReferenceId: matterReferenceId!,
            trademarkReferenceId: trademarkReferenceId!
          };
          break;
        case 'matter.link-order':
          payload = {
            matterReferenceId: matterReferenceId!,
            orderReferenceId: i.orderReferenceId!
          };
          break;
        case 'task.create':
          payload = {
            ...i.taskPlan,
            sourceReference: 'trademark-application-workflow',
            metadata: {
              ...(isRecord(i.taskPlan?.metadata) ? i.taskPlan.metadata : {}),
              trademarkReferenceId,
              matterReferenceId
            }
          } as Record<string, unknown>;
          break;
      }
      if (
        (step.owningApiOperation.includes('trademark.link') &&
          !trademarkReferenceId) ||
        (step.owningApiOperation.includes('matter.link') && !matterReferenceId)
      )
        return safe(
          'ReferenceInvalid',
          'Planned linkage is missing an authoritative public reference.',
          request.governance.correlationId
        );
      const res = call(step.owningApiOperation, payload!);
      if (!res.ok)
        return {
          ...res,
          error: {
            ...res.error,
            message: `${res.error.message} Completed delegation trace: ${delegationOrder.join(' > ') || 'none'}. Production compensation is out of scope.`
          }
        };
      delegationOrder.push(step.owningApiOperation);
      events.push(...extractEventTraceReferences(res.value.result));
      if (step.owningApiOperation === 'trademark.create') {
        trademarkResult = res.value.result;
        const got = extractPublicReference(res.value.result, 'trademark');
        if (!got)
          return safe(
            'ReferenceInvalid',
            'Trademark API did not return an authoritative public reference.',
            request.governance.correlationId
          );
        if (
          i.existingTrademarkReferenceId &&
          i.existingTrademarkReferenceId !== got
        )
          return safe(
            'ReferenceInvalid',
            'Supplied Trademark reference conflicts with authoritative result.',
            request.governance.correlationId
          );
        trademarkReferenceId = got;
      }
      if (step.owningApiOperation === 'matter.create') {
        matterResult = res.value.result;
        const got = extractPublicReference(res.value.result, 'matter');
        if (!got)
          return safe(
            'ReferenceInvalid',
            'Matter API did not return an authoritative public reference.',
            request.governance.correlationId
          );
        matterReferenceId = got;
      }
      if (step.owningApiOperation === 'task.create')
        taskPlanResult = res.value.result;
    }
    if (
      canonical(delegationOrder) !==
      canonical(record.orderedExecutionPlan.map((s) => s.owningApiOperation))
    )
      return safe(
        'ValidationFailed',
        'Actual Trademark Application delegation order did not match stored plan.',
        request.governance.correlationId
      );
    const result = {
      previewId: record.previewId,
      replayed: false,
      consumed: true,
      delegationOrder,
      eventTraceReferences: [...new Set(events)],
      completedDelegationTrace: delegationOrder,
      trademarkReferenceId,
      matterReferenceId,
      trademarkResult,
      matterResult,
      taskPlanResult,
      directDomainMutation: false as const,
      directEventEmission: false as const
    };
    const consumed = this.deps.planRegistry.consume(record.previewId, result);
    return consumed.ok ? { ok: true, value: result } : consumed;
  }
}

export const CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE =
  Object.freeze({
    requirementId: 'trademark-application-workflow-supports-preview-apply',
    workflowId: CORE_TRADEMARK_APPLICATION_WORKFLOW_ID,
    workflowType: 'bounded-trademark-application-workflow',
    workflowContractId: CORE_TRADEMARK_APPLICATION_WORKFLOW_CONTRACT_ID,
    implementationTask: 'CORE-TASK-058B',
    sourcePath: 'src/workflows/core-trademark-application-workflow.ts',
    currentDepth: 'meets_required_depth',
    previewSupported: true,
    applySupported: true,
    deterministicPreview: true,
    previewDigestRequired: true,
    previewVersionRequired: true,
    humanReviewRequired: true,
    permissionPolicyPreserved: true,
    idempotencyRequired: true,
    planExecutionInvariant: true,
    classificationValidationDelegation: true,
    referenceValidationDelegation: true,
    authoritativeReferencePropagation: true,
    owningApiDelegation: [
      'customer.validate-reference',
      'brand.validate-reference',
      'jurisdiction.validate-reference',
      'classification.validate-items',
      'document.validate-reference',
      'evidence.validate-reference',
      'trademark.create',
      'trademark.link-classifications',
      'trademark.link-documents',
      'trademark.link-evidence',
      'matter.create',
      'matter.link-trademark',
      'matter.link-order',
      'task.create'
    ],
    genuineEventReferenceAggregation: true,
    fixtureScenarioTraceability: true,
    directDomainMutation: false,
    directEventEmission: false,
    implementationFiles: [
      'src/workflows/core-trademark-application-workflow.ts',
      'src/validation/core-trademark-application-workflow-fixture-validation.ts',
      'docs/architecture/core-task-058b-trademark-application-workflow.md'
    ],
    testFiles: [
      'tests/unit/core-task-058b-trademark-application-workflow.test.ts',
      'tests/unit/core-task-058b-book-02-workflow-evidence.test.ts',
      'tests/fixtures/core-task-058b-trademark-application-workflow-fixture.test.ts'
    ],
    fixtureFiles: [
      'fixtures/workflows/core-task-058b-trademark-application-workflow.fixture.json'
    ],
    provenCapabilities: [
      'preview',
      'apply',
      'deterministic digest',
      'human review gate',
      'idempotency replay',
      'owning API delegation',
      'plan/execution invariant',
      'classification validation delegation',
      'authoritative Trademark reference propagation',
      'authoritative Matter reference propagation',
      'genuine Event-reference aggregation',
      'safe partial-failure evidence',
      'no external filing connector',
      'trace-only event references'
    ],
    unresolvedCapabilities: [
      'communication-review-workflow',
      'production preview persistence',
      'production compensation'
    ]
  });
