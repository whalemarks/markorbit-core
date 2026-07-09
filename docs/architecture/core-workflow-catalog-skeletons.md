# Core Workflow Catalog Skeletons

CORE-TASK-014 adds Core Workflow Catalog Skeletons to begin an explicit Workflow Catalog layer in MarkOrbit Core.

The catalog skeletons provide controlled names, domain mappings, ownership notes, and non-goals for baseline Core workflow contract concepts. They make workflow concepts discoverable in the Core Contract Index before any later task expands selected entries into full workflow contracts.

## Boundary

These skeletons do not implement a workflow engine. They do not implement workflow runtime, task runtime, executable transitions, running workflow instances, persistence, API servers, product UI, or database schema.

They also do not implement Book 03 Workflow Coordination Model behavior or Book 03 Execution System runtime behavior. Any future execution semantics must be added through explicit approval in a separate task.

`reviewRequired` and `protectedAction` are contract flags only. They are not permissions, runtime gates, executable checks, or approval mechanisms.

AI assistants and agents may not independently advance, approve, complete, or execute workflows based on these catalog entries. Product UI may display workflow catalog information in the future, but it must not invent workflow semantics or execution behavior.

Future tasks may expand selected workflow skeletons into full Workflow contracts through explicit approval while preserving Core / Execution / Product boundaries.
