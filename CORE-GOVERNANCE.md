# MarkOrbit Core Governance

## Operating principles

- **Core defines.** Core owns canonical definitions for Book 02 concepts, contracts, validation expectations, primitives, fixtures, and event semantics.
- **Execution coordinates.** Execution systems may coordinate work using Core contracts, but they do not redefine Core.
- **Integration connects.** Integrations connect external systems to approved Core contracts without changing Core meaning.
- **Products consume.** Product systems consume Core packages and contracts; they do not become the authority for Core definitions.
- **AI assists but does not approve.** AI may help draft, inspect, validate, or summarize, but AI does not grant approval authority.
- **Human Review governs protected action.** Protected actions require human review and approval according to the specification and repository governance.
- **Events trace what happened.** Events record observable facts and transitions; they are not a substitute for authorization or approval.
- **Implementation must follow specification.** Engineering convenience must not override Book 02 semantics.
- **Codex must not invent new Core domains without explicit approval.** New Core domains require explicit human approval and traceable specification authority.

## Change control

Changes that alter Core meaning must reference the relevant Book 02 source material or an approved decision record. Implementation-only changes may proceed when they preserve the current specification boundary.
