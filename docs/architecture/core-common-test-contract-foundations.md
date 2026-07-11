# Core Common and Test Contract Foundations

## Status

- Task: `CORE-TASK-020 — Common and Test Contract Foundations`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/`
- Implementation depth: `validated_skeleton`
- Common Contracts: 10
- Test Contracts: 7

## Result

CORE-TASK-020 implements the first batch locked by the Book 2 Contract Gap Inventory. It adds `common` and `test` to the Core Contract type registry and creates exact metadata-only skeleton families for every canonical Common and Test Contract source.

The 10 Common Contract skeletons cover References, Errors, Pagination, Audit Context, AI Context, Human Review, Permission Context, Policy Context, Idempotency, and Versioning.

The 7 Test Contract skeletons cover Common Contracts, API Contracts, Workflow Contracts, Agent Boundaries, Permission/Policy, Idempotency/Event, and Error/Versioning.

Each skeleton locks:

- the canonical contract id, name, type, and source path;
- the publication repository, pinned commit, and Book 2 path;
- purpose, owned boundary, and explicit non-goals;
- `validated_skeleton` implementation depth;
- absence of executable fields or behavior claims.

## Structural integration

| Measure                       | Before | After |
| ----------------------------- | -----: | ----: |
| Contract types                |     11 |    13 |
| Indexed contracts             |    106 |   123 |
| Structurally covered families |     10 |    12 |
| Required fixtures             |     17 |    19 |
| Completed gap targets         |      0 |    17 |
| Remaining gap targets         |     81 |    64 |

## Boundary

These skeletons do not implement the deeper primitive behavior described by the Book 2 sources. They do not resolve references, throw safe errors, execute pagination, record audit data, assemble AI context, make review decisions, evaluate Permission or Policy, persist idempotency records, perform version migration, or run acceptance tests.

They also add no API server, workflow engine, event bus, service execution, database integration, Product UI, Book 3 runtime, production data, or production-readiness claim.

## Next task

The next governed batch is `CORE-TASK-021 — Must-Build Object and Service Gaps`, containing 7 missing Object skeletons and 9 missing Service skeletons for Must Build Now Domains.
