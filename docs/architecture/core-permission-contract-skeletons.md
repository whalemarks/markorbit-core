# Core Permission Contract Skeletons

CORE-TASK-015 adds the first explicit Core Permission Contract layer for MarkOrbit Core. The skeletons name the baseline permission contract boundaries that later Core and Book 03 work may reference without inventing permission semantics in unrelated layers.

These contracts are intentionally declarative. They do not implement a permission engine, RBAC, authentication, authorization middleware, API guards, login/session behavior, runtime permission checks, database schema, API server behavior, or product UI.

The `protectedAction` and `requiresHumanReview` fields are contract flags only. They document that a permission boundary is expected to be treated as protected or human-reviewed by a future approved execution system, but they do not grant, deny, evaluate, bypass, complete, or enforce permissions.

Book 03 may later consume these contracts for execution gates through explicit tasks. Until then, these skeletons remain Book 02 Core specification artifacts only.

AI assistants and agents may not independently grant, bypass, approve, complete, or evaluate protected permissions. Product UI may display permission states in future work, but it must not invent permission semantics or enforce permissions independently of approved contracts.

Future tasks may expand selected permission skeletons into full Permission contracts through explicit approval while preserving Core / Execution / Product boundaries.
