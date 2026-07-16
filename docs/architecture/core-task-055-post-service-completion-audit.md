# CORE-TASK-055 Post-Service Completion Audit and Execution-Spine Lock

## Authority

- Specification repository: `whalemarks/markorbit-publication`
- Locked Book 02 commit: `3349ecb8955021a8714d023348f8b24f941eb98f`
- Audited Core state: merged CORE-TASK-054 Policy Service on `main`

## Audited result

All 18 Must Build Services meet Level 2–3 owning-behavior evidence. The Service gap is zero, but the Book 02 MVP is not complete.

The current Must Build disposition summary is `50 / 3 / 39`, with another 5 `boundary_scaffold_only` and 18 `semantic_overlap_only` requirements. The number `39` is only the count of `validated_skeleton_only` requirements; it is not the total remaining workload.

The complete unresolved Must Build inventory contains 65 requirements:

| Layer    | Count | Current evidence                                               |
| -------- | ----: | -------------------------------------------------------------- |
| Domain   |    18 | Validated skeletons with executable Domain tests               |
| API      |    18 | Structural API contracts only                                  |
| Workflow |     3 | Structural workflow contracts only                             |
| Event    |    18 | Generic semantic overlap without exact canonical alias records |
| Agent    |     5 | Generic boundary scaffold without five named Agent scaffolds   |
| Test     |     3 | API, Workflow and Agent test families remain partial           |

Seven of nineteen MVP acceptance criteria remain unresolved:

1. Must Build API validators exist.
2. Customer Intake Workflow supports preview/apply.
3. Trademark Application Workflow supports preview/apply.
4. Communication Review Workflow supports preview/apply.
5. API layer does not emit Events directly.
6. Workflow layer does not emit Events directly.
7. Agent layer does not emit Events directly.

## Completion-semantics lock

Book 02 explicitly accepts Must Build Domains when they are implemented **or scaffolded with tests**. Domain runtime promotion is therefore not required for the MVP cut. A validated Domain skeleton must not be relabeled as runtime behavior merely to satisfy a generic completion formula.

The completion formula is locked as:

```text
all 19 acceptance criteria satisfied
AND Domain scaffold acceptance criterion satisfied
AND every non-Domain Must Build requirement reaches its required depth
```

This replaces the over-strict interpretation that every Must Build requirement, including accepted Domain skeletons, must be labeled `meets_required_depth`. The correction does not weaken API, Workflow, Event, Agent or executable test requirements.

At the audited state, 47 non-Domain Must Build requirements still block completion: 18 APIs, 3 Workflows, 18 exact Events, 5 named Agent boundaries and 3 executable test families.

## Dependency-ordered implementation plan

### CORE-TASK-056 — Exact MVP Event Contract and Alias Lock

Create exact canonical records or validated aliases for all 18 MVP Event requirements. Preserve the rule that an Event reference is trace, not command. This work must not add a full event bus or allow API, Workflow or Agent layers to emit Domain Events directly.

### CORE-TASK-057A–C — API Validator and Service Delegation

Implement all 18 MVP API boundaries in three controlled batches:

- `057A`: Identity, Organization, User, Permission and Policy.
- `057B`: Customer, Brand, Trademark, Jurisdiction, Classification, Document and Evidence.
- `057C`: Matter, Order, Workflow Contract, Task, Event and Communication.

Every API must validate request, response, references, Permission, Policy, version and duplicate-sensitive idempotency; delegate to the owning Service; return safe errors; and prove no direct Domain mutation or Event emission.

### CORE-TASK-058A–C — Preview/Apply Workflows

Implement one bounded workflow per task:

- `058A`: Customer Intake Workflow.
- `058B`: Trademark Application Workflow.
- `058C`: Communication Review Workflow.

Each workflow must support preview/apply validation, step validation, Task-plan preparation through Task Service, Human Review checkpoints, AI boundaries, Permission/Policy, idempotency, safe Event references and safe errors. No full workflow engine is permitted.

### CORE-TASK-059 — Named Agent Boundary Scaffolds

Implement boundary-safe scaffolds for Knowledge Agent, Task Agent, Communication Agent, Workflow Agent and Audit Agent. Lock allowed and forbidden actions and executable no-direct-Event tests. Do not build a full Agent runtime.

### CORE-TASK-060 — Final Book 02 MVP Completion Audit

Regenerate all deterministic fixtures, prove all non-Domain Must Build requirements meet their locked depth, prove all 19 acceptance criteria pass, and confirm that Stub, Document Only, Defer and Never in MVP boundaries remain intact.

## Machine-readable evidence

The audit is derived by `src/mvp-coverage/book-02-post-service-completion-audit.ts`, locked by `fixtures/mvp-coverage/book-02-post-service-completion-audit.fixture.json`, validated by the fixture system and covered by positive and negative tests.

No runtime API, Workflow, Event emitter, Agent runtime, production integration or full engine is implemented by CORE-TASK-055.

## Validation boundary

The final clean branch must independently reproduce this audit in the canonical Node.js 20 and 22 Validation matrix. Acceptance requires typecheck, lint, format check, all 47 fixture validators, the complete test suite, contract and behavior acceptance, Book 02 gap validation, and the post-service audit report to pass together without any temporary workflow or payload files.
