# CORE-TASK-057A API Boundary Foundation

## Authority

- Specification repository: `whalemarks/markorbit-publication`
- Locked Book 02 commit: `3349ecb8955021a8714d023348f8b24f941eb98f`
- Core base: merged CORE-TASK-056 exact MVP Event lock

## Result

The Identity, Organization, User, Permission and Policy APIs now provide executable governed boundaries that validate requests and delegate only to their owning Service contracts. This task implements no transport runtime and no API-owned business behavior.

## Implemented API boundaries

| API              | Owning Service contract                               | Delegated operations |
| ---------------- | ----------------------------------------------------- | -------------------: |
| Identity API     | `core-service-identity-resolution-service-contract`   |                    8 |
| Organization API | `core-service-organization-service-contract`          |                    9 |
| User API         | `core-service-user-service-contract`                  |                   10 |
| Permission API   | `core-service-permission-evaluation-service-contract` |                    8 |
| Policy API       | `core-service-policy-evaluation-service-contract`     |                    8 |

Every operation locks its API operation, owning Service operation, Permission key, Policy scope, required and allowed payload fields, reference fields, and idempotency requirement.

## Boundary behavior

Before delegation, the generic governed API boundary validates:

- API and contract versions;
- correlation and audit-context references;
- requested operation and owning Service mapping;
- required and allowed payload fields;
- public and related references;
- Permission, Policy and Human Review context;
- idempotency keys for duplicate-sensitive operations;
- prohibited internal persistence, credential, Domain-mutation and Event-emission fields.

After delegation, the API returns an immutable safe response containing only the owning Service contract, delegated Service operation and audit-context reference. Unsafe Service results are rejected rather than exposed.

## Locked negative boundaries

The API layer cannot:

- invoke a non-owning Service;
- mutate Domain state directly;
- emit Domain Events directly;
- own persistence or expose internal database identifiers;
- bypass Permission, Policy, Human Review or audit checks;
- accept unsupported operations, versions or payload fields;
- expose unsafe Service errors or implementation details.

No HTTP server, router framework, authentication runtime, session/token handling or production transport is introduced.

## Book 02 effect

Five API requirements move from `validated_skeleton_only` to `meets_required_depth`. The Must Build summary becomes:

- `meets_required_depth`: 73
- `partial_evidence`: 3
- `validated_skeleton_only`: 34
- `boundary_scaffold_only`: 5
- `semantic_overlap_only`: 0

The unresolved inventory falls from 47 to 42. With 18 accepted Domain skeletons excluded, non-Domain blockers fall from 29 to 24. Thirteen APIs remain structural, so the all-API validator acceptance criterion remains open and `book02MvpComplete` remains false.

## Evidence

- Five deterministic API boundary specifications and evidence records.
- Executable validation and owning-Service delegation tests across every locked operation.
- Negative tests for version, idempotency, governance, direct Domain mutation, direct Event emission, non-owning Service access and unsafe responses.
- Required fixture and fixture validator.
- Updated Book 02 baseline and post-Service audit.
- Correction workflow completed the full repository validation chain after replacing the order-dependent API skeleton negative test with an explicit Customer API target.

## Next task

`CORE-TASK-057B` — Customer, Brand, Trademark, Jurisdiction, Classification, Document and Evidence API validators and Service delegation.
