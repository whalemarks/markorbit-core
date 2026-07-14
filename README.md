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

CORE-TASK-036 note: Customer Service core lifecycle behavior is implemented at the governed MVP boundary. The remaining 17 Must Build Services do not yet own executable behavior. Customer relationship-linking and metadata-update operations remain incomplete. Customer API validators remain incomplete. Customer Intake Workflow preview/apply remains incomplete. Book 02 MVP remains incomplete. Production readiness remains unaccepted. Next governed task: CORE-TASK-037 — select the next Service-owned behavior batch from the updated Book 02 MVP gap baseline.

CORE-TASK-037 note: Brand Service core lifecycle behavior is implemented at the governed MVP boundary with create, read, list, reference validation, and status transition operations. Customer and Brand are the only two Must Build Services with executable owned behavior; the remaining 16 Services remain incomplete. Brand update and relationship-linking operations, Brand API validators, Customer Intake Workflow preview/apply, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 34 meets_required_depth, 3 partial_evidence, 55 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-038 — select the next Service-owned behavior batch from the updated Book 02 MVP gap baseline.

CORE-TASK-038 note: Trademark Service core lifecycle behavior is implemented at the governed MVP boundary with create, read, list, reference validation, and status transition operations. Customer, Brand, and Trademark are the only three Must Build Services with executable owned behavior; the remaining 15 Services remain incomplete. Trademark update, relationship mutation, official-reference updates, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 35 meets_required_depth, 3 partial_evidence, 54 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-039 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.

CORE-TASK-039 note: Jurisdiction Service core lifecycle and code-resolution behavior is implemented at the governed MVP boundary with create, read, list, reference validation, code resolution, and status transition operations. Customer, Brand, Trademark, and Jurisdiction are the four Must Build Services with executable owned behavior; the remaining 14 Services remain incomplete. Jurisdiction metadata update, office/rule/service-scope linkage, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 36 meets_required_depth, 3 partial_evidence, 53 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-040 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.
