# Stub Domain Contract Gaps

## Status

- Task: `CORE-TASK-023 — Stub Domain Contract Gaps`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/`
- Implementation depth: `validated_skeleton`
- MVP requirement: `stub_now`
- Added Object skeletons: 7
- Added Service skeletons: 7
- Added API skeletons: 8

## Result

CORE-TASK-023 completes the structural Object, Service, and API gaps for all 8 Stub Now Domains. Knowledge already had mapped Object and Service skeletons, so this task adds only its canonical API skeleton. Opportunity, Notification, Partner, Agent, Service Provider, Service Network, and Routing each receive one Object, one Service, and one API skeleton.

Every addition locks its canonical id, name, Domain, Book 2 source file, publication repository and commit, implementation task, `stub_now` requirement, and `validated_skeleton` depth.

## Structural integration

| Measure                         |  Before |   After |
| ------------------------------- | ------: | ------: |
| Indexed contracts               |     157 |     179 |
| Object Domain coverage          | 19 / 26 | 26 / 26 |
| Service Domain coverage         | 19 / 26 | 26 / 26 |
| API Domain coverage             | 18 / 26 | 26 / 26 |
| Required-layer-complete Domains | 18 / 26 | 26 / 26 |
| Missing required layer slots    |      22 |       0 |
| Completed gap targets           |      51 |      73 |
| Remaining gap targets           |      30 |       8 |

## Safe stub boundary

These entries reserve structural contract boundaries only. They do not claim operational availability, successful execution, production readiness, full object schemas, persistence, lifecycle behavior, executable service methods, coordination, API endpoints, handlers, DTOs, authentication, mutation, AI authority, Product UI, or Book 3 runtime behavior.

The existence of a validated stub must not be interpreted as proof that the Domain can process requests, return successful results, execute workflows, persist records, or support production traffic.

## Next task

The final governed batch is `CORE-TASK-024 — Canonical Workflow Contracts`, containing 8 source-aligned Workflow Contract skeletons.
