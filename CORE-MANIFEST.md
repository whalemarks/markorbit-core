# MarkOrbit Core Manifest

## Repository purpose

`markorbit-core` implements Book 02 — MarkOrbit Core Specification as typed contracts, validation rules, fixtures, events, workflow primitives, and testable packages.

## Current phase

Phase 0 Initialization.

## Current scope

- Repository structure.
- TypeScript project setup.
- pnpm package manager setup.
- Vitest test setup.
- ESLint and Prettier configuration.
- Governance and roadmap documentation.
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

- CORE-TASK-002 — Core Domain Registry.
- Define initial domain registry structure only after explicit approval.
- Add base Core primitives in the order defined by the roadmap.
