# Core Contract Behavior Acceptance Lock

CORE-TASK-033 locks Phase 4 selected Core behavior-hook minimum-depth acceptance. The lock does not trust the behavior coverage summary alone: it recomputes acceptance from the coverage baseline, Behavior Gap Inventory, source evidence, fixture evidence, and executable tests.

The acceptance lock maps all 14 selected behavior targets to Book 02 source paths through the existing baseline, implementation evidence, test evidence, and implementation batch status. Twelve targets are `implemented_batch` evidence from CORE-TASK-028 through CORE-TASK-031. `workflow-engine` and `policy-engine` are `preexisting_minimum` only: Workflow is accepted only at generic validation Level 1, and Policy Engine remains Document Only Level 0.

`pnpm acceptance:behavior` validates the lock, deduplicates the mapped test files, and runs `node --import tsx --test` against those evidence tests. Any validator or test failure fails the command.

Boundary: this accepts selected Core behavior hooks at Book 02 minimum depth only. It does not accept Book 02 MVP completion, Domain business behavior, Execution System implementation, complete Workflow or Policy Engines, database/external integration work, AI autonomous authority, professional decision authority, or production readiness.
