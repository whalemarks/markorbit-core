# CORE-TASK-058A-CORRECTION — Customer Intake Workflow implementation lock

## Reason

PR #73 merged only the task boundary document. No Customer Intake Workflow implementation, fixture, executable test, or Book 02 evidence was added. CORE-TASK-058A therefore remains incomplete.

## Required implementation

Implement a bounded Customer Intake Workflow with explicit `preview` and `apply` modes.

### Preview

- deterministic and side-effect free;
- validates Customer and optional Brand input references;
- preserves Permission, Policy, Human Review, audit and organization context;
- produces a versioned plan and stable digest;
- records intended owning API operations without invoking them;
- does not mutate Domain state or emit Domain Events.

### Apply

- accepts only the exact current preview version and digest;
- fails closed for stale, altered, unapproved or consumed plans;
- delegates Customer and optional Brand operations only through their owning governed API boundaries;
- preserves idempotency and audit correlation;
- marks a successful plan consumed and rejects replay unless the same governed idempotency result is returned;
- does not directly mutate Domain state or emit Domain Events.

## Evidence and acceptance

- dedicated Workflow fixture and validator;
- executable positive and negative tests;
- Book 02 evidence for `must-workflow-customer-intake-workflow`;
- `customer-intake-workflow-supports-preview-apply` becomes satisfied;
- Workflow direct-Event prohibition remains enforced;
- canonical fixture, test, contract, behavior and Book 02 validation passes on Node.js 20 and 22.

## Exclusions

No generic Workflow Engine, scheduler, queue, worker, persistence adapter, Event bus, production connector or external transport.
