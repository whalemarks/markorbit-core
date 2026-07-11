# Core Contract Coverage Baseline

## Status

- Task: `CORE-TASK-018 — Phase 3 Contract Coverage Baseline`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/`
- Primary sources: `core-specs/TRACEABILITY.md`, `core-specs/implementation/mvp-cut-v0.1.md`, and `core-specs/validation/traceability-validation.md`
- Baseline version: `0.1.0`
- Contract Index entries: 106
- Required fixtures after this task: 16

## Purpose

This baseline separates two different meanings of coverage:

1. **Structural family coverage** — whether the existing indexed skeleton families have required fixtures, validators, and collection tests.
2. **Book 2 Domain-layer coverage** — whether each of the 26 Core Domains has mapped Domain, Object, Service, API, Event, Workflow, and Test contract coverage.

The first is complete for the current 106-entry index. The second is not. A validated skeleton means only that a structural placeholder exists and passes its collection checks; it does not mean that Book 2 behavior, runtime enforcement, or production readiness exists.

Canonical source alignment for Book 2 Common, API, Workflow, and Test Contracts is explicitly not assessed in CORE-TASK-018. Current skeleton names and Domain mappings are measured as they exist; they are not silently treated as replacements for canonical Book 2 contract files.

## Baseline result

| Measure                                                     |       Result |
| ----------------------------------------------------------- | -----------: |
| Structurally covered contract families                      |      10 / 10 |
| Indexed contracts under structural assurance                |    106 / 106 |
| Domain skeleton coverage                                    |      26 / 26 |
| Object skeleton Domain coverage                             |      12 / 26 |
| Service skeleton Domain coverage                            |      10 / 26 |
| Domain-mapped API skeleton coverage                         |       4 / 26 |
| Event skeleton Domain coverage                              |       4 / 26 |
| Workflow skeleton Domain coverage                           |       6 / 26 |
| Domains with Domain + Object + Service + API layers present |       1 / 26 |
| Missing required layer slots                                |           52 |
| Domains with collection-level structural validation         |      26 / 26 |
| Domains with contract behavior tests                        |       0 / 26 |
| Canonical Book 2 contract source alignment                  | Not assessed |

Four additional API skeletons are global Core APIs without a Domain mapping. They remain structurally covered but do not satisfy Book 2's requirement for 26 Domain API Contracts.

## Domain coverage matrix

`✓` means a validated Phase 2 skeleton is mapped to the Domain. It does not claim canonical contract completeness or behavior implementation. Required layers in this baseline are Domain, Object, Service, and API. Event and Workflow columns are trace visibility and do not independently determine required-layer completeness.

| Domain              | MVP        | Object | Service | API | Event | Workflow | Missing required layers |
| ------------------- | ---------- | :----: | :-----: | :-: | :---: | :------: | ----------------------- |
| `identity`          | Must Build |   —    |    ✓    |  —  |   —   |    —     | object, api             |
| `organization`      | Must Build |   ✓    |    —    |  —  |   —   |    —     | service, api            |
| `user`              | Must Build |   ✓    |    —    |  —  |   —   |    —     | service, api            |
| `permission`        | Must Build |   —    |    ✓    |  —  |   —   |    —     | object, api             |
| `policy`            | Must Build |   ✓    |    ✓    |  ✓  |   —   |    ✓     | none                    |
| `knowledge`         | Stub       |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `brand`             | Must Build |   ✓    |    —    |  —  |   —   |    —     | service, api            |
| `trademark`         | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `jurisdiction`      | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `classification`    | Must Build |   ✓    |    ✓    |  —  |   —   |    —     | api                     |
| `document`          | Must Build |   ✓    |    ✓    |  —  |   —   |    ✓     | api                     |
| `evidence`          | Must Build |   ✓    |    ✓    |  —  |   —   |    ✓     | api                     |
| `customer`          | Must Build |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `matter`            | Must Build |   ✓    |    —    |  —  |   —   |    —     | service, api            |
| `order`             | Must Build |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `opportunity`       | Stub       |   —    |    —    |  —  |   —   |    —     | object, service, api    |
| `workflow-contract` | Must Build |   —    |    —    |  ✓  |   ✓   |    ✓     | object, service         |
| `task`              | Must Build |   —    |    —    |  ✓  |   ✓   |    ✓     | object, service         |
| `event`             | Must Build |   —    |    —    |  ✓  |   ✓   |    —     | object, service         |
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

CORE-TASK-019 locks canonical Common, API, Workflow, and Test Contract targets and the Object, Service, and API gaps for all 26 Domains. It converts the baseline into 81 controlled additions across CORE-TASK-020 through CORE-TASK-024. The first implementation batch is CORE-TASK-020 — Common and Test Contract Foundations.
