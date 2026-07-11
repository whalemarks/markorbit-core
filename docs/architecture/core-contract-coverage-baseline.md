# Core Contract Coverage Baseline

## Status

- Task: `CORE-TASK-018 — Phase 3 Contract Coverage Baseline`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/`
- Primary sources: `core-specs/TRACEABILITY.md`, `core-specs/implementation/mvp-cut-v0.1.md`, and `core-specs/validation/traceability-validation.md`
- Baseline version: `0.1.0`
- Current Contract Index entries: 139
- Current required fixtures: 19

## Purpose

This baseline separates two different meanings of coverage:

1. **Structural family coverage** — whether the existing indexed skeleton families have required fixtures, validators, and collection tests.
2. **Book 2 Domain-layer coverage** — whether each of the 26 Core Domains has mapped Domain, Object, Service, API, Event, Workflow, and Test contract coverage.

The first is complete for the current 139-entry index. The second is not. A validated skeleton means only that a structural placeholder exists and passes its collection checks; it does not mean that Book 2 behavior, runtime enforcement, or production readiness exists.

CORE-TASK-020 adds canonical source-aligned Common and Test Contract skeleton families. Canonical Domain API and Workflow Contract source alignment remains pending in later governed batches. Current Domain mappings are not silently treated as replacements for those future canonical contracts.

## Baseline result

| Measure                                                     |       Result |
| ----------------------------------------------------------- | -----------: |
| Structurally covered contract families                      |      12 / 12 |
| Indexed contracts under structural assurance                |    139 / 139 |
| Domain skeleton coverage                                    |      26 / 26 |
| Object skeleton Domain coverage                             |      19 / 26 |
| Service skeleton Domain coverage                            |      19 / 26 |
| Domain-mapped API skeleton coverage                         |       4 / 26 |
| Event skeleton Domain coverage                              |       4 / 26 |
| Workflow skeleton Domain coverage                           |       6 / 26 |
| Domains with Domain + Object + Service + API layers present |       4 / 26 |
| Missing required layer slots                                |           36 |
| Domains with collection-level structural validation         |      26 / 26 |
| Domains with contract behavior tests                        |       0 / 26 |
| Canonical Common and Test source alignment                  |      17 / 17 |
| Canonical Domain API and Workflow source alignment          |      Pending |

Four additional API skeletons are global Core APIs without a Domain mapping. They remain structurally covered but do not satisfy Book 2's requirement for 26 Domain API Contracts.

## Domain coverage matrix

`✓` means a validated Phase 2 skeleton is mapped to the Domain. It does not claim canonical contract completeness or behavior implementation. Required layers in this baseline are Domain, Object, Service, and API. Event and Workflow columns are trace visibility and do not independently determine required-layer completeness.

| Domain              | MVP        | Object | Service | API | Event | Workflow | Missing required layers |
| ------------------- | ---------- | :----: | :-----: | :-: | :---: | :------: | ----------------------- |
| `identity`          | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `organization`      | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `user`              | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `permission`        | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `policy`            | Must Build |   ✓    |    ✓    |  ✓  |   —   |    ✓     | none                    |
| `knowledge`         | Stub       |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `brand`             | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `trademark`         | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `jurisdiction`      | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `classification`    | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `document`          | Must Build |   ✓    |    ✓    |  —  |   —   |    ✓     | api                     |
| `evidence`          | Must Build |   ✓    |    ✓    |  —  |   —   |    ✓     | api                     |
| `customer`          | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `matter`            | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `order`             | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `opportunity`       | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `workflow-contract` | Must Build |   ✓    |    ✓    |  ✓  |   ✓   |    ✓     | none                    |
| `task`              | Must Build |   ✓    |    ✓    |  ✓  |   ✓   |    ✓     | none                    |
| `event`             | Must Build |   ✓    |    ✓    |  ✓  |   ✓   |    —     | none                    |
| `notification`      | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `partner`           | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `agent`             | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `service-provider`  | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `service-network`   | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `routing`           | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `communication`     | Must Build |   ✓    |    ✓    |  —  |   ✓   |    ✓     | api                     |

## Acceptance boundary

CORE-TASK-018 is accepted when the baseline is reproducible and rejects stale counts or mappings. Acceptance does not require eliminating the reported gaps.

This task does not add full contracts, runtime behavior, service execution, API routes, event emission, workflow execution, permission or policy decisions, AI execution, Product UI, database behavior, Book 3 integration, or production-readiness claims.

## Governed follow-on

CORE-TASK-019 locks canonical Common, API, Workflow, and Test Contract targets and the Object, Service, and API gaps for all 26 Domains. CORE-TASK-020 and CORE-TASK-021 have completed 33 of the 81 controlled additions. The next batch is CORE-TASK-022 — Must-Build Canonical Domain APIs.
