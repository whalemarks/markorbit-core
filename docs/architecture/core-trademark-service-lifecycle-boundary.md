# Core Trademark Service lifecycle boundary

Trademark Service is the third Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.

## Selection rationale

Book 02 places Trademark after Brand and before Jurisdiction, Classification, and Matter execution. Trademark is the legal and procedural protection object, while Brand remains the commercial identity object and Matter remains the professional execution container.

## Exact operation scope

Implemented operations:

- createTrademark
- getTrademark
- listTrademarks
- validateTrademarkReference
- changeTrademarkStatus

The Service composes the accepted Core MVP Object foundation. Creation requires a pre-provisioned Trademark public reference, a valid active Jurisdiction reference, and an optional valid active Brand reference. It does not create or mutate Brand or Jurisdiction records.

## Controlled values

Trademark types and the 17 stored statuses follow the locked Trademark Object specification. Generic Object status is derived from the Trademark lifecycle without replacing the Trademark-specific status.

## Governance and safety

Every operation validates Permission, Policy, Human Review, Audit, correlation, target, organization visibility, reference type, and reference Domain. Duplicate-sensitive mutations use success-only idempotency. Replays do not duplicate state or Event traces. Event handoff failure rolls back the mutation.

## Executable evidence

The deterministic Trademark fixture is required fixture 30 and executes create, replay, conflict, duplicate rejection, Brand/Jurisdiction validation, read, list, reference validation, status transition, status replay, invalid transition, record counts, and Event counts.

## Explicit non-goals

- updateTrademark
- relationship-link mutation
- official registry synchronization
- filing or prosecution execution
- deadline or fee engines
- registrability scoring or legal conclusions
- Trademark API validators
- Workflow preview/apply
- persistence or Event bus runtime
- Book 02 MVP completion
- production readiness

Next governed task: CORE-TASK-039 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.
