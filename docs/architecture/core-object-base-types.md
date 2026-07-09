# Core Object Base Types

## Purpose

Core Object Base Types define the shared object primitives for MarkOrbit Core. They provide a small, stable vocabulary for identifying, typing, referencing, versioning, and describing Core objects before any domain-specific object model is introduced.

These primitives exist so future Core objects can share consistent base fields without each domain inventing its own object identity, status, metadata, or version shape.

## Generic primitives only

This task adds generic object primitives only:

- Core object ids.
- Core object types.
- Core object statuses.
- Core object references.
- Core object versions.
- Core object metadata.
- Core object definitions.

The base definition composes these primitives with an existing Core Domain id. It does not define a registry of canonical object types yet.

## Not domain-specific business objects

Trademark, Matter, Communication, and other domain concepts are not implemented as business objects in this task. Fixture object types such as `trademark-record`, `matter-record`, and `communication-record` are sample base-object records only.

The fixture must not be read as a Trademark, Matter, or Communication schema. Domain-specific fields, validation, lifecycle behavior, and business rules belong in future tasks.

## Execution and runtime boundaries

Execution Context and Execution Runtime from Book 03 are not Core objects. They are outside the scope of these base types and must not be modeled as Core object definitions here.

## Product UI boundary

Product UI must not depend on Core object internals directly. Product-facing applications should use stable contracts or adapters rather than reaching into implementation details of Core object primitives.

## Future work

Future tasks may define canonical Core object types after these base primitives are stable. Those tasks may add registries, stricter validation, and domain-specific object definitions, but this task intentionally avoids workflows, services, product UI, database schema, API servers, and execution-system behavior.
