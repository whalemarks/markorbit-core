# Core Order Service Commercial-Request Foundation

CORE-TASK-044 implements the Book 02 Order Service as the governed commercial-request boundary between demand context and professional execution.

The runtime owns Order creation, metadata update, lifecycle, Customer/Opportunity/Brand/Trademark/Matter linkage, reference validation, and readiness validation. Order readiness is advisory and never creates a Matter, executes a Task, calculates a price, processes payment, or manages invoices.

The Order Object specification is authoritative for controlled `orderType` and lifecycle values where the Object and Service drafts differ. The runtime therefore uses `TrademarkFiling`, `PendingConfirmation`, `Confirmed`, `ReadyForMatter`, and the remaining Object-owned values consistently across implementation, fixtures, tests, and contract metadata.

All mutations enforce Permission, Policy, Audit, organization scope, success-only idempotency, safe Events, and rollback when Event append fails. Final or deleted-reference Orders cannot resume active mutation through this service.
