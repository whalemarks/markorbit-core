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

Phase 4 selected Core behavior-hook minimum-depth acceptance is complete. Book 02 MVP remains incomplete; Domain business behavior, the Execution System, complete Workflow and Policy Engines, and production readiness remain outside the accepted scope.

## Book 02 MVP Gap Baseline

Book 02 MVP Gap Baseline is locked only after this task passes validation. Book 02 MVP remains incomplete. Selected behavior-hook minimum-depth acceptance remains valid. Domain business behavior remains unaccepted. Execution System remains incomplete. Production readiness remains unaccepted.

Run `pnpm gaps:mvp` to print and validate the canonical derived Book 02 MVP gap baseline.

## CORE-TASK-035 Object public-reference foundation

Must Build Object public-reference and base validation is implemented. Object business schemas and Domain behavior remain incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.

## CORE-TASK-035R Object public-reference semantic repair

The Object public-reference foundation now uses the corrected real Object contract/profile mapping, including the special Policy mapping to `permission-policy-record` / `core-object-permission-policy-record-contract`. Public reference identity validation is separated from related-reference resolution; deterministic fixture references are test evidence and not a default runtime registry. Metadata validation is plain-JSON only, Audit and Visibility metadata fail closed, construction deep-clones before freezing, and Book 02 Object evidence is derived per Object.

Object business schemas remain incomplete. Domain behavior remains incomplete. Service-owned behavior remains incomplete. API validators remain incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted.

Next governed task: CORE-TASK-036 — first Service-owned behavior batch selected from the locked MVP gap baseline.
