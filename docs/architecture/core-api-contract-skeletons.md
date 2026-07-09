# Core API Contract Skeletons

CORE-TASK-012 adds Core API Contract Skeletons to begin an explicit API contract layer for MarkOrbit Core.

These skeletons exist to name the baseline API exposure boundaries that Core may later formalize. They are contract-level placeholders only: they describe ownership, purpose, allowed operation categories, and non-goals without creating executable API behavior.

The API skeletons do not implement an API server. They do not define routes, route handlers, middleware, HTTP framework integration, request DTOs, or response DTOs. They also do not define service logic, database access, workflow runtime behavior, product UI behavior, or AI agent authority.

Product UI must not invent API semantics from these skeletons. The skeleton layer is the controlled place where API exposure boundaries are identified before any future task expands a selected skeleton into a full API contract through explicit approval.

Book 03 Execution Runtime remains outside this task. Event Bus, Workflow Engine, Task Runtime, Artifact Render, Publish Automation, Distillery, and AI Agent Execution are not API skeletons in CORE-TASK-012.
