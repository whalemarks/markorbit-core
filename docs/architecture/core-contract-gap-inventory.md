# Book 2 Contract Gap Inventory Lock

## Status

- Task: `CORE-TASK-019 — Book 2 Contract Gap Inventory Lock`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/`
- Inventory version: `0.1.0`
- Inventory baseline Contract Index: 106 entries
- Current Contract Index: 123 entries
- Completed canonical targets: 17
- Remaining canonical targets: 64
- Contract Index change in this task: none

## Purpose

CORE-TASK-018 measured current structural coverage but intentionally did not claim canonical Book 2 source alignment. This inventory resolves that boundary by locking every canonical target, every existing skeleton mapping, every retained Phase 2 scaffold, and the implementation batch for each required addition.

The inventory is metadata-only. It does not add contract types, contract skeletons, index entries, runtime behavior, service execution, API routes, workflow execution, test behavior, or Book 3 integration.

## Locked result

| Measure                                                       | Count |
| ------------------------------------------------------------- | ----: |
| Domain-layer targets: 26 Domains × Object/Service/API         |    78 |
| Domain targets mapped to existing Object or Service skeletons |    22 |
| New Object targets                                            |    14 |
| New Service targets                                           |    16 |
| New canonical Domain API targets                              |    26 |
| New Common Contract targets                                   |    10 |
| New canonical Workflow Contract targets                       |     8 |
| New Test Contract targets                                     |     7 |
| Total new canonical skeleton targets                          |    81 |
| Projected Contract Index after all batches                    |   187 |

Book 2 Common and Test Contracts required two `CoreContractType` additions: `common` and `test`. CORE-TASK-019 locked that requirement, and CORE-TASK-020 has now satisfied it together with all 17 Common/Test targets.

## Existing skeleton mappings

The 12 current Object and 10 current Service skeletons remain valid Phase 2 structural mappings. They are mapped to their canonical Domain source files and must be enriched through later explicit tasks rather than duplicated.

The 8 current API skeletons and 8 current Workflow catalog skeletons are retained during canonical expansion, but they do not satisfy the canonical targets:

- current API skeletons are global/reference scaffolds, not the 26 Book 2 Domain API Contracts;
- current Workflow skeletons are generic catalog scaffolds, not the 8 Book 2 canonical Workflow Contracts.

No current scaffold may be silently deleted, renamed, treated as canonical, or deprecated inside a gap-filling batch. Compatibility and deprecation require a separate governed task after canonical coverage exists.

## Locked implementation sequence

### CORE-TASK-020 — Common and Test Contract Foundations (17)

- 10 Common Contracts: References, Errors, Pagination, Audit Context, AI Context, Human Review, Permission Context, Policy Context, Idempotency, and Versioning.
- 7 Test Contracts: Common, API, Workflow, Agent Boundary, Permission/Policy, Idempotency/Event, and Error/Versioning.
- Adds `common` and `test` contract types.
- Status: completed; indexed and structurally validated at metadata-only skeleton depth.

### CORE-TASK-021 — Must-Build Object and Service Gaps (16)

- Object: Identity, Permission, Customer, Order, Workflow Contract, Task, Event.
- Service: Organization, User, Brand, Customer, Matter, Order, Workflow Contract, Task, Event.
- Preserves the 22 existing Object/Service mappings.

### CORE-TASK-022 — Must-Build Canonical Domain APIs (18)

Identity, Organization, User, Permission, Policy, Brand, Trademark, Jurisdiction, Classification, Document, Evidence, Customer, Matter, Order, Workflow Contract, Task, Event, and Communication.

These are contract skeletons only: no routes, handlers, service execution, request/response DTO implementation, authentication middleware, or API server.

### CORE-TASK-023 — Stub Domain Contract Gaps (22)

- Knowledge: API only; current Object and Service mappings remain.
- Opportunity, Notification, Partner, Agent, Service Provider, Service Network, and Routing: Object, Service, and API skeletons.
- All remain safe stubs without fake success or runtime capability.

### CORE-TASK-024 — Canonical Workflow Contracts (8)

Customer Intake, Trademark Application, Office Action Response, Provider Routing, Communication Review, Renewal, Assignment, and Evidence Review.

These contracts must not add a workflow engine, running instances, transition execution, direct domain mutation, active Task creation, or event emission.

## Acceptance boundary

CORE-TASK-019 is accepted when the exact 81-target inventory, 22 existing mappings, two retained scaffold families, two required contract-type additions, five batch counts, and Book 2 source paths are reproducible and drift-validated.

Acceptance does not require implementing every target. CORE-TASK-020 has completed the first batch; the next implementation batch is `CORE-TASK-021 — Must-Build Object and Service Gaps`.
