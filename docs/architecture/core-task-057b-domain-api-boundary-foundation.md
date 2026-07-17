# CORE-TASK-057B Domain API Boundary Foundation

## Scope

Implement executable governed API boundaries for Customer, Brand, Trademark, Jurisdiction, Classification, Document and Evidence.

Each API must validate request and response envelopes, delegate only to its owning Service contract, preserve Permission, Policy, Human Review, audit and idempotency context, reject direct Domain mutation and direct Domain Event emission, and return only safe immutable responses.

## Exclusions

No HTTP server, router framework, authentication runtime, persistence adapter, Event bus, workflow engine or production transport is introduced.

## Acceptance

- All seven API requirements reach `meets_required_depth`.
- Existing five CORE-TASK-057A API boundaries remain unchanged.
- Negative tests prove API code cannot emit Domain Events or mutate Domain state directly.
- Book 02 fixtures and post-Service audit are regenerated deterministically.
- Full repository validation passes on Node.js 20 and 22.
