# Core Object public-reference foundation

CORE-TASK-035 implements the Book 02 Object identity boundary that must exist before Service, API, and Workflow behavior can safely depend on Object records.

## Authority

Authority is Book 02 from `whalemarks/markorbit-publication` commit `3349ecb8955021a8714d023348f8b24f941eb98f`, especially Section 5.2 Objects, Section 14 MVP Acceptance Criteria, the implementation-depth matrix, common references, and `core-specs/objects/`. The canonical Event Object source remains `books/book-02-core-specification/core-specs/objects/event.md`.

## Corrected real Object contract/profile mapping

The Object profile registry is an independently declared, canonical 18-entry Must Build registry. It is not derived from template strings. Each profile is checked against the real Object contract skeleton for `domainId`, `objectType`, `objectContractId`, and `sourcePath`.

The policy profile intentionally maps to the established Policy Object identity: `domainId: policy`, `objectType: permission-policy-record`, and `objectContractId: core-object-permission-policy-record-contract`. This preserves the existing contract rather than inventing `policy-record` or `core-object-policy-record-contract`.

The Object skeleton registry is canonicalized into 18 Must Build Object skeletons plus 8 Stub Now Object skeletons, for 26 total Object skeletons. Must Build skeletons own the public-reference/base-validation boundary while preserving `implementationDepth: validated_skeleton`. Stub Now skeletons remain stubs and do not enter the Must Build Object acceptance batch.

## Public reference validation versus reference resolution

Every Must Build Object base record exposes one externally safe `publicReferenceId`. The value is opaque, non-empty, Domain-bound, Object-type-bound, and validated by reusing the accepted Core Reference record semantics. It is not generated here and is not a database primary key, row ID, array index, email address, phone number, display name, filesystem path, or persistence locator.

Object validation separates the supplied Object public reference from related-reference resolution. A caller must provide a matching `publicReferenceRecord` for the Object `publicReferenceId`; audit and visibility references resolve through a separate related-reference registry. Fixture reference records are deterministic test evidence only and are not a default runtime registry, so arbitrary valid supplied public IDs can be accepted when the matching Reference record is supplied.

## Plain JSON metadata rules

Core metadata must be a plain JSON object. The validator rejects root arrays, `undefined`, functions, symbols, bigints, non-finite numbers, `Date`, `Map`, `Set`, `RegExp`, `Error`, class instances, non-plain prototypes, and circular references. It enforces explicit maximum depth and total entry bounds, records one bounded issue when a limit is exceeded, and stops descending that branch.

## Audit and visibility

Audit metadata is only a trace boundary. It requires `createdAt`, `createdByReferenceId`, and `correlationId`; validates real UTC timestamps; enforces paired `updatedAt`/`updatedByReferenceId`; rejects `updatedAt` before `createdAt`; and resolves actor references through the related-reference registry. It does not implement audit persistence or an audit log.

Visibility metadata validates `permissionScopeReferenceId`, `policyScopeReferenceId`, and optional organization/actor scopes according to each Object profile's `required`, `optional`, or `not_applicable` applicability. This remains fail-closed metadata validation only and does not evaluate Permission or Policy.

## Construction semantics

`createCoreMvpObjectBaseRecord` validates first, deep-clones the validated plain data, then deep-freezes the clone. The original input and its nested metadata, audit metadata, visibility metadata, and version objects remain unfrozen and unmutated.

## Per-Object evidence derivation

Book 02 MVP Object evidence is requirement-specific. Each Object requirement can reach `meets_required_depth` only when its exact profile exists, the profile matches a real Object contract, the deterministic Object fixture record exists and validates, the matching public Reference record exists and matches type/Domain, and implementation/test/fixture evidence exists. Shared file existence alone is not enough.

## Book 02 result and boundaries

Must Build Object public-reference and base validation is implemented. Object business schemas and Domain behavior remain incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

The derived Book 02 MVP acceptance result is 11/19 by satisfying `must-build-objects-have-public-reference-ids`; `book02MvpComplete` remains `false`.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.
