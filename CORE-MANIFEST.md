# MarkOrbit Core Manifest

## Repository purpose

`markorbit-core` implements Book 02 — MarkOrbit Core Specification as typed contracts, validation rules, fixtures, events, workflow primitives, and testable packages.

## Current phase

Phase 3 — Contract Coverage started.

## Current status

- Core Domain Registry added.
- Registry contains 26 baseline Core Domains from Book 02 — MarkOrbit Core Specification.
- Domain registry fixture and tests added.
- Core Object Base Types added.
- Core Event Primitive added.
- Core Task Primitive added.
- Core Workflow Contract Primitive added.
- Core Validation Fixture System added.
- Phase 1 foundation primitives are now complete.
- Phase 2 started.
- Core Contract Index added.
- Core Domain Contract Skeletons added.
- Core Object Contract Skeletons added.
- Core Service Contract Skeletons added.
- Core API Contract Skeletons added.
- Core Event Catalog Skeleton added.
- Core Workflow Catalog Skeleton added.
- Core Policy Contract Skeletons added.
- Core AI Governance Contract Skeletons added and integrated.
- Phase 2 Core Contract Layer completed.
- Phase 3 Contract Coverage Baseline added.
- Book 2 Contract Gap Inventory locked.
- `CORE_CONTRACT_INDEX` now contains 106 entries:
  - 6 foundation contract entries
  - 26 domain contract entries
  - 12 object contract entries
  - 10 service contract entries
  - 8 API contract entries
  - 12 event catalog entries
  - 8 workflow catalog entries
  - 8 permission contract entries
  - 8 policy contract entries
  - 8 AI governance contract entries
- Current coverage baseline reports 106 structurally assured indexed contracts across 10 contract families.
- Current Domain-layer coverage is 26 Domain, 12 Object, 10 Service, 4 Domain-mapped API, 4 Event, and 6 Workflow.
- Gap Inventory maps 22 existing Domain targets and locks 81 new canonical skeleton targets across five batches.
- Required fixture manifest now contains 17 entries.
- Next recommended task: CORE-TASK-020 — Common and Test Contract Foundations.

## Current scope

- Repository structure.
- TypeScript project setup.
- pnpm package manager setup.
- Node test setup.
- ESLint and Prettier configuration.
- Governance and roadmap documentation.
- Baseline Core Domain Registry.
- Core Object Base Types.
- Core Event Primitive.
- Core Task Primitive.
- Core Workflow Contract Primitive.
- Core Validation Fixture System.
- Core Contract Index.
- Core Domain Contract Skeletons.
- Core Object Contract Skeletons.
- Core Service Contract Skeletons.
- Core API Contract Skeletons.
- Core Event Catalog Skeleton.
- Core Workflow Catalog Skeleton.
- Core Permission Contract Skeletons.
- Core Policy Contract Skeletons.
- Core AI Governance Contract Skeletons.
- Core Contract Coverage Baseline.
- Book 2 Contract Gap Inventory.
- Placeholder package and source directories.

## Out of scope

- Product UI.
- Product application behavior.
- MarkReg implementation.
- Lite implementation.
- Book 03 Execution System implementation.
- Book 04 Product System implementation.
- Trademark business logic.
- Workflow engine implementation.
- Database schema or production database connections.
- API server implementation.
- External API integrations.
- AI agents or AI approval authority.

## Package areas

- `packages/core-types` — future canonical TypeScript types.
- `packages/core-contracts` — future Core contract definitions.
- `packages/core-validation` — future validation schemas and rules.
- `packages/core-fixtures` — future specification fixtures.
- `packages/core-events` — future event primitives and catalog.
- `packages/core-workflows` — future workflow contract primitives.

## Validation expectations

Every change should keep the TypeScript project buildable, tests passing, lint checks clean, and repository diffs free of whitespace errors.

## Next tasks

- CORE-TASK-020 — Common and Test Contract Foundations.

## CORE-TASK-009 Status

- Core Domain Contract Skeletons added.
- `CORE_CONTRACT_INDEX` now contains 32 entries:
  - 6 foundation contract entries.
  - 26 domain contract entries.
- Next recommended task: CORE-TASK-010 — Core Object Contract Skeletons.

## CORE-TASK-010 Status

- Core Object Contract Skeletons added.
- CORE_CONTRACT_INDEX now contains 44 entries:
  - 6 foundation contract entries
  - 26 domain contract entries
  - 12 object contract entries
- Next recommended task: CORE-TASK-011 — Core Service Contract Skeletons.

## CORE-TASK-011 Status

- Core Service Contract Skeletons added.
- CORE_CONTRACT_INDEX now contains 54 entries:
  - 6 foundation contract entries
  - 26 domain contract entries
  - 12 object contract entries
  - 10 service contract entries
- Next recommended task: CORE-TASK-012 — Core API Contract Skeletons.

## CORE-TASK-012 Current Status

Core API Contract Skeletons added. CORE_CONTRACT_INDEX now contains 62 entries:

- 6 foundation contract entries
- 26 domain contract entries
- 12 object contract entries
- 10 service contract entries
- 8 API contract entries

Next recommended task: CORE-TASK-013 — Core Event Catalog Skeleton.

## CORE-TASK-013 — Core Event Catalog Skeleton

- Core Event Catalog Skeleton added.
- `CORE_CONTRACT_INDEX` now contains 74 entries:
  - 6 foundation contract entries
  - 26 domain contract entries
  - 12 object contract entries
  - 10 service contract entries
  - 8 API contract entries
  - 12 event catalog entries
- Next recommended task: CORE-TASK-014 — Core Workflow Catalog Skeleton.

## CORE-TASK-014 — Core Workflow Catalog Skeleton

- Core Workflow Catalog Skeleton added.
- Core Policy Contract Skeletons added.
- `CORE_CONTRACT_INDEX` now contains 98 entries:
  - 6 foundation contract entries
  - 26 domain contract entries
  - 12 object contract entries
  - 10 service contract entries
  - 8 API contract entries
  - 12 event catalog entries
  - 8 workflow catalog entries
  - 8 permission contract entries
  - 8 policy contract entries
- Next recommended task: CORE-TASK-017 — Core AI Governance Contract Skeletons.

## CORE-TASK-017 — Core AI Governance Contract Skeletons

- Book 02 source inventory locked in CORE-TASK-017A.
- `CoreAiGovernanceContract` and exactly 8 skeletons added in CORE-TASK-017B.
- Validator, exact fixture, manifest integration, and Contract Index integration added in CORE-TASK-017C.
- `CORE_CONTRACT_INDEX` now contains 106 entries.
- Required fixture manifest now contains 15 entries.
- Phase 2 Core Contract Layer is complete.
- Next recommended task: CORE-TASK-018 — Phase 3 Contract Coverage Baseline.

## CORE-TASK-018 — Phase 3 Contract Coverage Baseline

- Machine-readable coverage baseline added for 106 indexed contracts and all 26 Core Domains.
- Structural assurance confirmed for all 10 current contract families.
- Domain-layer gaps measured against Book 2 Traceability and MVP Cut sources.
- 1 of 26 Domains currently has Domain, Object, Service, and API skeleton layers present.
- 52 required Object, Service, or API layer slots remain open.
- Required fixture manifest now contains 16 entries.
- No runtime or behavior completeness is claimed.
- Next recommended task: CORE-TASK-019 — Book 2 Contract Gap Inventory Lock.

## CORE-TASK-019 — Book 2 Contract Gap Inventory Lock

- 78 Domain Object/Service/API targets locked.
- 22 Domain targets mapped to existing skeletons.
- 56 new Domain targets and 25 canonical Common/Workflow/Test targets locked.
- Total controlled additions: 81.
- Future `common` and `test` contract types required.
- Five follow-on batches locked: CORE-TASK-020 through CORE-TASK-024.
- `CORE_CONTRACT_INDEX` remains unchanged at 106 entries.
- Required fixture manifest now contains 17 entries.
- Next recommended task: CORE-TASK-020 — Common and Test Contract Foundations.
