# Communication Service Governed Communication Foundation

CORE-TASK-049 implements the Book 02 governed Communication Service boundary for message and conversation lifecycle records, controlled participant and business-reference linkage, governed status transitions, safe sent/received recording, reference validation, auditability, and Event trace handoff.

Communication Service owns communication records and their lifecycle. It does not replace Notification Service or Event Service, implement a production email/chat gateway, deliver external messages, convert attachments into Documents or Evidence automatically, or grant Permission, override Policy, or perform Human Review.

Outbound recording requires explicit authorization, policy, and review evidence. AI-originated content remains a disclosed draft and cannot become sent communication automatically. Mutation operations are organization-scoped, idempotent, immutable at the public boundary, and roll back when Event trace handoff fails.

## Validation boundary

The foundation is accepted only when type checking, linting, formatting, all required fixture validators, the complete repository test suite, contract acceptance, behavior acceptance, and the Book 02 MVP gap baseline pass together against the clean branch state.
