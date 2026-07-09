# MarkOrbit Core Manifest

## Repository purpose

`markorbit-core` implements Book 02 — MarkOrbit Core Specification as typed contracts, validation rules, fixtures, events, workflow primitives, and testable packages.

## Current phase

Phase 2 — Core Contract Layer started.

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
- Current index contains 6 foundation contract entries.

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

- CORE-TASK-009 — Core Domain Contract Skeletons.

## CORE-TASK-009 Status

- Core Domain Contract Skeletons added.
- `CORE_CONTRACT_INDEX` now contains 32 entries:
  - 6 foundation contract entries.
  - 26 domain contract entries.
- Next recommended task: CORE-TASK-010 — Core Object Contract Skeletons.
