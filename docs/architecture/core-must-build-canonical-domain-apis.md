# Must-Build Canonical Domain APIs

## Status

- Task: `CORE-TASK-022 — Must-Build Canonical Domain APIs`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/core-specs/contracts/api/`
- Implementation depth: `validated_skeleton`
- Canonical Domain API skeletons added: 18
- Phase 2 API scaffolds preserved: 8

## Result

CORE-TASK-022 completes the canonical API targets for every Must Build Now Domain: Identity, Organization, User, Permission, Policy, Brand, Trademark, Jurisdiction, Classification, Document, Evidence, Customer, Matter, Order, Workflow Contract, Task, Event, and Communication.

Each addition locks its canonical id, API type, name, Domain, Book 2 source file, publication repository and commit, implementation task, and `validated_skeleton` depth. The 8 original Phase 2 global/reference API scaffolds remain indexed as compatibility entries and are not reclassified as canonical targets.

## Structural integration

| Measure                         | Before |   After |
| ------------------------------- | -----: | ------: |
| Indexed contracts               |    139 |     157 |
| API family entries              |      8 |      26 |
| API Domain coverage             | 4 / 26 | 18 / 26 |
| Required-layer-complete Domains | 4 / 26 | 18 / 26 |
| Missing required layer slots    |     36 |      22 |
| Completed gap targets           |     33 |      51 |
| Remaining gap targets           |     48 |      30 |

## Boundary

The additions are metadata-only contract skeletons. They do not implement endpoints, routes, handlers, middleware, request or response DTOs, authentication, owning-service behavior, Permission or Policy evaluation, idempotency, event emission, persistence, state mutation, API server behavior, Product UI, or Book 3 runtime behavior.

## Next task

The next governed batch is `CORE-TASK-023 — Stub Domain Contract Gaps`, containing 22 safe Object, Service, and API skeletons for the 8 Stub Now Domains.
