# Core Evidence Service proof-layer foundation

Evidence Service is the seventh dependency-first Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.

## Authority

- Repository: whalemarks/markorbit-publication
- Commit: 3349ecb8955021a8714d023348f8b24f941eb98f
- Primary specifications: Evidence Domain, Evidence Object and Evidence Service.

## Dependency rationale

Document is the governed artifact layer. Evidence sits after Document and registers proof meaning, source, purpose, claim relationship and professional review state. Matter and later professional workflows consume Evidence references without treating Evidence as an automatic legal conclusion.

The selected dependency sequence is therefore:

`Classification → Document → Evidence → Matter`

## Governed foundation operations

- createEvidence
- getEvidence
- listEvidence
- validateEvidenceReference
- linkEvidenceSource
- linkEvidenceClaim
- linkEvidenceDocument
- requireEvidenceReview
- reviewEvidence
- changeEvidenceStatus

## Core invariants

- Evidence requires at least one governed source reference.
- Evidence requires a proof purpose or a linked claim relationship.
- A Document remains an artifact and does not become Evidence automatically.
- Document references are validated before they are accepted as Evidence sources or relationships.
- AI review remains a draft review state and is not professional acceptance.
- Professional acceptance, rejection and insufficiency decisions require completed governed human review.
- Finalized Evidence cannot silently change its source, claim or Document relationships.
- Cross-organization reference validation does not enumerate protected Evidence records.
- Validation returns governed hints and never certifies legal sufficiency, authenticity or professional truth.
- List and Event outputs omit source reference IDs, claim IDs, Document IDs, review-note references and proof strategy.

## Reliability behavior

Duplicate-sensitive operations use success-only idempotency scoped by Service, operation and authorized organization or actor. A successful replay does not duplicate records, relationships or Event traces, while a changed request under the same key returns `IdempotencyConflict`.

Create and mutation operations hand off internal Event traces. Failed Event append restores the prior Evidence state or removes the newly created record so proof metadata and trace history cannot diverge.

## Derived boundary

The independently derived target is 39 Must Build requirements meeting required depth, 3 partial evidence, 50 validated skeleton only, 5 boundary scaffold only and 18 semantic overlap only. Acceptance remains 11 of 19 because 11 Must Build Services still lack executable owned behavior.

The Evidence executable fixture is required fixture 34 and covers governed creation, source linkage, claim linkage, Document linkage, human review, professional acceptance, reference validation, archive, idempotency replay/conflict and Event payload safety.

## Boundary

This task does not implement automatic sufficiency scoring, OCR or extraction, authenticity verification, litigation chronology, Evidence Package runtime, external integrations, API routes, Workflow preview/apply, persistence, Event bus runtime or production readiness.
