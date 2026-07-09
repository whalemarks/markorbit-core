# Core Event Primitive

CORE-TASK-004 adds the foundational Core Event primitive for MarkOrbit Core.

Core Events exist as governed trace primitives. They provide a shared shape for recording that a meaningful action occurred against a Core Domain and, optionally, a Core Object reference. The primitive is intentionally small so future event definitions can compose a stable base instead of inventing incompatible structures.

This task does not define the full canonical Event catalog. The included fixture examples are generic samples only and are not a business event taxonomy.

This task does not implement an Event bus, event persistence, event sourcing, or any runtime delivery mechanism. It also does not implement the Book 03 Event Trace, Audit, or Replay runtime.

AI assistants and agents may appear as source context when they assisted with or contextualized an action. That source context does not grant AI assistants or agents independent authority to emit governed Events. Governed Event emission remains subject to MarkOrbit governance controls defined outside this primitive.

Future tasks may define a canonical Event catalog only after this primitive is stable. Product experiences may display Events, but products must not invent Event semantics or create independent event vocabularies outside the governed Core model.
