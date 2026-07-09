# Core Contract Index

## Purpose

The Core Contract Index is the foundational registry for future MarkOrbit Core contracts. It starts Phase 2 — Core Contract Layer by creating a typed index structure that can identify, classify, and track Core contracts without embedding full contract bodies or executable behavior.

The index exists to protect contract expansion from uncontrolled drift. New contract entries must be deliberate, reviewable, and tied to explicit implementation tasks.

## What the index contains

The current Core Contract Index contains only six foundation entries for primitives that already exist in Phase 1:

1. Core Domain Registry Contract
2. Core Object Base Contract
3. Core Event Primitive Contract
4. Core Task Primitive Contract
5. Core Workflow Contract Primitive Contract
6. Core Validation Fixture System Contract

Each entry is an index record. It identifies the contract id, type, status, version, source book, and high-level scope reference.

## What the index does not contain

Core Contract Definition entries do not contain full contract bodies, concrete schemas, business-specific behavior, service implementations, API behavior, workflow runtime logic, database schema, or product UI behavior.

Concrete domain, object, service, API, event, and workflow contracts will be added later through explicit tasks. Codex may not add new contract entries without explicit task approval.

## Explicit exclusions for this task

Book 03 Execution Runtime, Execution Context, Product UI, Artifact, Render, Publish, Distillery, and Workplace are not Core Contract Index entries in CORE-TASK-008.

This task also does not add concrete Trademark, Matter, or Communication contracts. It does not add service contracts, API contracts, event catalogs, workflow catalogs, runtime contracts, product contracts, database behavior, API server behavior, or AI agent authority.
