# Core Governance Context and Review Hooks

- Task: `CORE-TASK-030`
- Authority: `markorbit-publication` Book 2 at `3349ecb8955021a8714d023348f8b24f941eb98f`
- Sources: Permission Context, Policy Context, Audit Context, and Human Review Common Contracts

This batch adds a deterministic governed-action sequence: validate and enforce an explicit Permission decision, validate Policy context and restrictions, require completed accountable Human Review when Policy demands it, and produce an immutable safe Audit Context handoff.

The hooks fail closed when governance references or required context are absent. A valid context never grants permission or policy approval by itself; it consumes explicit decision references from their owning services. Human Review records reliance but does not execute the downstream action, and Audit Context preserves trace without creating or persisting Events.

The batch does not implement authentication, roles, a Permission or Policy engine, professional judgment, downstream mutation, Event persistence, or production compliance certification.
