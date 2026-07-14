# Core Matter Service Execution-Container Foundation

CORE-TASK-043B implements the Book 02 Matter Service boundary after the erroneous merge of PR #49, which contained only a temporary workspace workflow.

Matter remains a professional execution container. It does not own Order commercial commitment, Task execution, Workflow Contract rules, Document lifecycle, Evidence lifecycle, filing, payment, or professional decisions.

Implemented behavior covers governed creation, safe read/list, metadata update, lifecycle transitions, reference validation, and explicit links to Order, Customer, Brand, Trademark, Workflow Contract, Task, Document, and Evidence. All mutations use organization scope, Permission, Policy, Audit context, success-only idempotency, safe Event handoff, and rollback when Event append fails.

The canonical lifecycle follows the Matter Object specification:

`Draft → Open → InProgress → waiting/review/blocked → InProgress → Completed | Cancelled → Archived → DeletedReferenceOnly`.

Completion requires Task trace. Cancelled, Archived, and DeletedReferenceOnly records cannot silently return to active execution. Workflow Contract linkage is recorded but this foundation does not execute or interpret Book 03 workflow runtime.
