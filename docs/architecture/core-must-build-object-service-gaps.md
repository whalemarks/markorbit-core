# Must-Build Object and Service Gaps

## Status

- Task: `CORE-TASK-021 — Must-Build Object and Service Gaps`
- Authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical path: `books/book-02-core-specification/`
- Implementation depth: `validated_skeleton`
- Added Object skeletons: 7
- Added Service skeletons: 9

## Result

CORE-TASK-021 completes the missing Object and Service targets for the 18 Must Build Now Domains. It appends the 16 inventory-locked skeletons to the existing Object and Service families while preserving the original 12 Object and 10 Service mappings.

Added Object skeletons:

- Identity, Permission, Customer, Order, Workflow Contract, Task, and Event.

Added Service skeletons:

- Organization, User, Brand, Customer, Matter, Order, Workflow Contract, Task, and Event.

Each addition locks its canonical id, name, Domain, Book 2 source path, publication repository and commit, implementation task, and `validated_skeleton` depth.

## Structural integration

| Measure                         |  Before |   After |
| ------------------------------- | ------: | ------: |
| Indexed contracts               |     123 |     139 |
| Object Domain coverage          | 12 / 26 | 19 / 26 |
| Service Domain coverage         | 10 / 26 | 19 / 26 |
| Required-layer-complete Domains |  1 / 26 |  4 / 26 |
| Missing required layer slots    |      52 |      36 |
| Completed gap targets           |      17 |      33 |
| Remaining gap targets           |      64 |      48 |

## Boundary

The additions remain metadata-only skeletons. They do not add full object schemas, business fields, executable service methods, validation behavior, state changes, record persistence, task execution, workflow execution, event recording or dispatch, permission or policy decisions, AI authority, API routes, Product UI, or Book 3 runtime behavior.

## Next task

The next governed batch is `CORE-TASK-022 — Must-Build Canonical Domain APIs`, containing 18 source-aligned API Contract skeletons for the Must Build Now Domains.
