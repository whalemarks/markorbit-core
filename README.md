# MarkOrbit Core

`markorbit-core` is the engineering repository for **Book 02 — MarkOrbit Core Specification**. It provides the typed contracts, validation rules, fixtures, event primitives, workflow primitives, and testable package boundaries that future MarkOrbit systems consume.

This repository is intentionally a specification implementation layer. It is consumed by future **Execution System** and **Product System** implementations, but it does not implement those systems here.

## What this repository is

- A TypeScript repository for Book 02 Core Specification artifacts.
- A home for core types, contracts, validation schemas, fixtures, events, workflow primitives, policies, permissions, tasks, and governance references.
- A testable foundation for future packages and generated artifacts.

## What this repository is not

- It is not a product UI repository.
- It is not a product application.
- It is not MarkReg.
- It is not Lite.
- It is not Book 03 Execution System.
- It is not Book 04 Product System.
- It does not host production database connections.
- It does not define external API integrations.
- It does not implement AI agents or grant AI approval authority.

## Specification authority

Implementation must follow Book 02. This repository is not allowed to redefine Book 02 through implementation convenience. If code, fixtures, or tests reveal ambiguity, the specification must be clarified through the approved governance process before new Core meaning is introduced.

## Current phase

Phase 4 Contract Behavior Coverage is in progress, but Phase 4 is not formally accepted and Book 02 MVP remains incomplete. CORE-TASK-032 locks repository-local validation tooling and traceability checks without changing Core business behavior.
