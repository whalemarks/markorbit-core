# Core Evidence Service MVP completion

CORE-TASK-042B completes the governed Evidence Service behavior that was intentionally left outside the CORE-TASK-042 proof-layer foundation.

## Authority

- Specification repository: `whalemarks/markorbit-publication`
- Locked commit: `3349ecb8955021a8714d023348f8b24f941eb98f`
- Primary authority: Evidence Domain, Evidence Object, Evidence Service and related Document, Trademark, Brand and Classification specifications in Book 02.

## Controlled-value resolution

The Evidence Object specification is used as the canonical MVP controlled-value authority where the Evidence Service draft contains older names. This matches the existing CORE-TASK-042 runtime values and avoids inventing aliases or silently merging enums. Service inputs, tests, contract metadata and executable behavior therefore use the Evidence Object values consistently.

## Completed operations

- `updateEvidence` for governed mutable metadata only
- `linkEvidenceTrademark`
- `linkEvidenceBrand`
- `linkEvidenceClassification`, including governed goods/services item references

The existing create, read, list, validation, source, claim, Document, review and status operations remain part of the canonical Evidence boundary.

## Lifecycle correction

Professional decisions now require the explicit sequence:

`ReviewRequired → Reviewed → Accepted | Rejected | Insufficient`

`HumanReviewed` records the first transition. Acceptance, rejection and insufficiency cannot occur directly from `ReviewRequired`, and AI draft review never counts as professional acceptance. Remaining status transitions follow Book 02, including filing, archival and `Archived → DeletedReferenceOnly`.

## Reliability and privacy

Completed mutations preserve immutable public identity, organization scope, audit/version metadata, success-only idempotency and Event rollback. Relationship targets are validated through the governed reference registry. List, validation and Event payloads expose relationship presence or counts rather than protected reference IDs. Cross-organization validation remains a safe not-found result.

## Compatibility boundary

The original foundation class remains exported from the Evidence module for historical fixture execution. The repository root exports the completed class as the canonical `CoreEvidenceService`. New production-facing behavior and direct tests target the completed class.

## Remaining non-goals

- source unlinking
- Matter and Jurisdiction relationship mutation
- Evidence Package and litigation chronology runtime
- OCR, authenticity verification or automatic legal sufficiency scoring
- persistence, API routes, Workflow execution and external integrations
