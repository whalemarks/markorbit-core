# Core Service Contract Skeletons

CORE-TASK-011 adds the first explicit Core service contract layer for MarkOrbit Core. These skeletons identify baseline service boundaries by service type, owning domain, purpose, ownership notes, allowed textual operation categories, and non-goals.

The skeletons do not implement service logic. They do not define executable methods, handlers, API routes, database access, workflow runtime behavior, concrete trademark behavior, product UI behavior, or AI agent authority.

Each service skeleton is based on domain ownership and the Core contract boundaries established in Book 02. Product UI code must not call internal service assumptions directly from these skeletons; future API or product-facing contracts must be added explicitly.

Book 03 Execution Runtime remains outside this task. Event Bus, Workflow Engine, Task Runtime, and AI Agent Execution are excluded from the service skeleton baseline and are not modeled as Core service skeletons here.

Future tasks may expand selected service skeletons into full service contracts only through explicit approval, preserving Core / Execution / Product boundaries.
