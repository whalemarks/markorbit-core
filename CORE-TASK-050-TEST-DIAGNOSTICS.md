# CORE-TASK-050 full-suite failure

```text
      duration_ms: 176.326893
      type: 'test'
      ...
    # Subtest: uses requirement-specific evidence and does not fabricate contract IDs
    not ok 2 - uses requirement-specific evidence and does not fabricate contract IDs
      ---
      duration_ms: 4.689983
      type: 'test'
      location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/book-02-mvp-gap-baseline.test.ts:1:2051'
      failureType: 'testCodeFailure'
      error: |-
        Expected values to be strictly deep-equal:
        + actual - expected
        
          [
            'src/contracts/service/core-service-contract-skeletons.ts',
        +   'src/services/identity/core-identity-service.ts'
          ]
        
      code: 'ERR_ASSERTION'
      name: 'AssertionError'
      expected:
        0: 'src/contracts/service/core-service-contract-skeletons.ts'
      actual:
        0: 'src/contracts/service/core-service-contract-skeletons.ts'
        1: 'src/services/identity/core-identity-service.ts'
      operator: 'deepStrictEqual'
      stack: |-
        TestContext.<anonymous> (/home/runner/work/markorbit-core/markorbit-core/tests/unit/book-02-mvp-gap-baseline.test.ts:88:12)
        Test.runInAsyncScope (node:async_hooks:214:14)
        Test.run (node:internal/test_runner/test:1047:25)
        Suite.processPendingSubtests (node:internal/test_runner/test:744:18)
        Test.postRun (node:internal/test_runner/test:1173:19)
        Test.run (node:internal/test_runner/test:1101:12)
--
      duration_ms: 911.721261
      type: 'test'
      ...
    1..12
not ok 35 - Book 02 MVP gap baseline validation
  ---
  duration_ms: 5807.954319
  type: 'suite'
  location: '/home/runner/work/markorbit-core/markorbit-core/tests/unit/book-02-mvp-gap-baseline.test.ts:1:1618'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
# Subtest: Book 02 MVP canonical requirements
    # Subtest: locks exact category and layer counts
    ok 1 - locks exact category and layer counts
      ---
      duration_ms: 0.786201
      type: 'test'
      ...
--
1..117
# tests 635
# suites 117
# pass 634
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 67025.553552
 ELIFECYCLE  Test failed. See above for more details.
```
