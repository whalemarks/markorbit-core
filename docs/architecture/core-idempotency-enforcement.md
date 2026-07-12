# Core Idempotency Enforcement

- Task: `CORE-TASK-029`
- Authority: `markorbit-publication` Book 2 at `3349ecb8955021a8714d023348f8b24f941eb98f`
- Source: `contracts/common/idempotency.md`

This batch provides deterministic Level 3 behavior for duplicate-sensitive Core operations. It validates opaque keys, computes canonical SHA-256 request fingerprints, isolates records by scope and operation, returns the original safe result for identical replays, and fails closed for key reuse with different semantics or an expired record.

Permission and Policy decisions are checked on every invocation, including replay. Successful replay never executes the supplied effect again, so event, communication, workflow, and other external side effects can use the same guard.

The registry is intentionally process-local. It defines and tests the contract boundary without claiming durable storage, distributed locking, production concurrency control, or cross-process guarantees.
