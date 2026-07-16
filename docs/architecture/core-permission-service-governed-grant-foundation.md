# Permission Service Governed Grant Foundation

CORE-TASK-053 implements the Book 02 governed Permission Service boundary for explicit actor-action-resource grants, controlled lifecycle, safe reference validation, deterministic authorization evaluation, actor grant listing, archival, auditability, and Event trace handoff.

Permission Service answers whether an actor is authorized in principle. It does not authenticate credentials, own Identity, User, or Organization records, infer grants from task assignment or organization membership, execute workflow approval, replace professional judgment, or evaluate Policy as the final contextual decision. A matching grant may return `PolicyRequired`, preserving the handoff to Policy Service rather than absorbing it.

The Permission Object and Permission Service specifications describe different dimensions. This implementation locks the Service specification values for permission type and lifecycle, while using the Object specification effects (`Allow`, `Deny`, `ReviewRequired`) only as the governed rule disposition. The vocabularies are not silently conflated.

Evaluation is deterministic: explicit active deny takes precedence, followed by review-required rules, policy-required allow rules, ordinary active allow rules, suspended or review-required lifecycle matches, and finally no match. Task assignment and organization membership hints never create an implicit grant.

Mutations are organization-scoped, idempotent, immutable at the public boundary, and roll back when Event trace handoff fails. AI actors cannot grant themselves Permission. AI-initiated or high-risk Admin, AI Agent, and System Permission creation and escalation require an Agent Contract and approved Human Review.

The resulting Book 02 Must Build baseline is `49 / 3 / 40`, leaving Policy Service as the final foundational Service gap.

## Validation boundary

The foundation is accepted only when type checking, linting, formatting, all required fixture validators, the complete repository test suite, contract acceptance, behavior acceptance, and the Book 02 MVP gap baseline pass together against the clean branch state. Derived contract and Book 02 fixtures must be regenerated deterministically from the authoritative source code before acceptance.
