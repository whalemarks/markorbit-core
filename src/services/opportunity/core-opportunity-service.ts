import {
  paginateCoreItems,
  type CoreEventTraceRecord,
  type CorePaginatedResult
} from '../../behaviors/core-event-pagination-behavior.ts';
import {
  enforceCoreGovernedAction,
  type CoreAuditContext,
  type CoreHumanReviewContext,
  type CorePermissionContext,
  type CorePolicyContext
} from '../../behaviors/core-governance-behavior.ts';
import { CoreIdempotencyRegistry } from '../../behaviors/core-idempotency-behavior.ts';
import {
  CoreReferenceRegistry,
  type CoreReferenceRecord
} from '../../behaviors/core-reference-behavior.ts';
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
import type { CoreObjectStatus } from '../../objects/core-object-status.ts';
import {
  createCoreObjectId,
  createCoreObjectType
} from '../../objects/index.ts';

export const CORE_OPPORTUNITY_TYPES = [
  'NewFilingOpportunity',
  'RenewalOpportunity',
  'MaintenanceOpportunity',
  'OfficeActionOpportunity',
  'ExpansionOpportunity',
  'ChangeOpportunity',
  'AssignmentOpportunity',
  'OppositionOpportunity',
  'CancellationOpportunity',
  'EvidenceOpportunity',
  'ConsultationOpportunity',
  'Other',
  'Unknown'
] as const;
export type CoreOpportunityType = (typeof CORE_OPPORTUNITY_TYPES)[number];

export const CORE_OPPORTUNITY_STATUSES = [
  'Draft',
  'Identified',
  'ReviewRequired',
  'Qualified',
  'Rejected',
  'Deferred',
  'Converted',
  'Archived',
  'DeletedReferenceOnly'
] as const;
export type CoreOpportunityStatus = (typeof CORE_OPPORTUNITY_STATUSES)[number];

export const CORE_OPPORTUNITY_SOURCE_TYPES = [
  'Manual',
  'CustomerInquiry',
  'Communication',
  'TrademarkStatus',
  'DeadlineSignal',
  'BrandAnalysis',
  'AIRecommendation',
  'PartnerReferral',
  'SystemSignal',
  'Import',
  'Unknown'
] as const;
export type CoreOpportunitySourceType =
  (typeof CORE_OPPORTUNITY_SOURCE_TYPES)[number];

export const CORE_OPPORTUNITY_QUALIFICATION_STATUSES = [
  'Unqualified',
  'ReviewRequired',
  'Qualified',
  'NotQualified',
  'NeedsMoreInformation',
  'Deferred',
  'Converted'
] as const;
export type CoreOpportunityQualificationStatus =
  (typeof CORE_OPPORTUNITY_QUALIFICATION_STATUSES)[number];

export const CORE_OPPORTUNITY_PRIORITIES = [
  'Low',
  'Normal',
  'High',
  'Urgent',
  'Unknown'
] as const;
export type CoreOpportunityPriority =
  (typeof CORE_OPPORTUNITY_PRIORITIES)[number];

export const CORE_OPPORTUNITY_IMPLEMENTED_OPERATIONS = [
  'createOpportunity',
  'getOpportunity',
  'listOpportunities',
  'updateOpportunity',
  'changeOpportunityStatus',
  'qualifyOpportunity',
  'disqualifyOpportunity',
  'linkOpportunityCustomer',
  'linkOpportunityBrand',
  'linkOpportunityTrademark',
  'linkOpportunityCommunication',
  'convertOpportunityToOrder',
  'validateOpportunityReference',
  'archiveOpportunity'
] as const;

export const CORE_OPPORTUNITY_MINIMUM_CAPABILITIES = [
  'create potential-demand records',
  'read and search/list potential-demand records',
  'governed metadata update',
  'validate_reference',
  'qualification with explicit human/policy governance',
  'customer, brand, trademark, and communication linkage',
  'controlled Order Service conversion boundary',
  'complete Phase 4 partial lifecycle enforcement',
  'AI recommendation remains source/reference until reviewed',
  'permission check hook',
  'policy check hook',
  'safe error return',
  'event trace handoff where applicable',
  'event failure rollback',
  'idempotency handling where duplicate-sensitive'
] as const;

export const CORE_OPPORTUNITY_COLLECTION_TARGET = 'opportunity:collection';

const CONTRACT_ID = 'core-service-opportunity-service-contract';
const OPPORTUNITY_OBJECT_TYPE = 'opportunity-record';
const OPPORTUNITY_DOMAIN = 'opportunity';
const OPPORTUNITY_OBJECT_CONTRACT_ID =
  'core-object-opportunity-record-contract';
const opaque = /^[A-Za-z0-9][A-Za-z0-9:_./-]{2,127}$/;

const statusToObjectStatus: Record<CoreOpportunityStatus, CoreObjectStatus> = {
  Draft: 'draft',
  Identified: 'active',
  ReviewRequired: 'active',
  Qualified: 'active',
  Rejected: 'inactive',
  Deferred: 'inactive',
  Converted: 'active',
  Archived: 'archived',
  DeletedReferenceOnly: 'deleted'
};

const lifecycleTransitions = new Set([
  'Draft->Identified',
  'Identified->ReviewRequired',
  'Identified->Qualified',
  'ReviewRequired->Qualified',
  'ReviewRequired->Rejected',
  'ReviewRequired->Deferred',
  'Qualified->Converted',
  'Qualified->Deferred',
  'Qualified->Rejected',
  'Rejected->Archived',
  'Deferred->ReviewRequired',
  'Deferred->Archived',
  'Converted->Archived',
  'Archived->DeletedReferenceOnly'
]);

export interface CoreOpportunityGovernanceContext {
  readonly permission: CorePermissionContext;
  readonly policy: CorePolicyContext;
  readonly review: CoreHumanReviewContext;
  readonly audit: CoreAuditContext;
  readonly auditContextReferenceId: string;
  readonly correlationId: string;
  readonly authorizedOrganizationReferenceId?: string | null;
}

export interface CoreOpportunityServiceRecord {
  readonly objectRecord: CoreMvpObjectBaseRecord;
  readonly opportunityType: CoreOpportunityType;
  readonly titleReference: string;
  readonly opportunityStatus: CoreOpportunityStatus;
  readonly sourceType: CoreOpportunitySourceType;
  readonly sourceReference: string;
  readonly qualificationStatus: CoreOpportunityQualificationStatus;
  readonly qualificationReasonReferenceId: string | null;
  readonly serviceScopeReference: string | null;
  readonly priority: CoreOpportunityPriority;
  readonly customerReferenceIds: readonly string[];
  readonly brandReferenceIds: readonly string[];
  readonly trademarkReferenceIds: readonly string[];
  readonly communicationReferenceIds: readonly string[];
  readonly aiRecommendationReferenceId: string | null;
  readonly convertedOrderReferenceId: string | null;
}

export interface CoreOpportunityListSummary extends Record<string, unknown> {
  readonly publicReferenceId: string;
  readonly opportunityType: CoreOpportunityType;
  readonly opportunityStatus: CoreOpportunityStatus;
  readonly qualificationStatus: CoreOpportunityQualificationStatus;
  readonly sourceType: CoreOpportunitySourceType;
  readonly customerLinked: boolean;
  readonly brandLinked: boolean;
  readonly trademarkLinked: boolean;
  readonly communicationLinked: boolean;
  readonly converted: boolean;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface CoreOpportunityValidationResult {
  readonly isValid: boolean;
  readonly opportunityReferenceId: string;
  readonly opportunityType: CoreOpportunityType;
  readonly status: CoreOpportunityStatus;
  readonly qualificationStatus: CoreOpportunityQualificationStatus;
  readonly reasonCode:
    | 'Valid'
    | 'NotFound'
    | 'InvalidReference'
    | 'Unqualified'
    | 'Rejected'
    | 'Converted'
    | 'Expired'
    | 'Archived'
    | 'ReviewRequired'
    | 'PolicyRestricted';
  readonly customerReferenceHint: boolean;
  readonly orderReferenceHint: boolean;
  readonly policyHint: 'Allowed' | 'Restricted' | null;
}

export interface CoreOpportunityConversionResult {
  readonly converted: boolean;
  readonly opportunityReferenceId: string;
  readonly orderReferenceId: string | null;
  readonly reviewRequired: boolean;
  readonly reasonCode:
    | 'Converted'
    | 'QualificationRequired'
    | 'CustomerRequired'
    | 'ServiceScopeRequired'
    | 'ReviewRequired'
    | 'AlreadyConverted';
}

export interface CoreOpportunityServiceStore {
  get(id: string): CoreOpportunityServiceRecord | undefined;
  list(): readonly CoreOpportunityServiceRecord[];
  insert(
    record: CoreOpportunityServiceRecord
  ): CoreBehaviorResult<CoreOpportunityServiceRecord>;
  replace(
    record: CoreOpportunityServiceRecord
  ): CoreBehaviorResult<CoreOpportunityServiceRecord>;
  remove(id: string): CoreBehaviorResult<null>;
}

export interface CoreOpportunityEventTracePort {
  append(
    record: CoreEventTraceRecord
  ): CoreBehaviorResult<CoreEventTraceRecord>;
}

export interface CoreOpportunityOrderConversionPort {
  convert(input: {
    readonly opportunityReferenceId: string;
    readonly customerReferenceId: string;
    readonly serviceScopeReference: string;
    readonly conversionContextReferenceId: string;
    readonly actorReferenceId: string | null;
    readonly correlationId: string;
  }): CoreBehaviorResult<{ readonly orderReferenceId: string }>;
  rollback(input: {
    readonly opportunityReferenceId: string;
    readonly orderReferenceId: string;
    readonly correlationId: string;
  }): CoreBehaviorResult<null>;
}

export interface CoreOpportunityServiceDependencies {
  readonly store: CoreOpportunityServiceStore;
  readonly idempotencyRegistry: CoreIdempotencyRegistry;
  readonly eventTracePort: CoreOpportunityEventTracePort;
  readonly relatedReferenceRegistry: CoreReferenceRegistry;
  readonly orderConversionPort: CoreOpportunityOrderConversionPort;
  readonly requestingServiceDirectory: readonly {
    readonly domainId: CoreDomainId;
    readonly serviceType: string;
  }[];
  readonly now: () => string;
  readonly eventIdFactory: (
    operation: string,
    opportunityReferenceId: string,
    idempotencyKey: string
  ) => CoreEventId;
  readonly cursorSecret: string;
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

function included<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function organizationScopeOf(
  record: CoreOpportunityServiceRecord | CoreMvpObjectBaseRecord
): string | null {
  const objectRecord = 'objectRecord' in record ? record.objectRecord : record;
  return objectRecord.visibility?.organizationScopeReferenceId ?? null;
}

function ensureGovernance(
  context: CoreOpportunityGovernanceContext,
  expected: {
    readonly operation: string;
    readonly permission: string;
    readonly policyScope: string;
    readonly target: string;
    readonly reviewRequired?: boolean;
  }
): CoreBehaviorResult<null> {
  if (
    context.permission.correlationId !== context.correlationId ||
    context.policy.correlationId !== context.correlationId ||
    context.audit.correlationId !== context.correlationId ||
    context.permission.intendedOperation !== expected.operation ||
    context.policy.intendedOperation !== expected.operation ||
    context.audit.operationName !== expected.operation ||
    context.audit.targetObjectType !== OPPORTUNITY_OBJECT_TYPE ||
    context.audit.targetObjectReferenceId !== expected.target ||
    !context.permission.requiredPermissionKeys.includes(expected.permission) ||
    !context.policy.requiredPolicyScopes.includes(expected.policyScope) ||
    !opaque.test(context.auditContextReferenceId)
  ) {
    return safe(
      'AuditContextMissing',
      'Validation',
      'Opportunity governance context is invalid.',
      context.correlationId
    );
  }
  if (
    expected.reviewRequired &&
    (!context.review.humanReviewRequired ||
      context.review.reviewStatus !== 'Completed' ||
      context.review.reviewDecision !== 'Approved')
  ) {
    return safe(
      'HumanReviewRequired',
      'HumanReview',
      'Opportunity operation requires approved human review.',
      context.correlationId
    );
  }
  const governed = enforceCoreGovernedAction({
    permission: context.permission,
    policy: context.policy,
    review: context.review,
    audit: context.audit
  });
  return governed.ok ? { ok: true, value: null } : governed;
}

function enforceOrganizationScope(
  governance: CoreOpportunityGovernanceContext,
  recordOrganization: string | null
): CoreBehaviorResult<null> {
  if (
    governance.authorizedOrganizationReferenceId &&
    recordOrganization &&
    governance.authorizedOrganizationReferenceId !== recordOrganization
  ) {
    return safe(
      'OpportunityNotFound',
      'Reference',
      'Opportunity was not found.',
      governance.correlationId
    );
  }
  return { ok: true, value: null };
}

function idempotencyScope(
  governance: CoreOpportunityGovernanceContext,
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

function resolveReference(
  registry: CoreReferenceRegistry,
  referenceId: string,
  objectType: string,
  domain: string,
  code: CoreErrorCode,
  correlationId?: string
): CoreBehaviorResult<CoreReferenceRecord> {
  const resolved = registry.resolve({
    referenceId,
    expectedObjectType: objectType,
    expectedDomain: domain
  });
  return resolved.ok
    ? resolved
    : safe(
        code,
        'Reference',
        'Related Opportunity reference is invalid.',
        correlationId
      );
}

function eventTrace(input: {
  readonly id: CoreEventId;
  readonly action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS];
  readonly eventType: string;
  readonly opportunityReferenceId: string;
  readonly occurredAt: string;
  readonly governance: CoreOpportunityGovernanceContext;
  readonly payload: Record<string, unknown>;
}): CoreEventTraceRecord {
  return {
    auditContextReferenceId: input.governance.auditContextReferenceId,
    visibility: 'Internal',
    event: {
      id: input.id,
      type: createCoreEventType(
        input.eventType.replaceAll('.', '-').replaceAll('_', '-')
      ),
      action: input.action,
      domainId: OPPORTUNITY_DOMAIN,
      object: {
        id: createCoreObjectId(input.opportunityReferenceId),
        type: createCoreObjectType(OPPORTUNITY_OBJECT_TYPE),
        domainId: OPPORTUNITY_DOMAIN
      },
      source: { actorType: 'service', actorId: CONTRACT_ID },
      occurredAt: input.occurredAt,
      correlationId: input.governance.correlationId,
      payload: input.payload
    }
  };
}

function updatedObject(
  current: CoreOpportunityServiceRecord,
  now: string,
  actorReferenceId: string | null,
  status: CoreOpportunityStatus,
  metadata?: CoreJsonObject
): CoreMvpObjectBaseRecord {
  return {
    ...current.objectRecord,
    status: statusToObjectStatus[status],
    metadata: metadata ?? current.objectRecord.metadata,
    version: current.objectRecord.version
      ? { ...current.objectRecord.version, updatedAt: now }
      : undefined,
    auditMetadata: {
      ...current.objectRecord.auditMetadata,
      updatedAt: now,
      updatedByReferenceId:
        actorReferenceId ??
        current.objectRecord.auditMetadata.createdByReferenceId
    }
  };
}

function validateRecord(
  record: CoreOpportunityServiceRecord
): CoreBehaviorResult<CoreOpportunityServiceRecord> {
  if (
    !included(CORE_OPPORTUNITY_TYPES, record.opportunityType) ||
    record.opportunityType === 'Unknown'
  )
    return safe(
      'InvalidOpportunityType',
      'Validation',
      'Opportunity type is invalid.'
    );
  if (!included(CORE_OPPORTUNITY_STATUSES, record.opportunityStatus))
    return safe(
      'InvalidOpportunityStatus',
      'State',
      'Opportunity status is invalid.'
    );
  if (
    !included(CORE_OPPORTUNITY_SOURCE_TYPES, record.sourceType) ||
    record.sourceType === 'Unknown'
  )
    return safe(
      'InvalidOpportunitySourceType',
      'Validation',
      'Opportunity source type is invalid.'
    );
  if (
    !included(
      CORE_OPPORTUNITY_QUALIFICATION_STATUSES,
      record.qualificationStatus
    )
  )
    return safe(
      'InvalidOpportunityQualificationStatus',
      'State',
      'Opportunity qualification status is invalid.'
    );
  if (!included(CORE_OPPORTUNITY_PRIORITIES, record.priority))
    return safe(
      'InvalidOpportunityPriority',
      'Validation',
      'Opportunity priority is invalid.'
    );
  if (!record.titleReference.trim())
    return safe(
      'OpportunityTitleRequired',
      'Validation',
      'Opportunity title reference is required.'
    );
  if (!opaque.test(record.sourceReference))
    return safe(
      'OpportunitySourceReferenceRequired',
      'Validation',
      'Opportunity source reference is required.'
    );
  if (
    record.objectRecord.objectType !== OPPORTUNITY_OBJECT_TYPE ||
    record.objectRecord.domainId !== OPPORTUNITY_DOMAIN ||
    record.objectRecord.objectContractId !== OPPORTUNITY_OBJECT_CONTRACT_ID ||
    record.objectRecord.status !==
      statusToObjectStatus[record.opportunityStatus]
  )
    return safe(
      'OpportunityObjectMismatch',
      'Validation',
      'Opportunity Object foundation does not match.'
    );
  if (
    record.opportunityStatus === 'Qualified' &&
    record.qualificationStatus !== 'Qualified'
  )
    return safe(
      'InvalidOpportunityQualificationStatus',
      'State',
      'Qualified Opportunity status requires Qualified qualification.'
    );
  if (
    record.opportunityStatus === 'Converted' &&
    (record.qualificationStatus !== 'Converted' ||
      !record.convertedOrderReferenceId)
  )
    return safe(
      'OpportunityConversionRequired',
      'State',
      'Converted Opportunity requires an Order conversion reference.'
    );
  return { ok: true, value: immutable(record) };
}

export class CoreInMemoryOpportunityServiceStore implements CoreOpportunityServiceStore {
  readonly #records = new Map<string, CoreOpportunityServiceRecord>();

  get(id: string): CoreOpportunityServiceRecord | undefined {
    const record = this.#records.get(id);
    return record ? immutable(record) : undefined;
  }

  list(): readonly CoreOpportunityServiceRecord[] {
    return [...this.#records.values()].map(immutable);
  }

  insert(
    record: CoreOpportunityServiceRecord
  ): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (this.#records.has(id))
      return safe(
        'OpportunityAlreadyExists',
        'Conflict',
        'Opportunity already exists.'
      );
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  replace(
    record: CoreOpportunityServiceRecord
  ): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const id = record.objectRecord.publicReferenceId;
    if (!this.#records.has(id))
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.'
      );
    const stored = immutable(record);
    this.#records.set(id, stored);
    return { ok: true, value: immutable(stored) };
  }

  remove(id: string): CoreBehaviorResult<null> {
    this.#records.delete(id);
    return { ok: true, value: null };
  }
}

export class CoreOpportunityService {
  constructor(readonly deps: CoreOpportunityServiceDependencies) {}

  createOpportunity(input: {
    readonly objectRecord: CoreMvpObjectBaseRecord;
    readonly publicReferenceRecord: CoreReferenceRecord;
    readonly opportunityType: unknown;
    readonly titleReference: string;
    readonly opportunityStatus: unknown;
    readonly sourceType: unknown;
    readonly sourceReference: string;
    readonly priority?: unknown;
    readonly serviceScopeReference?: string | null;
    readonly aiRecommendationReferenceId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const target = input.objectRecord.publicReferenceId;
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.create',
      permission: 'opportunity:create',
      policyScope: 'opportunity.write',
      target,
      reviewRequired: input.sourceType === 'AIRecommendation'
    });
    if (!governed.ok) return governed;
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(input.objectRecord)
    );
    if (!scope.ok) return scope;
    if (input.opportunityStatus !== 'Draft')
      return safe(
        'InvalidOpportunityStatus',
        'State',
        'Opportunity creation must start as Draft.',
        input.governance.correlationId
      );
    const reference = resolveReference(
      this.deps.relatedReferenceRegistry,
      input.publicReferenceRecord.referenceId,
      OPPORTUNITY_OBJECT_TYPE,
      OPPORTUNITY_DOMAIN,
      'InvalidOpportunityReference',
      input.governance.correlationId
    );
    if (!reference.ok || target !== input.publicReferenceRecord.referenceId)
      return safe(
        'InvalidOpportunityReference',
        'Reference',
        'Opportunity reference is invalid.',
        input.governance.correlationId
      );
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'createOpportunity'
        ),
        operationName: 'createOpportunity',
        request: {
          target,
          opportunityType: input.opportunityType,
          titleReference: input.titleReference,
          sourceType: input.sourceType,
          sourceReference: input.sourceReference,
          serviceScopeReference: input.serviceScopeReference,
          aiRecommendationReferenceId: input.aiRecommendationReferenceId
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        if (this.deps.store.get(target))
          return safe(
            'OpportunityAlreadyExists',
            'Conflict',
            'Opportunity already exists.'
          );
        const record: CoreOpportunityServiceRecord = {
          objectRecord: input.objectRecord,
          opportunityType: input.opportunityType as CoreOpportunityType,
          titleReference: input.titleReference,
          opportunityStatus: input.opportunityStatus as CoreOpportunityStatus,
          sourceType: input.sourceType as CoreOpportunitySourceType,
          sourceReference: input.sourceReference,
          qualificationStatus:
            input.sourceType === 'AIRecommendation'
              ? 'ReviewRequired'
              : 'Unqualified',
          qualificationReasonReferenceId: null,
          serviceScopeReference: input.serviceScopeReference ?? null,
          priority: (input.priority ?? 'Normal') as CoreOpportunityPriority,
          customerReferenceIds: [],
          brandReferenceIds: [],
          trademarkReferenceIds: [],
          communicationReferenceIds: [],
          aiRecommendationReferenceId:
            input.aiRecommendationReferenceId ?? null,
          convertedOrderReferenceId: null
        };
        const valid = validateRecord(record);
        if (!valid.ok) return valid;
        const inserted = this.deps.store.insert(valid.value);
        if (!inserted.ok) return inserted;
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              'createOpportunity',
              target,
              input.idempotencyKey ?? ''
            ),
            action: CORE_EVENT_ACTIONS.created,
            eventType: 'opportunity-created',
            opportunityReferenceId: target,
            occurredAt: this.deps.now(),
            governance: input.governance,
            payload: {
              opportunityReferenceId: target,
              opportunityType: valid.value.opportunityType,
              status: valid.value.opportunityStatus,
              sourceType: valid.value.sourceType
            }
          })
        );
        if (!event.ok) {
          this.deps.store.remove(target);
          return safe(
            'EventTraceFailed',
            'Event',
            'Opportunity event trace failed.',
            input.governance.correlationId
          );
        }
        return inserted;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }

  getOpportunity(input: {
    readonly opportunityReferenceId: string;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.read',
      permission: 'opportunity:read',
      policyScope: 'opportunity.read',
      target: input.opportunityReferenceId
    });
    if (!governed.ok) return governed;
    const record = this.deps.store.get(input.opportunityReferenceId);
    if (!record)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    return scope.ok ? { ok: true, value: immutable(record) } : scope;
  }

  listOpportunities(input: {
    readonly filters?: {
      readonly opportunityType?: unknown;
      readonly opportunityStatus?: unknown;
      readonly qualificationStatus?: unknown;
      readonly sourceType?: unknown;
    };
    readonly pagination?: {
      readonly cursor?: string | null;
      readonly limit?: number | null;
      readonly sortField?: string | null;
      readonly sortDirection?: 'Asc' | 'Desc' | null;
      readonly includeTotalCount?: boolean | null;
    };
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CorePaginatedResult<CoreOpportunityListSummary>> {
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.list',
      permission: 'opportunity:list',
      policyScope: 'opportunity.list',
      target: CORE_OPPORTUNITY_COLLECTION_TARGET
    });
    if (!governed.ok) return governed;
    if (
      input.filters?.opportunityType !== undefined &&
      !included(CORE_OPPORTUNITY_TYPES, input.filters.opportunityType)
    )
      return safe(
        'InvalidOpportunityType',
        'Validation',
        'Opportunity type filter is invalid.'
      );
    if (
      input.filters?.opportunityStatus !== undefined &&
      !included(CORE_OPPORTUNITY_STATUSES, input.filters.opportunityStatus)
    )
      return safe(
        'InvalidOpportunityStatus',
        'State',
        'Opportunity status filter is invalid.'
      );
    if (
      input.filters?.qualificationStatus !== undefined &&
      !included(
        CORE_OPPORTUNITY_QUALIFICATION_STATUSES,
        input.filters.qualificationStatus
      )
    )
      return safe(
        'InvalidOpportunityQualificationStatus',
        'State',
        'Opportunity qualification filter is invalid.'
      );
    if (
      input.filters?.sourceType !== undefined &&
      !included(CORE_OPPORTUNITY_SOURCE_TYPES, input.filters.sourceType)
    )
      return safe(
        'InvalidOpportunitySourceType',
        'Validation',
        'Opportunity source filter is invalid.'
      );
    const items = this.deps.store
      .list()
      .filter((record) => {
        const org = organizationScopeOf(record);
        return (
          (!input.governance.authorizedOrganizationReferenceId ||
            !org ||
            org === input.governance.authorizedOrganizationReferenceId) &&
          (!input.filters?.opportunityType ||
            record.opportunityType === input.filters.opportunityType) &&
          (!input.filters?.opportunityStatus ||
            record.opportunityStatus === input.filters.opportunityStatus) &&
          (!input.filters?.qualificationStatus ||
            record.qualificationStatus === input.filters.qualificationStatus) &&
          (!input.filters?.sourceType ||
            record.sourceType === input.filters.sourceType)
        );
      })
      .map((record): CoreOpportunityListSummary => ({
        publicReferenceId: record.objectRecord.publicReferenceId,
        opportunityType: record.opportunityType,
        opportunityStatus: record.opportunityStatus,
        qualificationStatus: record.qualificationStatus,
        sourceType: record.sourceType,
        customerLinked: record.customerReferenceIds.length > 0,
        brandLinked: record.brandReferenceIds.length > 0,
        trademarkLinked: record.trademarkReferenceIds.length > 0,
        communicationLinked: record.communicationReferenceIds.length > 0,
        converted: Boolean(record.convertedOrderReferenceId),
        createdAt: record.objectRecord.auditMetadata.createdAt,
        updatedAt: record.objectRecord.auditMetadata.updatedAt
      }));
    return paginateCoreItems(
      items,
      input.pagination ?? {},
      {
        permissionAllowed: true,
        policyAllowed: true,
        actorReferenceId: input.governance.permission.actorReferenceId,
        allowedSortFields: [
          'createdAt',
          'publicReferenceId',
          'opportunityStatus',
          'qualificationStatus'
        ],
        totalCountAllowed: true,
        correlationId: input.governance.correlationId
      },
      {
        queryKey: JSON.stringify(input.filters ?? {}),
        cursorSecret: this.deps.cursorSecret,
        visible: () => true
      }
    );
  }

  updateOpportunity(input: {
    readonly opportunityReferenceId: string;
    readonly patch: {
      readonly opportunityType?: unknown;
      readonly titleReference?: string;
      readonly sourceType?: unknown;
      readonly sourceReference?: string;
      readonly serviceScopeReference?: string | null;
      readonly priority?: unknown;
      readonly metadata?: CoreJsonObject;
    };
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const current = this.deps.store.get(input.opportunityReferenceId);
    if (!current)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.update',
      permission: 'opportunity:update',
      policyScope: 'opportunity.write',
      target: input.opportunityReferenceId,
      reviewRequired:
        input.patch.sourceType === 'AIRecommendation' ||
        current.sourceType === 'AIRecommendation'
    });
    if (!governed.ok) return governed;
    if (
      ['Converted', 'Archived', 'DeletedReferenceOnly'].includes(
        current.opportunityStatus
      )
    )
      return safe(
        'InvalidOpportunityTransition',
        'State',
        'Finalized Opportunity metadata cannot change.',
        input.governance.correlationId
      );
    return this.mutate(
      input.opportunityReferenceId,
      'updateOpportunity',
      input.idempotencyKey,
      input.governance,
      input.patch,
      (record, now) => ({
        ...record,
        opportunityType:
          (input.patch.opportunityType as CoreOpportunityType | undefined) ??
          record.opportunityType,
        titleReference: input.patch.titleReference ?? record.titleReference,
        sourceType:
          (input.patch.sourceType as CoreOpportunitySourceType | undefined) ??
          record.sourceType,
        sourceReference: input.patch.sourceReference ?? record.sourceReference,
        serviceScopeReference:
          input.patch.serviceScopeReference === undefined
            ? record.serviceScopeReference
            : input.patch.serviceScopeReference,
        priority:
          (input.patch.priority as CoreOpportunityPriority | undefined) ??
          record.priority,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          record.opportunityStatus,
          input.patch.metadata
            ? {
                ...record.objectRecord.metadata,
                ...input.patch.metadata
              }
            : undefined
        )
      }),
      CORE_EVENT_ACTIONS.updated,
      'opportunity-updated'
    );
  }

  changeOpportunityStatus(input: {
    readonly opportunityReferenceId: string;
    readonly nextStatus: unknown;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const current = this.deps.store.get(input.opportunityReferenceId);
    if (!current)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.change_status',
      permission: 'opportunity:change_status',
      policyScope: 'opportunity.lifecycle',
      target: input.opportunityReferenceId,
      reviewRequired:
        input.nextStatus === 'Qualified' ||
        input.nextStatus === 'Converted' ||
        input.nextStatus === 'DeletedReferenceOnly'
    });
    if (!governed.ok) return governed;
    if (!included(CORE_OPPORTUNITY_STATUSES, input.nextStatus))
      return safe(
        'InvalidOpportunityStatus',
        'State',
        'Opportunity status is invalid.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReferenceId))
      return safe(
        'OpportunityReasonReferenceRequired',
        'Validation',
        'Opportunity status change requires a reason reference.',
        input.governance.correlationId
      );
    if (
      !lifecycleTransitions.has(
        `${current.opportunityStatus}->${input.nextStatus}`
      )
    )
      return safe(
        'InvalidOpportunityTransition',
        'State',
        'Opportunity lifecycle transition is not allowed.',
        input.governance.correlationId
      );
    if (
      input.nextStatus === 'Qualified' &&
      current.qualificationStatus !== 'Qualified'
    )
      return safe(
        'OpportunityQualificationRequired',
        'State',
        'Opportunity must be qualified before status becomes Qualified.',
        input.governance.correlationId
      );
    if (input.nextStatus === 'Converted' && !current.convertedOrderReferenceId)
      return safe(
        'OpportunityConversionRequired',
        'State',
        'Opportunity conversion must be completed by the conversion operation.',
        input.governance.correlationId
      );
    return this.mutate(
      input.opportunityReferenceId,
      'changeOpportunityStatus',
      input.idempotencyKey,
      input.governance,
      {
        nextStatus: input.nextStatus,
        reasonReferenceId: input.reasonReferenceId
      },
      (record, now) => ({
        ...record,
        opportunityStatus: input.nextStatus as CoreOpportunityStatus,
        qualificationStatus:
          input.nextStatus === 'Rejected'
            ? 'NotQualified'
            : input.nextStatus === 'Deferred'
              ? 'Deferred'
              : input.nextStatus === 'Converted'
                ? 'Converted'
                : record.qualificationStatus,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          input.nextStatus as CoreOpportunityStatus
        )
      }),
      CORE_EVENT_ACTIONS.statusChanged,
      'opportunity-status-changed'
    );
  }

  qualifyOpportunity(input: {
    readonly opportunityReferenceId: string;
    readonly qualificationReasonReferenceId: string;
    readonly serviceScopeReference?: string | null;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const current = this.deps.store.get(input.opportunityReferenceId);
    if (!current)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.qualify',
      permission: 'opportunity:qualify',
      policyScope: 'opportunity.qualification',
      target: input.opportunityReferenceId,
      reviewRequired: true
    });
    if (!governed.ok) return governed;
    if (!['Identified', 'ReviewRequired'].includes(current.opportunityStatus))
      return safe(
        'InvalidOpportunityTransition',
        'State',
        'Opportunity cannot be qualified from its current state.',
        input.governance.correlationId
      );
    if (!opaque.test(input.qualificationReasonReferenceId))
      return safe(
        'OpportunityQualificationReasonRequired',
        'Validation',
        'Qualification requires a reason reference.',
        input.governance.correlationId
      );
    return this.mutate(
      input.opportunityReferenceId,
      'qualifyOpportunity',
      input.idempotencyKey,
      input.governance,
      {
        qualificationReasonReferenceId: input.qualificationReasonReferenceId,
        serviceScopeReference: input.serviceScopeReference
      },
      (record, now) => ({
        ...record,
        opportunityStatus: 'Qualified',
        qualificationStatus: 'Qualified',
        qualificationReasonReferenceId: input.qualificationReasonReferenceId,
        serviceScopeReference:
          input.serviceScopeReference ?? record.serviceScopeReference,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Qualified'
        )
      }),
      CORE_EVENT_ACTIONS.approved,
      'opportunity-qualified'
    );
  }

  disqualifyOpportunity(input: {
    readonly opportunityReferenceId: string;
    readonly qualificationReasonReferenceId: string;
    readonly defer?: boolean;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const current = this.deps.store.get(input.opportunityReferenceId);
    if (!current)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.disqualify',
      permission: 'opportunity:disqualify',
      policyScope: 'opportunity.qualification',
      target: input.opportunityReferenceId,
      reviewRequired: true
    });
    if (!governed.ok) return governed;
    if (
      !['Identified', 'ReviewRequired', 'Qualified'].includes(
        current.opportunityStatus
      )
    )
      return safe(
        'InvalidOpportunityTransition',
        'State',
        'Opportunity cannot be disqualified from its current state.',
        input.governance.correlationId
      );
    if (!opaque.test(input.qualificationReasonReferenceId))
      return safe(
        'OpportunityQualificationReasonRequired',
        'Validation',
        'Disqualification requires a reason reference.',
        input.governance.correlationId
      );
    const status: CoreOpportunityStatus = input.defer ? 'Deferred' : 'Rejected';
    return this.mutate(
      input.opportunityReferenceId,
      'disqualifyOpportunity',
      input.idempotencyKey,
      input.governance,
      {
        qualificationReasonReferenceId: input.qualificationReasonReferenceId,
        defer: Boolean(input.defer)
      },
      (record, now) => ({
        ...record,
        opportunityStatus: status,
        qualificationStatus: input.defer ? 'Deferred' : 'NotQualified',
        qualificationReasonReferenceId: input.qualificationReasonReferenceId,
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          status
        )
      }),
      input.defer ? CORE_EVENT_ACTIONS.updated : CORE_EVENT_ACTIONS.rejected,
      input.defer ? 'opportunity-deferred' : 'opportunity-disqualified'
    );
  }

  linkOpportunityCustomer(input: OpportunityLinkInput<'customerReferenceId'>) {
    return this.linkArray(
      input,
      'linkOpportunityCustomer',
      'customer-record',
      'customer',
      'InvalidOpportunityCustomerReference',
      'customerReferenceIds'
    );
  }

  linkOpportunityBrand(input: OpportunityLinkInput<'brandReferenceId'>) {
    return this.linkArray(
      input,
      'linkOpportunityBrand',
      'brand-record',
      'brand',
      'InvalidOpportunityBrandReference',
      'brandReferenceIds'
    );
  }

  linkOpportunityTrademark(
    input: OpportunityLinkInput<'trademarkReferenceId'>
  ) {
    return this.linkArray(
      input,
      'linkOpportunityTrademark',
      'trademark-record',
      'trademark',
      'InvalidOpportunityTrademarkReference',
      'trademarkReferenceIds'
    );
  }

  linkOpportunityCommunication(
    input: OpportunityLinkInput<'communicationReferenceId'>
  ) {
    return this.linkArray(
      input,
      'linkOpportunityCommunication',
      'communication-record',
      'communication',
      'InvalidOpportunityCommunicationReference',
      'communicationReferenceIds'
    );
  }

  convertOpportunityToOrder(input: {
    readonly opportunityReferenceId: string;
    readonly customerReferenceId?: string | null;
    readonly serviceScopeReference?: string | null;
    readonly conversionContextReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityConversionResult> {
    const current = this.deps.store.get(input.opportunityReferenceId);
    if (!current)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.convert_to_order',
      permission: 'opportunity:convert_to_order',
      policyScope: 'opportunity.conversion',
      target: input.opportunityReferenceId,
      reviewRequired: true
    });
    if (!governed.ok) return governed;
    if (current.convertedOrderReferenceId)
      return {
        ok: true,
        value: {
          converted: true,
          opportunityReferenceId: input.opportunityReferenceId,
          orderReferenceId: current.convertedOrderReferenceId,
          reviewRequired: false,
          reasonCode: 'AlreadyConverted'
        }
      };
    if (
      current.opportunityStatus !== 'Qualified' ||
      current.qualificationStatus !== 'Qualified'
    )
      return {
        ok: true,
        value: {
          converted: false,
          opportunityReferenceId: input.opportunityReferenceId,
          orderReferenceId: null,
          reviewRequired: true,
          reasonCode: 'QualificationRequired'
        }
      };
    const customerReferenceId =
      input.customerReferenceId ?? current.customerReferenceIds[0] ?? null;
    if (!customerReferenceId)
      return {
        ok: true,
        value: {
          converted: false,
          opportunityReferenceId: input.opportunityReferenceId,
          orderReferenceId: null,
          reviewRequired: true,
          reasonCode: 'CustomerRequired'
        }
      };
    const customer = resolveReference(
      this.deps.relatedReferenceRegistry,
      customerReferenceId,
      'customer-record',
      'customer',
      'InvalidOpportunityCustomerReference',
      input.governance.correlationId
    );
    if (!customer.ok) return customer;
    const serviceScopeReference =
      input.serviceScopeReference ?? current.serviceScopeReference;
    if (!serviceScopeReference || !opaque.test(serviceScopeReference))
      return {
        ok: true,
        value: {
          converted: false,
          opportunityReferenceId: input.opportunityReferenceId,
          orderReferenceId: null,
          reviewRequired: true,
          reasonCode: 'ServiceScopeRequired'
        }
      };
    if (!opaque.test(input.conversionContextReferenceId))
      return safe(
        'OpportunityConversionContextRequired',
        'Validation',
        'Opportunity conversion requires a conversion context reference.',
        input.governance.correlationId
      );
    const run = this.deps.idempotencyRegistry.executeBehavior<
      {
        readonly opportunityReferenceId: string;
        readonly customerReferenceId: string;
        readonly serviceScopeReference: string;
        readonly conversionContextReferenceId: string;
      },
      CoreOpportunityConversionResult
    >(
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyScope: idempotencyScope(
          input.governance,
          'convertOpportunityToOrder'
        ),
        operationName: 'convertOpportunityToOrder',
        request: {
          opportunityReferenceId: input.opportunityReferenceId,
          customerReferenceId,
          serviceScopeReference,
          conversionContextReferenceId: input.conversionContextReferenceId
        },
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: input.governance.correlationId
      },
      () => {
        const converted = this.deps.orderConversionPort.convert({
          opportunityReferenceId: input.opportunityReferenceId,
          customerReferenceId,
          serviceScopeReference,
          conversionContextReferenceId: input.conversionContextReferenceId,
          actorReferenceId: input.governance.permission.actorReferenceId,
          correlationId: input.governance.correlationId
        });
        if (!converted.ok) return converted;
        if (!opaque.test(converted.value.orderReferenceId))
          return safe(
            'InvalidOpportunityOrderReference',
            'Reference',
            'Order conversion returned an invalid reference.',
            input.governance.correlationId
          );
        const now = this.deps.now();
        const next: CoreOpportunityServiceRecord = {
          ...current,
          opportunityStatus: 'Converted',
          qualificationStatus: 'Converted',
          customerReferenceIds: current.customerReferenceIds.includes(
            customerReferenceId
          )
            ? current.customerReferenceIds
            : [...current.customerReferenceIds, customerReferenceId],
          serviceScopeReference,
          convertedOrderReferenceId: converted.value.orderReferenceId,
          objectRecord: updatedObject(
            current,
            now,
            input.governance.permission.actorReferenceId,
            'Converted'
          )
        };
        const valid = validateRecord(next);
        if (!valid.ok) {
          this.deps.orderConversionPort.rollback({
            opportunityReferenceId: input.opportunityReferenceId,
            orderReferenceId: converted.value.orderReferenceId,
            correlationId: input.governance.correlationId
          });
          return valid;
        }
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) {
          this.deps.orderConversionPort.rollback({
            opportunityReferenceId: input.opportunityReferenceId,
            orderReferenceId: converted.value.orderReferenceId,
            correlationId: input.governance.correlationId
          });
          return replaced;
        }
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              'convertOpportunityToOrder',
              input.opportunityReferenceId,
              input.idempotencyKey ?? ''
            ),
            action: CORE_EVENT_ACTIONS.completed,
            eventType: 'opportunity-converted-to-order',
            opportunityReferenceId: input.opportunityReferenceId,
            occurredAt: now,
            governance: input.governance,
            payload: {
              opportunityReferenceId: input.opportunityReferenceId,
              converted: true,
              orderReferencePresent: true
            }
          })
        );
        if (!event.ok) {
          this.deps.store.replace(current);
          this.deps.orderConversionPort.rollback({
            opportunityReferenceId: input.opportunityReferenceId,
            orderReferenceId: converted.value.orderReferenceId,
            correlationId: input.governance.correlationId
          });
          return safe(
            'EventTraceFailed',
            'Event',
            'Opportunity conversion event trace failed.',
            input.governance.correlationId
          );
        }
        return {
          ok: true as const,
          value: {
            converted: true,
            opportunityReferenceId: input.opportunityReferenceId,
            orderReferenceId: converted.value.orderReferenceId,
            reviewRequired: false,
            reasonCode: 'Converted' as const
          }
        };
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }

  validateOpportunityReference(input: {
    readonly opportunityReferenceId: string;
    readonly requestingDomain: CoreDomainId;
    readonly requestingService: string;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityValidationResult> {
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.validate_reference',
      permission: 'opportunity:validate_reference',
      policyScope: 'opportunity.reference',
      target: input.opportunityReferenceId
    });
    if (!governed.ok) return governed;
    if (
      !this.deps.requestingServiceDirectory.some(
        (entry) =>
          entry.domainId === input.requestingDomain &&
          entry.serviceType === input.requestingService
      )
    )
      return safe(
        'InvalidOpportunityRequestingService',
        'Reference',
        'Requesting service is not registered.',
        input.governance.correlationId
      );
    const record = this.deps.store.get(input.opportunityReferenceId);
    if (!record)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const scope = enforceOrganizationScope(
      input.governance,
      organizationScopeOf(record)
    );
    if (!scope.ok) return scope;
    let reasonCode: CoreOpportunityValidationResult['reasonCode'] = 'Valid';
    let isValid = true;
    if (record.opportunityStatus === 'ReviewRequired') {
      reasonCode = 'ReviewRequired';
      isValid = false;
    } else if (record.opportunityStatus === 'Rejected') {
      reasonCode = 'Rejected';
      isValid = false;
    } else if (record.opportunityStatus === 'Converted') {
      reasonCode = 'Converted';
    } else if (
      record.opportunityStatus === 'Archived' ||
      record.opportunityStatus === 'DeletedReferenceOnly'
    ) {
      reasonCode = 'Archived';
      isValid = false;
    } else if (record.qualificationStatus !== 'Qualified') {
      reasonCode = 'Unqualified';
      isValid = false;
    }
    return {
      ok: true,
      value: {
        isValid,
        opportunityReferenceId: input.opportunityReferenceId,
        opportunityType: record.opportunityType,
        status: record.opportunityStatus,
        qualificationStatus: record.qualificationStatus,
        reasonCode,
        customerReferenceHint: record.customerReferenceIds.length > 0,
        orderReferenceHint: Boolean(record.convertedOrderReferenceId),
        policyHint: 'Allowed'
      }
    };
  }

  archiveOpportunity(input: {
    readonly opportunityReferenceId: string;
    readonly reasonReferenceId: string;
    readonly idempotencyKey?: string | null;
    readonly governance: CoreOpportunityGovernanceContext;
  }): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const current = this.deps.store.get(input.opportunityReferenceId);
    if (!current)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        input.governance.correlationId
      );
    const governed = ensureGovernance(input.governance, {
      operation: 'opportunity.archive',
      permission: 'opportunity:archive',
      policyScope: 'opportunity.lifecycle',
      target: input.opportunityReferenceId,
      reviewRequired: true
    });
    if (!governed.ok) return governed;
    if (
      !['Rejected', 'Deferred', 'Converted'].includes(current.opportunityStatus)
    )
      return safe(
        'InvalidOpportunityTransition',
        'State',
        'Opportunity cannot be archived from its current state.',
        input.governance.correlationId
      );
    if (!opaque.test(input.reasonReferenceId))
      return safe(
        'OpportunityReasonReferenceRequired',
        'Validation',
        'Opportunity archive requires a reason reference.',
        input.governance.correlationId
      );
    return this.mutate(
      input.opportunityReferenceId,
      'archiveOpportunity',
      input.idempotencyKey,
      input.governance,
      { reasonReferenceId: input.reasonReferenceId },
      (record, now) => ({
        ...record,
        opportunityStatus: 'Archived',
        objectRecord: updatedObject(
          record,
          now,
          input.governance.permission.actorReferenceId,
          'Archived'
        )
      }),
      CORE_EVENT_ACTIONS.archived,
      'opportunity-archived'
    );
  }

  private linkArray<K extends string>(
    input: OpportunityLinkInput<K>,
    operation: string,
    objectType: string,
    domain: string,
    code: CoreErrorCode,
    field:
      | 'customerReferenceIds'
      | 'brandReferenceIds'
      | 'trademarkReferenceIds'
      | 'communicationReferenceIds'
  ): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const referenceId = String(
      input[
        Object.keys(input).find(
          (key) =>
            key.endsWith('ReferenceId') && key !== 'opportunityReferenceId'
        ) as K
      ]
    );
    return this.link(
      input.opportunityReferenceId,
      operation,
      referenceId,
      objectType,
      domain,
      code,
      input.idempotencyKey,
      input.governance,
      (record) =>
        record[field].includes(referenceId)
          ? null
          : { ...record, [field]: [...record[field], referenceId] }
    );
  }

  private link(
    opportunityReferenceId: string,
    operation: string,
    relatedReferenceId: string,
    objectType: string,
    domain: string,
    code: CoreErrorCode,
    idempotencyKey: string | null | undefined,
    governance: CoreOpportunityGovernanceContext,
    apply: (
      record: CoreOpportunityServiceRecord
    ) => CoreOpportunityServiceRecord | null
  ): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const current = this.deps.store.get(opportunityReferenceId);
    if (!current)
      return safe(
        'OpportunityNotFound',
        'Reference',
        'Opportunity was not found.',
        governance.correlationId
      );
    const suffix = operation
      .replace('linkOpportunity', 'link_')
      .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
      .replace('__', '_');
    const governed = ensureGovernance(governance, {
      operation: `opportunity.${suffix}`,
      permission: `opportunity:${suffix}`,
      policyScope: 'opportunity.relationship',
      target: opportunityReferenceId
    });
    if (!governed.ok) return governed;
    if (
      ['Converted', 'Archived', 'DeletedReferenceOnly'].includes(
        current.opportunityStatus
      )
    )
      return safe(
        'InvalidOpportunityTransition',
        'State',
        'Finalized Opportunity relationships cannot change.',
        governance.correlationId
      );
    const related = resolveReference(
      this.deps.relatedReferenceRegistry,
      relatedReferenceId,
      objectType,
      domain,
      code,
      governance.correlationId
    );
    if (!related.ok) return related;
    const next = apply(current);
    if (!next)
      return safe(
        'OpportunityRelationshipAlreadyLinked',
        'Conflict',
        'Opportunity relationship is already linked.',
        governance.correlationId
      );
    return this.mutate(
      opportunityReferenceId,
      operation,
      idempotencyKey,
      governance,
      { relatedReferenceId },
      (record, now) => ({
        ...next,
        objectRecord: updatedObject(
          record,
          now,
          governance.permission.actorReferenceId,
          record.opportunityStatus
        )
      }),
      CORE_EVENT_ACTIONS.updated,
      'opportunity-relationship-linked'
    );
  }

  private mutate(
    opportunityReferenceId: string,
    operation: string,
    idempotencyKey: string | null | undefined,
    governance: CoreOpportunityGovernanceContext,
    request: unknown,
    apply: (
      record: CoreOpportunityServiceRecord,
      now: string
    ) => CoreOpportunityServiceRecord,
    action: (typeof CORE_EVENT_ACTIONS)[keyof typeof CORE_EVENT_ACTIONS],
    eventType: string
  ): CoreBehaviorResult<CoreOpportunityServiceRecord> {
    const run = this.deps.idempotencyRegistry.executeBehavior(
      {
        idempotencyKey,
        idempotencyScope: idempotencyScope(governance, operation),
        operationName: operation,
        request,
        permissionAllowed: true,
        policyAllowed: true,
        correlationId: governance.correlationId
      },
      () => {
        const current = this.deps.store.get(opportunityReferenceId);
        if (!current)
          return safe(
            'OpportunityNotFound',
            'Reference',
            'Opportunity was not found.',
            governance.correlationId
          );
        const scope = enforceOrganizationScope(
          governance,
          organizationScopeOf(current)
        );
        if (!scope.ok) return scope;
        const next = apply(current, this.deps.now());
        const valid = validateRecord(next);
        if (!valid.ok) return valid;
        const replaced = this.deps.store.replace(valid.value);
        if (!replaced.ok) return replaced;
        const event = this.deps.eventTracePort.append(
          eventTrace({
            id: this.deps.eventIdFactory(
              operation,
              opportunityReferenceId,
              idempotencyKey ?? ''
            ),
            action,
            eventType,
            opportunityReferenceId,
            occurredAt:
              valid.value.objectRecord.auditMetadata.updatedAt ??
              valid.value.objectRecord.auditMetadata.createdAt,
            governance,
            payload: {
              opportunityReferenceId,
              eventType,
              status: valid.value.opportunityStatus,
              qualificationStatus: valid.value.qualificationStatus
            }
          })
        );
        if (!event.ok) {
          this.deps.store.replace(current);
          return safe(
            'EventTraceFailed',
            'Event',
            'Opportunity event trace failed.',
            governance.correlationId
          );
        }
        return replaced;
      }
    );
    return run.ok ? { ok: true, value: run.value.result } : run;
  }
}

type OpportunityLinkInput<K extends string> = {
  readonly opportunityReferenceId: string;
  readonly idempotencyKey?: string | null;
  readonly governance: CoreOpportunityGovernanceContext;
} & Readonly<Record<K, string>>;
