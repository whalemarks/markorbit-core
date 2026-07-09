# Core Task Primitive

CORE-TASK-005 adds the Core Task primitive so MarkOrbit Core has a shared structural language for task-like records across domains. The primitive composes existing Core domain, object, and event references without defining product-specific behavior.

This task defines only foundational task structure primitives: identifiers, task types, statuses, priorities, actors, review requirements, the `CoreTask` interface, and a non-throwing validation helper. It does not define the full task catalog, business-specific task payload schemas, workflow transitions, or any canonical set of domain tasks.

The Core Task primitive does not implement a task runtime. It does not implement a workflow engine. It does not implement the Book 03 Task Lifecycle Model or any Book 03 Execution System runtime. Status values are shared primitive labels only; they are not lifecycle transition rules.

Human Review remains governance. AI output is not Human Review. AI assistants and agents may appear as task context where allowed, including assignment, suggestion, involvement, or reference, but they may not independently approve, complete, or execute protected tasks.

Products may display tasks using these primitives, but products must not invent task semantics that conflict with Core governance. Future Book 03 Execution System work may consume Core Task primitives for lifecycle coordination while preserving the separation between primitive structure and execution runtime.
