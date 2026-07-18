import type {
  Book02MvpAcceptanceCriterionId,
  Book02MvpDisposition,
  Book02MvpLayer,
  Book02MvpRequirement
} from './book-02-mvp-requirements.ts';
import {
  BOOK_02_MVP_GAP_BASELINE,
  type Book02MvpGapBaseline
} from './book-02-mvp-gap-baseline.ts';

export const BOOK_02_POST_SERVICE_AUDIT_TASK = 'CORE-TASK-055' as const;

export type Book02ExecutionWorkstreamId =
  | 'exact-event-contracts'
  | 'api-validator-delegation'
  | 'workflow-preview-apply'
  | 'named-agent-boundaries'
  | 'final-completion-audit';

export interface Book02ExecutionWorkstream {
  readonly id: Book02ExecutionWorkstreamId;
  readonly order: number;
  readonly taskIds: readonly string[];
  readonly requirementIds: readonly string[];
  readonly acceptanceCriterionIds: readonly Book02MvpAcceptanceCriterionId[];
  readonly dependencies: readonly Book02ExecutionWorkstreamId[];
  readonly completionEffect: string;
}

export interface Book02PostServiceCompletionAudit {
  readonly fixtureType: 'book_02_post_service_completion_audit';
  readonly auditTask: typeof BOOK_02_POST_SERVICE_AUDIT_TASK;
  readonly authority: Book02MvpGapBaseline['authority'];
  readonly sourceBaseline: {
    readonly mustBuildTotal: number;
    readonly dispositionCounts: Readonly<Record<string, number>>;
    readonly acceptanceSatisfied: number;
    readonly acceptanceTotal: number;
    readonly book02MvpComplete: boolean;
  };
  readonly serviceClosure: {
    readonly serviceRequirementCount: number;
    readonly meetsRequiredDepthCount: number;
    readonly unresolvedServiceRequirementIds: readonly string[];
    readonly zeroServiceGap: boolean;
  };
  readonly unresolvedInventory: {
    readonly total: number;
    readonly byLayer: Readonly<Record<Book02MvpLayer, number>>;
    readonly byDisposition: Readonly<Record<Book02MvpDisposition, number>>;
    readonly requirementIdsByLayer: Readonly<
      Partial<Record<Book02MvpLayer, readonly string[]>>
    >;
    readonly unresolvedAcceptanceCriterionIds: readonly Book02MvpAcceptanceCriterionId[];
  };
  readonly completionSemantics: {
    readonly domainCriterionId: 'must-build-domains-implemented-or-scaffolded-with-tests';
    readonly domainCriterionSatisfied: boolean;
    readonly domainValidatedSkeletonsAreMvpAccepted: true;
    readonly domainRuntimePromotionRequiredForMvp: false;
    readonly domainRequirementIds: readonly string[];
    readonly completionBlockingNonDomainRequirementIds: readonly string[];
    readonly allAcceptanceCriteriaMustPass: true;
    readonly allNonDomainMustBuildRequirementsMustMeetDepth: true;
    readonly neverInMvpViolationsMustRemainZero: true;
    readonly existingAllMustBuildFormulaWasOverStrict: true;
    readonly resolvedFormula: 'acceptance_plus_non_domain_depth';
  };
  readonly executionWorkstreams: readonly Book02ExecutionWorkstream[];
  readonly nextTask:
    | 'CORE-TASK-057B'
    | 'CORE-TASK-057C'
    | 'CORE-TASK-058A'
    | 'CORE-TASK-058B'
    | 'CORE-TASK-058C'
    | 'CORE-TASK-059';
}

const sortedIds = (requirements: readonly Book02MvpRequirement[]) =>
  requirements.map((requirement) => requirement.id).sort();

const countBy = <T extends string>(values: readonly T[]): Record<T, number> => {
  const counts = {} as Record<T, number>;
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
};

export function deriveBook02PostServiceCompletionAudit(
  baseline: Book02MvpGapBaseline = BOOK_02_MVP_GAP_BASELINE
): Book02PostServiceCompletionAudit {
  const mustBuild = baseline.requirements.filter(
    (requirement) => requirement.category === 'must_build_now'
  );
  const unresolved = mustBuild.filter(
    (requirement) => requirement.currentDisposition !== 'meets_required_depth'
  );
  const services = mustBuild.filter(
    (requirement) => requirement.layer === 'service'
  );
  const unresolvedServices = services.filter(
    (requirement) => requirement.currentDisposition !== 'meets_required_depth'
  );
  const domains = mustBuild.filter(
    (requirement) => requirement.layer === 'domain'
  );
  const nonDomainBlockers = unresolved.filter(
    (requirement) => requirement.layer !== 'domain'
  );
  const unresolvedCriteria = baseline.acceptanceCriteria
    .filter((criterion) => !criterion.satisfied)
    .map((criterion) => criterion.id);
  const domainCriterion = baseline.acceptanceCriteria.find(
    (criterion) =>
      criterion.id === 'must-build-domains-implemented-or-scaffolded-with-tests'
  );

  const requirementIdsByLayer: Partial<
    Record<Book02MvpLayer, readonly string[]>
  > = {};
  for (const layer of [...new Set(unresolved.map((entry) => entry.layer))]) {
    requirementIdsByLayer[layer] = sortedIds(
      unresolved.filter((entry) => entry.layer === layer)
    );
  }

  const exactEventIds = sortedIds(
    unresolved.filter((entry) => entry.layer === 'event')
  );
  const apiIds = sortedIds(unresolved.filter((entry) => entry.layer === 'api'));
  const workflowIds = sortedIds(
    unresolved.filter((entry) => entry.layer === 'workflow')
  );
  const agentIds = sortedIds(
    unresolved.filter((entry) => entry.layer === 'agent')
  );
  const testIds = sortedIds(
    unresolved.filter((entry) => entry.layer === 'test')
  );

  return {
    fixtureType: 'book_02_post_service_completion_audit',
    auditTask: BOOK_02_POST_SERVICE_AUDIT_TASK,
    authority: baseline.authority,
    sourceBaseline: {
      mustBuildTotal: baseline.summary.mustBuildNow.total,
      dispositionCounts: { ...baseline.summary.mustBuildNow },
      acceptanceSatisfied:
        baseline.summary.acceptance.acceptanceCriteriaSatisfied,
      acceptanceTotal: baseline.summary.acceptance.acceptanceCriteriaTotal,
      book02MvpComplete: baseline.summary.acceptance.book02MvpComplete
    },
    serviceClosure: {
      serviceRequirementCount: services.length,
      meetsRequiredDepthCount: services.filter(
        (requirement) =>
          requirement.currentDisposition === 'meets_required_depth'
      ).length,
      unresolvedServiceRequirementIds: sortedIds(unresolvedServices),
      zeroServiceGap: unresolvedServices.length === 0
    },
    unresolvedInventory: {
      total: unresolved.length,
      byLayer: countBy(unresolved.map((entry) => entry.layer)),
      byDisposition: countBy(
        unresolved.map((entry) => entry.currentDisposition)
      ),
      requirementIdsByLayer,
      unresolvedAcceptanceCriterionIds: unresolvedCriteria
    },
    completionSemantics: {
      domainCriterionId:
        'must-build-domains-implemented-or-scaffolded-with-tests',
      domainCriterionSatisfied: domainCriterion?.satisfied === true,
      domainValidatedSkeletonsAreMvpAccepted: true,
      domainRuntimePromotionRequiredForMvp: false,
      domainRequirementIds: sortedIds(domains),
      completionBlockingNonDomainRequirementIds: sortedIds(nonDomainBlockers),
      allAcceptanceCriteriaMustPass: true,
      allNonDomainMustBuildRequirementsMustMeetDepth: true,
      neverInMvpViolationsMustRemainZero: true,
      existingAllMustBuildFormulaWasOverStrict: true,
      resolvedFormula: 'acceptance_plus_non_domain_depth'
    },
    executionWorkstreams: [
      {
        id: 'exact-event-contracts',
        order: 1,
        taskIds: ['CORE-TASK-056'],
        requirementIds: exactEventIds,
        acceptanceCriterionIds: [],
        dependencies: [],
        completionEffect:
          'Replace semantic overlap with explicit canonical MVP Event records or validated aliases before higher-layer contracts consume Event references.'
      },
      {
        id: 'api-validator-delegation',
        order: 2,
        taskIds: ['CORE-TASK-057A', 'CORE-TASK-057B', 'CORE-TASK-057C'],
        requirementIds: [
          ...apiIds,
          ...testIds.filter((id) => id === 'must-test-api-contract-tests')
        ],
        acceptanceCriterionIds: [
          'must-build-api-validators-exist',
          'api-layer-does-not-emit-events-directly'
        ],
        dependencies: ['exact-event-contracts'],
        completionEffect:
          'Add request/response/reference/governance/version/idempotency validators, Service delegation, safe errors, and executable no-direct-mutation/no-direct-Event tests for all 18 MVP APIs.'
      },
      {
        id: 'workflow-preview-apply',
        order: 3,
        taskIds: ['CORE-TASK-058A', 'CORE-TASK-058B', 'CORE-TASK-058C'],
        requirementIds: [
          ...workflowIds,
          ...testIds.filter((id) => id === 'must-test-workflow-contract-tests')
        ],
        acceptanceCriterionIds: [
          'customer-intake-workflow-supports-preview-apply',
          'trademark-application-workflow-supports-preview-apply',
          'communication-review-workflow-supports-preview-apply',
          'workflow-layer-does-not-emit-events-directly'
        ],
        dependencies: ['exact-event-contracts', 'api-validator-delegation'],
        completionEffect:
          'Implement bounded preview/apply validators, Task plans, review and AI boundaries, Permission/Policy and idempotency checks, safe Event references, and no direct Workflow Event emission.'
      },
      {
        id: 'named-agent-boundaries',
        order: 4,
        taskIds: ['CORE-TASK-059'],
        requirementIds: [
          ...agentIds,
          ...testIds.filter((id) => id === 'must-test-agent-boundary-tests')
        ],
        acceptanceCriterionIds: ['agent-layer-does-not-emit-events-directly'],
        dependencies: ['workflow-preview-apply'],
        completionEffect:
          'Create five named boundary-safe Agent scaffolds and executable forbidden-action/no-direct-Event tests without building a full Agent runtime.'
      },
      {
        id: 'final-completion-audit',
        order: 5,
        taskIds: ['CORE-TASK-060'],
        requirementIds: [],
        acceptanceCriterionIds: [],
        dependencies: [
          'exact-event-contracts',
          'api-validator-delegation',
          'workflow-preview-apply',
          'named-agent-boundaries'
        ],
        completionEffect:
          'Regenerate all fixtures, prove every non-Domain Must Build requirement reaches its locked depth, prove all 19 acceptance criteria pass, and set Book 02 MVP complete without deepening deferred or forbidden capabilities.'
      }
    ],
    nextTask:
      apiIds.length > 6
        ? 'CORE-TASK-057B'
        : apiIds.length > 0
          ? 'CORE-TASK-057C'
          : baseline.summary.acceptance.unresolvedCriteria.includes(
                'customer-intake-workflow-supports-preview-apply'
              )
            ? 'CORE-TASK-058A'
            : baseline.summary.acceptance.unresolvedCriteria.includes(
                  'trademark-application-workflow-supports-preview-apply'
                )
              ? 'CORE-TASK-058B'
              : baseline.summary.acceptance.unresolvedCriteria.includes(
                    'communication-review-workflow-supports-preview-apply'
                  )
                ? 'CORE-TASK-058C'
                : 'CORE-TASK-059'
  };
}

export const BOOK_02_POST_SERVICE_COMPLETION_AUDIT =
  deriveBook02PostServiceCompletionAudit();
