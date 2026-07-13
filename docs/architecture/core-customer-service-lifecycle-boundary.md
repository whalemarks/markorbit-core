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

## CORE-TASK-036R repair notes

The repaired boundary validates governance cross-consistency across Permission, Policy, Human Review, and Audit contexts, including actor identity, decision-reference linkage, correlation IDs, and the controlled `customer:collection` list target.

Customer operations now carry an authorized organization scope and compare it to `objectRecord.visibility.organizationScopeReferenceId`; create requires the supplied Object visibility to match, read/mutation/reference validation fail closed or withhold details on mismatch, and list filters records to the authorized scope.

Customer reference validation uses the accepted Reference boundary for Customer public IDs and validates the requesting Domain and Service contract pairing before returning any Customer reference result.

Idempotency scope is isolated by the Customer Service contract, operation, and authorized organization or actor, and the success-only idempotency helper avoids caching validation, store, or Event handoff failures.

Mutating operations commit state and Event trace handoff consistently: failed store operations do not emit Events, failed Event handoffs roll back committed state, and replay duplicates neither state nor Event traces.

The executable Customer Service fixture is registered as the 28th required Core fixture and is used by fixture validation and Book 02 MVP evidence derivation. Customer Service now derives `meets_required_depth`, while the remaining 17 Must Build Services remain incomplete and the global Service acceptance criterion remains unresolved.
