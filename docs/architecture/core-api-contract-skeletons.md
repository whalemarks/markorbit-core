# Core API Contract Skeletons

CORE-TASK-012 adds Core API Contract Skeletons to begin an explicit API contract layer for MarkOrbit Core.

These skeletons exist to name the baseline API exposure boundaries that Core may later formalize. They are contract-level placeholders only: they describe ownership, purpose, allowed operation categories, and non-goals without creating executable API behavior.

The API skeletons do not implement an API server. They do not define routes, route handlers, middleware, HTTP framework integration, request DTOs, or response DTOs. They also do not define service logic, database access, workflow runtime behavior, product UI behavior, or AI agent authority.

Product UI must not invent API semantics from these skeletons. The skeleton layer is the controlled place where API exposure boundaries are identified before any future task expands a selected skeleton into a full API contract through explicit approval.

Book 03 Execution Runtime remains outside this task. Event Bus, Workflow Engine, Task Runtime, Artifact Render, Publish Automation, Distillery, and AI Agent Execution are not API skeletons in CORE-TASK-012.

## CORE-TASK-022 canonical expansion

CORE-TASK-022 preserves the original 8 Phase 2 API scaffolds and appends 18 canonical, source-locked Domain API skeletons for the Must Build Now Domains. The API family now contains 26 entries: 8 retained global/reference scaffolds and 18 Book 2 canonical Domain API targets.

Each canonical addition records its exact Book 2 source file, pinned `markorbit-publication` commit, implementation task, Domain mapping, and `validated_skeleton` depth. This expansion does not implement the endpoint sets, request or response schemas, handlers, middleware, service delegation, Permission or Policy evaluation, idempotency behavior, event trace behavior, or version behavior described by the source contracts.

## CORE-TASK-023 safe stub expansion

CORE-TASK-023 appends 8 canonical API skeletons for Knowledge, Opportunity, Notification, Partner, Agent, Service Provider, Service Network, and Routing. Each is explicitly marked `stub_now` and reserves only a request/safe-response boundary; none claims endpoints, handlers, DTOs, service execution, API availability, fake success, or production readiness.
