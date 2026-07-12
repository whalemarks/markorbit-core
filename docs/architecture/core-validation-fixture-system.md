# Core Validation Fixture System

CORE-TASK-007 adds the Core Validation Fixture System as a validation spine for MarkOrbit Core. It checks that the canonical Core domain registry and foundation primitive fixtures remain aligned as Core contracts evolve.

The system currently protects 22 required fixtures across the domain registry, foundation primitives, Contract Index, every Phase 2 contract family, the Phase 3 coverage, gap, and acceptance controls, the Phase 4 behavior baseline and gap inventory, and the canonical Common and Test Contract skeleton families. It validates structure, registry domain references, exact locked collections where required, primitive compatibility, coverage and gap count drift, behavior-depth claims, canonical target mappings, and prohibited runtime or business-specific fields.

This is validation infrastructure only. It does not add business logic, trademark-specific validation, service logic, product UI, database schema, API server behavior, AI agent authority, Book 03 execution runtime, or a workflow engine.

The fixture validators intentionally remain generic. They verify Core primitive contracts and guardrails, but they do not define domain-specific business contracts or operational execution behavior.

Future tasks may add more fixture validators as Core contracts expand. Those validators should continue to preserve the separation between Core structural integrity and downstream business or runtime systems.

Codex should run `pnpm validate:fixtures` before changing Core primitives or fixture files, along with the normal test, lint, typecheck, and diff checks.
