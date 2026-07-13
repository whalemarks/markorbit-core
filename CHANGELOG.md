# Changelog

## CORE-TASK-032 — Validation and Traceability Lock

- Declared repository-local TypeScript, ESLint, Prettier, tsx, and Node.js type dependencies for reproducible validation.
- Added a Node.js 20 and 22 GitHub Actions validation matrix for typecheck, lint, format check, fixtures, tests, and contract/behavior reports.
- Scoped formatting checks to task-governed tooling, workflow, script, and documentation files to avoid repository-wide formatting churn.
- Corrected the behavior-coverage Event source path to `books/book-02-core-specification/core-specs/objects/event.md` and added a focused regression assertion rejecting the legacy path.
- Added no Core business behavior change, Phase 4 acceptance, Book 02 MVP completion, or production-readiness claim.

## CORE-TASK-031 — Event Trace and Pagination Hooks

- Added append-only Event trace handoff, duplicate protection, and visibility filtering.
- Added bounded cursor pagination with signed query-bound cursors, safe sorting, governance filtering, redaction, and total-count omission.
- Added stricter Agent pagination limits and fail-closed cursor, limit, sort, Permission, and Policy behavior.
- Reached minimum depth for all 14 behavior targets and all 11 Must Build Now targets.
- Added no database, Event bus, search engine, unrestricted export, or production-readiness claim.

## CORE-TASK-030 — Governance Context and Review Hooks

- Added fail-closed Permission decision enforcement and Policy context validation.
- Added Policy-triggered Human Review gates for protected actions.
- Added required Audit Context validation and immutable safe trace handoff.
- Updated behavior coverage to 12 minimum-satisfied, 1 partial, and 1 not implemented target; 9/11 Must Build Now targets now meet minimum depth.
- Added no role system, Policy Engine, Event persistence, downstream execution, or professional conclusion.

## CORE-TASK-029 — Idempotency Enforcement

- Added opaque key validation and canonical SHA-256 request fingerprints.
- Added deterministic replay, conflict and expiration protection, and single-execution side-effect behavior.
- Re-evaluated Permission and Policy gates before first execution and replay.
- Updated behavior coverage to 8 minimum-satisfied, 1 partial, and 5 not implemented targets; 5/11 Must Build Now targets now meet minimum depth.
- Added a required deterministic fixture without claiming durable storage or distributed locking.

## CORE-TASK-028 — Safety and Boundary Foundations

- Implemented deterministic Reference validation/resolution and safe fail-closed Reference errors at Level 3.
- Implemented controlled Safe Error construction and unsafe detail suppression at Level 3.
- Implemented supported semantic Version validation, AI Context validation, and Agent registry/capability boundaries at Level 1.
- Added deterministic executable fixtures and negative tests for invalid references, unsafe errors, unsupported versions, undisclosed AI output, suspended Agents, and forbidden/out-of-scope capabilities.
- Updated behavior coverage to 7 minimum-satisfied, 1 partial, and 6 not implemented targets; 4/11 Must Build Now targets now meet minimum depth.
- Added no database, external integration, model execution, Permission/Policy decision, Event emission, or professional authority.

## CORE-TASK-027 — Contract Behavior Gap Inventory Lock

- Locked 12 minimum-depth behavior gaps totaling 22 depth increments.
- Sequenced the gaps into four controlled batches, CORE-TASK-028 through CORE-TASK-031.
- Excluded Workflow Engine and Policy Engine from minimum-depth work because their current levels meet their Book 2 MVP minimums.
- Added an exact validator, required fixture, tests, architecture record, and `pnpm gaps:behavior` report.
- Added no behavior implementation, database, event bus, external integration, or Product runtime.

## CORE-TASK-026 — Phase 4 Contract Behavior Coverage Baseline

- Started Phase 4 with contract behavior coverage as the first acceptance result.
- Added the Book 2 Level 0–4 behavior depth model and 14 governed behavior targets.
- Measured 2 targets at minimum depth, 1 partial target, and 11 not implemented targets; 0/11 Must Build Now targets currently meet minimum depth.
- Added an exact validator, required fixture, tests, architecture record, and `pnpm coverage:behavior` report.
- Added no contract behavior, Execution System runtime, or production-readiness claim.

## CORE-TASK-025 — Phase 3 Contract Coverage Acceptance Lock

- Locked the final Phase 3 structural acceptance state at 187 indexed contracts across 12/12 structurally covered families.
- Accepted required Domain, Object, Service, and API layers for 26/26 Domains with 0 missing required slots.
- Accepted all 81/81 Gap Inventory targets and all five controlled implementation batches.
- Added an exact validator, required fixture, tests, architecture record, and `pnpm acceptance:contracts` report.
- Preserved the boundary that runtime, behavior, workflow execution, production readiness, and Product/Book 3 behavior are not accepted.

## CORE-TASK-024 — Canonical Workflow Contracts

- Added exactly 8 inventory-locked canonical Workflow Contract skeletons from the pinned Book 2 sources.
- Preserved the original 8 Phase 2 Workflow catalog scaffolds as noncanonical compatibility entries.
- Locked canonical ids, names, source paths, publication commit, implementation task, and validated-skeleton depth.
- Expanded `CORE_CONTRACT_INDEX` from 179 to the projected 187 entries and the Workflow family from 8 to 16 entries.
- Completed all five controlled batches and all 81/81 Gap Inventory targets; 0 remain.
- Added exact collection, source-drift, index, fixture, coverage, and final-progress validation.
- Added no workflow engine, running instances, executable transitions, direct domain mutation, active Task creation, Event emission, external communication, professional decisions, Book 3 integration, or Product behavior.
- Phase 3 implementation batches are complete; formal Contract Coverage Acceptance Lock remains the next closeout step.

## CORE-TASK-023 — Stub Domain Contract Gaps

- Added exactly 7 Object, 7 Service, and 8 API inventory-locked safe stubs for all 8 Stub Now Domains.
- Preserved the existing Knowledge Object and Service mappings and added only its missing canonical API target.
- Locked exact Book 2 source paths, publication commit, `stub_now` requirement, implementation task, and validated-skeleton depth.
- Expanded `CORE_CONTRACT_INDEX` from 157 to 179 entries: 26 Object, 26 Service, and 34 API entries.
- Completed Object, Service, and API Domain coverage at 26/26 without claiming runtime or behavior coverage.
- Increased required-layer-complete Domains from 18 to 26 and reduced missing required layer slots from 22 to 0.
- Completed 73/81 inventory targets; 8 canonical Workflow Contract targets remain.
- Added no fake success, operational availability, object schemas, service methods, API endpoints, state mutation, persistence, Book 3 integration, or Product behavior.

## CORE-TASK-022 — Must-Build Canonical Domain APIs

- Added exactly 18 inventory-locked canonical Domain API skeletons for Must Build Now Domains.
- Preserved all 8 Phase 2 global/reference API scaffolds as noncanonical compatibility entries.
- Locked canonical Book 2 source paths, publication commit, implementation task, and validated-skeleton depth for every addition.
- Expanded `CORE_CONTRACT_INDEX` from 139 to 157 entries and the API family from 8 to 26 entries.
- Expanded API Domain coverage from 4/26 to 18/26.
- Increased required-layer-complete Domains from 4 to 18 and reduced missing required layer slots from 36 to 22.
- Completed 51/81 inventory targets; 30 remain.
- Added no API routes, handlers, middleware, request/response DTOs, service execution, state mutation, event emission, database behavior, Book 3 integration, or Product behavior.

## CORE-TASK-021 — Must-Build Object and Service Gaps

- Added exactly 7 inventory-locked Object skeletons and 9 inventory-locked Service skeletons for Must Build Now Domains.
- Preserved all 12 existing Object and 10 existing Service skeletons without renaming, duplicating, or reclassifying their locked mappings.
- Added canonical Book 2 source path, pinned publication commit, implementation-task, and validated-skeleton metadata to the 16 new entries.
- Expanded `CORE_CONTRACT_INDEX` from 123 to 139 entries.
- Expanded Object Domain coverage from 12/26 to 19/26 and Service Domain coverage from 10/26 to 19/26.
- Increased required-layer-complete Domains from 1 to 4 and reduced missing required layer slots from 52 to 36.
- Completed 33/81 inventory targets; 48 remain.
- Added no object schemas, executable service methods, state mutation, workflow execution, task execution, event dispatch, database behavior, Book 3 integration, or Product behavior.

## CORE-TASK-020 — Common and Test Contract Foundations

- Added the `common` and `test` Core Contract types.
- Added exactly 10 canonical Common Contract skeletons and 7 canonical Test Contract skeletons from the locked Book 2 sources.
- Added exact source, identity, metadata, boundary, and executable-field validation for both families.
- Added two required fixtures and fixture validation, expanding the manifest from 17 to 19 entries.
- Expanded `CORE_CONTRACT_INDEX` from 106 to 123 entries.
- Expanded structural coverage from 10 to 12 contract families.
- Added batch progress reporting: CORE-TASK-020 is 17/17 complete, with 64 canonical targets remaining.
- Added unit, fixture, index, coverage, inventory-progress, and validation tests.
- Added no Common primitive runtime, executable Test Contract cases, API routes, workflow execution, permission or policy decisions, AI execution, Book 3 integration, or Product behavior.

## CORE-TASK-019 — Book 2 Contract Gap Inventory Lock

- Locked 78 Domain Object/Service/API targets against the Book 2 source tree.
- Mapped 22 targets to existing Phase 2 Object or Service skeletons.
- Locked 56 new Domain-layer targets: 14 Object, 16 Service, and 26 canonical Domain API skeletons.
- Locked 25 canonical contract-layer targets: 10 Common, 8 Workflow, and 7 Test Contracts.
- Required future `common` and `test` contract types.
- Retained the existing 8 API and 8 Workflow scaffolds without treating them as canonical targets.
- Sequenced 81 additions into five controlled batches: 17, 16, 18, 22, and 8 targets.
- Kept `CORE_CONTRACT_INDEX` unchanged at 106 entries.
- Added exact inventory validation, a required fixture, tests, and `pnpm gaps:contracts`.
- No contract skeleton, runtime, API route, workflow engine, Book 3 integration, or Product behavior added.

## CORE-TASK-018 — Phase 3 Contract Coverage Baseline

- Added a machine-readable coverage baseline for all 106 indexed contracts and 26 Core Domains.
- Distinguished structural family assurance from Book 2 Domain-layer completeness.
- Added coverage types, generated Domain mappings, exact validation, a required fixture, and a reporting command.
- Expanded the required fixture manifest from 15 to 16 entries.
- Confirmed 10/10 current contract families have structural fixture, validator, and collection-test coverage.
- Reported current Domain coverage: 26 Domain, 12 Object, 10 Service, 4 Domain-mapped API, 4 Event, and 6 Workflow.
- Reported 1/26 Domains with all required structural layers present and 52 missing required layer slots.
- Explicitly left canonical Book 2 Common, API, Workflow, and Test Contract source alignment for the next governed inventory lock.
- Did not claim runtime, behavior, production, Book 3, or Product coverage.
- Started Phase 3 with contract coverage as the first acceptance result.

## CORE-TASK-017 — Core AI Governance Contract Skeletons

- Locked Book 02 AI Governance sources and exactly 8 contract identifiers.
- Added `CoreAiGovernanceContract` and 8 metadata-only skeletons.
- Added source, Domain, protected-action, and executable-field validation.
- Added the exact AI Governance skeleton fixture.
- Expanded `CORE_CONTRACT_INDEX` from 98 to 106 entries.
- Expanded the required fixture manifest from 14 to 15 entries.
- Added fixture, validator, index, and boundary tests.
- No model or prompt execution added.
- No agent runtime, orchestration, or autonomous authority added.
- No permission, policy, review, workflow, event, service, API, database, Product UI, or state-mutation behavior added.
- Phase 2 Core Contract Layer completed; Phase 3 contract coverage is next.

## CORE-TASK-016 — Core Policy Contract Skeletons

- Added `CorePolicyContract` type.
- Added 8 Core Policy Contract Skeletons.
- Added policy skeleton validator.
- Added policy skeleton fixture.
- Expanded `CORE_CONTRACT_INDEX` from 90 to 98 entries.
- Updated fixture manifest and validation.
- Added tests.
- No policy engine added.
- No rule evaluation added.
- No runtime enforcement added.
- No compliance decision logic added.
- No Book 03 runtime contracts added.
- No product UI contracts added.
- No AI agent policy authority added.

All notable changes to MarkOrbit Core will be documented in this file.

## CORE-TASK-015 — Core Permission Contract Skeletons

- Added `CorePermissionContract` type.
- Added 8 Core Permission Contract Skeletons.
- Added permission skeleton validator.
- Added permission skeleton fixture.
- Expanded `CORE_CONTRACT_INDEX` from 82 to 90 entries.
- Updated fixture manifest and validation.
- Added tests.
- No permission engine added.
- No RBAC added.
- No authentication or authorization middleware added.
- No API guards added.
- No Book 03 runtime contracts added.
- No product UI contracts added.
- No AI agent permission authority added.

## CORE-TASK-014 — Core Workflow Catalog Skeleton

- Added `CoreWorkflowCatalogEntry` type.
- Added 8 Core Workflow Catalog Skeletons.
- Added workflow catalog skeleton validator.
- Added workflow catalog skeleton fixture.
- Expanded `CORE_CONTRACT_INDEX` from 74 to 82 entries.
- Updated fixture manifest and validation.
- Added tests.
- No workflow engine added.
- No workflow runtime added.
- No running workflow instances added.
- No Book 03 Workflow Coordination runtime added.
- No product UI contracts added.
- No AI agent workflow authority added.

## CORE-TASK-013 — Core Event Catalog Skeleton

- Added `CoreEventCatalogEntry` type.
- Added 12 Core Event Catalog Skeletons.
- Added event catalog skeleton validator.
- Added event catalog skeleton fixture.
- Expanded `CORE_CONTRACT_INDEX` from 62 to 74 entries.
- Updated fixture manifest and validation.
- Added tests.
- No Event Bus added.
- No Event Sourcing added.
- No persistence added.
- No concrete payload schemas added.
- No Book 03 Event Trace runtime added.
- No product UI contracts added.
- No AI agent event authority added.

## CORE-TASK-011 — Core Service Contract Skeletons

- Added CoreServiceContract type.
- Added 10 Core Service Contract Skeletons.
- Added service skeleton validator.
- Added service skeleton fixture.
- Expanded CORE_CONTRACT_INDEX from 44 to 54 entries.
- Updated fixture manifest and validation.
- Added tests.
- No service implementations added.
- No executable methods added.
- No API contracts added.
- No Book 03 runtime contracts added.
- No product UI contracts added.
- No AI agent authority added.

## CORE-TASK-008 — Core Contract Index

- Added CoreContractId.
- Added CoreContractType.
- Added CoreContractStatus.
- Added CoreContractScope.
- Added CoreContractReference.
- Added CoreContractDefinition.
- Added CORE_CONTRACT_INDEX with 6 foundation entries.
- Added contract index fixture.
- Added contract index validation.
- Added tests.
- Started Phase 2 — Core Contract Layer.
- No concrete business contracts added.
- No service/API contracts added.
- No Book 03 runtime contracts added.
- No product UI contracts added.
- No AI agent authority added.

## CORE-TASK-005 — Core Task Primitive

- Added CoreTaskId.
- Added CoreTaskType.
- Added CoreTaskStatus.
- Added CoreTaskPriority.
- Added CoreTaskActor.
- Added CoreTaskReviewRequirement.
- Added CoreTask.
- Added CoreTask validation helper.
- Added task base fixture.
- Added task tests.
- No task runtime added.
- No task catalog added.
- No workflow engine added.
- No Book 03 Task Lifecycle runtime added.
- No product UI added.
- No AI agent task authority added.

## CORE-TASK-004 — Core Event Primitive

- Added CoreEventId.
- Added CoreEventType.
- Added CoreEventAction.
- Added CoreEventSource.
- Added CoreEvent.
- Added CoreEvent validation helper.
- Added event base fixture.
- Added event tests.
- No event bus added.
- No event catalog added.
- No Book 03 runtime added.
- No product UI added.
- No AI agent event authority added.

## CORE-TASK-003 — Core Object Base Types

- Added CoreObjectId.
- Added CoreObjectType.
- Added CoreObjectStatus.
- Added CoreObjectReference.
- Added CoreObjectVersion.
- Added CoreObjectMetadata.
- Added CoreObjectDefinition.
- Added object base fixture.
- Added object base tests.
- No domain-specific business objects added.
- No workflow logic added.
- No product UI added.

## CORE-TASK-002 — Core Domain Registry

- Added canonical 26-domain registry.
- Added domain categories.
- Added registry fixture.
- Added registry tests.
- Added architecture note.
- No business logic added.
- No product UI added.
- No Book 03 / Book 04 implementation added.

## 0.0.0

- Initialize repository structure, project setup, governance files, and placeholder version export.

## CORE-TASK-006 — Core Workflow Contract Primitive

- Added CoreWorkflowContractId.
- Added CoreWorkflowContractType.
- Added CoreWorkflowContractStatus.
- Added CoreWorkflowStep.
- Added CoreWorkflowTransition.
- Added CoreWorkflowContract.
- Added workflow contract validation helper.
- Added workflow contract base fixture.
- Added workflow contract tests.
- No workflow engine added.
- No workflow runtime added.
- No Book 03 Workflow Coordination runtime added.
- No product UI added.
- No AI agent workflow authority added.

## CORE-TASK-009 — Core Domain Contract Skeletons

- Added `CoreDomainContract` type.
- Added 26 Core Domain Contract Skeletons.
- Added domain skeleton validator.
- Added domain skeleton fixture.
- Expanded `CORE_CONTRACT_INDEX` from 6 to 32 entries.
- Updated fixture manifest and validation.
- Added tests.
- No concrete business contracts added.
- No object/service/API contracts added.
- No Book 03 runtime contracts added.
- No product UI contracts added.
- No AI agent authority added.

## CORE-TASK-012 — Core API Contract Skeletons

- Added CoreApiContract type.
- Added 8 Core API Contract Skeletons.
- Added API skeleton validator.
- Added API skeleton fixture.
- Expanded CORE_CONTRACT_INDEX from 54 to 62 entries.
- Updated fixture manifest and validation.
- Added tests.
- No API server added.
- No routes or handlers added.
- No request/response DTO schemas added.
- No service implementations added.
- No Book 03 runtime contracts added.
- No product UI contracts added.
- No AI agent authority added.

## CORE-TASK-033 — Phase 4 Contract Behavior Hook Acceptance Lock

- Added the Phase 4 selected Core behavior-hook minimum-depth acceptance lock.
- Accepted 14/14 selected behavior targets, including 12 implemented-batch targets and 2 preexisting-minimum targets.
- Added dynamic validation, fixture coverage, and evidence test execution through `pnpm acceptance:behavior`.
- Boundary: does not accept Book 02 MVP completion, Domain business behavior, Execution System implementation, complete Workflow or Policy Engines, or production readiness.

## CORE-TASK-034 — Lock Book 02 MVP gap baseline

- Book 02 MVP Gap Baseline is locked only after this task passes validation.
- Book 02 MVP remains incomplete.
- Selected behavior-hook minimum-depth acceptance remains valid.
- Domain business behavior remains unaccepted.
- Execution System remains incomplete.
- Production readiness remains unaccepted.

## CORE-TASK-035 Object public-reference foundation

Must Build Object public-reference and base validation is implemented. Object business schemas and Domain behavior remain incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.

## CORE-TASK-035R Object public-reference semantic repair

The Object public-reference foundation now uses the corrected real Object contract/profile mapping, including the special Policy mapping to `permission-policy-record` / `core-object-permission-policy-record-contract`. Public reference identity validation is separated from related-reference resolution; deterministic fixture references are test evidence and not a default runtime registry. Metadata validation is plain-JSON only, Audit and Visibility metadata fail closed, construction deep-clones before freezing, and Book 02 Object evidence is derived per Object.

Object business schemas remain incomplete. Domain behavior remains incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.
