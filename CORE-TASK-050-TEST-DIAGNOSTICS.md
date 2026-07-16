# CORE-TASK-050 full-suite failure

```text
          assert.ok(codes(validateBook02MvpGapBaseline(baseline)).includes(code))
        
      code: 'ERR_ASSERTION'
      name: 'AssertionError'
      expected: true
      actual: false
      operator: '=='
      stack: |-
        TestContext.<anonymous> (/home/runner/work/markorbit-core/markorbit-core/tests/unit/book-02-mvp-gap-baseline.test.ts:497:14)
        Test.runInAsyncScope (node:async_hooks:214:14)
        Test.run (node:internal/test_runner/test:1047:25)
        Suite.processPendingSubtests (node:internal/test_runner/test:744:18)
        Test.postRun (node:internal/test_runner/test:1173:19)
        Test.run (node:internal/test_runner/test:1101:12)
        async Suite.processPendingSubtests (node:internal/test_runner/test:744:7)
      ...
--
      duration_ms: 1398.468704
      type: 'test'
      ...
    1..12
not ok 35 - Book 02 MVP gap baseline validation
  ---
  duration_ms: 7176.411176
  type: 'suite'
  location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/book-02-mvp-gap-baseline.test.ts:1:1618'
  failureType: 'subtestsFailed'
  error: '2 subtests failed'
  code: 'ERR_TEST_FAILURE'
  ...
# Subtest: Book 02 MVP canonical requirements
    # Subtest: locks exact category and layer counts
    ok 1 - locks exact category and layer counts
      ---
      duration_ms: 1.853546
      type: 'test'
      ...
--
  type: 'suite'
  ...
# Subtest: CORE-TASK-039 Book 02 Service evidence
    # Subtest: preserves Customer through Jurisdiction after later Service batches
    not ok 1 - preserves Customer through Jurisdiction after later Service batches
      ---
      duration_ms: 4.658509
      type: 'test'
      location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-039-book-02-service-evidence.test.ts:1:343'
      failureType: 'testCodeFailure'
      error: |-
        Expected values to be strictly deep-equal:
        + actual - expected
        
          [
        +   'must-service-identity-service',
            'must-service-customer-service',
            'must-service-brand-service',
            'must-service-trademark-service',
        -   'must-service-jurisdiction-service'
          ]
        
      code: 'ERR_ASSERTION'
      name: 'AssertionError'
      expected:
        0: 'must-service-customer-service'
        1: 'must-service-brand-service'
        2: 'must-service-trademark-service'
        3: 'must-service-jurisdiction-service'
      actual:
        0: 'must-service-identity-service'
        1: 'must-service-customer-service'
        2: 'must-service-brand-service'
        3: 'must-service-trademark-service'
      operator: 'deepStrictEqual'
      stack: |-
        TestContext.<anonymous> (/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-039-book-02-service-evidence.test.ts:23:12)
        Test.runInAsyncScope (node:async_hooks:214:14)
        Test.run (node:internal/test_runner/test:1047:25)
        Test.start (node:internal/test_runner/test:944:17)
--
      duration_ms: 0.267724
      type: 'test'
      ...
    1..2
not ok 84 - CORE-TASK-039 Book 02 Service evidence
  ---
  duration_ms: 6.350951
  type: 'suite'
  location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-039-book-02-service-evidence.test.ts:1:288'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
# Subtest: CORE-TASK-039 Jurisdiction Service contract metadata
    # Subtest: locks the promoted canonical behavior metadata
    ok 1 - locks the promoted canonical behavior metadata
      ---
      duration_ms: 1.214604
      type: 'test'
      ...
--
  type: 'suite'
  ...
# Subtest: CORE-TASK-040 Book 02 Service evidence
    # Subtest: preserves Customer through Classification after later Service batches
    not ok 1 - preserves Customer through Classification after later Service batches
      ---
      duration_ms: 3.419729
      type: 'test'
      location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-040-book-02-service-evidence.test.ts:1:381'
      failureType: 'testCodeFailure'
      error: |-
        Expected values to be strictly deep-equal:
        + actual - expected
        
          [
        +   'must-service-identity-service',
            'must-service-customer-service',
            'must-service-brand-service',
            'must-service-trademark-service',
            'must-service-jurisdiction-service',
        -   'must-service-classification-service'
          ]
        
      code: 'ERR_ASSERTION'
      name: 'AssertionError'
      expected:
        0: 'must-service-customer-service'
        1: 'must-service-brand-service'
        2: 'must-service-trademark-service'
        3: 'must-service-jurisdiction-service'
        4: 'must-service-classification-service'
      actual:
        0: 'must-service-identity-service'
        1: 'must-service-customer-service'
        2: 'must-service-brand-service'
        3: 'must-service-trademark-service'
        4: 'must-service-jurisdiction-service'
      operator: 'deepStrictEqual'
      stack: |-
        TestContext.<anonymous> (/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-040-book-02-service-evidence.test.ts:24:12)
        Test.runInAsyncScope (node:async_hooks:214:14)
        Test.run (node:internal/test_runner/test:1047:25)
--
      duration_ms: 0.186411
      type: 'test'
      ...
    1..2
not ok 86 - CORE-TASK-040 Book 02 Service evidence
  ---
  duration_ms: 4.641707
  type: 'suite'
  location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-040-book-02-service-evidence.test.ts:1:326'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
# Subtest: CORE-TASK-040 Classification Service contract metadata
    # Subtest: promotes the index-6 Classification placeholder in place
    ok 1 - promotes the index-6 Classification placeholder in place
      ---
      duration_ms: 4.178897
      type: 'test'
      ...
--
  type: 'suite'
  ...
# Subtest: CORE-TASK-041 Book 02 Service evidence
    # Subtest: promotes Customer through Document in dependency order
    not ok 1 - promotes Customer through Document in dependency order
      ---
      duration_ms: 3.352683
      type: 'test'
      location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-041-book-02-service-evidence.test.ts:1:417'
      failureType: 'testCodeFailure'
      error: |-
        Expected values to be strictly deep-equal:
        + actual - expected
        
          [
        +   'must-service-identity-service',
            'must-service-customer-service',
            'must-service-brand-service',
            'must-service-trademark-service',
            'must-service-jurisdiction-service',
            'must-service-classification-service',
        -   'must-service-document-service'
          ]
        
      code: 'ERR_ASSERTION'
      name: 'AssertionError'
      expected:
        0: 'must-service-customer-service'
        1: 'must-service-brand-service'
        2: 'must-service-trademark-service'
        3: 'must-service-jurisdiction-service'
        4: 'must-service-classification-service'
        5: 'must-service-document-service'
      actual:
        0: 'must-service-identity-service'
        1: 'must-service-customer-service'
        2: 'must-service-brand-service'
        3: 'must-service-trademark-service'
        4: 'must-service-jurisdiction-service'
        5: 'must-service-classification-service'
      operator: 'deepStrictEqual'
      stack: |-
        TestContext.<anonymous> (/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-041-book-02-service-evidence.test.ts:22:12)
        Test.runInAsyncScope (node:async_hooks:214:14)
--
      duration_ms: 0.270438
      type: 'test'
      ...
    1..2
not ok 88 - CORE-TASK-041 Book 02 Service evidence
  ---
  duration_ms: 4.666193
  type: 'suite'
  location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/core-task-041-book-02-service-evidence.test.ts:1:362'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
# Subtest: CORE-TASK-041 Document Service contract metadata
    # Subtest: promotes the index-7 Document placeholder in place
    ok 1 - promotes the index-7 Document placeholder in place
      ---
      duration_ms: 3.799414
      type: 'test'
      ...
--
1..117
# tests 635
# suites 117
# pass 630
# fail 5
# cancelled 0
# skipped 0
# todo 0
# duration_ms 87658.477434
 ELIFECYCLE  Test failed. See above for more details.
```
