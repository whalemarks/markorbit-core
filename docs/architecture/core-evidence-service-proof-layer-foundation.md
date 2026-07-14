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

## Planned foundation operations

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

- Evidence requires a source.
- Evidence requires a proof purpose or claim relationship.
- A Document does not become Evidence automatically.
- AI review is not professional acceptance.
- Professional acceptance and rejection require governed human review.
- Evidence validation must not expose restricted proof content or sensitive proof strategy.

## Boundary

This task does not implement automatic sufficiency scoring, OCR or extraction, authenticity verification, litigation chronology, Evidence Package runtime, external integrations, API routes, Workflow preview/apply, persistence, Event bus runtime or production readiness.
