# Core AI Governance Contract Skeletons

## Purpose

Core AI Governance Contract Skeletons establish eight stable, inspectable governance boundaries for AI assistance in MarkOrbit Core. Their sole specification authority is Book 02 under `whalemarks/markorbit-publication/books/book-02-core-specification/`.

The eight contracts cover AI Agent, Agent Contract, AI Capability, AI Output, AI Recommendation, AI Audit Record, Structured Context, and Human Review Requirement. Every contract maps to the existing `agent` Core Domain and retains its Book 02 references and locked inventory provenance.

## Integration

CORE-TASK-017C registers all eight skeletons in `CORE_CONTRACT_INDEX` as `ai_governance` entries, adds an exact fixture, and includes that fixture in the required validation manifest. The validator preserves the locked identifiers and ordering, the `agent` Domain mapping, source metadata, non-empty textual boundaries, and the prohibition on protected-action authority or executable fields.

## Boundary

These contracts are metadata-only. They do not execute a model or prompt, run an agent, grant permissions, evaluate policies, perform human review, approve outputs, emit events, advance workflows, access production data, or mutate state.

`protectedAction: false` means the skeleton does not grant protected-action authority. `requiresHumanReview` is descriptive governance metadata only; it does not perform, route, approve, or record a review.

Book 03 may consume approved Core contracts through later explicit tasks. No execution runtime, service, API, database, Product UI, AI infrastructure, autonomous authority, or specialized agent implementation is introduced here.
