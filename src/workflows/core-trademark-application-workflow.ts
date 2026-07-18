import { createHash } from 'node:crypto';

export const CORE_TRADEMARK_APPLICATION_WORKFLOW_ID =
  'must-workflow-trademark-application-workflow' as const;
export const CORE_TRADEMARK_APPLICATION_PLAN_VERSION =
  'trademark-application-plan:v2' as const;

type Result<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: { code: string; message: string };
      partialFailure?: TrademarkApplicationPartialFailure;
    };
type ApiResult = Result<Record<string, unknown>>;

export interface TrademarkApplicationInput {
  readonly customerReferenceId: string;
  readonly brandReferenceId: string;
  readonly jurisdictionReferenceId: string;
  readonly classificationReferenceIds: readonly string[];
  readonly documentReferenceIds?: readonly string[];
  readonly evidenceReferenceIds?: readonly string[];
  readonly existingTrademarkReferenceId?: string;
  readonly existingMatterReferenceId?: string;
  readonly orderReferenceId?: string;
  readonly organizationReferenceId: string;
  readonly rawTrademarkPayload?: Readonly<Record<string, unknown>>;
}
export interface TrademarkApplicationPreviewValidationStep {
  readonly order: number;
  readonly operation: string;
  readonly payload: Readonly<Record<string, unknown>>;
}
export interface TrademarkApplicationApplyMutationStep {
  readonly order: number;
  readonly operation:
    | 'trademark.create'
    | 'matter.create'
    | 'trademark.linkMatter'
    | 'task.create';
  readonly payload: Readonly<Record<string, unknown>>;
}
export interface TrademarkApplicationPreview {
  readonly previewId: string;
  readonly planVersion: typeof CORE_TRADEMARK_APPLICATION_PLAN_VERSION;
  readonly previewDigest: string;
  readonly previewValidationPlan: readonly TrademarkApplicationPreviewValidationStep[];
  readonly applyMutationPlan: readonly TrademarkApplicationApplyMutationStep[];
  readonly normalizedTrademarkCreatePayload: Readonly<Record<string, unknown>>;
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface TrademarkApplicationPartialFailure {
  readonly previewId: string;
  readonly safePartialFailure: true;
  readonly failedOperation: string;
  readonly completedDelegationTrace: readonly string[];
  readonly eventTraceReferences: readonly string[];
  readonly trademarkReferenceId?: string;
  readonly matterReferenceId?: string;
  readonly compensationAvailable: false;
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface TrademarkApplicationApplyResult {
  readonly previewId: string;
  readonly completedDelegationTrace: readonly string[];
  readonly eventTraceReferences: readonly string[];
  readonly trademarkReferenceId: string;
  readonly matterReferenceId: string;
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface TrademarkApplicationPorts {
  readonly customerApi: {
    validateCustomerReference(payload: object): ApiResult;
  };
  readonly brandApi: { validateBrandReference(payload: object): ApiResult };
  readonly jurisdictionApi: {
    validateJurisdictionReference(payload: object): ApiResult;
  };
  readonly classificationApi: {
    validateClassificationReference(payload: object): ApiResult;
  };
  readonly documentApi: {
    validateDocumentReference(payload: object): ApiResult;
  };
  readonly evidenceApi: {
    validateEvidenceReference(payload: object): ApiResult;
  };
  readonly trademarkApi: {
    validateTrademarkReference(payload: object): ApiResult;
    createTrademark(payload: object): ApiResult;
    linkTrademarkMatter(payload: object): ApiResult;
  };
  readonly matterApi: {
    validateMatterReference(payload: object): ApiResult;
    createMatter(payload: object): ApiResult;
  };
  readonly orderApi?: { validateOrderReference(payload: object): ApiResult };
  readonly taskApi: { createTask(payload: object): ApiResult };
}
export class TrademarkApplicationPreviewRegistry {
  readonly records = new Map<string, TrademarkApplicationPreview>();
  register(preview: TrademarkApplicationPreview): void {
    this.records.set(preview.previewId, preview);
  }
  get(previewId: string): TrademarkApplicationPreview | undefined {
    return this.records.get(previewId);
  }
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
function fail<T>(code: string, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}
function refFrom(
  value: Record<string, unknown>,
  key: string
): string | undefined {
  return typeof value[key] === 'string' ? value[key] : undefined;
}
export function normalizeTrademarkCreatePayload(
  input: TrademarkApplicationInput
): Result<Readonly<Record<string, unknown>>> {
  const raw = input.rawTrademarkPayload ?? {};
  const bound = {
    ...raw,
    customerReferenceId: input.customerReferenceId,
    brandReferenceId: input.brandReferenceId,
    jurisdictionReferenceId: input.jurisdictionReferenceId,
    classificationReferenceIds: [...input.classificationReferenceIds].sort(),
    organizationReferenceId: input.organizationReferenceId
  };
  for (const key of [
    'customerReferenceId',
    'brandReferenceId',
    'jurisdictionReferenceId',
    'organizationReferenceId'
  ] as const) {
    if (raw[key] !== undefined && raw[key] !== bound[key])
      return fail(
        'ValidationFailed',
        `Conflicting Trademark payload field: ${key}.`
      );
  }
  if (
    raw.classificationReferenceIds !== undefined &&
    canonical(raw.classificationReferenceIds) !==
      canonical(bound.classificationReferenceIds)
  )
    return fail(
      'ValidationFailed',
      'Conflicting Trademark payload field: classificationReferenceIds.'
    );
  return { ok: true, value: bound };
}
export function buildTrademarkApplicationPlans(
  input: TrademarkApplicationInput
): Result<
  Pick<
    TrademarkApplicationPreview,
    | 'previewValidationPlan'
    | 'applyMutationPlan'
    | 'normalizedTrademarkCreatePayload'
  >
> {
  const normalized = normalizeTrademarkCreatePayload(input);
  if (!normalized.ok) return normalized;
  let order = 1;
  const previewValidationPlan: TrademarkApplicationPreviewValidationStep[] = [
    {
      order: order++,
      operation: 'customer.validateReference',
      payload: { customerReferenceId: input.customerReferenceId }
    },
    {
      order: order++,
      operation: 'brand.validateReference',
      payload: {
        brandReferenceId: input.brandReferenceId,
        customerReferenceId: input.customerReferenceId
      }
    },
    {
      order: order++,
      operation: 'jurisdiction.validateReference',
      payload: { jurisdictionReferenceId: input.jurisdictionReferenceId }
    }
  ];
  input.classificationReferenceIds.forEach((classificationReferenceId) =>
    previewValidationPlan.push({
      order: order++,
      operation: 'classification.validateReference',
      payload: { classificationReferenceId }
    })
  );
  input.documentReferenceIds?.forEach((documentReferenceId) =>
    previewValidationPlan.push({
      order: order++,
      operation: 'document.validateReference',
      payload: { documentReferenceId }
    })
  );
  input.evidenceReferenceIds?.forEach((evidenceReferenceId) =>
    previewValidationPlan.push({
      order: order++,
      operation: 'evidence.validateReference',
      payload: { evidenceReferenceId }
    })
  );
  if (input.existingTrademarkReferenceId)
    previewValidationPlan.push({
      order: order++,
      operation: 'trademark.validateReference',
      payload: { trademarkReferenceId: input.existingTrademarkReferenceId }
    });
  if (input.existingMatterReferenceId)
    previewValidationPlan.push({
      order: order++,
      operation: 'matter.validateReference',
      payload: { matterReferenceId: input.existingMatterReferenceId }
    });
  if (input.orderReferenceId)
    previewValidationPlan.push({
      order: order++,
      operation: 'order.validateReference',
      payload: { orderReferenceId: input.orderReferenceId }
    });
  const applyMutationPlan: TrademarkApplicationApplyMutationStep[] = [
    { order: 1, operation: 'trademark.create', payload: normalized.value },
    {
      order: 2,
      operation: 'matter.create',
      payload: {
        customerReferenceId: input.customerReferenceId,
        brandReferenceId: input.brandReferenceId,
        trademarkReferenceId: '$trademarkReferenceId',
        organizationReferenceId: input.organizationReferenceId
      }
    },
    {
      order: 3,
      operation: 'trademark.linkMatter',
      payload: {
        trademarkReferenceId: '$trademarkReferenceId',
        matterReferenceId: '$matterReferenceId'
      }
    },
    {
      order: 4,
      operation: 'task.create',
      payload: {
        matterReferenceId: '$matterReferenceId',
        taskType: 'trademark-application-review'
      }
    }
  ];
  return {
    ok: true,
    value: {
      previewValidationPlan,
      applyMutationPlan,
      normalizedTrademarkCreatePayload: normalized.value
    }
  };
}
export function previewTrademarkApplication(
  input: TrademarkApplicationInput,
  ports: TrademarkApplicationPorts,
  registry: TrademarkApplicationPreviewRegistry
): Result<TrademarkApplicationPreview> {
  const plans = buildTrademarkApplicationPlans(input);
  if (!plans.ok) return plans;
  for (const step of plans.value.previewValidationPlan) {
    const result =
      step.operation === 'customer.validateReference'
        ? ports.customerApi.validateCustomerReference(step.payload)
        : step.operation === 'brand.validateReference'
          ? ports.brandApi.validateBrandReference(step.payload)
          : step.operation === 'jurisdiction.validateReference'
            ? ports.jurisdictionApi.validateJurisdictionReference(step.payload)
            : step.operation === 'classification.validateReference'
              ? ports.classificationApi.validateClassificationReference(
                  step.payload
                )
              : step.operation === 'document.validateReference'
                ? ports.documentApi.validateDocumentReference(step.payload)
                : step.operation === 'evidence.validateReference'
                  ? ports.evidenceApi.validateEvidenceReference(step.payload)
                  : step.operation === 'trademark.validateReference'
                    ? ports.trademarkApi.validateTrademarkReference(
                        step.payload
                      )
                    : step.operation === 'matter.validateReference'
                      ? ports.matterApi.validateMatterReference(step.payload)
                      : (ports.orderApi?.validateOrderReference(step.payload) ??
                        fail('ReferenceInvalid', 'Order API is required.'));
    if (!result.ok) return fail(result.error.code, result.error.message);
    if (
      step.operation === 'brand.validateReference' &&
      result.value.customerReferenceId !== input.customerReferenceId
    )
      return fail(
        'ReferenceInvalid',
        'Brand API did not confirm Customer relationship.'
      );
  }
  const preview = {
    previewId: digest({ input, plans: plans.value }),
    planVersion: CORE_TRADEMARK_APPLICATION_PLAN_VERSION,
    previewDigest: digest(plans.value.applyMutationPlan),
    ...plans.value,
    directDomainMutation: false,
    directEventEmission: false
  } as const;
  registry.register(preview);
  return { ok: true, value: preview };
}
function partial(
  previewId: string,
  failedOperation: string,
  trace: string[],
  events: string[],
  trademarkReferenceId?: string,
  matterReferenceId?: string
): Result<never> {
  return {
    ok: false,
    error: {
      code: 'PartialMutationFailed',
      message: 'Trademark application mutation failed after delegation began.'
    },
    partialFailure: {
      previewId,
      safePartialFailure: true,
      failedOperation,
      completedDelegationTrace: trace,
      eventTraceReferences: events,
      trademarkReferenceId,
      matterReferenceId,
      compensationAvailable: false,
      directDomainMutation: false,
      directEventEmission: false
    }
  };
}
export function applyTrademarkApplication(
  previewId: string,
  input: TrademarkApplicationInput,
  ports: TrademarkApplicationPorts,
  registry: TrademarkApplicationPreviewRegistry
): Result<TrademarkApplicationApplyResult> {
  const stored = registry.get(previewId);
  if (!stored) return fail('ReferenceInvalid', 'Preview not found.');
  const expected = buildTrademarkApplicationPlans(input);
  if (!expected.ok) return expected;
  if (digest(expected.value.applyMutationPlan) !== stored.previewDigest)
    return fail(
      'ValidationFailed',
      'Stored applyMutationPlan does not match expected normalized mutation plan.'
    );
  const trace: string[] = [];
  const events: string[] = [];
  const trademark = ports.trademarkApi.createTrademark(
    stored.applyMutationPlan[0].payload
  );
  if (!trademark.ok)
    return partial(previewId, 'trademark.create', trace, events);
  trace.push('trademark.create');
  events.push(
    ...((trademark.value.eventTraceReferences as string[] | undefined) ?? [])
  );
  const trademarkReferenceId = refFrom(trademark.value, 'trademarkReferenceId');
  if (!trademarkReferenceId)
    return partial(
      previewId,
      'trademark.create:missingReference',
      trace,
      events
    );
  const matter = ports.matterApi.createMatter({
    ...stored.applyMutationPlan[1].payload,
    trademarkReferenceId
  });
  if (!matter.ok)
    return partial(
      previewId,
      'matter.create',
      trace,
      events,
      trademarkReferenceId
    );
  trace.push('matter.create');
  events.push(
    ...((matter.value.eventTraceReferences as string[] | undefined) ?? [])
  );
  const matterReferenceId = refFrom(matter.value, 'matterReferenceId');
  if (!matterReferenceId)
    return partial(
      previewId,
      'matter.create:missingReference',
      trace,
      events,
      trademarkReferenceId
    );
  for (const [operation, call] of [
    [
      'trademark.linkMatter',
      () =>
        ports.trademarkApi.linkTrademarkMatter({
          trademarkReferenceId,
          matterReferenceId
        })
    ],
    [
      'task.create',
      () =>
        ports.taskApi.createTask({
          matterReferenceId,
          taskType: 'trademark-application-review'
        })
    ]
  ] as const) {
    const result = call();
    if (!result.ok)
      return partial(
        previewId,
        operation,
        trace,
        events,
        trademarkReferenceId,
        matterReferenceId
      );
    trace.push(operation);
    events.push(
      ...((result.value.eventTraceReferences as string[] | undefined) ?? [])
    );
  }
  if (
    canonical(trace) !==
    canonical(stored.applyMutationPlan.map((s) => s.operation))
  )
    return partial(
      previewId,
      'applyMutationPlan.invariant',
      trace,
      events,
      trademarkReferenceId,
      matterReferenceId
    );
  return {
    ok: true,
    value: {
      previewId,
      completedDelegationTrace: trace,
      eventTraceReferences: events,
      trademarkReferenceId,
      matterReferenceId,
      directDomainMutation: false,
      directEventEmission: false
    }
  };
}

export const CORE_TASK_058B_TRADEMARK_APPLICATION_WORKFLOW_EVIDENCE =
  Object.freeze({
    implementationTask: 'CORE-TASK-058B',
    workflowId: CORE_TRADEMARK_APPLICATION_WORKFLOW_ID,
    workflowContractId: 'core-workflow-trademark-application-workflow-contract',
    currentDepth: 'meets_required_depth',
    previewSupported: true,
    applySupported: true,
    implementationFiles: [
      'src/workflows/core-trademark-application-workflow.ts'
    ],
    testFiles: [
      'tests/unit/core-task-058b-trademark-application-workflow.test.ts'
    ],
    previewGovernedReferenceValidation: true,
    existingTrademarkValidation: true,
    brandCustomerRelationshipValidation: true,
    normalizedMutationPayloads: true,
    previewValidationPlan: true,
    applyMutationPlan: true,
    structuredPartialFailureEvidence: true,
    partialRetrySemantics:
      'fail-closed-no-automatic-retry-or-compensation-preserve-trace-and-events',
    noExternalFilingBehavior: true
  });
