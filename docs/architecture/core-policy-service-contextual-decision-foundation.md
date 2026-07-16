# Policy Service Contextual-Decision Foundation

CORE-TASK-054 implements the Book 02 governed Policy Service boundary for contextual rule lifecycle, Permission-aware evaluation, deterministic restrictions, review and approval requirements, redaction and non-disclosure guidance, safe reference validation, applicable-policy listing, archival, auditability, and Event trace handoff.

Policy Service answers whether an otherwise Permission-authorized action is allowed in the current governed context. It never creates or implies a Permission grant. A Permission denial or unknown Permission result fails closed before any Policy allowance is considered. Conversely, a Policy `Allowed` decision means only that the applicable contextual rules do not impose an additional restriction; it cannot authorize an actor that Permission Service did not authorize.

Evaluation is deterministic: Permission failure precedes explicit Policy deny, non-disclosure restriction, blocking restriction, human review, approval requirement, redaction requirement, ordinary allow, missing-policy fail-closed, and finally `NotApplicable` for behavior that is not Policy-controlled. Review and approval decisions express requirements only; Policy Service does not execute approval or Workflow.

Protected AI actions involving restricted data, professional conclusions, external communications, or automated execution require explicit Policy evaluation. AI-initiated, override-capable, negative, or high-risk Policy creation and escalation require an Agent Contract and approved Human Review. Policy does not replace professional judgment, implement a jurisdiction-specific legal rule engine, disclose protected conditions, or embed product-specific business logic.

Mutations are organization-scoped, idempotent, immutable at the public boundary, and roll back when Event trace handoff fails. Safe views and evaluation outputs omit confidential conditions and protected resource details.

The resulting Book 02 Must Build baseline is `50 / 3 / 39`. All 18 Must Build Services now meet Level 2–3 behavior evidence, so the Must Build Service gap is zero. Book 02 MVP remains incomplete because API validator/delegation boundaries, preview/apply workflows, and event-emission separation criteria remain unresolved.

## Validation boundary

The foundation is accepted only when type checking, linting, formatting, all required fixture validators, the complete repository test suite, contract acceptance, behavior acceptance, and the Book 02 MVP gap baseline pass together against the clean branch state. Derived contract and Book 02 fixtures must be regenerated deterministically from authoritative source code before acceptance. Zero unresolved Must Build Service gaps must not be represented as full Book 02 completion while `book02MvpComplete` remains false.
