# Core Object Contract Skeletons

CORE-TASK-010 introduces Core Object Contract Skeletons as the first explicit object contract layer in MarkOrbit Core.

These skeletons exist to reserve approved object contract boundaries for a controlled baseline set of Core objects while preserving the separation between Core contracts, execution runtime, product UI, and future domain-specific implementations.

## Scope

Core Object Contract Skeletons are based on `CoreObjectDefinition`. They identify the object contract id, object type, owning Core domain, purpose, base field expectations, ownership boundary, and non-goals.

They do not define full object schemas yet. They do not define business object fields such as filing dates, goods, services, client instructions, legal opinions, evidence file payloads, provider fees, workflow state, or other domain-specific data.

## Boundary Rules

Product UI must not depend on object internals directly. Product experiences should consume approved contracts or future service/API layers rather than assuming object schema details from these skeletons.

Execution Context and Execution Runtime belong to Book 03 and are not object contracts in this task. Artifact, Render, Publish, Distillery, and Workplace concepts are also not object contracts in CORE-TASK-010.

## Future Expansion

Future tasks may expand selected object skeletons into full object contracts, but only through explicit approval. Any such expansion must keep Core, Execution, Product, service/API, workflow runtime, database, and AI agent authority boundaries intact.

## CORE-TASK-023 safe stub expansion

CORE-TASK-023 appends 7 canonical Object skeletons for Opportunity, Notification, Partner, Agent, Service Provider, Service Network, and Routing. Each is explicitly marked `stub_now` and reserves only a structural object-reference boundary; none claims a full schema, persistence, lifecycle, validation, operational availability, or production readiness.
