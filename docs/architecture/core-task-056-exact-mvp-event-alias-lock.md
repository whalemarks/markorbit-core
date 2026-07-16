# CORE-TASK-056 Exact MVP Event Contract and Alias Lock

## Authority

- Specification repository: `whalemarks/markorbit-publication`
- Locked Book 02 commit: `3349ecb8955021a8714d023348f8b24f941eb98f`
- Core base: merged CORE-TASK-055 post-Service audit

## Result

All 18 Book 02 Must Build Event requirements now have exact deterministic evidence. Fifteen are canonical Event contracts and three use explicit validated aliases:

| Required Event                | Resolution      | Validated alias target              |
| ----------------------------- | --------------- | ----------------------------------- |
| `document-attached`           | validated alias | `core-object-updated`               |
| `communication-reviewed`      | validated alias | `core-communication-approved`       |
| `workflow-contract-previewed` | validated alias | `core-workflow-contract-registered` |

The other fifteen required Event types are exact canonical records. Alias resolution is compatibility evidence only: it does not rewrite history, change action semantics, create commands or allow a non-owning layer to emit Domain Events.

## Locked evidence

Each Event record locks:

- the exact Book 02 requirement and Event type;
- owning Domain, subject Object type and Event action;
- owning Service contract and source operation;
- source specification and payload-contract references;
- canonical or validated-alias authority;
- required trace fields, schema version and safe payload boundary;
- positive evidence files and deterministic fixture identity.

The validator rejects duplicates, missing requirements, unresolved or ambiguous aliases, invalid Domain/Object/action mappings, incomplete trace fields, unsafe boundary drift and fabricated contract IDs.

## Trace-not-command boundary

Event references are immutable trace facts. The lock permits only `trace_reference` use and fails closed for:

- command triggering;
- API direct Domain Event emission;
- Workflow direct Domain Event emission;
- Agent direct Domain Event emission.

Owning Services remain responsible for governed Event trace handoff. This task adds no Event bus, broker, queue, retry runtime, command dispatcher or production integration.

## Book 02 effect

The 18 Must Build Event requirements move from `semantic_overlap_only` to `meets_required_depth` at the locked Event depth. The Must Build summary becomes:

- `meets_required_depth`: 68
- `partial_evidence`: 3
- `validated_skeleton_only`: 39
- `boundary_scaffold_only`: 5
- `semantic_overlap_only`: 0

The post-Service unresolved inventory falls from 65 to 47. Because 18 accepted Domain skeletons remain in that inventory, the non-Domain completion blockers fall from 47 to 29: 18 APIs, 3 Workflows, 5 named Agent boundaries and 3 executable test families.

Acceptance remains 12 / 19 and `book02MvpComplete` remains false. CORE-TASK-056 does not complete API validation/delegation, preview/apply Workflows or API/Workflow/Agent no-direct-Event tests.

## Validation lock

The final clean branch must pass the canonical Node.js 20 and 22 matrix with TypeScript, ESLint, Prettier, all 48 fixture validators, the complete test suite, contract and behavior coverage/gaps/acceptance, Book 02 MVP gap validation, and the exact Event positive and negative tests. Temporary workflows, payload fragments and diagnostic artifacts are not part of the accepted diff.

## Next task

`CORE-TASK-057A` — Identity, Organization, User, Permission and Policy API validators and Service delegation.
