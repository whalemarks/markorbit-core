import { createHash } from 'node:crypto';

export const CORE_COMMUNICATION_REVIEW_WORKFLOW_ID =
  'must-workflow-communication-review-workflow' as const;
export const CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION =
  'communication-review-workflow:v1' as const;
export const CORE_COMMUNICATION_REVIEW_PLAN_VERSION =
  'communication-review-plan:v1' as const;

export type CommunicationReviewDisposition =
  'approve' | 'reject' | 'request_changes';
type Result<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: { code: string; message: string };
      partialFailure?: CommunicationReviewPartialFailure;
    };
type ApiResult = Result<Record<string, unknown>>;

export interface CommunicationReviewGovernanceContext {
  readonly organizationReferenceId: string;
  readonly actorReferenceId: string;
  readonly permission: {
    readonly allowed: boolean;
    readonly decisionId: string;
  };
  readonly policy: { readonly allowed: boolean; readonly decisionId: string };
  readonly humanReview?: {
    readonly state: 'pending' | 'approved' | 'rejected' | 'expired';
    readonly disposition?: CommunicationReviewDisposition;
    readonly reviewerReferenceId?: string;
    readonly decisionReferenceId?: string;
  };
}
export interface CommunicationReviewInput {
  readonly organizationReferenceId: string;
  readonly communicationReferenceId: string;
  readonly communicationVersion: string;
  readonly communicationState: string;
  readonly customerReferenceId?: string;
  readonly brandReferenceId?: string;
  readonly matterReferenceId?: string;
  readonly trademarkReferenceId?: string;
  readonly documentReferenceIds?: readonly string[];
  readonly evidenceReferenceIds?: readonly string[];
  readonly reviewerReferenceId: string;
  readonly disposition: CommunicationReviewDisposition;
  readonly approvedPayload?: Readonly<Record<string, unknown>>;
  readonly rejection?: Readonly<Record<string, unknown>>;
  readonly changeRequest?: Readonly<Record<string, unknown>>;
  readonly taskPlan?: Readonly<Record<string, unknown>>;
  readonly idempotencyScope: string;
}
export interface CommunicationReviewPreviewRequest {
  readonly schemaVersion: typeof CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION;
  readonly input: CommunicationReviewInput;
  readonly governance: CommunicationReviewGovernanceContext;
  readonly validUntil: string;
}
export interface CommunicationReviewApplyRequest {
  readonly previewId: string;
  readonly previewDigest: string;
  readonly schemaVersion: typeof CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION;
  readonly governance: CommunicationReviewGovernanceContext;
  readonly idempotencyKey: string;
  readonly currentCommunicationVersion: string;
  readonly currentReviewRelevantDigest: string;
  readonly disposition?: CommunicationReviewDisposition;
  readonly approvedPayload?: Readonly<Record<string, unknown>>;
}
export interface CommunicationReviewPreviewValidationPlan {
  readonly checks: readonly string[];
}
export interface CommunicationReviewApplyMutationPlan {
  readonly disposition: CommunicationReviewDisposition;
  readonly operation:
    | 'communication.approveReview'
    | 'communication.rejectReview'
    | 'communication.requestChanges';
  readonly payload: Readonly<Record<string, unknown>>;
  readonly taskPlan?: Readonly<Record<string, unknown>>;
}
export interface CommunicationReviewPreview {
  readonly workflowId: typeof CORE_COMMUNICATION_REVIEW_WORKFLOW_ID;
  readonly previewId: string;
  readonly previewDigest: string;
  readonly schemaVersion: typeof CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION;
  readonly planVersion: typeof CORE_COMMUNICATION_REVIEW_PLAN_VERSION;
  readonly validUntil: string;
  readonly contentDigest: string;
  readonly reviewRelevantDigest: string;
  readonly previewValidationPlan: CommunicationReviewPreviewValidationPlan;
  readonly applyMutationPlan: CommunicationReviewApplyMutationPlan;
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface CommunicationReviewApplyResult {
  readonly workflowId: typeof CORE_COMMUNICATION_REVIEW_WORKFLOW_ID;
  readonly previewId: string;
  readonly previewDigest: string;
  readonly disposition: CommunicationReviewDisposition;
  readonly replayed: boolean;
  readonly completedDelegationTrace: readonly string[];
  readonly authoritativeCommunicationReferenceId: string;
  readonly taskReferenceId?: string;
  readonly eventTraceReferences: readonly string[];
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
export interface CommunicationReviewPartialFailure {
  readonly safePartialFailure: true;
  readonly workflowId: typeof CORE_COMMUNICATION_REVIEW_WORKFLOW_ID;
  readonly previewId: string;
  readonly previewDigest: string;
  readonly failedStep: string;
  readonly completedDelegationTrace: readonly string[];
  readonly authoritativePublicReferences: Readonly<Record<string, string>>;
  readonly eventTraceReferences: readonly string[];
  readonly safeErrorCode: string;
  readonly retryClassification: 'manual_review_required' | 'safe_to_retry';
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}
interface CommunicationReviewPreviewRecord extends CommunicationReviewPreview {
  readonly input: CommunicationReviewInput;
  readonly governance: CommunicationReviewGovernanceContext;
  readonly approvalState: 'pending' | 'approved' | 'rejected' | 'expired';
  readonly consumed: boolean;
  readonly applyResult?: CommunicationReviewApplyResult;
}
export interface CommunicationReviewPorts {
  readonly communicationApi?: {
    validateCommunicationReference(payload: object): ApiResult;
    approveReview(payload: object): ApiResult;
    rejectReview(payload: object): ApiResult;
    requestChanges(payload: object): ApiResult;
  };
  readonly customerApi?: {
    validateCustomerReference(payload: object): ApiResult;
  };
  readonly brandApi?: { validateBrandReference(payload: object): ApiResult };
  readonly matterApi?: { validateMatterReference(payload: object): ApiResult };
  readonly trademarkApi?: {
    validateTrademarkReference(payload: object): ApiResult;
  };
  readonly documentApi?: {
    validateDocumentReference(payload: object): ApiResult;
  };
  readonly evidenceApi?: {
    validateEvidenceReference(payload: object): ApiResult;
  };
  readonly taskApi?: {
    createTask(payload: object): ApiResult;
    validateTaskPlan?(payload: object): ApiResult;
  };
  readonly now: () => string;
}
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object')
    return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value as globalThis.Record<string, unknown>)
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
function events(value: globalThis.Record<string, unknown>): string[] {
  return Array.isArray(value.eventTraceReferences)
    ? value.eventTraceReferences.filter(
        (v): v is string => typeof v === 'string'
      )
    : [];
}
function stringField(value: globalThis.Record<string, unknown>, key: string) {
  return typeof value[key] === 'string' ? value[key] : undefined;
}
function reviewable(state: string) {
  return [
    'draft_pending_review',
    'pending_review',
    'changes_requested'
  ].includes(state);
}
export class CommunicationReviewPreviewRegistry {
  readonly records = new Map<string, CommunicationReviewPreviewRecord>();
  register(
    record: CommunicationReviewPreviewRecord
  ): Result<CommunicationReviewPreviewRecord> {
    const existing = this.records.get(record.previewId);
    if (existing)
      return existing.previewDigest === record.previewDigest
        ? { ok: true, value: existing }
        : fail('DigestMismatch', 'Preview digest mismatch.');
    this.records.set(record.previewId, structuredClone(record));
    return { ok: true, value: this.records.get(record.previewId)! };
  }
  read(previewId: string) {
    return this.records.get(previewId);
  }
  bindHumanReview(
    previewId: string,
    decision: NonNullable<CommunicationReviewGovernanceContext['humanReview']>
  ): Result<CommunicationReviewPreviewRecord> {
    const record = this.read(previewId);
    if (!record) return fail('ReferenceNotFound', 'Preview not found.');
    const state: CommunicationReviewPreviewRecord['approvalState'] =
      decision.state === 'approved'
        ? 'approved'
        : decision.state === 'rejected'
          ? 'rejected'
          : decision.state === 'expired'
            ? 'expired'
            : 'pending';
    const next = {
      ...record,
      governance: { ...record.governance, humanReview: decision },
      approvalState: state
    };
    this.records.set(previewId, next);
    return { ok: true, value: next };
  }
  approve(
    previewId: string,
    decision: NonNullable<CommunicationReviewGovernanceContext['humanReview']>
  ) {
    return this.bindHumanReview(previewId, { ...decision, state: 'approved' });
  }
  reject(previewId: string) {
    const r = this.read(previewId);
    if (!r)
      return fail<CommunicationReviewPreviewRecord>(
        'ReferenceNotFound',
        'Preview not found.'
      );
    const n = { ...r, approvalState: 'rejected' as const };
    this.records.set(previewId, n);
    return { ok: true as const, value: n };
  }
  consume(
    previewId: string,
    result: CommunicationReviewApplyResult
  ): Result<CommunicationReviewPreviewRecord> {
    const r = this.read(previewId);
    if (!r) return fail('ReferenceNotFound', 'Preview not found.');
    if (r.consumed)
      return fail('IdempotencyConflict', 'Preview already consumed.');
    const n = { ...r, consumed: true, applyResult: result };
    this.records.set(previewId, n);
    return { ok: true, value: n };
  }
  expire(previewId: string) {
    const r = this.read(previewId);
    if (r) this.records.set(previewId, { ...r, approvalState: 'expired' });
  }
}
function normalize(
  input: CommunicationReviewInput
): Result<CommunicationReviewApplyMutationPlan> {
  const common = {
    organizationReferenceId: input.organizationReferenceId,
    communicationReferenceId: input.communicationReferenceId,
    communicationVersion: input.communicationVersion,
    reviewerReferenceId: input.reviewerReferenceId
  };
  if (input.disposition === 'approve')
    return {
      ok: true,
      value: {
        disposition: input.disposition,
        operation: 'communication.approveReview',
        payload: {
          ...common,
          approvedPayload: input.approvedPayload ?? {},
          approvedContentDigest: digest(input.approvedPayload ?? {})
        },
        taskPlan: input.taskPlan
      }
    };
  if (input.disposition === 'reject')
    return {
      ok: true,
      value: {
        disposition: input.disposition,
        operation: 'communication.rejectReview',
        payload: { ...common, rejection: input.rejection ?? {} },
        taskPlan: input.taskPlan
      }
    };
  return {
    ok: true,
    value: {
      disposition: input.disposition,
      operation: 'communication.requestChanges',
      payload: { ...common, changeRequest: input.changeRequest ?? {} },
      taskPlan: input.taskPlan
    }
  };
}
function validateGovernance(
  input: CommunicationReviewInput,
  governance: CommunicationReviewGovernanceContext
): Result<null> {
  if (governance.organizationReferenceId !== input.organizationReferenceId)
    return fail('OrganizationMismatch', 'Organization mismatch.');
  if (governance.actorReferenceId !== input.reviewerReferenceId)
    return fail('ReviewerMismatch', 'Reviewer mismatch.');
  if (!governance.permission.allowed)
    return fail('PermissionDenied', 'Permission denied.');
  if (!governance.policy.allowed)
    return fail('PolicyRestricted', 'Policy restricted.');
  return { ok: true, value: null };
}
export function previewCommunicationReview(
  request: CommunicationReviewPreviewRequest,
  ports: CommunicationReviewPorts,
  registry: CommunicationReviewPreviewRegistry
): Result<CommunicationReviewPreview> {
  if (request.schemaVersion !== CORE_COMMUNICATION_REVIEW_SCHEMA_VERSION)
    return fail('VersionUnsupported', 'Unsupported schema version.');
  const gov = validateGovernance(request.input, request.governance);
  if (!gov.ok) return gov;
  if (!ports.communicationApi)
    return fail(
      'DownstreamServiceRequired',
      'Communication API delegation is required.'
    );
  if (!reviewable(request.input.communicationState))
    return fail(
      'StateNotReviewable',
      'Communication is not in a reviewable state.'
    );
  if (Date.parse(request.validUntil) <= Date.parse(ports.now()))
    return fail('PreviewExpired', 'Preview expiry must be in the future.');
  const comm = ports.communicationApi.validateCommunicationReference({
    communicationReferenceId: request.input.communicationReferenceId,
    organizationReferenceId: request.input.organizationReferenceId
  });
  if (!comm.ok) return comm;
  if (
    comm.value.organizationReferenceId &&
    comm.value.organizationReferenceId !== request.input.organizationReferenceId
  )
    return fail('OrganizationMismatch', 'Communication organization mismatch.');
  if (
    comm.value.version &&
    comm.value.version !== request.input.communicationVersion
  )
    return fail('StaleCommunicationVersion', 'Communication version is stale.');
  for (const [id, api, op] of [
    [
      request.input.customerReferenceId,
      ports.customerApi,
      'customer.validateReference'
    ],
    [request.input.brandReferenceId, ports.brandApi, 'brand.validateReference'],
    [
      request.input.matterReferenceId,
      ports.matterApi,
      'matter.validateReference'
    ],
    [
      request.input.trademarkReferenceId,
      ports.trademarkApi,
      'trademark.validateReference'
    ]
  ] as const)
    if (id) {
      if (!api) return fail('DownstreamServiceRequired', `${op} API required.`);
      const r = Object.values(api)[0]({ referenceId: id });
      if (!r.ok) return r;
    }
  for (const id of request.input.documentReferenceIds ?? []) {
    if (!ports.documentApi)
      return fail('DownstreamServiceRequired', 'Document API required.');
    const r = ports.documentApi.validateDocumentReference({
      documentReferenceId: id
    });
    if (!r.ok) return r;
  }
  for (const id of request.input.evidenceReferenceIds ?? []) {
    if (!ports.evidenceApi)
      return fail('DownstreamServiceRequired', 'Evidence API required.');
    const r = ports.evidenceApi.validateEvidenceReference({
      evidenceReferenceId: id
    });
    if (!r.ok) return r;
  }
  if (request.input.taskPlan) {
    if (!ports.taskApi)
      return fail(
        'DownstreamServiceRequired',
        'Task API required when task plan exists.'
      );
    const r = ports.taskApi.validateTaskPlan?.(request.input.taskPlan) ?? {
      ok: true as const,
      value: {}
    };
    if (!r.ok) return r;
  }
  const mutation = normalize(request.input);
  if (!mutation.ok) return mutation;
  const relatedReferences = {
    customerReferenceId: request.input.customerReferenceId,
    brandReferenceId: request.input.brandReferenceId,
    matterReferenceId: request.input.matterReferenceId,
    trademarkReferenceId: request.input.trademarkReferenceId,
    documentReferenceIds: [
      ...(request.input.documentReferenceIds ?? [])
    ].sort(),
    evidenceReferenceIds: [...(request.input.evidenceReferenceIds ?? [])].sort()
  };
  const contentDigest = digest(mutation.value.payload);
  const reviewRelevantDigest = digest({
    version: request.input.communicationVersion,
    payload: mutation.value.payload,
    relatedReferences
  });
  const previewDigest = digest({
    schemaVersion: request.schemaVersion,
    planVersion: CORE_COMMUNICATION_REVIEW_PLAN_VERSION,
    organizationReferenceId: request.input.organizationReferenceId,
    communicationReferenceId: request.input.communicationReferenceId,
    disposition: request.input.disposition,
    reviewerReferenceId: request.input.reviewerReferenceId,
    contentDigest,
    relatedReferences,
    mutationPlan: mutation.value
  });
  const previewId = `communication-review:${previewDigest.slice(7, 31)}`;
  const record: CommunicationReviewPreviewRecord = {
    workflowId: CORE_COMMUNICATION_REVIEW_WORKFLOW_ID,
    previewId,
    previewDigest,
    schemaVersion: request.schemaVersion,
    planVersion: CORE_COMMUNICATION_REVIEW_PLAN_VERSION,
    validUntil: request.validUntil,
    contentDigest,
    reviewRelevantDigest,
    previewValidationPlan: {
      checks: [
        'communication.validateReference',
        'permission.decision',
        'policy.decision',
        'humanReview.required',
        'content.digest'
      ]
    },
    applyMutationPlan: mutation.value,
    directDomainMutation: false,
    directEventEmission: false,
    input: request.input,
    governance: request.governance,
    approvalState: 'pending',
    consumed: false
  };
  const stored = registry.register(record);
  if (!stored.ok) return stored;
  const {
    input: _i,
    governance: _g,
    approvalState: _a,
    consumed: _c,
    applyResult: _r,
    ...pub
  } = stored.value;
  return { ok: true, value: pub };
}
function partial(
  record: CommunicationReviewPreviewRecord,
  failedStep: string,
  trace: string[],
  eventTraceReferences: string[],
  refs: globalThis.Record<string, string>,
  code = 'PartialMutationFailed'
): Result<never> {
  return {
    ok: false,
    error: {
      code,
      message: 'Communication review failed after authoritative mutation began.'
    },
    partialFailure: {
      safePartialFailure: true,
      workflowId: CORE_COMMUNICATION_REVIEW_WORKFLOW_ID,
      previewId: record.previewId,
      previewDigest: record.previewDigest,
      failedStep,
      completedDelegationTrace: trace,
      authoritativePublicReferences: refs,
      eventTraceReferences,
      safeErrorCode: code,
      retryClassification: 'manual_review_required',
      directDomainMutation: false,
      directEventEmission: false
    }
  };
}
export function applyCommunicationReview(
  request: CommunicationReviewApplyRequest,
  ports: CommunicationReviewPorts,
  registry: CommunicationReviewPreviewRegistry
): Result<CommunicationReviewApplyResult> {
  const record = registry.read(request.previewId);
  if (!record) return fail('ReferenceNotFound', 'Preview not found.');
  if (record.consumed) {
    const same =
      record.applyResult &&
      request.previewDigest === record.previewDigest &&
      request.schemaVersion === record.schemaVersion &&
      request.idempotencyKey === `${record.input.idempotencyScope}:apply`;
    return same
      ? { ok: true, value: { ...record.applyResult, replayed: true } }
      : fail(
          'IdempotencyConflict',
          'Consumed preview cannot be reused with conflicting request.'
        );
  }
  const gov = validateGovernance(record.input, request.governance);
  if (!gov.ok) return gov;
  if (request.schemaVersion !== record.schemaVersion)
    return fail('VersionUnsupported', 'Schema mismatch.');
  if (request.previewDigest !== record.previewDigest)
    return fail('DigestMismatch', 'Preview digest mismatch.');
  if (
    Date.parse(record.validUntil) <= Date.parse(ports.now()) ||
    record.approvalState === 'expired'
  )
    return fail('PreviewExpired', 'Preview expired.');
  if (
    record.approvalState !== 'approved' ||
    record.governance.humanReview?.state !== 'approved'
  )
    return fail(
      'HumanReviewRequired',
      'Matching Human Review approval is required.'
    );
  if (
    record.governance.humanReview.disposition !==
    record.applyMutationPlan.disposition
  )
    return fail('HumanReviewMismatch', 'Human Review disposition mismatch.');
  if (
    record.governance.humanReview.reviewerReferenceId !==
    record.input.reviewerReferenceId
  )
    return fail('ReviewerMismatch', 'Human Review reviewer mismatch.');
  if (request.currentCommunicationVersion !== record.input.communicationVersion)
    return fail(
      'StaleCommunicationVersion',
      'Communication version changed after preview.'
    );
  if (request.currentReviewRelevantDigest !== record.reviewRelevantDigest)
    return fail(
      'ContentDigestMismatch',
      'Review-relevant payload changed after preview.'
    );
  if (
    request.disposition &&
    request.disposition !== record.applyMutationPlan.disposition
  )
    return fail(
      'DispositionMismatch',
      'Apply disposition conflicts with preview.'
    );
  if (
    request.approvedPayload &&
    digest({
      ...record.applyMutationPlan.payload,
      approvedPayload: request.approvedPayload,
      approvedContentDigest: digest(request.approvedPayload)
    }) !== digest(record.applyMutationPlan.payload)
  )
    return fail(
      'ContentDigestMismatch',
      'Raw apply payload conflicts with preview.'
    );
  if (!ports.communicationApi)
    return fail(
      'DownstreamServiceRequired',
      'Communication API delegation is required.'
    );
  if (record.applyMutationPlan.taskPlan && !ports.taskApi)
    return fail(
      'DownstreamServiceRequired',
      'Task API required when task plan exists.'
    );
  const call =
    record.applyMutationPlan.operation === 'communication.approveReview'
      ? ports.communicationApi.approveReview
      : record.applyMutationPlan.operation === 'communication.rejectReview'
        ? ports.communicationApi.rejectReview
        : ports.communicationApi.requestChanges;
  const trace: string[] = [];
  const ev: string[] = [];
  const refs: globalThis.Record<string, string> = {};
  const transitioned = call(record.applyMutationPlan.payload);
  if (!transitioned.ok) return transitioned;
  trace.push(record.applyMutationPlan.operation);
  ev.push(...events(transitioned.value));
  const cref = stringField(transitioned.value, 'communicationReferenceId');
  if (!cref)
    return partial(
      record,
      `${record.applyMutationPlan.operation}:missingReference`,
      trace,
      ev,
      refs,
      'MissingAuthoritativeReference'
    );
  refs.communicationReferenceId = cref;
  let taskReferenceId: string | undefined;
  if (record.applyMutationPlan.taskPlan) {
    const task = ports.taskApi!.createTask(record.applyMutationPlan.taskPlan);
    if (!task.ok) return partial(record, 'task.create', trace, ev, refs);
    trace.push('task.create');
    ev.push(...events(task.value));
    taskReferenceId = stringField(task.value, 'taskReferenceId');
    if (!taskReferenceId)
      return partial(
        record,
        'task.create:missingReference',
        trace,
        ev,
        refs,
        'MissingAuthoritativeReference'
      );
    refs.taskReferenceId = taskReferenceId;
  }
  const result: CommunicationReviewApplyResult = {
    workflowId: CORE_COMMUNICATION_REVIEW_WORKFLOW_ID,
    previewId: record.previewId,
    previewDigest: record.previewDigest,
    disposition: record.applyMutationPlan.disposition,
    replayed: false,
    completedDelegationTrace: trace,
    authoritativeCommunicationReferenceId: cref,
    taskReferenceId,
    eventTraceReferences: ev,
    directDomainMutation: false,
    directEventEmission: false
  };
  const consumed = registry.consume(record.previewId, result);
  return consumed.ok ? { ok: true, value: result } : consumed;
}
export const CORE_TASK_058C_COMMUNICATION_REVIEW_WORKFLOW_EVIDENCE =
  Object.freeze({
    implementationTask: 'CORE-TASK-058C',
    workflowId: CORE_COMMUNICATION_REVIEW_WORKFLOW_ID,
    workflowContractId: 'core-workflow-communication-review-workflow-contract',
    implementationFiles: [
      'src/workflows/core-communication-review-workflow.ts'
    ],
    testFiles: [
      'tests/unit/core-task-058c-communication-review-workflow.test.ts'
    ],
    fixtureFiles: [
      'fixtures/workflows/core-task-058c-communication-review-workflow.fixture.json'
    ],
    currentDepth: 'meets_required_depth',
    previewSupported: true,
    applySupported: true,
    previewValidationOnly: true,
    separatedPreviewValidationAndApplyMutationPlans: true,
    noDirectDomainMutation: true,
    noDirectEventEmission: true,
    eventReferencesTraceOnly: true,
    nextTask: 'CORE-TASK-059',
    mvpComplete: false
  });
