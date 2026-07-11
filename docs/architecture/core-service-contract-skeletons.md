# Core Service Contract Skeletons

CORE-TASK-011 adds the first explicit Core service contract layer for MarkOrbit Core. The service skeletons identify baseline service boundaries by service type, owning Core domain, purpose, ownership notes, and non-goals.

These skeletons exist to make service ownership visible before any implementation work begins. They are based on domain ownership and the Core contract boundaries already established by the domain registry, contract index, domain contract skeletons, and object contract skeletons.

## Boundary rules

Core Service Contract Skeletons do not implement service logic, define executable methods, add API routes, or define database access. `allowedOperations` values are textual operation categories only; they are not callable method signatures.

Product UI must not call internal service assumptions directly from these skeletons. Any future product-facing integration must go through explicitly approved API contracts and product boundaries.

Book 03 Execution Runtime is outside this task. Event Bus, Workflow Engine, Task Runtime, and AI Agent Execution are not service skeletons in CORE-TASK-011, and this task does not introduce AI agent authority.

Future tasks may expand selected service skeletons into full service contracts only through explicit approval, preserving Core / Execution / Product boundaries.

## CORE-TASK-023 safe stub expansion

CORE-TASK-023 appends 7 canonical Service skeletons for Opportunity, Notification, Partner, Agent, Service Provider, Service Network, and Routing. Each is explicitly marked `stub_now` and reserves only a structural ownership and reference boundary; none claims methods, coordination, mutation, execution, operational availability, fake success, or production readiness.
