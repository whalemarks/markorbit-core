# Core Classification Service scope and validation boundary

Classification Service is the fifth dependency-first Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.

## Authority

- Repository: whalemarks/markorbit-publication
- Commit: 3349ecb8955021a8714d023348f8b24f941eb98f
- Primary specifications: Classification Domain, Object, and Service.

## Exact operation scope

- createClassification
- getClassification
- listClassifications
- validateClassification
- validateClassificationReference
- changeClassificationStatus

Classification requires a controlled scheme, at least one class reference, and at least one goods/services item linked to a declared class. A class number alone is not a valid Classification.

## Review and AI boundary

Draft scope is structurally valid but remains review-required. ReviewRequired to Approved or Rejected requires completed governed human review. AIRecommended is never treated as ApprovedForFiling. Classification Service does not file applications or certify official wording.

The lifecycle batch intentionally stops before Filed and Amended transitions. Those states require filing or prosecution synchronization that does not belong in this foundation task.

## Safety and governance

The boundary reuses Object, Reference, Permission, Policy, Human Review, Audit, Idempotency, Pagination, Safe Error, and Event trace foundations. Organization scope is enforced before reads, list pagination, validation, reference validation, and mutation. List, validation, and Event outputs omit item contents, source references, visibility, metadata, and governance internals.

Mutating operations use success-only idempotency. Event handoff failure rolls back the inserted Classification or restores the prior lifecycle state.

Cross-organization reference validation returns a non-enumerating NotFound-style result and does not reveal whether another organization owns the Classification.

## Contract promotion

The existing index-6 Classification reference placeholder is promoted in place to `classification-service`, preserving the 26-Service contract structure while locking CORE-TASK-040 behavior metadata.

## Evidence

Required fixture 32 executes create, replay, idempotency conflict, safe reads, structural validation, reference validation, review-required transition, governed approval, approval replay, approval conflict, record counts, Event counts, and payload safety.

Historical Customer, Brand, Trademark, and Jurisdiction evidence remains independently validated; Classification is appended as the fifth dependency-first Service rather than replacing or weakening prior evidence.

## Derived boundary

The independently derived target is 37 Must Build requirements meeting required depth, 3 partial evidence, 52 validated skeleton only, 5 boundary scaffold only, and 18 semantic overlap only. Acceptance remains 11 of 19 because 13 Must Build Services still lack executable owned behavior.

## Explicit non-goals

Item add/update/remove operations, metadata update, relationship mutation, AI recommendation, official item synchronization, legal-rule and fee engines, filing execution, API validators, Workflow preview/apply, persistence, Event bus runtime, Book 02 completion, and production readiness remain incomplete.
