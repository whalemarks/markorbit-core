# CORE-TASK-058C Communication Review Workflow

## Authority

This bounded workflow implements Book 02 Communication Review preview/apply behavior using the existing Communication, Permission, Policy, Human Review, Task, Document, Evidence, Matter, Customer, Brand, Trademark and Event boundary contracts. It follows the CORE-TASK-058A/058B preview/apply pattern and does not introduce a generic workflow engine.

## Preview boundary

`previewCommunicationReview(...)` is validation-only. It validates organization scope, Communication reference/version/state, related governed references, Permission and Policy decisions, reviewer context, disposition, canonical content payload, optional Task plan, schema version and expiry. Preview stores a canonical immutable plan in `CommunicationReviewPreviewRegistry` and returns no executable event or command object.

Preview never mutates Domain state, never emits Domain Events, and never treats the preview itself as Human Review approval.

## Apply boundary

`applyCommunicationReview(...)` reads the exact stored preview and verifies preview id, digest, schema version, organization, actor/reviewer governance context, Human Review approval state, expiry, stale Communication version, review-relevant digest, idempotency key and the stored normalized mutation plan before any permitted mutation delegation.

Apply executes only the stored `CommunicationReviewApplyMutationPlan`; raw apply payloads that conflict with the previewed content or disposition fail closed.

## Disposition semantics

- `approve` delegates `communication.approveReview` through the owning Communication API with approved content digest and reviewer evidence. It does not send or externally deliver the Communication.
- `reject` delegates `communication.rejectReview` and preserves structured rejection information. It does not delete the Communication.
- `request_changes` delegates `communication.requestChanges` and preserves reviewer instructions without rewriting draft content beyond that owning API operation.

## Content digest integrity

Preview normalizes the disposition payload, binds it to organization, Communication reference/version, reviewer, disposition and related references, then stores both `contentDigest` and `reviewRelevantDigest`. Apply uses the stored canonical payload and rejects digest, content, disposition, reviewer, organization, or Communication-version drift.

## Human Review rules

Apply requires a Human Review decision bound in the registry with `state: approved`, the same disposition, and the same reviewer context. Pending, rejected, expired, missing, or mismatched Human Review decisions cannot authorize apply.

## Delegation order

The only mutation delegation is the authoritative Communication review transition. If the stored plan includes a follow-up Task, the workflow requires the governed Task API at preview and apply, and creates the Task only after the Communication transition succeeds.

## Idempotency

A consumed preview cannot be reused except as an exact idempotent replay of the same successful apply request. Conflicting replay attempts fail closed.

## Partial failure

If Communication mutation succeeds but a later permitted delegation fails, an expected authoritative reference is absent, or trace evidence is incomplete after mutation begins, the workflow returns `CommunicationReviewPartialFailure`. The partial failure contains workflow id, preview id/digest, failed step, completed delegation trace, authoritative public references, Event trace references, safe error code and retry classification only.

It excludes stack traces, secrets, raw sensitive Communication content, provider payloads and executable Event objects.

## Event trace-not-command boundary

Event references returned by owning APIs are preserved only as trace evidence. They cannot execute, authorize, enqueue, schedule or retry commands, and the workflow does not expose an Event bus or Event emission surface.

## Explicit exclusions

No generic Workflow Engine, scheduler, queue/worker, persistence adapter, Event bus, email sending, SMS/chat/messaging transport, provider integration, external delivery, automatic AI approval, autonomous Agent execution, production HTTP route, UI implementation, or Book 02 source file modification is included.
