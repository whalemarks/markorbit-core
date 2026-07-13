import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOK_02_MVP_GAP_BASELINE,
  validateBook02MvpGapBaseline
} from '../../src/index.ts';
const codes = (issues: readonly { code: string }[]) =>
  issues.map((i) => i.code);
describe('Book 02 MVP gap baseline validation', () => {
  it('validates the canonical baseline and derives incomplete MVP state', () => {
    assert.deepEqual(
      validateBook02MvpGapBaseline(BOOK_02_MVP_GAP_BASELINE),
      []
    );
    assert.equal(
      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete,
      false
    );
    assert.equal(BOOK_02_MVP_GAP_BASELINE.summary.neverInMvp.violationCount, 0);
  });
  it('rejects duplicate, missing, extra, category, and source path drift', () => {
    const b = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    b.requirements[1] = { ...b.requirements[1], id: b.requirements[0].id };
    assert.ok(
      codes(validateBook02MvpGapBaseline(b)).includes(
        'book02.requirements.duplicate_id'
      )
    );
    const m = {
      ...BOOK_02_MVP_GAP_BASELINE,
      requirements: BOOK_02_MVP_GAP_BASELINE.requirements.slice(1)
    };
    assert.ok(
      codes(validateBook02MvpGapBaseline(m)).includes(
        'book02.requirements.missing'
      )
    );
    const e = {
      ...BOOK_02_MVP_GAP_BASELINE,
      requirements: [
        ...BOOK_02_MVP_GAP_BASELINE.requirements,
        BOOK_02_MVP_GAP_BASELINE.requirements[0]
      ]
    };
    assert.ok(
      codes(validateBook02MvpGapBaseline(e)).includes(
        'book02.requirements.extra'
      )
    );
    const c = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    c.requirements[0].category = 'stub_now';
    assert.ok(
      codes(validateBook02MvpGapBaseline(c)).includes(
        'book02.requirements.category_changed'
      )
    );
    const s = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    s.requirements[0].sourcePath = 'changed.md';
    assert.ok(
      codes(validateBook02MvpGapBaseline(s)).includes(
        'book02.requirements.source_path_changed'
      )
    );
  });
  it('rejects invalid evidence paths and missing files', () => {
    for (const file of ['/tmp/x', '../x', 'missing/file.ts']) {
      const b = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
      b.requirements[0].implementationFiles = [file];
      assert.ok(
        codes(validateBook02MvpGapBaseline(b)).some(
          (code) =>
            code === 'book02.evidence.invalid_path' ||
            code === 'book02.evidence.missing_file'
        )
      );
    }
  });
  it('preserves depth distinctions and scope guards', () => {
    const service = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    service.requirements.find((r) => r.layer === 'service').currentDisposition =
      'meets_required_depth';
    assert.ok(
      codes(validateBook02MvpGapBaseline(service)).includes(
        'book02.depth.service_contract_index_only'
      )
    );
    const workflow = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    workflow.requirements.find(
      (r) => r.layer === 'workflow'
    ).currentDisposition = 'meets_required_depth';
    assert.ok(
      codes(validateBook02MvpGapBaseline(workflow)).includes(
        'book02.depth.workflow_skeleton_only'
      )
    );
    const event = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    const er = event.requirements.find(
      (r) => r.currentDisposition === 'semantic_overlap_only'
    );
    er.currentDisposition = 'meets_required_depth';
    assert.ok(
      codes(validateBook02MvpGapBaseline(event)).includes(
        'book02.depth.generic_event_overlap'
      )
    );
    const test = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    test.requirements.find((r) => r.layer === 'test').currentDisposition =
      'meets_required_depth';
    assert.ok(
      codes(validateBook02MvpGapBaseline(test)).includes(
        'book02.depth.test_contract_skeleton_only'
      )
    );
    const stub = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    stub.requirements.find(
      (r) => r.category === 'stub_now'
    ).currentDisposition = 'meets_required_depth';
    assert.ok(
      codes(validateBook02MvpGapBaseline(stub)).includes(
        'book02.scope.stub_production_ready'
      )
    );
    const doc = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    doc.requirements.find(
      (r) => r.category === 'document_only'
    ).currentDisposition = 'meets_required_depth';
    assert.ok(
      codes(validateBook02MvpGapBaseline(doc)).includes(
        'book02.scope.document_only_runtime_complete'
      )
    );
    const never = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    never.requirements.find(
      (r) => r.category === 'never_in_mvp'
    ).currentDisposition = 'violation_present';
    assert.ok(
      codes(validateBook02MvpGapBaseline(never)).includes(
        'book02.scope.never_violation'
      )
    );
  });
  it('rejects static or inconsistent MVP completion claims', () => {
    const b = structuredClone(BOOK_02_MVP_GAP_BASELINE) as any;
    b.summary.acceptance.book02MvpComplete = true;
    assert.ok(
      codes(validateBook02MvpGapBaseline(b)).includes(
        'book02.acceptance.static_or_inconsistent_completion'
      )
    );
  });
});
