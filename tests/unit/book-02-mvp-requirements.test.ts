import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AGENT_REQUIRED_CAPABILITIES,
  API_REQUIRED_CAPABILITIES,
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
