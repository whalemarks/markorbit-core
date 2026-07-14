# MarkOrbit Core Manifest

## Repository purpose

`markorbit-core` implements Book 02 — MarkOrbit Core Specification as typed contracts, validation rules, fixtures, events, workflow primitives, and testable packages.

## Current phase

Phase 4 — Selected Core Behavior Hook Acceptance completed.

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
- Common and Test Contract Foundations added.
- Must-Build Object and Service gaps completed.
- Must-Build Canonical Domain APIs completed.
- Stub Domain Contract gaps completed.
- Canonical Workflow Contracts completed.
- All five Gap Inventory implementation batches completed.
- `CORE_CONTRACT_INDEX` now contains 187 entries:
  - 6 foundation contract entries
  - 26 domain contract entries
  - 26 object contract entries
  - 26 service contract entries
  - 34 API contract entries
  - 12 event catalog entries
  - 16 workflow contract/catalog entries
  - 8 permission contract entries
  - 8 policy contract entries
  - 8 AI governance contract entries
  - 10 Common Contract entries
  - 7 Test Contract entries
- Current coverage baseline reports 187 structurally assured indexed contracts across 12 contract families.
- Current Domain-layer coverage is 26 Domain, 26 Object, 26 Service, 26 Domain-mapped API, 4 Event, and 6 Workflow.
- Gap Inventory maps 22 existing Domain targets and locks 81 canonical skeleton additions across five batches.
- CORE-TASK-020 through CORE-TASK-024 have completed all 81 canonical targets; 0 remain.
- Required fixture manifest now contains 25 entries.
- CORE-TASK-025 locks the final structural acceptance state: 187 indexed contracts, 12/12 families, 26/26 required-layer-complete Domains, and 81/81 controlled targets.
- Selected cross-cutting behavior hooks are accepted at minimum depth; Domain business behavior and broader runtime readiness are not accepted.
- CORE-TASK-032 locks repository-local TypeScript, ESLint, Prettier, test, fixture-reporting, and CI validation commands. Book 02 MVP remains incomplete.
- 14/14 selected behavior targets accepted.
- 11/11 Must Build Now targets accepted.
- 12 implemented-batch targets.
- 2 preexisting-minimum targets.
- 4/4 implementation batches accepted.
- Domain contract behavior-tested: 0/26.
- Book 02 MVP remains incomplete.
- Execution System remains unimplemented.
- Production readiness remains unaccepted.

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
- Core Common Contract Skeletons.
- Core Test Contract Skeletons.
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

- CORE-TASK-034 — Book 02 MVP Gap Baseline Lock.

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

## CORE-TASK-020 — Common and Test Contract Foundations

- Added `common` and `test` to `CORE_CONTRACT_TYPES`.
- Added 10 canonical Common Contract skeletons and 7 canonical Test Contract skeletons.
- Added exact validators, required fixtures, fixture routing, and collection tests.
- Expanded `CORE_CONTRACT_INDEX` from 106 to 123 entries.
- Expanded structural coverage from 10 to 12 families.
- Completed the first inventory batch: 17 / 81 canonical targets.
- Remaining inventory targets: 64.
- No executable Common primitive or Test Contract behavior added.
- Next recommended task: CORE-TASK-021 — Must-Build Object and Service Gaps.

## CORE-TASK-021 — Must-Build Object and Service Gaps

- Added 7 canonical Object skeletons: Identity, Permission, Customer, Order, Workflow Contract, Task, and Event.
- Added 9 canonical Service skeletons: Organization, User, Brand, Customer, Matter, Order, Workflow Contract, Task, and Event.
- Preserved the original 22 mapped Object and Service skeletons.
- Expanded `CORE_CONTRACT_INDEX` from 123 to 139 entries.
- Object Domain coverage: 19 / 26; Service Domain coverage: 19 / 26.
- Required-layer-complete Domains: 4 / 26; missing required layer slots: 36.
- Gap inventory progress: 33 completed, 48 remaining.
- No object schemas, executable service methods, runtime behavior, or state mutation added.
- Next recommended task: CORE-TASK-022 — Must-Build Canonical Domain APIs.

## CORE-TASK-022 — Must-Build Canonical Domain APIs

- Added 18 canonical Domain API skeletons for all Must Build Now Domains.
- Preserved the original 8 Phase 2 API scaffolds as noncanonical compatibility entries.
- Expanded `CORE_CONTRACT_INDEX` from 139 to 157 entries.
- API Domain coverage: 18 / 26.
- Required-layer-complete Domains: 18 / 26; missing required layer slots: 22.
- Gap inventory progress: 51 completed, 30 remaining.
- No routes, handlers, middleware, DTO implementation, service execution, runtime behavior, or state mutation added.
- Next recommended task: CORE-TASK-023 — Stub Domain Contract Gaps.

## CORE-TASK-023 — Stub Domain Contract Gaps

- Added 7 Object, 7 Service, and 8 API safe stubs across the 8 Stub Now Domains.
- Preserved Knowledge Object and Service mappings; added only the missing Knowledge API.
- Expanded `CORE_CONTRACT_INDEX` from 157 to 179 entries.
- Object, Service, and API Domain coverage: 26 / 26 each.
- Required-layer-complete Domains: 26 / 26; missing required layer slots: 0.
- Gap inventory progress: 73 completed, 8 remaining.
- No fake success, operational availability, executable behavior, runtime, or state mutation added.
- Next recommended task: CORE-TASK-024 — Canonical Workflow Contracts.

## CORE-TASK-024 — Canonical Workflow Contracts

- Added 8 canonical Workflow Contract skeletons.
- Preserved the original 8 Phase 2 Workflow catalog scaffolds as noncanonical compatibility entries.
- Expanded `CORE_CONTRACT_INDEX` from 179 to the projected 187 entries.
- Workflow family entries: 16.
- Gap inventory progress: 81 completed, 0 remaining.
- All five controlled implementation batches: completed.
- No workflow engine, execution runtime, Task creation, Event emission, or state mutation added.
- Next recommended task: CORE-TASK-025 — Phase 3 Contract Coverage Acceptance Lock.

## CORE-TASK-025 — Phase 3 Contract Coverage Acceptance Lock

- Added `CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK` with exact accepted counts, batches, authority, and assessment boundaries.
- Added a required acceptance-lock fixture and exact drift validation.
- Added unit, fixture, and validation coverage plus `pnpm acceptance:contracts`.
- Accepted Phase 3 contract structure only; runtime behavior, workflow execution, production readiness, and Product/Book 3 behavior remain excluded.
- Phase 3 contract coverage is complete.

## CORE-TASK-026 — Phase 4 Contract Behavior Coverage Baseline

- Added a Book 2-aligned Level 0–4 behavior depth model covering 14 governed capabilities.
- Current result: 2 targets meet minimum depth, 1 is partial, and 11 are not implemented.
- Must Build Now result: 0 / 11 meet minimum behavior depth.
- Added an exact baseline validator, required fixture, tests, architecture record, and `pnpm coverage:behavior`.
- No new contract behavior or Execution System runtime was implemented.
- Next recommended task: CORE-TASK-027 — Contract Behavior Gap Inventory Lock.

## CORE-TASK-027 — Contract Behavior Gap Inventory Lock

- Locked 12 minimum-depth behavior gaps totaling 22 depth increments.
- Sequenced four controlled batches: Safety and Boundary Foundations, Idempotency Enforcement, Governance Context and Review Hooks, and Event Trace and Pagination Hooks.
- Preserved Workflow Engine at Stub Now Level 1 and Policy Engine at Document Only Level 0 without overbuilding either.
- Added an exact inventory validator, required fixture, tests, architecture record, and `pnpm gaps:behavior`.
- Added no behavior implementation or Execution System runtime.
- Next recommended task: CORE-TASK-028 — Safety and Boundary Foundations.

## CORE-TASK-028 — Safety and Boundary Foundations

- Added real Core behavior for Reference resolution and Safe Error enforcement at Level 3.
- Added Versioning, AI Context, and Agent boundary validation at Level 1.
- Added deterministic behavior fixtures and executable negative tests.
- Behavior coverage is now 7 minimum-satisfied, 1 partial, and 6 not implemented; 4/11 Must Build Now targets meet minimum depth.
- Agent capability acceptance still requires downstream Permission and Policy evaluation.
- No database, external integration, model execution, Event emission, or professional authority was added.
- Next recommended task: CORE-TASK-029 — Idempotency Enforcement.

## CORE-TASK-032 — Validation and Traceability Lock

- Repository-local validation toolchain declared for TypeScript, ESLint, Prettier, tsx, and Node.js types.
- GitHub Actions validation matrix added for Node.js 20 and 22.
- Behavior coverage Event source path corrected from the legacy event-object path to the canonical Event source document.
- Repository-wide formatting is intentionally excluded; Phase 4 remains unaccepted and Book 02 MVP remains incomplete.

## Book 02 MVP Gap Baseline

Book 02 MVP Gap Baseline is locked only after this task passes validation. Book 02 MVP remains incomplete. Selected behavior-hook minimum-depth acceptance remains valid. Domain business behavior remains unaccepted. Execution System remains incomplete. Production readiness remains unaccepted.

## CORE-TASK-035 Object public-reference foundation

Must Build Object public-reference and base validation is implemented. Object business schemas and Domain behavior remain incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.

## CORE-TASK-035R Object public-reference semantic repair

The Object public-reference foundation now uses the corrected real Object contract/profile mapping, including the special Policy mapping to `permission-policy-record` / `core-object-permission-policy-record-contract`. Public reference identity validation is separated from related-reference resolution; deterministic fixture references are test evidence and not a default runtime registry. Metadata validation is plain-JSON only, Audit and Visibility metadata fail closed, construction deep-clones before freezing, and Book 02 Object evidence is derived per Object.

Object business schemas remain incomplete. Domain behavior remains incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.

CORE-TASK-036 note: Customer Service core lifecycle behavior is implemented at the governed MVP boundary. The remaining 17 Must Build Services do not yet own executable behavior. Customer relationship-linking and metadata-update operations remain incomplete. Customer API validators remain incomplete. Customer Intake Workflow preview/apply remains incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted. Next governed task: CORE-TASK-037 — select the next Service-owned behavior batch from the updated Book 02 MVP gap baseline.

CORE-TASK-037 note: Brand Service core lifecycle behavior is implemented at the governed MVP boundary with create, read, list, reference validation, and status transition operations. Customer and Brand are the only two Must Build Services with executable owned behavior; the remaining 16 Services remain incomplete. Brand update and relationship-linking operations, Brand API validators, Customer Intake Workflow preview/apply, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 34 meets_required_depth, 3 partial_evidence, 55 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-038 — select the next Service-owned behavior batch from the updated Book 02 MVP gap baseline.

CORE-TASK-038 note: Trademark Service core lifecycle behavior is implemented at the governed MVP boundary with create, read, list, reference validation, and status transition operations. Customer, Brand, and Trademark are the only three Must Build Services with executable owned behavior; the remaining 15 Services remain incomplete. Trademark update, relationship mutation, official-reference updates, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 35 meets_required_depth, 3 partial_evidence, 54 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-039 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.

CORE-TASK-039 note: Jurisdiction Service core lifecycle and code-resolution behavior is implemented at the governed MVP boundary with create, read, list, reference validation, code resolution, and status transition operations. Customer, Brand, Trademark, and Jurisdiction are the four Must Build Services with executable owned behavior; the remaining 14 Services remain incomplete. Jurisdiction metadata update, office/rule/service-scope linkage, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 36 meets_required_depth, 3 partial_evidence, 53 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-040 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.
