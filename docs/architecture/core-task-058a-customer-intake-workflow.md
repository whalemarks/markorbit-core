# CORE-TASK-058A — Customer Intake Workflow Preview/Apply Boundary

## Authority

- Specification repository: `whalemarks/markorbit-publication`
- Locked Book 02 authority commit: `3349ecb8955021a8714d023348f8b24f941eb98f`
- Base: merged CORE-TASK-058A correction scope on `main` at `3b9625a740121710e724b4aa6c7c3e91f63ba5e0`

## Implemented result

CORE-TASK-058A implements the bounded Customer Intake Workflow in `src/workflows/core-customer-intake-workflow.ts`. This is not a generic Workflow Engine: it exposes explicit preview/apply operations for only `must-workflow-customer-intake-workflow`.

## Preview plan semantics

`previewCustomerIntake(...)` validates the workflow contract version, Customer intake input, optional Brand intake input, organization/actor scope, Permission/Policy/Human Review/Audit context, correlation context and validity boundary. It prepares a deterministic ordered plan:

1. `customer.create` through Customer API/Service ownership.
2. Optional `brand.create` through Brand API/Service ownership when Brand intake is present.
3. Optional `task.create` plan-preparation boundary when a Task plan payload is present.

Preview fails closed when a Task plan is requested without a configured governed Task API boundary; the plan cannot advertise a step that apply would omit. Preview stores a bounded in-memory plan record, produces a canonical SHA-256 digest, records the plan version, records expiry, lists Human Review checkpoints and performs no Domain mutation, no Service mutation, no Event emission and no external side effect.

## Approved apply semantics

`applyCustomerIntake(...)` requires the exact preview id, exact plan version, exact canonical digest, an unexpired preview, matching and currently valid governance context, approval state, unused preview state and a duplicate-sensitive idempotency key. Apply fails closed for stale version, altered digest, expired preview, governance mismatch, missing/rejected approval, consumed preview and conflicting idempotency replay.

Apply delegates only through the existing governed API boundary for Customer, Brand and optional Task operations. Before mutation, a Customer Intake-specific invariant checker verifies that the stored plan exactly matches the previewed input shape, supported operation sequence and configured owning API boundaries. Unsupported, duplicate, malformed, unexpected or unavailable planned steps fail before Service delegation.

## Customer-to-Brand reference propagation

Customer creation is ordered before Brand creation. After Customer API success, apply extracts the authoritative Customer public reference from the governed result shape (`customerReferenceId`, `publicReferenceId`, nested `objectRecord.publicReferenceId`, or nested `record.objectRecord.publicReferenceId`). Brand apply payloads are built deterministically with that authoritative `customerReferenceId` and then passed through Brand API validation. A conflicting Customer reference pre-supplied in Brand input fails closed with `InvalidBrandCustomerReference`; Brand creation is skipped deterministically when Brand intake is absent.

## Owning Service mutation and Event trace reference

The Workflow does not mutate Domain state and does not emit Domain Events directly. Any mutation occurs only after API validation delegates to the owning Service. Event trace output is extracted only from genuine Service/API result fields (`eventReferenceId`, `eventReferences`, or `eventTraceReferences`). Audit context is not treated as Event evidence; when a Service/API result has no Event reference fields, the Workflow returns an empty trace list for that invocation. Workflow trace references are not commands, retries, queue messages or authorizations for more mutation.

## Evidence and fixtures

- Machine-readable CORE-TASK-058A evidence is exported as `CORE_TASK_058A_CUSTOMER_INTAKE_WORKFLOW_EVIDENCE`.
- The dedicated fixture is `fixtures/workflows/core-task-058a-customer-intake-workflow.fixture.json` and is registered in the required fixture manifest and validation dispatcher.
- The fixture distinguishes declared scenarios from executable scenario evidence. The validator checks required scenario IDs, duplicate scenario prevention, expected outcome types, safe error codes for boundary cases and traceable test file/test name/case IDs without executing tests itself.
- The Book 02 MVP baseline derives Customer Intake Workflow as `meets_required_depth` while leaving Trademark Application Workflow and Communication Review Workflow unresolved.

## Explicit exclusions preserved

No HTTP routes, authentication runtime, database persistence, production connector, queue, scheduler, worker, retry loop, generic Workflow Engine, Workflow DSL, Event bus, direct Workflow Event emitter, Agent runtime, CORE-TASK-058B implementation or CORE-TASK-058C implementation were added.

## Next task

`CORE-TASK-058B — Trademark Application Workflow preview/apply boundary`.
