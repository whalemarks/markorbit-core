# MarkOrbit Core Roadmap

## Phase 0

- Repository initialization.
- Governance files.
- Project setup.

## Phase 1 — Complete

- [x] Core domain registry.
- [x] Core object base types.
- [x] Event primitive.
- [x] Task primitive.
- [x] Workflow contract primitive.
- [x] Validation fixture system.

## Phase 2 — Complete

- [x] Core Contract Index.
- [x] Domain Contract Skeletons.
- [x] Object Contract Skeletons.
- [x] Service Contract Skeletons.
- [x] API Contract Skeletons.
- [x] Event Catalog Skeleton.
- [x] Core Workflow Catalog Skeleton.
- [x] Core Permission Contract Skeletons.
- [x] Core Policy Contract Skeletons.
- [x] Core AI Governance Contract Skeletons: completed/current.

## Phase 3 — Contract Coverage Accepted

- [x] Contract coverage baseline — first acceptance result/current.
- [x] Book 2 Contract Gap Inventory Lock — completed/current.
- [x] Common and Test Contract Foundations — completed/current.
- [x] Must-Build Object and Service Gaps — completed/current.
- [x] Must-Build Canonical Domain APIs — completed/current.
- [x] Stub Domain Contract Gaps — completed/current.
- [x] Canonical Workflow Contracts — completed/current.
- [x] Phase 3 Contract Coverage Acceptance Lock — completed/current.
- Integration with Execution System.
- Generated SDK.
- Documentation site.
- Package publishing.

## Phase 4 — Contract Behavior Coverage Started

- [x] Contract Behavior Coverage Baseline — completed/current.
- [x] Contract Behavior Gap Inventory Lock — completed/current.
- [ ] Controlled behavior implementation batches.
- [ ] Contract Behavior Coverage Acceptance Lock.
- [x] Validation and traceability tooling lock — completed/current without accepting Phase 4.

## Phase 2 Update — CORE-TASK-009

- Core Contract Index: completed.
- Core Domain Contract Skeletons: completed/current.
- Next: Core Object Contract Skeletons.

## Phase 2 Update — CORE-TASK-010

- Core Object Contract Skeletons: completed/current.
- Next: Core Service Contract Skeletons.

## Phase 2 Update — CORE-TASK-011

- Core Service Contract Skeletons: completed/current.
- Next: Core API Contract Skeletons.

## Phase 2 Update — CORE-TASK-012

- Core API Contract Skeletons: completed/current.
- Next: CORE-TASK-013 — Core Event Catalog Skeleton.

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

- Core Workflow Catalog Skeleton: completed.
- Core Permission Contract Skeletons: completed.
- Core Policy Contract Skeletons: completed/current.
- Next: CORE-TASK-017 — Core AI Governance Contract Skeletons.

## CORE-TASK-017 — Core AI Governance Contract Skeletons

- Source inventory: completed.
- Contract type and exactly 8 skeletons: completed.
- Validator, fixture, manifest, and 106-entry Contract Index integration: completed/current.
- Phase 2: complete.
- Next: CORE-TASK-018 — Phase 3 Contract Coverage Baseline.

## CORE-TASK-018 — Phase 3 Contract Coverage Baseline

- 106 indexed contracts mapped across 10 structurally assured contract families.
- All 26 Core Domains mapped to current Object, Service, API, Event, Workflow, and collection-test coverage.
- Required-layer completeness: 1 / 26 Domains.
- Missing required Object, Service, or API layer slots: 52.
- Runtime and behavior completeness: not assessed.
- Next: CORE-TASK-019 — Book 2 Contract Gap Inventory Lock.

## CORE-TASK-019 — Book 2 Contract Gap Inventory Lock

- 22 existing Domain targets mapped.
- 81 new canonical targets locked.
- Existing generic API and Workflow scaffolds retained but not counted as canonical.
- Five controlled implementation batches defined.
- Contract Index remains 106.
- Next: CORE-TASK-020 — Common and Test Contract Foundations.

## CORE-TASK-020 — Common and Test Contract Foundations

- `common` and `test` contract types: completed.
- 10 Common Contract skeletons: completed/current.
- 7 Test Contract skeletons: completed/current.
- Contract Index: 123 entries.
- Structural coverage: 12 / 12 current families.
- Gap inventory progress: 17 completed, 64 remaining.
- Runtime and contract behavior: not implemented.
- Next: CORE-TASK-021 — Must-Build Object and Service Gaps.

## CORE-TASK-021 — Must-Build Object and Service Gaps

- 7 missing Must Build Now Object skeletons: completed/current.
- 9 missing Must Build Now Service skeletons: completed/current.
- Original 22 Object/Service mappings: preserved.
- Contract Index: 139 entries.
- Object coverage: 19 / 26 Domains; Service coverage: 19 / 26 Domains.
- Required-layer-complete Domains: 4 / 26.
- Gap inventory progress: 33 completed, 48 remaining.
- Runtime and contract behavior: not implemented.
- Next: CORE-TASK-022 — Must-Build Canonical Domain APIs.

## CORE-TASK-022 — Must-Build Canonical Domain APIs

- 18 Must Build Now canonical Domain API skeletons: completed/current.
- Original 8 Phase 2 API scaffolds: preserved as noncanonical compatibility entries.
- Contract Index: 157 entries.
- API coverage: 18 / 26 Domains.
- Required-layer-complete Domains: 18 / 26.
- Gap inventory progress: 51 completed, 30 remaining.
- Runtime and API behavior: not implemented.
- Next: CORE-TASK-023 — Stub Domain Contract Gaps.

## CORE-TASK-023 — Stub Domain Contract Gaps

- 7 safe Object stubs: completed/current.
- 7 safe Service stubs: completed/current.
- 8 safe API stubs: completed/current.
- Contract Index: 179 entries.
- Object, Service, and API coverage: 26 / 26 Domains each.
- Required-layer-complete Domains: 26 / 26.
- Gap inventory progress: 73 completed, 8 remaining.
- Runtime and contract behavior: not implemented.
- Next: CORE-TASK-024 — Canonical Workflow Contracts.

## CORE-TASK-024 — Canonical Workflow Contracts

- 8 canonical Workflow Contract skeletons: completed/current.
- Original 8 Phase 2 Workflow catalog scaffolds: preserved.
- Contract Index: projected final 187 entries reached.
- Gap inventory progress: 81 completed, 0 remaining.
- Five controlled implementation batches: completed.
- Runtime and workflow behavior: not implemented.
- Next: CORE-TASK-025 — Phase 3 Contract Coverage Acceptance Lock.

## CORE-TASK-025 — Phase 3 Contract Coverage Acceptance Lock

- Final Contract Index: 187 entries accepted/current.
- Structurally covered contract families: 12 / 12 accepted/current.
- Required Domain, Object, Service, and API layers: 26 / 26 Domains accepted/current.
- Gap Inventory: 81 / 81 targets complete; 0 remaining.
- Controlled implementation batches: 5 / 5 accepted.
- Runtime, behavior, and production readiness: not accepted.
- Phase 3 contract coverage: completed/current.

## CORE-TASK-026 — Phase 4 Contract Behavior Coverage Baseline

- Behavior depth model: Book 2 Levels 0–4 locked/current.
- Governed behavior targets: 14.
- Meets minimum depth: 2; partial: 1; not implemented: 11.
- Must Build Now at minimum depth: 0 / 11.
- Behavior acceptance ready: no.
- Runtime behavior added by this task: none.
- Next: CORE-TASK-027 — Contract Behavior Gap Inventory Lock.

## CORE-TASK-027 — Contract Behavior Gap Inventory Lock

- Minimum-depth behavior gaps: 12.
- Total required depth increments: 22.
- Controlled implementation batches: 4.
- Minimum-satisfied exclusions: Workflow Engine and Policy Engine.
- Behavior implemented by this task: none.
- Next: CORE-TASK-028 — Safety and Boundary Foundations.

## CORE-TASK-028 — Safety and Boundary Foundations

- References: Level 3 completed/current.
- Errors: Level 3 completed/current.
- Versioning: Level 1 completed/current.
- AI Context: Level 1 completed/current.
- Agent Runtime boundary: Level 1 completed/current.
- Behavior coverage: 7 minimum-satisfied, 1 partial, 6 not implemented.
- Must Build Now at minimum depth: 4 / 11.
- Next: CORE-TASK-029 — Idempotency Enforcement.

## CORE-TASK-032 — Validation and Traceability Lock

- Repository-local validation commands and Node.js 20/22 CI matrix locked.
- Event behavior-coverage traceability now references `objects/event.md` instead of the legacy `objects/event-object.md`.
- No repository-wide formatting baseline added.
- Phase 4 remains formally unaccepted and Book 02 MVP remains incomplete.

## Phase 4 Acceptance

- [x] Contract Behavior Coverage Acceptance Lock.
- [ ] Integration with Execution System.
- [ ] Generated SDK.
- [ ] Package publishing.
- [ ] Production readiness.
