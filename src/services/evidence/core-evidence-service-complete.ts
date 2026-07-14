import type { CoreEventTraceRecord } from '../../behaviors/core-event-pagination-behavior.ts';
import { enforceCoreGovernedAction } from '../../behaviors/core-governance-behavior.ts';
import {
  createCoreSafeError,
  type CoreBehaviorResult,
  type CoreErrorCategory,
  type CoreErrorCode
} from '../../behaviors/core-safe-error.ts';
import type { CoreDomainId } from '../../domains/index.ts';
import {
  CORE_EVENT_ACTIONS,
  createCoreEventType,
  type CoreEventId
} from '../../events/index.ts';
import type {
  CoreJsonObject,
  CoreMvpObjectBaseRecord
} from '../../objects/core-mvp-object-base-record.ts';
import {
  createCoreObjectId,
  createCoreObjectType
} from '../../objects/index.ts';
import {
  CORE_EVIDENCE_CONFIDENTIALITY_LEVELS,
  CORE_EVIDENCE_PURPOSES,
  CORE_EVIDENCE_SOURCE_RELIABILITIES,
  CORE_EVIDENCE_TYPES,
  CoreEvidenceService as CoreEvidenceServiceFoundation,
  type CoreEvidenceConfidentialityLevel,
  type CoreEvidenceGovernanceContext,
  type CoreEvidencePurpose,
  type CoreEvidenceReviewDecisionStatus,
  type CoreEvidenceServiceDependencies,
  type CoreEvidenceServiceRecord,
  type CoreEvidenceSourceReliability,
  type CoreEvidenceStatus,
  type CoreEvidenceType,
  type CoreEvidenceValidationResult
} from './core-evidence-service.ts';

export const CORE_EVIDENCE_IMPLEMENTED_OPERATIONS = [
  'createEvidence',
  'getEvidence',
  'listEvidence',
  'updateEvidence',
  'validateEvidenceReference',
  'linkEvidenceSource',
  'linkEvidenceClaim',
  'linkEvidenceDocument',
  'linkEvidenceTrademark',
  'linkEvidenceBrand',
  'linkEvidenceClassification',
  'requireEvidenceReview',
  'reviewEvidence',
  'changeEvidenceStatus'
] as const;

export const CORE_EVIDENCE_MINIMUM_CAPABILITIES = [
  'create where required',
  'read where required',
  'search/list where required',
  'governed metadata update',
  'validate_reference',
  'complete Book 02 lifecycle enforcement',
  'source reference linkage',
  'claim and purpose linkage',
  'document reference linkage',
  'trademark reference linkage',
  'brand reference linkage',
  'classification and goods/services linkage',
  'human review gate',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive'
] as const;

export interface CoreEvidenceCompletedRecord extends CoreEvidenceServiceRecord {
  readonly trademarkReferenceIds?: readonly string[];
  readonly brandReferenceIds?: readonly string[];
  readonly classificationReferenceIds?: readonly string[];
  readonly goodsServicesItemReferenceIds?: readonly string[];
}

export interface CoreEvidenceCompletedValidationResult
  extends CoreEvidenceValidationResult {
  readonly trademarkLinked: boolean;
  readonly brandLinked: boolean;
  readonly classificationLinked: boolean;
  readonly goodsServicesItemsLinked: boolean;
  readonly policyHint: 'Allowed' | 'Restricted' | null;
}

export interface CoreEvidenceUpdatePatch {
  readonly evidenceType?: CoreEvidenceType;
  readonly evidencePurpose?: CoreEvidencePurpose;
  readonly confidentialityLevel?: CoreEvidenceConfidentialityLevel;
  readonly sourceReliability?: CoreEvidenceSourceReliability;
  readonly metadata?: CoreJsonObject;
}

const CONTRACT_ID = 'core-service-evidence-service-contract';
const EVIDENCE_OBJECT_TYPE = 'evidence-record';
const EVIDENCE_DOMAIN = 'evidence';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;
const controlledReference = /^[a-z0-9][a-z0-9:_-]{2,127}$/;

const relationshipDefinitions = {
  trademark: {
    objectType: 'trademark-record',
    domain: 'trademark',
    operation: 'linkEvidenceTrademark',
    governanceOperation: 'evidence.link_trademark',
    permission: 'evidence:link_trademark',
    policyScope: 'evidence.relationship',
    field: 'trademarkReferenceIds'
  },
  brand: {
    objectType: 'brand-record',
    domain: 'brand',
    operation: 'linkEvidenceBrand',
    governanceOperation: 'evidence.link_brand',
    permission: 'evidence:link_brand',
    policyScope: 'evidence.relationship',
    field: 'brandReferenceIds'
  },
  classification: {
    objectType: 'classification-record',
    domain: 'classification',
    operation: 'linkEvidenceClassification',
    governanceOperation: 'evidence.link_classification',
    permission: 'evidence:link_classification',
    policyScope: 'evidence.relationship',
    field: 'classificationReferenceIds'
  }
} as const;

type RelationshipKind = keyof typeof relationshipDefinitions;
type CompletedMutationOperation =
  | 'updateEvidence'
  | 'linkEvidenceTrademark'
  | 'linkEvidenceBrand'
  | 'linkEvidenceClassification'
  | 'reviewEvidenceComplete'
  | 'changeEvidenceStatusComplete';

function safe<T = never>(
  code: CoreErrorCode,
  category: CoreErrorCategory,
  message: string,
  correlationId?: string
): CoreBehaviorResult<T> {
  return {
    ok: false,
    error: createCoreSafeError({ code, category, message, correlationId })
  };
}

function immutable<T>(value: T): T {
  const cloned = structuredClone(value);
  const freeze = (candidate: unknown): void => {
    if (typeof candidate !== 'object' || candidate === null) return;
    for (const nested of Object.values(candidate)) freeze(nested);
    Object.freeze(candidate);
  };
  freeze(cloned);
  return cloned;
}

function included<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function validUtcTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function organizationScopeOf(record: CoreEvidenceServiceRecord): string | null {
  return record.objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function normalizeRecord(
  record: CoreEvidenceServiceRecord
): CoreEvidenceCompletedRecord {
  const completed = record as CoreEvidenceCompletedRecord;
  return immutable({
    ...completed,
    trademarkReferenceIds: completed.trademarkReferenceIds ?? [],
    brandReferenceIds: completed.brandReferenceIds ?? [],
    classificationReferenceIds: completed.classificationReferenceIds ?? [],
    goodsServicesItemReferenceIds:
      completed.goodsServicesItemReferenceIds ?? []
  });
}

function ensureGovernance(
  context: CoreEvidenceGovernanceContext,
  expected: {
    readonly operation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly target: string;
  }
): CoreBehaviorResult<null> {
  const correlationId = context.correlationId;
  if (
    context.permission.correlationId !== correlationId ||
    context.policy.correlationId !== correlationId ||
    context.audit.correlationId !== correlationId
  ) {
    return safe(
      'ValidationFailed',
      'Validation',
      'Correlation IDs must match.',
      correlationId
    );
  }
  if (
    context.permission.intendedOperation !== expected.operation ||
    !context.permission.requiredPermissionKeys.includes(expected.permission)
  ) {
    return safe(
      'PermissionDenied',
      'Permission',
      'Required permission is missing.',
      correlationId
    );
  }
  if (
    context.policy.intendedOperation !== expected.operation ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope)
  ) {
    return safe(
      'PolicyRestricted',
      'Policy',
      'Required policy scope is missing.',
      correlationId
    );
  }
  if (
    context.permission.actorReferenceId !== context.audit.actorReferenceId ||
    context.permission.permissionDecisionReferenceId !==
      context.audit.permissionDecisionReferenceId ||
    context.policy.policyDecisionReferenceId !==
      context.audit.policyDecisionReferenceId
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Governance audit linkage is invalid.',
      correlationId
    );
  }
  if (
    context.review.targetObjectType !== EVIDENCE_OBJECT_TYPE ||
    context.review.targetObjectReferenceId !== expected.target
  ) {
    return safe(
      'HumanReviewRequired',
      'HumanReview',
      'Human Review target is invalid.',
      correlationId
    );
  }
  if (
    context.review.humanReviewRequired &&
    context.review.humanReviewReferenceId !==
      context.audit.humanReviewReferenceId
  ) {
    return safe(
      'HumanReviewRequired',
      'HumanReview',
      'Human Review audit linkage is invalid.',
      correlationId
    );
  }
  if (
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== EVIDENCE_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Audit context is missing.',
      correlationId
    );
  }
  const governed = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  if (!governed.ok) return governed;
  return { ok: true, value: null };
}

function enforceOrganizationScope(
  governance: CoreEvidenceGovernanceContext,
  record: CoreEvidenceServiceRecord
): CoreBehaviorResult<null> {
  const expectedScope = organizationScopeOf(record);
  if (
    expectedScope !== null &&
    governance.authorizedOrganizationReferenceId !== expectedScope
  ) {
    return safe(
      'PolicyRestricted',
      'Policy',
      'Evidence organization scope is not authorized.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreEvidenceGovernanceContext,
  operation: string
): string {
  return [
    CONTRACT_ID,
    operation,
    governance.authorizedOrganizationReferenceId ??
      governance.permission.actorReferenceId ??
      'anonymous'
  ].join('|');
}

function eventTrace(input: {
  readonly id: CoreEventId;
  readonly type: string;
  readonly action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
  readonly evidenceReferenceId: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly auditContextReferenceId: string;
  readonly payload: Record<string, unknown>;
}): CoreEventTraceRecord {
  return {
    auditContextReferenceId: input.auditContextReferenceId,
    visibility: 'Internal',
    event: {
      id: input.id,
      type: createCoreEventType(input.type),
      action: input.action,
      domainId: EVIDENCE_DOMAIN,
      object: {
        id: createCoreObjectId(input.evidenceReferenceId),
        type: createCoreObjectType(EVIDENCE_OBJECT_TYPE),
        domainId: EVIDENCE_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      payload: input.payload
    }
  };
}

function updateObjectRecord(
  current: CoreEvidenceServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status?: CoreMvpObjectBaseRecord['status']
): CoreBehaviorResult<CoreMvpObjectBaseRecord> {
  const version = current.objectRecord.version;
  if (!version) {
    return safe(
      'ValidationFailed',
      'Validation',
      'Evidence Object version is required.',
      current.objectRecord.auditMetadata.correlationId
    );
  }
  return {
    ok: true,
    value: immutable({
      ...current.objectRecord,
      status: status ?? current.objectRecord.status,
      auditMetadata: {
        ...current.objectRecord.auditMetadata,
        updatedAt: now,
        updatedByReferenceId:
          actorReferenceId ??
          current.objectRecord.auditMetadata.createdByReferenceId
      },
      version: {
        ...version,
        version: version.version + 1,
        updatedAt: now
      }
    })
  };
}

function relationshipMutable(status: CoreEvidenceStatus): boolean {
  return ![
    'Accepted',
    'Rejected',
    'Filed',
    'Archived',
    'DeletedReferenceOnly'
  ].includes(status);
}

function reviewCompleted(governance: CoreEvidenceGovernanceContext): boolean {
  return (
    governance.policy.policyDecision === 'HumanReviewRequired' &&
    governance.review.humanReviewRequired &&
    governance.review.reviewStatus === 'Completed' &&
    governance.review.reviewDecision === 'Approved' &&
    Boolean(governance.review.reviewerUserReferenceId)
  );
}

export class CoreEvidenceService extends CoreEvidenceServiceFoundation {
  constructor(deps: CoreEvidenceServiceDependencies) {
    super(deps);
  }

  updateEvidence(input: {
    readonly evidenceReferenceId: string;
    readonly patch: CoreEvidenceUpdatePatch;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceCompletedRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.update',
      permission: 'evidence:update',
      policyScope: 'evidence.write',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    const patchEntries = Object.entries(input.patch).filter(
      ([, value]) => value !== undefined
    );
    if (patchEntries.length === 0) {
      return safe(
        'ValidationFailed',
        'Validation',
        'Evidence update requires at least one governed field.',
        input.governance.correlationId
      );
    }
    if (
      input.patch.evidenceType !== undefined &&
      !included(CORE_EVIDENCE_TYPES, input.patch.evidenceType)
    ) {
      return safe(
        'InvalidEvidenceType',
        'Validation',
        'Evidence type is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.patch.evidencePurpose !== undefined &&
      !included(CORE_EVIDENCE_PURPOSES, input.patch.evidencePurpose)
    ) {
      return safe(
        'InvalidEvidencePurpose',
        'Validation',
        'Evidence purpose is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.patch.confidentialityLevel !== undefined &&
      !included(
        CORE_EVIDENCE_CONFIDENTIALITY_LEVELS,
        input.patch.confidentialityLevel
      )
    ) {
      return safe(
        'InvalidEvidenceConfidentialityLevel',
        'Validation',
        'Evidence confidentiality level is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.patch.sourceReliability !== undefined &&
      !included(
        CORE_EVIDENCE_SOURCE_RELIABILITIES,
        input.patch.sourceReliability
      )
    ) {
      return safe(
        'InvalidEvidenceSourceReliability',
        'Validation',
        'Evidence source reliability is invalid.',
        input.governance.correlationId
      );
    }
    if (
      input.patch.metadata !== undefined &&
      (typeof input.patch.metadata !== 'object' ||
        input.patch.metadata === null ||
        Array.isArray(input.patch.metadata))
    ) {
      return safe(
        'ValidationFailed',
        'Validation',
        'Evidence metadata must be an object.',
        input.governance.correlationId
      );
    }
    return this.completedMutation(
      {
        operationName: 'updateEvidence',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: { patch: input.patch }
      },
      (current, now) => {
        if (!relationshipMutable(current.evidenceStatus)) {
          return safe(
            'InvalidEvidenceTransition',
            'State',
            'Finalized Evidence cannot be updated.',
            input.governance.correlationId
          );
        }
        const nextPurpose =
          input.patch.evidencePurpose ?? current.evidencePurpose;
        if (
          nextPurpose === 'Unknown' &&
          current.claimReferenceIds.length === 0
        ) {
          return safe(
            'EvidencePurposeRequired',
            'Validation',
            'Evidence requires a proof purpose or claim relationship.',
            input.governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId
        );
        if (!objectRecord.ok) return objectRecord;
        const next = normalizeRecord({
          ...current,
          evidenceType: input.patch.evidenceType ?? current.evidenceType,
          evidencePurpose: nextPurpose,
          confidentialityLevel:
            input.patch.confidentialityLevel ?? current.confidentialityLevel,
          sourceReliability:
            input.patch.sourceReliability ?? current.sourceReliability,
          objectRecord: {
            ...objectRecord.value,
            metadata: input.patch.metadata ?? current.objectRecord.metadata
          }
        });
        return {
          ok: true,
          value: {
            record: next,
            eventType: 'core-object-updated',
            eventAction: CORE_EVENT_ACTIONS.updated,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              evidenceStatus: next.evidenceStatus,
              updatedFields: patchEntries.map(([field]) => field).sort(),
              sourceCount: next.sourceLinks.length,
              claimCount: next.claimReferenceIds.length,
              documentCount: next.documentReferenceIds.length
            }
          }
        };
      }
    );
  }

  linkEvidenceTrademark(input: {
    readonly evidenceReferenceId: string;
    readonly trademarkReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceCompletedRecord> {
    return this.linkRelationship(
      'trademark',
      input.evidenceReferenceId,
      input.trademarkReferenceId,
      [],
      input.idempotencyKey,
      input.governance
    );
  }

  linkEvidenceBrand(input: {
    readonly evidenceReferenceId: string;
    readonly brandReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceCompletedRecord> {
    return this.linkRelationship(
      'brand',
      input.evidenceReferenceId,
      input.brandReferenceId,
      [],
      input.idempotencyKey,
      input.governance
    );
  }

  linkEvidenceClassification(input: {
    readonly evidenceReferenceId: string;
    readonly classificationReferenceId: string;
    readonly goodsServicesItemReferenceIds?: readonly string[];
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceCompletedRecord> {
    const itemReferences = input.goodsServicesItemReferenceIds ?? [];
    if (
      new Set(itemReferences).size !== itemReferences.length ||
      itemReferences.some((reference) => !controlledReference.test(reference))
    ) {
      return safe(
        'InvalidClassificationItemReference',
        'Reference',
        'Goods or services item references are invalid.',
        input.governance.correlationId
      );
    }
    return this.linkRelationship(
      'classification',
      input.evidenceReferenceId,
      input.classificationReferenceId,
      itemReferences,
      input.idempotencyKey,
      input.governance
    );
  }

  override reviewEvidence(input: {
    readonly evidenceReferenceId: string;
    readonly targetReviewStatus: CoreEvidenceReviewDecisionStatus;
    readonly reviewNoteReference: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.review',
      permission: 'evidence:review',
      policyScope: 'evidence.review',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    if (!opaque.test(input.reviewNoteReference)) {
      return safe(
        'EvidenceReviewNoteRequired',
        'Validation',
        'Evidence review note reference is required.',
        input.governance.correlationId
      );
    }
    if (!reviewCompleted(input.governance)) {
      return safe(
        'HumanReviewRequired',
        'HumanReview',
        'Completed human review is required.',
        input.governance.correlationId
      );
    }
    const requested = input.targetReviewStatus;
    const validDecisions: readonly CoreEvidenceReviewDecisionStatus[] = [
      'HumanReviewed',
      'AcceptedForUse',
      'Rejected',
      'NeedsMoreEvidence',
      'NeedsTranslation',
      'NeedsSourceVerification'
    ];
    if (!validDecisions.includes(requested)) {
      return safe(
        'InvalidEvidenceReviewStatus',
        'State',
        'Evidence review decision is invalid.',
        input.governance.correlationId
      );
    }
    return this.completedMutation(
      {
        operationName: 'reviewEvidenceComplete',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: {
          targetReviewStatus: requested,
          reviewNoteReference: input.reviewNoteReference
        }
      },
      (current, now) => {
        let targetStatus: CoreEvidenceStatus;
        if (requested === 'HumanReviewed') {
          if (current.evidenceStatus !== 'ReviewRequired') {
            return safe(
              'InvalidEvidenceTransition',
              'State',
              'Human review requires ReviewRequired Evidence.',
              input.governance.correlationId
            );
          }
          targetStatus = 'Reviewed';
        } else {
          if (
            current.evidenceStatus !== 'Reviewed' ||
            current.reviewStatus !== 'HumanReviewed'
          ) {
            return safe(
              'InvalidEvidenceTransition',
              'State',
              'Professional decision requires Reviewed Evidence.',
              input.governance.correlationId
            );
          }
          targetStatus =
            requested === 'AcceptedForUse'
              ? 'Accepted'
              : requested === 'Rejected'
                ? 'Rejected'
                : 'Insufficient';
        }
        const objectStatus =
          targetStatus === 'Rejected' || targetStatus === 'Insufficient'
            ? 'inactive'
            : 'active';
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          objectStatus
        );
        if (!objectRecord.ok) return objectRecord;
        return {
          ok: true,
          value: {
            record: normalizeRecord({
              ...current,
              evidenceStatus: targetStatus,
              reviewStatus: requested,
              objectRecord: objectRecord.value
            }),
            eventType: 'core-object-updated',
            eventAction:
              requested === 'AcceptedForUse'
                ? CORE_EVENT_ACTIONS.approved
                : requested === 'Rejected'
                  ? CORE_EVENT_ACTIONS.rejected
                  : CORE_EVENT_ACTIONS.reviewed,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              previousStatus: current.evidenceStatus,
              newStatus: targetStatus,
              reviewStatus: requested,
              sourceCount: current.sourceLinks.length,
              claimCount: current.claimReferenceIds.length,
              documentCount: current.documentReferenceIds.length
            }
          }
        };
      }
    );
  }

  override changeEvidenceStatus(input: {
    readonly evidenceReferenceId: string;
    readonly targetStatus: CoreEvidenceStatus;
    readonly reasonReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'evidence.change_status',
      permission: 'evidence:change_status',
      policyScope: 'evidence.lifecycle',
      target: input.evidenceReferenceId
    });
    if (!governed.ok) return governed;
    const allowedTransitions = new Set([
      'Draft->Collected',
      'Accepted->Filed',
      'Accepted->Archived',
      'Rejected->Archived',
      'Filed->Archived',
      'Archived->DeletedReferenceOnly'
    ]);
    return this.completedMutation(
      {
        operationName: 'changeEvidenceStatusComplete',
        idempotencyKey: input.idempotencyKey,
        evidenceReferenceId: input.evidenceReferenceId,
        governance: input.governance,
        request: {
          targetStatus: input.targetStatus,
          reasonReference: input.reasonReference ?? null
        }
      },
      (current, now) => {
        if (
          !allowedTransitions.has(
            `${current.evidenceStatus}->${input.targetStatus}`
          )
        ) {
          return safe(
            'InvalidEvidenceTransition',
            'State',
            'Evidence status transition is invalid.',
            input.governance.correlationId
          );
        }
        if (
          ['Archived', 'DeletedReferenceOnly'].includes(input.targetStatus) &&
          (typeof input.reasonReference !== 'string' ||
            !opaque.test(input.reasonReference))
        ) {
          return safe(
            'EvidenceReasonReferenceRequired',
            'Validation',
            'Evidence lifecycle reason reference is required.',
            input.governance.correlationId
          );
        }
        const objectStatus =
          input.targetStatus === 'Archived'
            ? 'archived'
            : input.targetStatus === 'DeletedReferenceOnly'
              ? 'deleted'
              : input.targetStatus === 'Draft' ||
                  input.targetStatus === 'Collected'
                ? 'draft'
                : 'active';
        const objectRecord = updateObjectRecord(
          current,
          now,
          input.governance.permission.actorReferenceId,
          objectStatus
        );
        if (!objectRecord.ok) return objectRecord;
        return {
          ok: true,
          value: {
            record: normalizeRecord({
              ...current,
              evidenceStatus: input.targetStatus,
              objectRecord: objectRecord.value
            }),
            eventType: 'core-object-status-changed',
            eventAction:
              input.targetStatus === 'Archived'
                ? CORE_EVENT_ACTIONS.archived
                : input.targetStatus === 'DeletedReferenceOnly'
                  ? CORE_EVENT_ACTIONS.deleted
                  : CORE_EVENT_ACTIONS.statusChanged,
            eventPayload: {
              evidenceReferenceId: input.evidenceReferenceId,
              previousStatus: current.evidenceStatus,
              newStatus: input.targetStatus,
              reviewStatus: current.reviewStatus,
              reasonPresent: Boolean(input.reasonReference)
            }
          }
        };
      }
    );
  }

  override validateEvidenceReference(input: {
    readonly evidenceReferenceId: string;
    readonly requestingDomain: CoreDomainId | string;
    readonly requestingService: string;
    readonly governance: CoreEvidenceGovernanceContext;
  }): CoreBehaviorResult<CoreEvidenceCompletedValidationResult> {
    const result = super.validateEvidenceReference(input);
    if (!result.ok) return result;
    const record = this.deps.store.get(input.evidenceReferenceId);
    const completed = record ? normalizeRecord(record) : null;
    return {
      ok: true,
      value: immutable({
        ...result.value,
        trademarkLinked:
          (completed?.trademarkReferenceIds?.length ?? 0) > 0,
        brandLinked: (completed?.brandReferenceIds?.length ?? 0) > 0,
        classificationLinked:
          (completed?.classificationReferenceIds?.length ?? 0) > 0,
        goodsServicesItemsLinked:
          (completed?.goodsServicesItemReferenceIds?.length ?? 0) > 0,
        policyHint:
          result.value.reasonCode === 'ConfidentialityRestricted'
            ? 'Restricted'
            : result.value.reasonCode === 'NotFound' ||
                result.value.reasonCode === 'InvalidReference'
              ? null
              : 'Allowed'
      })
    };
  }

  private linkRelationship(
    kind: RelationshipKind,
    evidenceReferenceId: string,
    relatedReferenceId: string,
    itemReferenceIds: readonly string[],
    idempotencyKey: string | null | undefined,
    governance: CoreEvidenceGovernanceContext
  ): CoreBehaviorResult<CoreEvidenceCompletedRecord> {
    const definition = relationshipDefinitions[kind];
    const governed = ensureGovernance(governance, {
      operation: definition.governanceOperation,
      permission: definition.permission,
      policyScope: definition.policyScope,
      target: evidenceReferenceId
    });
    if (!governed.ok) return governed;
    const related = this.deps.relatedReferenceRegistry.resolve({
      referenceId: relatedReferenceId,
      expectedObjectType: definition.objectType,
      expectedDomain: definition.domain
    });
    if (!related.ok) {
      return safe(
        'InvalidEvidenceReference',
        'Reference',
        `Evidence ${kind} reference is invalid.`,
        governance.correlationId
      );
    }
    return this.completedMutation(
      {
        operationName: definition.operation,
        idempotencyKey,
        evidenceReferenceId,
        governance,
        request: { relatedReferenceId, itemReferenceIds }
      },
      (current, now) => {
        if (!relationshipMutable(current.evidenceStatus)) {
          return safe(
            'InvalidEvidenceTransition',
            'State',
            'Evidence relationships cannot change after finalization.',
            governance.correlationId
          );
        }
        const completed = normalizeRecord(current);
        const currentReferences = completed[definition.field] ?? [];
        if (currentReferences.includes(relatedReferenceId)) {
          return safe(
            'Conflict',
            'Conflict',
            `Evidence ${kind} reference is already linked.`,
            governance.correlationId
          );
        }
        const objectRecord = updateObjectRecord(
          current,
          now,
          governance.permission.actorReferenceId
        );
        if (!objectRecord.ok) return objectRecord;
        const nextItems = [
          ...(completed.goodsServicesItemReferenceIds ?? []),
          ...itemReferenceIds.filter(
            (reference) =>
              !(completed.goodsServicesItemReferenceIds ?? []).includes(
                reference
              )
          )
        ];
        const next = {
          ...completed,
          [definition.field]: [...currentReferences, relatedReferenceId],
          goodsServicesItemReferenceIds: nextItems,
          objectRecord: objectRecord.value
        } as CoreEvidenceCompletedRecord;
        return {
          ok: true,
          value: {
            record: normalizeRecord(next),
            eventType: 'core-object-updated',
            eventAction: CORE_EVENT_ACTIONS.updated,
            eventPayload: {
              evidenceReferenceId,
              relationshipType: kind,
              relationshipCount: currentReferences.length + 1,
              goodsServicesItemCount: nextItems.length
            }
          }
        };
      }
    );
  }

  private completedMutation(
    input: {
      readonly operationName: CompletedMutationOperation;
      readonly idempotencyKey?: string | null;
      readonly evidenceReferenceId: string;
      readonly governance: CoreEvidenceGovernanceContext;
      readonly request: Record<string, unknown>;
    },
    build: (
      current: CoreEvidenceServiceRecord,
      now: string
    ) => CoreBehaviorResult<{
      readonly record: CoreEvidenceCompletedRecord;
      readonly eventType: string;
      readonly eventAction: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
      readonly eventPayload: Record<string, unknown>;
    }>
  ): CoreBehaviorResult<CoreEvidenceCompletedRecord> {
    const existing = this.deps.store.get(input.evidenceReferenceId);
    if (!existing) {
      return safe(
        'EvidenceNotFound',
        'Reference',
        'Evidence was not found.',
        input.governance.correlationId
      );
    }
    const scope = enforceOrganizationScope(input.governance, existing);
    if (!scope.ok) return scope;
    const idempotent = this.deps.idempotencyRegistry.executeBehavior<
      Record<string, unknown>,
      CoreEvidenceCompletedRecord
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          input.operationName
        ),
        operationName: input.operationName,
        request: {
          evidenceReferenceId: input.evidenceReferenceId,
          ...input.request
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const current = this.deps.store.get(input.evidenceReferenceId);
        if (!current) {
          return safe(
            'EvidenceNotFound',
            'Reference',
            'Evidence was not found.',
            input.governance.correlationId
          );
        }
        const now = this.deps.now();
        if (
          !validUtcTimestamp(now) ||
          new Date(now).getTime() <
            new Date(current.objectRecord.auditMetadata.createdAt).getTime()
        ) {
          return safe(
            'ValidationFailed',
            'Validation',
            'Clock value is invalid.',
            input.governance.correlationId
          );
        }
        const built = build(current, now);
        if (!built.ok) return built;
        let replaced: CoreBehaviorResult<CoreEvidenceServiceRecord>;
        try {
          replaced = this.deps.store.replace(built.value.record);
        } catch {
          return safe(
            'InternalError',
            'Internal',
            'Evidence Service dependency failed safely.',
            input.governance.correlationId
          );
        }
        if (!replaced.ok) return replaced;
        let event: CoreBehaviorResult<CoreEventTraceRecord>;
        try {
          const eventFactory = this.deps.eventIdFactory as unknown as (
            operation: string,
            evidenceReferenceId: string,
            idempotencyKey: string
          ) => CoreEventId;
          event = this.deps.eventTracePort.append(
            eventTrace({
              id: eventFactory(
                input.operationName,
                input.evidenceReferenceId,
                input.idempotencyKey ?? ''
              ),
              type: built.value.eventType,
              action: built.value.eventAction,
              evidenceReferenceId: input.evidenceReferenceId,
              occurredAt: now,
              correlationId: input.governance.correlationId,
              auditContextReferenceId:
                input.governance.auditContextReferenceId,
              payload: built.value.eventPayload
            })
          );
        } catch {
          event = safe(
            'EventTraceFailed',
            'Event',
            'Event trace failed.',
            input.governance.correlationId
          );
        }
        if (!event.ok) {
          const rollback = this.deps.store.replace(current);
          if (!rollback.ok) {
            return safe(
              'InternalError',
              'Internal',
              'Evidence mutation rollback failed.',
              input.governance.correlationId
            );
          }
          return safe(
            'EventTraceFailed',
            'Event',
            'Event trace failed.',
            input.governance.correlationId
          );
        }
        return { ok: true, value: normalizeRecord(built.value.record) };
      }
    );
    return idempotent.ok
      ? { ok: true, value: idempotent.value.result }
      : idempotent;
  }
}
