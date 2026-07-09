# Core Event Catalog Skeletons

CORE-TASK-013 adds the first explicit Core Event Catalog layer for MarkOrbit Core. The catalog skeletons name governed baseline event concepts so future contracts can refer to a stable vocabulary before any runtime mechanism exists.

These entries are intentionally skeletons only. They do not implement an Event Bus, event streams, Event Sourcing, event persistence, runtime event emission, workflow runtime behavior, or Book 03 Event Trace / Audit / Replay runtime behavior.

The skeletons do not define concrete payload schemas. Any `payloadShape` text is descriptive only and must not be treated as JSON Schema, Zod schema, required properties, or persistence shape.

AI assistants and agents may not independently emit governed Events. Product UI may display governed Events in later work, but Product UI must not invent Event semantics or bypass Core approval.

Future tasks may expand selected event skeletons into full Event contracts only through explicit approval and while preserving Core / Execution / Product boundaries.
