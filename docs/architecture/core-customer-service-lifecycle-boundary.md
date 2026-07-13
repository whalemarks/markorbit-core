# Core Customer Service lifecycle boundary

Customer Service core lifecycle behavior is implemented at the governed MVP boundary.

This is the first Service-owned behavior batch because `must-service-customer-service` has a stable Customer Object foundation and can prove the Book 02 Section 5.3 minimum without introducing a generic Service Engine.

The exact operations are `createCustomer`, `getCustomer`, `listCustomers`, `validateCustomerReference`, and `changeCustomerStatus`.

The stored MVP controlled Customer types are `Individual`, `Company`, `AgencyClient`, `InternalClient`, and `Unknown`. The stored MVP Customer statuses are `Draft`, `Active`, `ReviewRequired`, `Suspended`, `Inactive`, `Archived`, and `DeletedReferenceOnly`. Broader Customer Service values such as `Agency`, `BrandOwner`, `Applicant`, `Assignee`, `RepresentativeClient`, `Lead`, and `Blocked` require separately governed specification reconciliation.

Customer Service records compose the Core MVP Object base record with Customer type, Customer status, a safe name reference, and a safe source reference. The Customer lifecycle maps to generic Object status as Draft and ReviewRequired to `draft`, Active to `active`, Suspended and Inactive to `inactive`, Archived to `archived`, and DeletedReferenceOnly to `deleted`.

Permission, Policy, Human Review, Audit, Idempotency, Pagination, Reference validation, safe errors, and Event trace handoff reuse the accepted Core behavior boundaries. Creation and status change are idempotent and emit safe Event trace handoffs only for `core-object-created` and `core-object-status-changed`.

Reads, lists, and reference validation return safe data only and do not emit Events. The in-memory store is an ephemeral deterministic MVP/test boundary, not production persistence.

The remaining 17 Must Build Services do not yet own executable behavior.

Customer relationship-linking and metadata-update operations remain incomplete.

Customer API validators remain incomplete.

Customer Intake Workflow preview/apply remains incomplete.

Book 02 MVP remains incomplete.

Production readiness remains unaccepted.

Next governed task: CORE-TASK-037 — select the next Service-owned behavior batch from the updated Book 02 MVP gap baseline.
