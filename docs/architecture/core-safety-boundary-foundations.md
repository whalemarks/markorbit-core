# Core Safety and Boundary Foundations

- Task: `CORE-TASK-028`
- Book 2 authority: Reference, Error, Versioning, AI Context, Agent Registry, AI Agent Governance, and Agent Boundary Test specifications
- Scope: pure Core behavior with deterministic in-memory fixtures

## Implemented behavior

| Capability    | New depth | Behavior                                                                                                           |
| ------------- | --------: | ------------------------------------------------------------------------------------------------------------------ |
| References    |   Level 3 | Typed public-reference validation, deterministic resolution, status handling, and fail-closed errors               |
| Errors        |   Level 3 | Controlled safe errors with suppression of SQL, stack, credential, prompt, and database details                    |
| Versioning    |   Level 1 | `vMAJOR.MINOR.PATCH` validation and supported-version fail-closed behavior                                         |
| AI Context    |   Level 1 | AI disclosure, Agent identity, capability, access scope, output mode, source trace, and review metadata validation |
| Agent Runtime |   Level 1 | Registry, capability scope, status, and forbidden-action boundary enforcement                                      |

Agent acceptance explicitly returns `requiresPermissionPolicyEvaluation: true`; Agent identity and capability never grant Permission or Policy approval.

## Boundary

All behavior is deterministic and in memory. This task adds no database, external integration, model execution, service mutation, direct Event emission, full Agent runtime, Permission/Policy implementation, or professional decision authority.
