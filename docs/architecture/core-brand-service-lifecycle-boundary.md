# Core Brand Service lifecycle boundary

Brand Service is the second Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.

## Selection rationale

Book 02 places Brand immediately after Customer in the execution spine and Customer Intake coordinates Brand intake after Customer creation. Implementing Brand Service therefore extends the first accepted Service-owned pattern without jumping ahead to Trademark, Matter, Order, API validators, or Workflow execution.

## Authority and controlled values

The authority is `whalemarks/markorbit-publication` commit `3349ecb8955021a8714d023348f8b24f941eb98f`.

Stored MVP Brand types follow `objects/brand.md`:

- `Word`
- `Logo`
- `Combined`
- `Slogan`
- `Series`
- `TradeName`
- `ProductLine`
- `Unknown`

Stored MVP Brand statuses are `Draft`, `Active`, `ReviewRequired`, `Archived`, and `DeletedReferenceOnly`.

The broader and conflicting type/status vocabulary in `services/brand-service.md` is not silently merged. It requires a separately governed specification reconciliation.

## Exact operation scope

The implemented operations are:

- `createBrand`
- `getBrand`
- `listBrands`
- `validateBrandReference`
- `changeBrandStatus`

`updateBrand`, asset linking, Customer-link mutation, Trademark linking, Brand API validators, and Customer Intake Workflow behavior remain unresolved.

## Record and reference boundary

A Brand Service record composes the accepted Core MVP Object foundation with Brand type, Brand status, bounded name/source references, and an optional Customer public reference.

Brand public references are pre-provisioned by the accepted Reference boundary. Creation requires the supplied Brand reference to exist in the injected registry and to match its ID, Object type, Domain, and status. An optional Customer reference must resolve as an active `customer-record` in the `customer` Domain. Brand Service does not create Customer records and does not mutate Customer relationships.

## Governance, visibility, and idempotency

Every operation validates Permission, Policy, Human Review, Audit, correlation, target, and decision-reference consistency. Organization visibility is enforced where present on the Brand Object.

Create and status-change operations use success-only idempotency scoped by Service, operation, and authorized organization or actor. Status replay is resolved before lifecycle transition execution, so a repeated request returns the original immutable result without another state mutation or Event. Reusing the same key for a different Brand request returns `IdempotencyConflict`.

## Lifecycle and Events

The Brand lifecycle implements the exact Brand Object transitions:

- `Draft -> Active`
- `Draft -> ReviewRequired`
- `ReviewRequired -> Active`
- `Active -> ReviewRequired`
- `Active -> Archived`
- `Draft -> Archived`
- `Archived -> DeletedReferenceOnly`

Archival and deletion-reference transitions require a safe reason reference. Mutations use generic `core-object-created` and `core-object-status-changed` Event trace handoffs owned by Brand Service. The Service does not implement an Event bus or dispatch runtime.

## Executable evidence

The deterministic Brand fixture is the 29th required Core fixture. Fixture validation and Service behavior validation both execute create, replay, duplicate/conflict, read/list/reference validation, status change, status replay, prohibited transition, record counts, and Event counts.

Service evidence is now registry-driven for Customer and Brand rather than hard-coded to Customer. A Service without its own executable evidence cannot be promoted by shared implementation files.

## MVP state

Brand Service is expected to derive `meets_required_depth` at `level_2_3`. Customer and Brand are the only two Must Build Services with executable owned behavior; the remaining 16 Services stay incomplete. The global Service acceptance criterion remains unresolved, acceptance remains 11/19, and `book02MvpComplete` remains false.

Customer Intake Workflow preview/apply, Brand API validators, Trademark Service, full execution runtime, database persistence, and production readiness remain unaccepted.

Next governed task: CORE-TASK-038 — select the next Service-owned behavior batch from the updated Book 02 MVP gap baseline.
