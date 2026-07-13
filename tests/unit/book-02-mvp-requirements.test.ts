import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AGENT_REQUIRED_CAPABILITIES,
  API_REQUIRED_CAPABILITIES,
  BOOK_02_GUARD_INSPECTION_RULES,
  BOOK_02_EXPECTED_COUNTS,
  BOOK_02_MVP_REQUIREMENT_IDENTITIES,
  COMMON_CONTRACTS,
  COMMON_CONTRACT_DEPTHS,
  DEFER_ITEMS,
  DOCUMENT_ONLY_ITEMS,
  EVENT_REQUIRED_CAPABILITIES,
  MUST_BUILD_AGENTS,
  MUST_BUILD_DOMAINS,
  MUST_BUILD_EVENTS,
  MUST_BUILD_TESTS,
  MUST_BUILD_WORKFLOWS,
  MVP_ACCEPTANCE_CRITERIA,
  MVP_ACCEPTANCE_CRITERION_DEPENDENCIES,
  MVP_ACCEPTANCE_CRITERION_IDS,
  NEVER_IN_MVP_ITEMS,
  STUB_AGENTS,
  STUB_DOMAINS,
  STUB_WORKFLOWS,
  TEST_REQUIRED_CAPABILITIES,
  WORKFLOW_REQUIRED_CAPABILITIES
} from '../../src/index.ts';

describe('Book 02 MVP canonical requirements', () => {
  it('locks exact category and layer counts', () => {
    const reqs = BOOK_02_MVP_REQUIREMENT_IDENTITIES;
    assert.equal(
      reqs.filter((r) => r.category === 'must_build_now').length,
      BOOK_02_EXPECTED_COUNTS.mustBuildNow
    );
    assert.equal(
      reqs.filter(
        (r) => r.category === 'must_build_now' && r.layer === 'domain'
      ).length,
      18
    );
    assert.equal(
      reqs.filter(
        (r) => r.category === 'must_build_now' && r.layer === 'object'
      ).length,
      18
    );
    assert.equal(
      reqs.filter(
        (r) => r.category === 'must_build_now' && r.layer === 'service'
      ).length,
      18
    );
    assert.equal(
      reqs.filter(
        (r) => r.category === 'must_build_now' && r.layer === 'common_contract'
      ).length,
      10
    );
    assert.equal(
      reqs.filter((r) => r.category === 'must_build_now' && r.layer === 'api')
        .length,
      18
    );
    assert.equal(
      reqs.filter(
        (r) => r.category === 'must_build_now' && r.layer === 'workflow'
      ).length,
      3
    );
    assert.equal(
      reqs.filter((r) => r.category === 'must_build_now' && r.layer === 'event')
        .length,
      18
    );
    assert.equal(
      reqs.filter((r) => r.category === 'must_build_now' && r.layer === 'agent')
        .length,
      5
    );
    assert.equal(
      reqs.filter((r) => r.category === 'must_build_now' && r.layer === 'test')
        .length,
      7
    );
    assert.equal(reqs.filter((r) => r.category === 'stub_now').length, 31);
    assert.equal(reqs.filter((r) => r.category === 'document_only').length, 14);
    assert.equal(reqs.filter((r) => r.category === 'defer').length, 17);
    assert.equal(reqs.filter((r) => r.category === 'never_in_mvp').length, 18);
    assert.equal(MVP_ACCEPTANCE_CRITERIA.length, 19);
  });
  it('preserves deterministic exact Book 02 identities', () => {
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.slice(0, 18).map((r) =>
        r.name.toLowerCase().replaceAll(' ', '-')
      ),
      [...MUST_BUILD_DOMAINS]
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.slice(54, 64).map((r) =>
        r.id.replace('must-common-', '')
      ),
      [...COMMON_CONTRACTS]
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.slice(82, 85).map((r) =>
        r.id.replace('must-workflow-', '')
      ),
      [...MUST_BUILD_WORKFLOWS]
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.slice(85, 103).map((r) =>
        r.id.replace('must-event-', '')
      ),
      [...MUST_BUILD_EVENTS]
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.slice(103, 108).map((r) =>
        r.id.replace('must-agent-', '')
      ),
      [...MUST_BUILD_AGENTS]
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.slice(108, 115).map((r) =>
        r.id.replace('must-test-', '')
      ),
      [...MUST_BUILD_TESTS]
    );
    assert.equal(
      STUB_DOMAINS.length +
        STUB_DOMAINS.length +
        STUB_DOMAINS.length +
        STUB_WORKFLOWS.length +
        STUB_AGENTS.length,
      31
    );
    assert.deepEqual(
      [...DOCUMENT_ONLY_ITEMS],
      [
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
      ]
    );
    assert.deepEqual(
      [...DEFER_ITEMS],
      [
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
      ]
    );
    assert.deepEqual(
      [...NEVER_IN_MVP_ITEMS],
      [
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
      ]
    );
  });

  it('uses Book 02 Sections 5.x and 6.x for Must Build and Stub inventories', () => {
    const sectionByLayer = new Map([
      ['domain', 'Section 5.1'],
      ['object', 'Section 5.2'],
      ['service', 'Section 5.3'],
      ['common_contract', 'Section 5.4'],
      ['api', 'Section 5.5'],
      ['workflow', 'Section 5.6'],
      ['event', 'Section 5.7'],
      ['agent', 'Section 5.8'],
      ['test', 'Section 5.9']
    ]);
    for (const requirement of BOOK_02_MVP_REQUIREMENT_IDENTITIES.filter(
      (r) => r.category === 'must_build_now'
    )) {
      assert.equal(
        requirement.sourceSection,
        sectionByLayer.get(requirement.layer)
      );
      assert.equal(requirement.sourceSection.startsWith('Section 3.'), false);
    }
    const stubSectionByLayer = new Map([
      ['domain', 'Section 6.1'],
      ['service', 'Section 6.2'],
      ['api', 'Section 6.3'],
      ['workflow', 'Section 6.4'],
      ['agent', 'Section 6.5']
    ]);
    for (const requirement of BOOK_02_MVP_REQUIREMENT_IDENTITIES.filter(
      (r) => r.category === 'stub_now'
    )) {
      assert.equal(
        requirement.sourceSection,
        stubSectionByLayer.get(requirement.layer)
      );
      assert.equal(requirement.sourceSection.startsWith('Section 4.'), false);
    }
  });

  it('preserves exact acceptance criterion literal registries', () => {
    assert.equal(MVP_ACCEPTANCE_CRITERION_IDS.length, 19);
    assert.equal(
      new Set(MVP_ACCEPTANCE_CRITERION_IDS).size,
      MVP_ACCEPTANCE_CRITERION_IDS.length
    );
    assert.deepEqual(Object.keys(MVP_ACCEPTANCE_CRITERION_DEPENDENCIES), [
      ...MVP_ACCEPTANCE_CRITERION_IDS
    ]);
    assert.deepEqual(
      MVP_ACCEPTANCE_CRITERIA.map((criterion) => criterion.id),
      [...MVP_ACCEPTANCE_CRITERION_IDS]
    );
    const arbitraryCriterionId: string = 'arbitrary-criterion-id';
    assert.equal(
      new Set<string>(MVP_ACCEPTANCE_CRITERION_IDS).has(arbitraryCriterionId),
      false
    );
  });

  it('covers every exact guard requirement with non-empty inspection rules', () => {
    const ruleIds = Object.keys(BOOK_02_GUARD_INSPECTION_RULES).sort();
    const expectedDocumentRules = DOCUMENT_ONLY_ITEMS.map(
      (item) => `document-only-${item}`
    );
    const expectedDeferRules = DEFER_ITEMS.map((item) => `defer-${item}`);
    const expectedNeverRules = NEVER_IN_MVP_ITEMS.map(
      (item) => `never-${item}`
    );
    const expected = [
      ...expectedDocumentRules,
      ...expectedDeferRules,
      ...expectedNeverRules
    ].sort();
    assert.deepEqual(ruleIds, expected);
    assert.equal(expectedDocumentRules.length, 14);
    assert.equal(expectedDeferRules.length, 17);
    assert.equal(expectedNeverRules.length, 18);
    assert.equal(ruleIds.length, 49);
    for (const id of ruleIds) {
      const rule =
        BOOK_02_GUARD_INSPECTION_RULES[
          id as keyof typeof BOOK_02_GUARD_INSPECTION_RULES
        ];
      assert.ok(rule.inspectionPaths.length > 0);
      assert.ok(rule.excludedPaths.length > 0);
      assert.ok(
        rule.forbiddenIndicators.length > 0 ||
          (rule.forbiddenPathPatterns?.length ?? 0) > 0 ||
          (rule.structuredChecks?.length ?? 0) > 0
      );
    }
  });

  it('uses canonical source roots and exact capabilities', () => {
    assert.equal(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find(
        (r) => r.id === 'must-common-references'
      )?.sourcePath,
      'books/book-02-core-specification/core-specs/contracts/common/references.md'
    );
    assert.equal(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find(
        (r) => r.id === 'must-api-identity-api-contract'
      )?.sourcePath,
      'books/book-02-core-specification/core-specs/contracts/api/identity-api-contract.md'
    );
    assert.equal(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find(
        (r) => r.id === 'must-test-common-contract-tests'
      )?.sourcePath,
      'books/book-02-core-specification/core-specs/contracts/tests/common-contract-tests.md'
    );
    assert.equal(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find(
        (r) => r.id === 'must-object-event'
      )?.sourcePath,
      'books/book-02-core-specification/core-specs/objects/event.md'
    );
    assert.equal(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.some((r) =>
        r.sourcePath.includes('event-object.md')
      ),
      false
    );
    assert.deepEqual(COMMON_CONTRACT_DEPTHS, {
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
    });
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find((r) => r.layer === 'api')
        ?.requiredCapabilities,
      API_REQUIRED_CAPABILITIES
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find((r) => r.layer === 'workflow')
        ?.requiredCapabilities,
      WORKFLOW_REQUIRED_CAPABILITIES
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find((r) => r.layer === 'event')
        ?.requiredCapabilities,
      EVENT_REQUIRED_CAPABILITIES
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find((r) => r.layer === 'agent')
        ?.requiredCapabilities,
      AGENT_REQUIRED_CAPABILITIES
    );
    assert.deepEqual(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.find((r) => r.layer === 'test')
        ?.requiredCapabilities,
      TEST_REQUIRED_CAPABILITIES
    );
  });
  it('has no numbered placeholders or category substitutions', () => {
    const ids = [
      ...BOOK_02_MVP_REQUIREMENT_IDENTITIES.map((r) => r.id),
      ...MVP_ACCEPTANCE_CRITERIA.map((c) => c.id)
    ];
    assert.equal(
      ids.some((id) =>
        /document-only-\d|defer-\d|book-02-mvp-acceptance-\d/.test(id)
      ),
      false
    );
    const neverIds: readonly string[] = NEVER_IN_MVP_ITEMS;
    assert.equal(neverIds.includes('full-workflow-engine'), false);
    assert.equal(neverIds.includes('full-policy-engine'), false);
    assert.equal(neverIds.includes('payment-execution'), false);
  });
});
