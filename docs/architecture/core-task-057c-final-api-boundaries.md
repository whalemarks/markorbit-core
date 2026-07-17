# CORE-TASK-057C — Final API Boundary Lock

## Scope

Complete the remaining six Must Build API boundaries:

- Matter API
- Order API
- Workflow Contract API
- Task API
- Event API
- Communication API

## Required behavior

Each API must provide request and response validation, reference validation, Permission and Policy context validation, Human Review preservation where required, idempotency checks for duplicate-sensitive operations, safe error behavior, version validation, and delegation only to its owning Service contract.

## Layer boundaries

- API code must not mutate Domain state directly.
- API code must not emit Domain Events directly.
- Event API accepts and returns governed Event records and references; it does not turn Event references into commands.
- Workflow Contract API does not become a Workflow Engine.
- Communication API does not send external communication without the owning Service and required review state.

## Acceptance target

- All 18 Must Build APIs reach required depth.
- `must-build-api-validators-exist` becomes satisfied.
- `api-layer-does-not-emit-events-directly` becomes satisfied.
- Book 02 remains incomplete until Workflow and Agent execution-spine work is complete.
