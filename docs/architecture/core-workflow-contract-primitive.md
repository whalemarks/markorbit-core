# Core Workflow Contract Primitive

CORE-TASK-006 adds the Core Workflow Contract primitive as a shared Book 02 contract structure for describing workflow definitions across MarkOrbit Core. It exists so future Core workflow contracts can use common identifiers, statuses, steps, transitions, and validation rules without introducing execution behavior.

This primitive defines contract structure only. It does not implement workflow runtime, a workflow engine, Book 03 Workflow Coordination Model behavior, product UI, database schema, API behavior, or AI agent workflow execution.

## Contract definitions only

Core workflow steps and transitions are definitions inside a contract. They are not runtime tasks, executable transitions, state machines, policy enforcement points, review gates, or workflow engine instructions.

The `reviewRequired` and `protectedAction` step fields are contract flags only. They mark that a future execution system may need stronger governance or review behavior, but they do not approve, block, advance, or complete anything by themselves. Human Review runtime and review gate enforcement belong to the future Book 03 execution governance model.

## Governance boundaries

AI assistants and agents may not independently execute, approve, complete, or advance workflow contracts. AI output must not be treated as Human Review. Products may display workflow status later, but they must not invent workflow contract semantics or reinterpret contract statuses as runtime execution states.

Future Book 03 Execution System work may consume these workflow contracts for execution coordination. That future work must define runtime state, review gates, policy enforcement, and execution semantics separately from this Core primitive.
