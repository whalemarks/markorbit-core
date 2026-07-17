# CORE-TASK-058A — Customer Intake Workflow Preview/Apply Boundary

## Authority

- Specification repository: `whalemarks/markorbit-publication`
- Locked Book 02 authority commit: `3349ecb8955021a8714d023348f8b24f941eb98f`
- Base: merged CORE-TASK-057C on `main` at `8584adf716aef39b9e5cf8808759d05cedb01ea3`

## Goal

Implement the first bounded Workflow execution-spine slice: Customer Intake Workflow preview/apply. The workflow coordinates existing governed APIs and Services without becoming a generic Workflow Engine, mutating Domain state directly, emitting Domain Events directly, or invoking production integrations.

## Locked scope

The Customer Intake Workflow must support two explicit modes:

1. `preview`
   - validate Customer and Brand intake inputs;
   - resolve governed references and organization scope;
   - evaluate Permission, Policy and Human Review requirements;
   - produce a deterministic execution plan;
   - report blocked, review-required and ready steps;
   - perform no Service mutation and emit no Domain Event.

2. `apply`
   - accept only a valid, current preview plan;
   - preserve correlation, causation, organization, actor, decision and idempotency context;
   - delegate Customer creation and optional Brand creation only through their owning APIs/Services;
   - reject stale, altered, unapproved or already-consumed plans;
   - return immutable execution evidence and Service-owned Event references;
   - never emit Domain Events directly.

## Required boundaries

- No generic Workflow Engine, scheduler, queue, worker or orchestration runtime.
- No direct Domain mutation.
- No direct Domain Event emission.
- No bypass of API validators or owning Services.
- No automatic Human Review approval.
- No production persistence, external connector, notification transport or Event bus.
- Preview is deterministic and side-effect free.
- Apply is fail-closed and bound to the exact preview digest/version.

## Acceptance

- `must-workflow-customer-intake-workflow` reaches required depth.
- `customer-intake-workflow-supports-preview-apply` becomes satisfied.
- Workflow direct-Event rejection is executable and machine-readable.
- Fixture, unit, contract, behavior and Book 02 evidence remain deterministic.
- Book 02 remains incomplete until Trademark Application Workflow, Communication Review Workflow and Agent boundaries are complete.

## Next task

`CORE-TASK-058B — Trademark Application Workflow preview/apply boundary`.
