export type Book02MvpCategory =
  'must_build_now' | 'stub_now' | 'document_only' | 'defer' | 'never_in_mvp';
export type Book02MvpLayer =
  | 'domain'
  | 'object'
  | 'service'
  | 'common_contract'
  | 'api'
  | 'workflow'
  | 'event'
  | 'agent'
  | 'test'
  | 'guard';
export type Book02MvpDisposition =
  | 'meets_required_depth'
  | 'partial_evidence'
  | 'validated_skeleton_only'
  | 'boundary_scaffold_only'
  | 'semantic_overlap_only'
  | 'fixture_only'
  | 'documented_only'
  | 'missing'
  | 'not_required'
  | 'violation_present';
export type Book02MvpDepth =
  | 'level_0'
  | 'level_1'
  | 'level_2'
  | 'level_2_3'
  | 'level_1_2'
  | 'level_3'
  | 'forbidden';
export type Book02GuardInspectionStatus = 'complete' | 'incomplete';

export interface Book02MvpRequirementIdentity {
  readonly id: string;
  readonly name: string;
  readonly category: Book02MvpCategory;
  readonly layer: Book02MvpLayer;
  readonly sourcePath: string;
  readonly sourceSection: string;
  readonly requiredImplementationKind: string;
  readonly requiredCapabilities: readonly string[];
  readonly requiredDepth?: Book02MvpDepth;
  readonly dependencies: readonly string[];
}
export interface Book02MvpRequirement extends Book02MvpRequirementIdentity {
  readonly currentDisposition: Book02MvpDisposition;
  readonly currentDepth?: Book02MvpDepth;
  readonly contractIds: readonly string[];
  readonly implementationFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly fixtureFiles: readonly string[];
  readonly inspectionPaths?: readonly string[];
  readonly forbiddenIndicators?: readonly string[];
  readonly forbiddenPathPatterns?: readonly string[];
  readonly structuredChecks?: readonly Book02StructuredGuardCheck[];
  readonly excludedPaths?: readonly string[];
  readonly inspectionStatus?: Book02GuardInspectionStatus;
  readonly inspectedFiles?: readonly string[];
  readonly violationReasons?: readonly string[];
  readonly gapReasons: readonly string[];
}
export const MVP_ACCEPTANCE_CRITERION_IDS = [
  'must-build-domains-implemented-or-scaffolded-with-tests',
  'must-build-objects-have-public-reference-ids',
  'must-build-services-own-behavior',
  'must-build-api-validators-exist',
  'customer-intake-workflow-supports-preview-apply',
  'trademark-application-workflow-supports-preview-apply',
  'communication-review-workflow-supports-preview-apply',
  'permission-and-policy-fail-closed',
  'ai-forbidden-actions-are-blocked',
  'human-review-gates-protected-actions',
  'idempotency-replay-and-conflict-are-tested',
  'event-trace-exists-and-is-not-command',
  'api-layer-does-not-emit-events-directly',
  'workflow-layer-does-not-emit-events-directly',
  'agent-layer-does-not-emit-events-directly',
  'errors-are-safe',
  'unsupported-versions-fail-closed',
  'deferred-items-do-not-block-mvp',
  'never-in-mvp-items-are-not-implemented'
] as const;
export type Book02MvpAcceptanceCriterionId =
  (typeof MVP_ACCEPTANCE_CRITERION_IDS)[number];

export interface Book02MvpAcceptanceCriterionIdentity {
  readonly id: Book02MvpAcceptanceCriterionId;
  readonly name: string;
  readonly sourcePath: string;
  readonly sourceSection: string;
  readonly dependencies: readonly string[];
}
export interface Book02MvpAcceptanceCriterion extends Book02MvpAcceptanceCriterionIdentity {
  readonly satisfied: boolean;
  readonly evidenceRequirementIds: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly evidenceFiles: readonly string[];
  readonly unresolvedReasons: readonly string[];
}

export const BOOK_02_AUTHORITY = {
  repository: 'whalemarks/markorbit-publication',
  commit: '3349ecb8955021a8714d023348f8b24f941eb98f',
  files: [
    'books/book-02-core-specification/core-specs/implementation/mvp-cut-v0.1.md',
    'books/book-02-core-specification/core-specs/implementation/implementation-depth-matrix.md',
    'books/book-02-core-specification/core-specs/TRACEABILITY.md',
    'books/book-02-core-specification/core-specs/validation/traceability-validation.md'
  ]
} as const;
export const BOOK_02_EXPECTED_COUNTS = {
  mustBuildNow: 115,
  stubNow: 31,
  documentOnly: 14,
  defer: 17,
  neverInMvp: 18,
  acceptanceCriteria: 19,
  fixtureCount: 35
} as const;
const book = 'books/book-02-core-specification/core-specs';
const mvpCut = `${book}/implementation/mvp-cut-v0.1.md`;
const cap = (s: string) =>
  s
    .split('-')
    .map((p) => `${p[0]?.toUpperCase() ?? ''}${p.slice(1)}`)
    .join(' ');
const req = (
  id: string,
  name: string,
  category: Book02MvpCategory,
  layer: Book02MvpLayer,
  sourcePath: string,
  sourceSection: string,
  requiredImplementationKind: string,
  requiredCapabilities: readonly string[],
  requiredDepth?: Book02MvpDepth,
  dependencies: readonly string[] = []
): Book02MvpRequirementIdentity => ({
  id,
  name,
  category,
  layer,
  sourcePath,
  sourceSection,
  requiredImplementationKind,
  requiredCapabilities,
  requiredDepth,
  dependencies
});

export const MUST_BUILD_DOMAINS = [
  'identity',
  'organization',
  'user',
  'permission',
  'policy',
  'customer',
  'brand',
  'trademark',
  'jurisdiction',
  'classification',
  'document',
  'evidence',
  'matter',
  'order',
  'workflow-contract',
  'task',
  'event',
  'communication'
] as const;
export const COMMON_CONTRACTS = [
  'references',
  'errors',
  'permission-context',
  'policy-context',
  'idempotency',
  'audit-context',
  'versioning',
  'pagination',
  'ai-context',
  'human-review'
] as const;
export const COMMON_CONTRACT_DEPTHS = {
  references: 'level_3',
  errors: 'level_3',
  'permission-context': 'level_2_3',
  'policy-context': 'level_1_2',
  idempotency: 'level_3',
  'audit-context': 'level_2',
  versioning: 'level_1',
  pagination: 'level_2',
  'ai-context': 'level_1',
  'human-review': 'level_2'
} as const satisfies Record<(typeof COMMON_CONTRACTS)[number], Book02MvpDepth>;
export const MUST_BUILD_WORKFLOWS = [
  'customer-intake-workflow',
  'trademark-application-workflow',
  'communication-review-workflow'
] as const;
export const MUST_BUILD_EVENTS = [
  'customer-created',
  'brand-created',
  'trademark-created',
  'matter-created',
  'order-created',
  'document-created',
  'document-attached',
  'evidence-created',
  'task-created',
  'task-updated',
  'task-completed',
  'communication-created',
  'communication-reviewed',
  'communication-sent',
  'workflow-contract-previewed',
  'workflow-contract-applied',
  'permission-evaluated',
  'policy-evaluated'
] as const;
export const MUST_BUILD_AGENTS = [
  'knowledge-agent',
  'task-agent',
  'communication-agent',
  'workflow-agent',
  'audit-agent'
] as const;
export const MUST_BUILD_TESTS = [
  'common-contract-tests',
  'api-contract-tests',
  'workflow-contract-tests',
  'agent-boundary-tests',
  'permission-policy-tests',
  'idempotency-event-tests',
  'error-versioning-tests'
] as const;
export type Book02MvpTestFamilyId = (typeof MUST_BUILD_TESTS)[number];
export interface Book02MvpTestFamilyEvidence {
  readonly contractId: string;
  readonly implementationFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly provenCapabilities: readonly string[];
  readonly unresolvedCapabilities: readonly string[];
}
export const STUB_DOMAINS = [
  'knowledge',
  'notification',
  'opportunity',
  'partner',
  'agent',
  'service-provider',
  'service-network',
  'routing'
] as const;
export const STUB_WORKFLOWS = [
  'office-action-response-workflow',
  'provider-routing-workflow',
  'renewal-workflow',
  'assignment-workflow',
  'evidence-review-workflow'
] as const;
export const STUB_AGENTS = [
  'routing-agent',
  'advanced-agent-registry-runtime'
] as const;
export const DOCUMENT_ONLY_ITEMS = [
  'full-policy-engine',
  'full-agent-runtime-orchestration',
  'full-workflow-engine',
  'external-official-filing-integrations',
  'foreign-associate-live-network-integrations',
  'payment-execution',
  'provider-marketplace-settlement',
  'advanced-analytics',
  'advanced-service-network-optimization',
  'multi-product-app-marketplace',
  'public-developer-api-portal',
  'ai-autonomous-workflow-execution',
  'official-deadline-certification-automation',
  'professional-registrability-decision-automation'
] as const;
export const DEFER_ITEMS = [
  'renewal-production-workflow',
  'assignment-production-workflow',
  'office-action-response-production-workflow',
  'evidence-review-production-workflow',
  'provider-routing-production-workflow',
  'foreign-agent-onboarding-automation',
  'partner-facing-mini-program',
  'client-self-service-filing-portal',
  'global-jurisdiction-rule-automation',
  'official-fee-calculation-engine',
  'trademark-watch-monitoring',
  'bulk-opportunity-generation',
  'service-provider-scoring',
  'communication-delivery-integrations',
  'document-e-signature-integration',
  'external-storage-integrations',
  'billing-and-invoice-automation'
] as const;
export const NEVER_IN_MVP_ITEMS = [
  'ai-submitting-official-filings',
  'ai-certifying-legal-deadlines',
  'ai-certifying-trademark-registrability',
  'ai-deciding-evidence-sufficiency-as-professional-truth',
  'ai-selecting-service-provider-as-final-decision',
  'ai-sending-external-communication-without-human-review',
  'api-layer-mutating-domain-state-directly',
  'workflow-layer-creating-active-tasks-outside-task-service',
  'workflow-layer-emitting-domain-events-directly',
  'agent-layer-emitting-events-directly',
  'event-references-triggering-commands',
  'permission-bypass-for-convenience',
  'policy-bypass-for-convenience',
  'production-data-fixtures',
  'raw-database-ids-in-public-responses',
  'unsafe-stack-traces-in-api-responses',
  'silent-unsupported-version-acceptance',
  'silent-historical-version-rewriting'
] as const;

export type Book02GuardRequirementId =
  | `document-only-${(typeof DOCUMENT_ONLY_ITEMS)[number]}`
  | `defer-${(typeof DEFER_ITEMS)[number]}`
  | `never-${(typeof NEVER_IN_MVP_ITEMS)[number]}`;
export type Book02StructuredGuardCheck =
  | `package-dependency:${string}`
  | `package-script:${string}`
  | `path-exists:${string}`
  | `fixture-type:${string}`
  | `runtime-export:${string}`;
export interface Book02GuardInspectionRule {
  readonly inspectionPaths: readonly string[];
  readonly excludedPaths: readonly string[];
  readonly forbiddenIndicators: readonly string[];
  readonly forbiddenPathPatterns?: readonly string[];
  readonly structuredChecks?: readonly Book02StructuredGuardCheck[];
}
const guardPaths = ['src', 'fixtures', 'package.json'] as const;
const guardExclusions = [
  'src/mvp-coverage/',
  'fixtures/mvp-coverage/',
  'tests/',
  'docs/',
  'CHANGELOG.md',
  'CORE-MANIFEST.md',
  'CORE-ROADMAP.md',
  'README.md'
] as const;
const guardRule = (
  forbiddenIndicators: readonly string[],
  forbiddenPathPatterns: readonly string[] = [],
  structuredChecks: readonly Book02StructuredGuardCheck[] = []
): Book02GuardInspectionRule => ({
  inspectionPaths: guardPaths,
  excludedPaths: guardExclusions,
  forbiddenIndicators,
  forbiddenPathPatterns,
  structuredChecks
});
export const BOOK_02_GUARD_INSPECTION_RULES = {
  'document-only-full-policy-engine': guardRule(
    ['createFullPolicyEngine', 'FullPolicyEngine'],
    ['src/policy-engine/'],
    ['runtime-export:createFullPolicyEngine']
  ),
  'document-only-full-agent-runtime-orchestration': guardRule(
    ['createFullAgentRuntimeOrchestration', 'FullAgentRuntimeOrchestrator'],
    ['src/agent-runtime/'],
    ['runtime-export:createFullAgentRuntimeOrchestration']
  ),
  'document-only-full-workflow-engine': guardRule(
    ['createFullWorkflowEngine', 'FullWorkflowEngine'],
    ['src/workflow-engine/'],
    ['runtime-export:createFullWorkflowEngine']
  ),
  'document-only-external-official-filing-integrations': guardRule(
    ['executeOfficialFiling', 'submitOfficialTrademarkApplication'],
    ['src/integrations/official-filing/'],
    ['package-dependency:official-filing-sdk']
  ),
  'document-only-foreign-associate-live-network-integrations': guardRule(
    ['connectForeignAssociateLiveNetwork', 'ForeignAssociateLiveNetworkClient'],
    ['src/integrations/foreign-associate/'],
    ['package-dependency:foreign-associate-network-sdk']
  ),
  'document-only-payment-execution': guardRule(
    ['executePayment', 'PaymentExecution'],
    ['src/payments/'],
    ['package-dependency:stripe']
  ),
  'document-only-provider-marketplace-settlement': guardRule(
    ['settleProviderMarketplacePayment', 'ProviderMarketplaceSettlement'],
    ['src/provider-marketplace/settlement/'],
    ['package-dependency:marketplace-settlement-sdk']
  ),
  'document-only-advanced-analytics': guardRule(
    ['runAdvancedAnalytics', 'AdvancedAnalyticsEngine'],
    ['src/analytics/advanced/'],
    ['package-script:analytics:advanced']
  ),
  'document-only-advanced-service-network-optimization': guardRule(
    ['optimizeAdvancedServiceNetwork', 'AdvancedServiceNetworkOptimizer'],
    ['src/service-network/optimization/'],
    ['runtime-export:optimizeAdvancedServiceNetwork']
  ),
  'document-only-multi-product-app-marketplace': guardRule(
    ['createMultiProductAppMarketplace', 'MultiProductAppMarketplace'],
    ['src/app-marketplace/'],
    ['package-script:marketplace:apps']
  ),
  'document-only-public-developer-api-portal': guardRule(
    ['createPublicDeveloperApiPortal', 'PublicDeveloperApiPortal'],
    ['src/developer-portal/'],
    ['package-script:developer-portal']
  ),
  'document-only-ai-autonomous-workflow-execution': guardRule(
    ['executeAutonomousAiWorkflow', 'AutonomousAiWorkflowExecutor'],
    ['src/ai/autonomous-workflow/'],
    ['runtime-export:executeAutonomousAiWorkflow']
  ),
  'document-only-official-deadline-certification-automation': guardRule(
    ['certifyLegalDeadline', 'OfficialDeadlineCertificationAutomation'],
    ['src/deadlines/certification/'],
    ['runtime-export:certifyLegalDeadline']
  ),
  'document-only-professional-registrability-decision-automation': guardRule(
    [
      'certifyTrademarkRegistrability',
      'ProfessionalRegistrabilityDecisionAutomation'
    ],
    ['src/registrability/automation/'],
    ['runtime-export:certifyTrademarkRegistrability']
  ),
  'defer-renewal-production-workflow': guardRule(
    ['executeRenewalProductionWorkflow', 'RenewalProductionWorkflowRunner'],
    ['src/workflows/renewal/production/'],
    ['runtime-export:executeRenewalProductionWorkflow']
  ),
  'defer-assignment-production-workflow': guardRule(
    [
      'executeAssignmentProductionWorkflow',
      'AssignmentProductionWorkflowRunner'
    ],
    ['src/workflows/assignment/production/'],
    ['runtime-export:executeAssignmentProductionWorkflow']
  ),
  'defer-office-action-response-production-workflow': guardRule(
    [
      'executeOfficeActionResponseProductionWorkflow',
      'OfficeActionResponseProductionWorkflowRunner'
    ],
    ['src/workflows/office-action-response/production/'],
    ['runtime-export:executeOfficeActionResponseProductionWorkflow']
  ),
  'defer-evidence-review-production-workflow': guardRule(
    [
      'executeEvidenceReviewProductionWorkflow',
      'EvidenceReviewProductionWorkflowRunner'
    ],
    ['src/workflows/evidence-review/production/'],
    ['runtime-export:executeEvidenceReviewProductionWorkflow']
  ),
  'defer-provider-routing-production-workflow': guardRule(
    [
      'executeProviderRoutingProductionWorkflow',
      'ProviderRoutingProductionWorkflowRunner'
    ],
    ['src/workflows/provider-routing/production/'],
    ['runtime-export:executeProviderRoutingProductionWorkflow']
  ),
  'defer-foreign-agent-onboarding-automation': guardRule(
    ['automateForeignAgentOnboarding', 'ForeignAgentOnboardingAutomation'],
    ['src/foreign-agent/onboarding/'],
    ['runtime-export:automateForeignAgentOnboarding']
  ),
  'defer-partner-facing-mini-program': guardRule(
    ['launchPartnerMiniProgram', 'PartnerFacingMiniProgram'],
    ['src/partner-mini-program/'],
    ['package-script:partner-mini-program']
  ),
  'defer-client-self-service-filing-portal': guardRule(
    ['launchClientSelfServiceFilingPortal', 'ClientSelfServiceFilingPortal'],
    ['src/client-filing-portal/'],
    ['package-script:client-filing-portal']
  ),
  'defer-global-jurisdiction-rule-automation': guardRule(
    ['automateGlobalJurisdictionRules', 'GlobalJurisdictionRuleAutomation'],
    ['src/jurisdiction-rules/automation/'],
    ['runtime-export:automateGlobalJurisdictionRules']
  ),
  'defer-official-fee-calculation-engine': guardRule(
    ['calculateOfficialFees', 'OfficialFeeCalculationEngine'],
    ['src/fees/official/'],
    ['runtime-export:calculateOfficialFees']
  ),
  'defer-trademark-watch-monitoring': guardRule(
    ['startTrademarkWatchMonitoring', 'TrademarkWatchMonitoringService'],
    ['src/trademark-watch/'],
    ['runtime-export:startTrademarkWatchMonitoring']
  ),
  'defer-bulk-opportunity-generation': guardRule(
    ['generateBulkOpportunities', 'BulkOpportunityGeneration'],
    ['src/opportunities/bulk/'],
    ['runtime-export:generateBulkOpportunities']
  ),
  'defer-service-provider-scoring': guardRule(
    ['scoreServiceProvider', 'ServiceProviderScoringEngine'],
    ['src/service-provider/scoring/'],
    ['runtime-export:scoreServiceProvider']
  ),
  'defer-communication-delivery-integrations': guardRule(
    ['sendExternalCommunication', 'CommunicationDeliveryIntegration'],
    ['src/integrations/communication-delivery/'],
    ['package-dependency:sendgrid']
  ),
  'defer-document-e-signature-integration': guardRule(
    ['executeDocumentESignature', 'DocumentESignatureIntegration'],
    ['src/integrations/e-signature/'],
    ['package-dependency:docusign']
  ),
  'defer-external-storage-integrations': guardRule(
    ['writeExternalStorageObject', 'ExternalStorageIntegration'],
    ['src/integrations/external-storage/'],
    ['package-dependency:@aws-sdk/client-s3']
  ),
  'defer-billing-and-invoice-automation': guardRule(
    ['automateBillingAndInvoicing', 'BillingInvoiceAutomation'],
    ['src/billing/automation/'],
    ['runtime-export:automateBillingAndInvoicing']
  ),
  'never-ai-submitting-official-filings': guardRule(
    ['aiSubmitOfficialFiling', 'submitOfficialFilingWithAi'],
    ['src/ai/official-filing/'],
    ['runtime-export:aiSubmitOfficialFiling']
  ),
  'never-ai-certifying-legal-deadlines': guardRule(
    ['aiCertifyLegalDeadline', 'certifyLegalDeadlineWithAi'],
    ['src/ai/deadline-certification/'],
    ['runtime-export:aiCertifyLegalDeadline']
  ),
  'never-ai-certifying-trademark-registrability': guardRule(
    [
      'aiCertifyTrademarkRegistrability',
      'certifyTrademarkRegistrabilityWithAi'
    ],
    ['src/ai/registrability-certification/'],
    ['runtime-export:aiCertifyTrademarkRegistrability']
  ),
  'never-ai-deciding-evidence-sufficiency-as-professional-truth': guardRule(
    [
      'aiDecideEvidenceSufficiencyAsTruth',
      'EvidenceSufficiencyProfessionalTruth'
    ],
    ['src/ai/evidence-sufficiency/'],
    ['runtime-export:aiDecideEvidenceSufficiencyAsTruth']
  ),
  'never-ai-selecting-service-provider-as-final-decision': guardRule(
    ['selectFinalServiceProvider', 'aiSelectFinalServiceProvider'],
    ['src/ai/provider-selection/'],
    ['runtime-export:selectFinalServiceProvider']
  ),
  'never-ai-sending-external-communication-without-human-review': guardRule(
    [
      'sendExternalCommunicationWithoutReview',
      'aiSendExternalCommunicationWithoutHumanReview'
    ],
    ['src/ai/external-communication/'],
    ['runtime-export:sendExternalCommunicationWithoutReview']
  ),
  'never-api-layer-mutating-domain-state-directly': guardRule(
    ['apiDirectDomainMutation', 'mutateDomainStateFromApi'],
    ['src/api/domain-mutation/'],
    ['runtime-export:apiDirectDomainMutation']
  ),
  'never-workflow-layer-creating-active-tasks-outside-task-service': guardRule(
    ['workflowDirectTaskActivation', 'createActiveTaskOutsideTaskService'],
    ['src/workflows/task-activation/'],
    ['runtime-export:workflowDirectTaskActivation']
  ),
  'never-workflow-layer-emitting-domain-events-directly': guardRule(
    ['workflowDirectEventEmission', 'emitDomainEventFromWorkflow'],
    ['src/workflows/event-emission/'],
    ['runtime-export:workflowDirectEventEmission']
  ),
  'never-agent-layer-emitting-events-directly': guardRule(
    ['agentDirectEventEmission', 'emitDomainEventFromAgent'],
    ['src/agents/event-emission/'],
    ['runtime-export:agentDirectEventEmission']
  ),
  'never-event-references-triggering-commands': guardRule(
    ['eventReferenceCommandExecution', 'executeCommandFromEventReference'],
    ['src/events/command-execution/'],
    ['runtime-export:eventReferenceCommandExecution']
  ),
  'never-permission-bypass-for-convenience': guardRule(
    ['bypassPermissionEvaluation', 'permissionBypassForConvenience'],
    ['src/permissions/bypass/'],
    ['runtime-export:bypassPermissionEvaluation']
  ),
  'never-policy-bypass-for-convenience': guardRule(
    ['bypassPolicyEvaluation', 'policyBypassForConvenience'],
    ['src/policies/bypass/'],
    ['runtime-export:bypassPolicyEvaluation']
  ),
  'never-production-data-fixtures': guardRule(
    ['productionFixture', 'production_data_fixture'],
    ['fixtures/production/'],
    ['fixture-type:production']
  ),
  'never-raw-database-ids-in-public-responses': guardRule(
    ['exposeRawDatabaseId', 'rawDatabaseId'],
    ['src/api/response/raw-database-id/'],
    ['runtime-export:exposeRawDatabaseId']
  ),
  'never-unsafe-stack-traces-in-api-responses': guardRule(
    ['unsafeStackTraceResponse', 'exposeUnsafeStackTrace'],
    ['src/api/errors/unsafe-stack-trace/'],
    ['runtime-export:unsafeStackTraceResponse']
  ),
  'never-silent-unsupported-version-acceptance': guardRule(
    ['acceptUnsupportedVersionSilently', 'silentUnsupportedVersionAcceptance'],
    ['src/versioning/unsupported-silent-acceptance/'],
    ['runtime-export:acceptUnsupportedVersionSilently']
  ),
  'never-silent-historical-version-rewriting': guardRule(
    ['rewriteHistoricalVersionSilently', 'silentHistoricalVersionRewrite'],
    ['src/versioning/historical-rewrite/'],
    ['runtime-export:rewriteHistoricalVersionSilently']
  )
} as const satisfies Record<
  Book02GuardRequirementId,
  Book02GuardInspectionRule
>;

export const API_REQUIRED_CAPABILITIES = [
  'request validation',
  'response validation',
  'reference validation',
  'permission context validation',
  'policy context validation',
  'idempotency validation where duplicate-sensitive',
  'safe error behavior',
  'version validation',
  'owning Service delegation',
  'no direct Domain mutation',
  'no direct Event emission'
] as const;
export const WORKFLOW_REQUIRED_CAPABILITIES = [
  'preview request validation',
  'apply request validation',
  'step validation',
  'Task plan generation or validation',
  'Human Review checkpoint validation',
  'AI assistance boundary validation',
  'Permission validation',
  'Policy validation',
  'Idempotency validation',
  'Event trace reference validation',
  'safe error behavior'
] as const;
export const EVENT_REQUIRED_CAPABILITIES = [
  'event_reference_id',
  'event_type',
  'source_service',
  'subject_reference_id',
  'correlation_id',
  'causation_event_reference_id where applicable',
  'created_at',
  'visibility policy hook',
  'safe payload',
  'schema_version'
] as const;
export const AGENT_REQUIRED_CAPABILITIES = [
  'agent identity',
  'capability metadata',
  'allowed capability validation',
  'forbidden action validation',
  'AI Context output metadata',
  'Human Review preservation',
  'no protected-state mutation',
  'no Event emission',
  'executable boundary tests'
] as const;
export const TEST_REQUIRED_CAPABILITIES = [
  'contract specification',
  'mapped executable test files',
  'positive coverage',
  'negative coverage',
  'execution under pnpm test or a dedicated evidence runner'
] as const;

export const MVP_ACCEPTANCE_CRITERION_DEPENDENCIES = {
  'must-build-domains-implemented-or-scaffolded-with-tests': [
    ...MUST_BUILD_DOMAINS.map((domain) => `must-domain-${domain}`)
  ],
  'must-build-objects-have-public-reference-ids': [
    ...MUST_BUILD_DOMAINS.map((domain) => `must-object-${domain}`)
  ],
  'must-build-services-own-behavior': MUST_BUILD_DOMAINS.map(
    (domain) => `must-service-${domain}-service`
  ),
  'must-build-api-validators-exist': MUST_BUILD_DOMAINS.map(
    (domain) => `must-api-${domain}-api-contract`
  ),
  'customer-intake-workflow-supports-preview-apply': [
    'must-workflow-customer-intake-workflow'
  ],
  'trademark-application-workflow-supports-preview-apply': [
    'must-workflow-trademark-application-workflow'
  ],
  'communication-review-workflow-supports-preview-apply': [
    'must-workflow-communication-review-workflow'
  ],
  'permission-and-policy-fail-closed': [
    'must-common-permission-context',
    'must-common-policy-context',
    'must-test-permission-policy-tests'
  ],
  'ai-forbidden-actions-are-blocked': [
    'must-common-ai-context',
    'must-agent-knowledge-agent',
    'must-test-agent-boundary-tests'
  ],
  'human-review-gates-protected-actions': [
    'must-common-human-review',
    'must-common-permission-context',
    'must-common-policy-context',
    'must-test-permission-policy-tests'
  ],
  'idempotency-replay-and-conflict-are-tested': [
    'must-common-idempotency',
    'must-test-idempotency-event-tests'
  ],
  'event-trace-exists-and-is-not-command': [
    'must-common-idempotency',
    'must-test-idempotency-event-tests',
    'never-event-references-triggering-commands'
  ],
  'api-layer-does-not-emit-events-directly': ['must-test-api-contract-tests'],
  'workflow-layer-does-not-emit-events-directly': [
    'must-test-workflow-contract-tests'
  ],
  'agent-layer-does-not-emit-events-directly': [
    'must-test-agent-boundary-tests'
  ],
  'errors-are-safe': ['must-common-errors', 'must-test-error-versioning-tests'],
  'unsupported-versions-fail-closed': [
    'must-common-versioning',
    'must-test-error-versioning-tests'
  ],
  'deferred-items-do-not-block-mvp': [
    ...DEFER_ITEMS.map((item) => `defer-${item}`),
    ...DOCUMENT_ONLY_ITEMS.map((item) => `document-only-${item}`)
  ],
  'never-in-mvp-items-are-not-implemented': NEVER_IN_MVP_ITEMS.map(
    (item) => `never-${item}`
  )
} as const satisfies Record<Book02MvpAcceptanceCriterionId, readonly string[]>;

export const MVP_ACCEPTANCE_CRITERIA_IDENTITIES =
  MVP_ACCEPTANCE_CRITERION_IDS.map((id) => ({
    id,
    name: cap(id),
    sourcePath: mvpCut,
    sourceSection: 'Section 14',
    dependencies: MVP_ACCEPTANCE_CRITERION_DEPENDENCIES[id]
  })) satisfies readonly Book02MvpAcceptanceCriterionIdentity[];
export const MVP_ACCEPTANCE_CRITERIA = MVP_ACCEPTANCE_CRITERIA_IDENTITIES;

export const BOOK_02_MVP_REQUIREMENT_IDENTITIES: readonly Book02MvpRequirementIdentity[] =
  [
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-domain-${d}`,
        cap(d),
        'must_build_now',
        'domain',
        `${book}/domains/${d}.md`,
        'Section 5.1',
        'structural_contract',
        ['domain boundary']
      )
    ),
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-object-${d}`,
        `${cap(d)} Object`,
        'must_build_now',
        'object',
        `${book}/objects/${d}.md`,
        'Section 5.2',
        'structural_contract',
        ['object contract', 'public reference id']
      )
    ),
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-service-${d}-service`,
        `${cap(d)} Service`,
        'must_build_now',
        'service',
        `${book}/services/${d}-service.md`,
        'Section 5.3',
        'real_boundary_behavior',
        ['real boundary behavior', 'owning service authority']
      )
    ),
    ...COMMON_CONTRACTS.map((c) =>
      req(
        `must-common-${c}`,
        cap(c),
        'must_build_now',
        'common_contract',
        `${book}/contracts/common/${c}.md`,
        'Section 5.4',
        'book_02_depth_matrix_behavior',
        ['contract hook', 'executable behavior evidence'],
        COMMON_CONTRACT_DEPTHS[c]
      )
    ),
    ...MUST_BUILD_DOMAINS.map((d) =>
      req(
        `must-api-${d}-api-contract`,
        `${cap(d)} API Contract`,
        'must_build_now',
        'api',
        `${book}/contracts/api/${d}-api-contract.md`,
        'Section 5.5',
        'validator_and_service_delegation',
        API_REQUIRED_CAPABILITIES
      )
    ),
    ...MUST_BUILD_WORKFLOWS.map((w) =>
      req(
        `must-workflow-${w}`,
        cap(w),
        'must_build_now',
        'workflow',
        `${book}/workflows/${w}.md`,
        'Section 5.6',
        'preview_apply_validator',
        WORKFLOW_REQUIRED_CAPABILITIES
      )
    ),
    ...MUST_BUILD_EVENTS.map((e) =>
      req(
        `must-event-${e}`,
        cap(e),
        'must_build_now',
        'event',
        `${book}/events/${e}.md`,
        'Section 5.7',
        'event_record_or_deterministic_fixture',
        EVENT_REQUIRED_CAPABILITIES
      )
    ),
    ...MUST_BUILD_AGENTS.map((a) =>
      req(
        `must-agent-${a}`,
        cap(a),
        'must_build_now',
        'agent',
        `${book}/agents/${a}.md`,
        'Section 5.8',
        'boundary_safe_scaffold',
        AGENT_REQUIRED_CAPABILITIES
      )
    ),
    ...MUST_BUILD_TESTS.map((t) =>
      req(
        `must-test-${t}`,
        cap(t),
        'must_build_now',
        'test',
        `${book}/contracts/tests/${t}.md`,
        'Section 5.9',
        'executable_test_family',
        TEST_REQUIRED_CAPABILITIES
      )
    ),
    ...STUB_DOMAINS.map((d) =>
      req(
        `stub-domain-${d}`,
        cap(d),
        'stub_now',
        'domain',
        `${book}/domains/${d}.md`,
        'Section 6.1',
        'bounded_stub',
        ['no production execution']
      )
    ),
    ...STUB_DOMAINS.map((d) =>
      req(
        `stub-service-${d}-service`,
        `${cap(d)} Service`,
        'stub_now',
        'service',
        `${book}/services/${d}-service.md`,
        'Section 6.2',
        'bounded_stub',
        ['no production execution']
      )
    ),
    ...STUB_DOMAINS.map((d) =>
      req(
        `stub-api-${d}-api-contract`,
        `${cap(d)} API Contract`,
        'stub_now',
        'api',
        `${book}/contracts/api/${d}-api-contract.md`,
        'Section 6.3',
        'bounded_stub',
        ['validation only']
      )
    ),
    ...STUB_WORKFLOWS.map((w) =>
      req(
        `stub-workflow-${w}`,
        cap(w),
        'stub_now',
        'workflow',
        `${book}/workflows/${w}.md`,
        'Section 6.4',
        'preview_or_validation_only',
        [
          'preview-only or validation-only',
          'no production execution',
          'no official filing',
          'no external communication send',
          'no final provider selection'
        ]
      )
    ),
    ...STUB_AGENTS.map((a) =>
      req(
        `stub-agent-${a}`,
        cap(a),
        'stub_now',
        'agent',
        `${book}/agents/${a}.md`,
        'Section 6.5',
        'bounded_stub',
        ['no production runtime']
      )
    ),
    ...DOCUMENT_ONLY_ITEMS.map((g) =>
      req(
        `document-only-${g}`,
        cap(g),
        'document_only',
        'guard',
        mvpCut,
        'Section 7',
        'document_only',
        ['no runtime implementation']
      )
    ),
    ...DEFER_ITEMS.map((g) =>
      req(
        `defer-${g}`,
        cap(g),
        'defer',
        'guard',
        mvpCut,
        'Section 8',
        'defer',
        ['outside MVP implementation']
      )
    ),
    ...NEVER_IN_MVP_ITEMS.map((g) =>
      req(
        `never-${g}`,
        cap(g),
        'never_in_mvp',
        'guard',
        mvpCut,
        'Section 9',
        'never_in_mvp',
        ['must not be implemented'],
        'forbidden'
      )
    )
  ];
