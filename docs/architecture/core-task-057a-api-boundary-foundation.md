# CORE-TASK-057A API Boundary Foundation

## Authority

- Specification repository: `whalemarks/markorbit-publication`
- Locked Book 02 commit: `3349ecb8955021a8714d023348f8b24f941eb98f`
- Core base: merged CORE-TASK-056 exact MVP Event lock

## Scope

Implement governed API validators and Service delegation boundaries for:

- Identity API
- Organization API
- User API
- Permission API
- Policy API

## Required boundaries

- Validate request envelope, identifiers, operation, version, idempotency and governance references before delegation.
- Delegate only to the owning Service contract.
- Normalize safe success and safe error responses.
- Preserve Permission, Policy, Human Review and audit context.
- Prove that the API layer cannot mutate Domain state directly.
- Prove that the API layer cannot emit Domain Events directly.

## Explicit exclusions

- No HTTP server, router framework, authentication runtime or production transport.
- No API-owned persistence.
- No direct Domain mutation.
- No direct Domain Event emission.
- No bypass of owning Service validation or governance.
- No implementation of the remaining thirteen APIs in this task.

This document is the initial task lock. It will be updated with the final evidence and validation result before the PR is marked ready for review.
