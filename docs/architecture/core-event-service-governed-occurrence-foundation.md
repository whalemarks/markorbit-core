# Core Event Service governed occurrence foundation

CORE-TASK-046 gives the Event Domain an owning Service boundary for governed occurrence records. The implementation owns `recordEvent`, `getEvent`, Event reference and payload validation, controlled status changes, dispatch success and failure traces, downstream consumer reference linkage, and archival.

Event remains a record of what happened. It does not execute Tasks or Workflows, notify users, send Communications, replace Audit, or provide an event bus, event-sourcing runtime, distributed queue, replay engine, stream processor, webhook marketplace, or production persistence.

Recording requires controlled source, actor, organization, object, payload-contract, category, timestamp, governance, idempotency, and audit context. Safe reads and reference validation omit raw payloads and protected actor, organization, source-object, and consumer identifiers. Dispatch and consumer mutations are idempotent, organization-scoped, policy-governed, and rolled back when trace handoff fails.
