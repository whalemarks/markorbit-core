# CORE-TASK-061 — Core Engineering Distribution Baseline

`@markorbit/core` version `0.1.0` is the Book 02 MVP Engineering Baseline. It is a controlled internal package baseline, not a production-ready release.

## Public package exports

- `@markorbit/core`
- `@markorbit/core/objects`
- `@markorbit/core/events`
- `@markorbit/core/tasks`
- `@markorbit/core/contracts`
- `@markorbit/core/services`
- `@markorbit/core/api`
- `@markorbit/core/workflows`
- `@markorbit/core/governance`

The package intentionally does not export arbitrary `src/` files, tests, fixtures, temporary task files, coverage output, private notes, database adapters, UI code, external connectors, or a full Workflow Runtime.

## Baseline status

- Book 02 semantic completion: complete via `CORE-TASK-060`.
- Engineering distribution baseline: accepted only when `CORE-TASK-061` is merged after validation.
- Production readiness: not accepted.
- Full Workflow Runtime: excluded.
- External protected actions: unauthorized.
- AI autonomous authority: not granted.
- Execution coordination ownership: `whalemarks/markorbit-execution`.

## Consumer compatibility record

- Intended first downstream consumer: `whalemarks/markorbit-execution`.
- Core package version: `0.1.0`.
- Current Core commit basis: the merge commit for `CORE-TASK-061`.
- Public API schema/baseline ID: `book-02-mvp-engineering-baseline@0.1.0`.
- Compatibility status: internal fixture proof only until Execution adds a real dependency.
- Consumer proof: repository-local package consumer compiles and runs against public package paths.
- Next required Execution task: consume `@markorbit/core@0.1.0` from a controlled local workspace, packed tarball, or Git dependency without modifying Core semantics.

## Known limitations

Some top-level exports remain broad for accepted Book 02 evidence compatibility. The package export map is the distribution boundary; unlisted internal paths are intentionally unavailable to downstream consumers.
