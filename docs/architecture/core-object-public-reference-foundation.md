# Core Object public-reference foundation

CORE-TASK-035 implements the Book 02 Object identity boundary that must exist before Service, API, and Workflow behavior can safely depend on Object records.

## Authority

Authority is Book 02 from `whalemarks/markorbit-publication` commit `3349ecb8955021a8714d023348f8b24f941eb98f`, especially Section 5.2 Objects, Section 14 MVP Acceptance Criteria, the implementation-depth matrix, common references, and `core-specs/objects/`.

## Public references, not database IDs

Every Must Build Object base record exposes one externally safe `publicReferenceId`. The value is opaque, non-empty, Domain-bound, Object-type-bound, and validated by reusing the accepted Core Reference behavior. It is not generated here and is not a database primary key, row ID, array index, email address, phone number, display name, filesystem path, or persistence locator.

## Exact profile registry

The deterministic registry contains exactly these 18 profiles in Book 02 order: identity, organization, user, permission, policy, customer, brand, trademark, jurisdiction, classification, document, evidence, matter, order, workflow-contract, task, event, communication.

Each profile maps Domain ID, Object type, Object contract ID, Book 02 source path, required public reference, required core metadata, required audit metadata, status applicability, version applicability, and Permission/Policy visibility applicability.

## Validation boundary

The shared Object validator checks profile existence, canonical order, Domain/Object mapping, contract ID matching, public-reference shape/type/Domain/status, safe bounded JSON metadata, audit timestamps and actor references, fail-closed visibility metadata, status, version, and unknown fields. It returns structured safe validation issues and does not mutate input.

## Audit and visibility

Audit metadata at this layer is a trace boundary: `createdAt`, `createdByReferenceId`, optional paired update metadata, and `correlationId`. Visibility metadata validates Permission and Policy scope references for protected profiles but does not evaluate permissions or policies.

## No generation or persistence

This task validates and constructs immutable records from supplied IDs. It does not generate IDs, persist records, check storage uniqueness, emit Events, create Tasks, call Services, or implement Object business schemas.

## Book 02 result

Must Build Object public-reference and base validation is implemented. Object business schemas and Domain behavior remain incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

The derived Book 02 MVP acceptance result moves from 10/19 to 11/19 by satisfying `must-build-objects-have-public-reference-ids`; `book02MvpComplete` remains `false`.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.
