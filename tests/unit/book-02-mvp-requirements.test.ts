import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOK_02_EXPECTED_COUNTS,
  BOOK_02_MVP_REQUIREMENT_IDENTITIES,
  MUST_BUILD_DOMAINS,
  COMMON_CONTRACTS,
  MUST_BUILD_WORKFLOWS,
  MUST_BUILD_EVENTS,
  MUST_BUILD_AGENTS,
  MUST_BUILD_TESTS,
  STUB_DOMAINS,
  STUB_WORKFLOWS,
  STUB_AGENTS,
  DOCUMENT_ONLY_ITEMS,
  DEFER_ITEMS,
  NEVER_IN_MVP_ITEMS,
  MVP_ACCEPTANCE_CRITERIA
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
  it('preserves deterministic Book 02 order', () => {
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
    assert.equal(DOCUMENT_ONLY_ITEMS.length, 14);
    assert.equal(DEFER_ITEMS.length, 17);
    assert.equal(NEVER_IN_MVP_ITEMS.length, 18);
  });
  it('uses canonical event object source path only', () => {
    const eventObject = BOOK_02_MVP_REQUIREMENT_IDENTITIES.find(
      (r) => r.id === 'must-object-event'
    );
    assert.equal(
      eventObject?.sourcePath,
      'books/book-02-core-specification/core-specs/objects/event.md'
    );
    assert.equal(
      BOOK_02_MVP_REQUIREMENT_IDENTITIES.some((r) =>
        r.sourcePath.includes('event-object.md')
      ),
      false
    );
  });
});
