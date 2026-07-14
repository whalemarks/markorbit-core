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

## Safety and governance

The boundary reuses Object, Reference, Permission, Policy, Human Review, Audit, Idempotency, Pagination, Safe Error, and Event trace foundations. Organization scope is enforced before reads, list pagination, validation, reference validation, and mutation. List, validation, and Event outputs omit item contents, source references, visibility, metadata, and governance internals.

## Evidence

Required fixture 32 executes create, replay, idempotency conflict, safe reads, structural validation, reference validation, review-required transition, governed approval, approval replay, approval conflict, record counts, Event counts, and payload safety.

## Explicit non-goals

Item add/update/remove operations, metadata update, relationship mutation, AI recommendation, official item synchronization, legal-rule and fee engines, filing execution, API validators, Workflow preview/apply, persistence, Event bus runtime, Book 02 completion, and production readiness remain incomplete.
