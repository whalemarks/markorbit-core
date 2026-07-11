# Core Contract Coverage Baseline

## Status

- Task: `CORE-TASK-018 — Phase 3 Contract Coverage Baseline`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/`
- Primary sources: `core-specs/TRACEABILITY.md`, `core-specs/implementation/mvp-cut-v0.1.md`, and `core-specs/validation/traceability-validation.md`
- Baseline version: `0.1.0`
- Current Contract Index entries: 187
- Current required fixtures: 19

## Purpose

This baseline separates two different meanings of coverage:

1. **Structural family coverage** — whether the existing indexed skeleton families have required fixtures, validators, and collection tests.
2. **Book 2 Domain-layer coverage** — whether each of the 26 Core Domains has mapped Domain, Object, Service, API, Event, Workflow, and Test contract coverage.

The first is complete for the current 187-entry index. All 26 Domains have the required Domain, Object, Service, and API structural layers, and all 81 Gap Inventory targets are implemented. Behavioral completeness remains unassessed. A validated skeleton means only that a structural placeholder exists and passes its collection checks; it does not mean that Book 2 behavior, runtime enforcement, or production readiness exists.

CORE-TASK-020 adds canonical source-aligned Common and Test Contract skeleton families, CORE-TASK-022 adds all 18 Must Build Now canonical Domain API skeletons, CORE-TASK-023 completes the 22 Stub Domain Object, Service, and API gaps, and CORE-TASK-024 adds all 8 canonical Workflow Contract skeletons.

## Baseline result

| Measure                                                     |    Result |
| ----------------------------------------------------------- | --------: |
| Structurally covered contract families                      |   12 / 12 |
| Indexed contracts under structural assurance                | 187 / 187 |
| Domain skeleton coverage                                    |   26 / 26 |
| Object skeleton Domain coverage                             |   26 / 26 |
| Service skeleton Domain coverage                            |   26 / 26 |
| Domain-mapped API skeleton coverage                         |   26 / 26 |
| Event skeleton Domain coverage                              |    4 / 26 |
| Workflow skeleton Domain coverage                           |    6 / 26 |
| Domains with Domain + Object + Service + API layers present |   26 / 26 |
| Missing required layer slots                                |         0 |
| Domains with collection-level structural validation         |   26 / 26 |
| Domains with contract behavior tests                        |    0 / 26 |
| Canonical Common and Test source alignment                  |   17 / 17 |
| Canonical Domain API source alignment                       |   26 / 26 |
| Canonical Workflow source alignment                         |     8 / 8 |

Four additional API skeletons are global Core APIs without a Domain mapping. They remain structurally covered but are excluded from the now-complete 26/26 canonical Domain API count.

## Domain coverage matrix

`✓` means a validated Phase 2 skeleton is mapped to the Domain. It does not claim canonical contract completeness or behavior implementation. Required layers in this baseline are Domain, Object, Service, and API. Event and Workflow columns are trace visibility and do not independently determine required-layer completeness.

| Domain              | MVP        | Object | Service | API | Event | Workflow | Missing required layers |
| ------------------- | ---------- | :----: | :-----: | :-: | :---: | :------: | ----------------------- |
| `identity`          | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `organization`      | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `user`              | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `permission`        | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `policy`            | Must Build |   ✓    |    ✓    |  ✓  |   —   |    ✓     | none                    |
| `knowledge`         | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `brand`             | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `trademark`         | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `jurisdiction`      | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `classification`    | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `document`          | Must Build |   ✓    |    ✓    |  ✓  |   —   |    ✓     | none                    |
| `evidence`          | Must Build |   ✓    |    ✓    |  ✓  |   —   |    ✓     | none                    |
| `customer`          | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `matter`            | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `order`             | Must Build |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `opportunity`       | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `workflow-contract` | Must Build |   ✓    |    ✓    |  ✓  |   ✓   |    ✓     | none                    |
| `task`              | Must Build |   ✓    |    ✓    |  ✓  |   ✓   |    ✓     | none                    |
| `event`             | Must Build |   ✓    |    ✓    |  ✓  |   ✓   |    —     | none                    |
| `notification`      | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `partner`           | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `agent`             | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `service-provider`  | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `service-network`   | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `routing`           | Stub       |   ✓    |    ✓    |  ✓  |   —   |    —     | none                    |
| `communication`     | Must Build |   ✓    |    ✓    |  ✓  |   ✓   |    ✓     | none                    |

## Acceptance boundary

CORE-TASK-018 is accepted when the baseline is reproducible and rejects stale counts or mappings. Acceptance does not require eliminating the reported gaps.

This task does not add full contracts, runtime behavior, service execution, API routes, event emission, workflow execution, permission or policy decisions, AI execution, Product UI, database behavior, Book 3 integration, or production-readiness claims.

## Governed follow-on

CORE-TASK-019 locks canonical Common, API, Workflow, and Test Contract targets and the Object, Service, and API gaps for all 26 Domains. CORE-TASK-020 through CORE-TASK-024 have completed all 81 controlled additions. The next closeout task is CORE-TASK-025 — Phase 3 Contract Coverage Acceptance Lock.
