# Changelog

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
