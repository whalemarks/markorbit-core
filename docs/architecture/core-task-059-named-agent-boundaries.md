# CORE-TASK-059 Named Agent Boundaries

## Authority

CORE-TASK-059 is derived from the Book 02 frozen specification baseline, existing Book 02 MVP requirement identities, existing Core Agent boundary behavior, existing AI Context, Permission, Policy, Human Review, Audit Context, API, Workflow, Task and Event contracts, and the merged CORE-TASK-058A/058B/058C Workflow boundaries.

## Exact five Agent identities

The only Book 02 Must Build Agents registered by this task are:

1. `knowledge-agent`
2. `task-agent`
3. `communication-agent`
4. `workflow-agent`
5. `audit-agent`

Unknown Agent identifiers fail closed with a safe Agent error.

## Shared boundary contract

The shared contract is implemented in `src/agents/core-named-agent-boundary.ts` and routed through `src/agents/core-named-agent-registry.ts`. Requests carry organization, actor, Permission, Policy, Human Review, audit, schema/version, correlation, optional idempotency, governed input references, proposed actions, permitted delegation target and trace-only Event reference context.

The boundary reuses `CoreAgentBoundaryRegistry` and `enforceCoreGovernedAction` so Agent validation does not duplicate common governance logic. Agent output is advisory, deterministic for identical canonical inputs, preserves source references, preserves trace-only Event references, records delegation intent separately from execution, and returns structured safe failures.

## Per-Agent responsibilities

- `knowledge-agent` validates and summarizes supplied governed Document, Evidence and structured knowledge references. It can cite sources, identify missing information and propose follow-up Task plans.
- `task-agent` recommends Task proposals, priority, due-date input and assignee criteria. Approved protected Task mutations may only be delegated through the governed Task API.
- `communication-agent` drafts or summarizes Communication content and proposes Communication Review Workflow input. It can delegate only to the Communication Review Workflow or governed Communication API where permitted.
- `workflow-agent` inspects explicitly registered Workflow contracts, prepares preview inputs, explains validation failures and invokes preview only through a governed Workflow preview boundary.
- `audit-agent` inspects immutable audit records, Event references and completed delegation traces, then reports non-authoritative anomalies or remediation recommendations.

## Allowed and forbidden actions

Agents may analyze, recommend, summarize, classify, draft, prepare plans or propose bounded delegations only within their named scope. They must not directly mutate Domain state, directly emit Domain Events, treat Event references as commands, bypass Permission/Policy/Human Review, call Domain implementations directly, execute External Protected Actions autonomously, send external Communications, certify legal deadlines, certify registrability, select a Service Provider as a final decision, or rewrite audit history.

## Delegation allowlists

- `knowledge-agent`: `knowledge-api`, `task-api`
- `task-agent`: `task-api`
- `communication-agent`: `communication-review-workflow`, `communication-api`
- `workflow-agent`: `workflow-preview-boundary`
- `audit-agent`: `audit-api`, `task-api`

Delegation remains intent unless the caller supplies an explicitly permitted delegation target and governance context. Direct Domain mutation and direct Event emission remain prohibited.

## Human Review rules

Protected proposed actions require approved Human Review evidence. Missing, rejected, expired or mismatched review context blocks the Agent request. External Protected Actions remain human-authorized and are not executed by the Agent layer.

## Event trace-not-command rules

Event references are immutable trace evidence only. They are returned as references for auditability and cannot trigger commands, Workflow apply, Domain Event emission or Domain mutation.

## Safe failure behavior

Failures use `CoreSafeError` and do not expose stack traces, secrets, prompts, model internals or raw sensitive payloads. Unsupported versions, unknown Agents, forbidden operations, forbidden delegation targets, Permission denials, Policy restrictions, organization mismatches, fabricated references and altered approved plan digests fail closed.

## Machine-readable evidence and fixture

`CORE_TASK_059_NAMED_AGENT_BOUNDARY_EVIDENCE` exports exactly five Agent entries with requirement IDs, implementation files, capabilities, delegation targets, Human Review requirements, direct mutation/Event prohibitions, trace-not-command proof, tests, fixtures and required/achieved depth. The deterministic fixture `fixtures/agents/core-task-059-named-agent-boundaries.fixture.json` records scenario inventories, allowlists, forbidden operations and the derived Book 02 after-state.

## Explicit exclusions

This task does not introduce a full Agent Runtime, autonomous orchestration, multi-agent collaboration runtime, model-provider integration, prompt execution runtime, tool-selection engine, Agent memory, vector store, scheduler, queue, worker, external communication, official filing, provider final selection, legal-deadline certification, registrability certification, production HTTP routes, UI, or a CORE-TASK-060 final completion claim.

## Relationship to a future full Agent Runtime

These files are named boundary-safe scaffolds only. A future Agent Runtime may reuse their contracts as guardrails, but this task intentionally stops at executable boundary validation and machine-verifiable evidence.
