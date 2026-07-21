# MarkOrbit Core Roadmap

## Current state — CORE-TASK-061

- Book 02 MVP semantic baseline: COMPLETE.
- Engineering distribution baseline: accepted only on merge of CORE-TASK-061.
- Production readiness: NOT ACCEPTED.
- Next program after acceptance: Execution consumer integration.

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

## Phase 4 — Selected Behavior Hook Acceptance Complete

- [x] Contract Behavior Coverage Baseline — completed/current.
- [x] Contract Behavior Gap Inventory Lock — completed/current.
- [x] Controlled behavior implementation batches — CORE-TASK-028 through CORE-TASK-031 completed/current.
- [x] Contract Behavior Coverage Acceptance Lock — completed/current.
- [x] Validation and traceability tooling lock — completed/current.

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
- Phase 4 acceptance is completed by CORE-TASK-033 for selected behavior hooks only; Book 02 MVP remains incomplete.

## Next governed task

CORE-TASK-035 — first implementation batch selected from the locked Book 02 MVP gap baseline.

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

CORE-TASK-040 note: Classification Service core scope and validation behavior is implemented at the governed MVP boundary with create, read, list, structural validation, reference validation, and controlled status transition operations. Customer, Brand, Trademark, Jurisdiction, and Classification are the five Must Build Services with executable owned behavior; the remaining 13 Services remain incomplete. Item mutation, AI recommendation, official wording synchronization, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 37 meets_required_depth, 3 partial_evidence, 52 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-041 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.

## CORE-TASK-055 — Post-Service Completion Audit and Execution-Spine Lock

- All 18 Must Build Services: Level 2–3 behavior complete/current.
- Service gap: 0.
- Book 02 baseline: 50 meets depth, 3 partial, 39 validated skeleton, 5 boundary scaffold and 18 semantic overlap.
- Total unresolved Must Build requirements: 65, including 18 accepted Domain skeletons and 47 non-Domain completion blockers.
- Remaining acceptance criteria: 7 / 19 unresolved.
- Domain skeletons with executable tests are accepted for MVP and do not require artificial runtime promotion.
- Completion still requires all non-Domain Must Build requirements and all 19 acceptance criteria.
- Next: CORE-TASK-056 — Exact MVP Event Contract and Alias Lock.

## CORE-TASK-056 — Exact MVP Event Contract and Alias Lock

- Completed all 18 exact Must Build Event records.
- Locked 15 canonical contracts and 3 validated aliases: document-attached, communication-reviewed and workflow-contract-previewed.
- Added deterministic lock, validator, fixture, manifest validation and positive/negative tests.
- Event semantic-overlap requirements reduced from 18 to 0.
- Remaining non-Domain completion blockers: 29.
- Acceptance remains 12 / 19; no API, Workflow or Agent completion is claimed.
- Next: CORE-TASK-057A — first API validator and Service-delegation batch.

## CORE-TASK-057A API boundary completion

- Identity, Organization, User, Permission and Policy APIs meet validator and owning-Service delegation depth.
- Five API requirements are complete; thirteen API requirements remain.
- Current Must Build disposition: `73 / 3 / 34`, plus 5 boundary scaffolds and zero semantic overlaps.
- Current unresolved inventory: 42; non-Domain completion blockers: 24.
- API all-family acceptance remains open until CORE-TASK-057B and CORE-TASK-057C complete the remaining APIs and full no-direct-Event proof.
- Next task: `CORE-TASK-057B`.

## CORE-TASK-057B domain API boundary completion

- Customer, Brand, Trademark, Jurisdiction, Classification, Document and Evidence APIs meet validator and owning-Service delegation depth.
- Twelve of eighteen MVP APIs are complete; six APIs remain.
- Current Must Build disposition: `80 / 3 / 27`, plus 5 boundary scaffolds and zero semantic overlaps.
- Current unresolved inventory: 35; non-Domain completion blockers: 17.
- Next governed task: `CORE-TASK-057C`.
