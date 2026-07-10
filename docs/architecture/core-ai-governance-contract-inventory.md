# Core AI Governance Contract Inventory

## Status

- Task: `CORE-TASK-017A — AI Governance Source Inventory Lock`
- Status: Locked for `CORE-TASK-017B`
- Implementation baseline: `whalemarks/markorbit-core@8d5c933bf01a12af695bee51aefed533134e8755`
- Specification authority: `whalemarks/markorbit-publication@3349ecb8955021a8714d023348f8b24f941eb98f`
- Canonical Book path: `books/book-02-core-specification/`
- Accepted skeleton count: 8
- Unresolved count: 0

## Purpose

This inventory locks the Book 02 source, proposed identifiers, existing Core Domain mapping, ownership boundary, and non-goals for the first Core AI Governance Contract Skeletons.

It is an inventory only. It does not add a contract type, contract body, contract index entry, fixture, validator, runtime, service, event, permission decision, policy decision, review mechanism, product behavior, or AI Agent authority.

## Specification authority and source scope

Book 02 governance states that Codex implements traced specifications and does not define Core architecture. This inventory therefore uses `markorbit-publication` Book 02 as its specification authority. The separate `markorbit-core-specification` repository is not a source for this task.

The accepted inventory is anchored in the following Book 02 sources:

| Source                                                                                | Authority used in this inventory                                                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BOOK-GOVERNANCE.md`                                                                  | Book 02 owns the Core Specification; Codex must implement traced artifacts without defining architecture.                                                |
| `manuscript/B02-CH-26_AI_Capability_and_Agent_Governance_Specification.md`            | Defines AI governance, AI Capability, AI Agent, Agent Contract, output, review, audit, failure, permission, policy, event, and MVP boundaries.           |
| `appendices/B02-APP-C_Core_Object_Index.md`, section 11                               | Canonically lists exactly eight AI Governance Objects and marks all eight Must Implement.                                                                |
| `manuscript/B02-CH-28_Core_MVP_Boundary.md`, section 7.4                              | Confirms the AI Governance Core baseline.                                                                                                                |
| `manuscript/B02-CH-31_Codex_Implementation_Roadmap.md`, section 12                    | Confirms Wave 4 required AI governance specifications and acceptance boundaries.                                                                         |
| `core-specs/agents/ai-agent-governance.md`                                            | Defines the governance lock, identity, capabilities, permission/policy, knowledge, data, review, output, event, audit, rejection, and Codex constraints. |
| `core-specs/contracts/common/ai-context.md`                                           | Defines the canonical AI Context boundary and explicit assistance, access, output, review, and trace metadata.                                           |
| `core-specs/TRACEABILITY.md` and `core-specs/contracts/tests/agent-boundary-tests.md` | Confirm that agents assist within governed capability boundaries and must not execute protected actions.                                                 |

## Domain ownership lock

All eight proposed skeletons map to the existing `agent` Core Domain.

Book 02 describes AI Governance as a cross-cutting system, not as a new Core Domain. The current Core Domain Registry already defines `agent` as the domain for agent records and explicitly excludes AI authority. Using `agent` preserves one owning Domain without inventing `ai-governance` or `capability` Domains.

Permission, Policy, Knowledge, Event, User, Task, Communication, Routing, and Workflow Contract remain related domains or future contract dependencies. They do not become the owning Domain of these AI governance skeletons, and the skeletons must not duplicate their semantics.

## Accepted inventory

| No. | Book 02 canonical concept | Primary source reference                                        | Proposed skeleton ID                                   | Proposed contract name                                     | Domain  | appliesTo                                                | owns                                                                                                                                                   | nonGoals / duplicate boundary                                                                                                                                     |
| --: | ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | AI Agent                  | Appendix C §11.1; Chapter 26 §§7, 11                            | `core-ai-governance-ai-agent-contract`                 | Core AI Agent Governance Contract Skeleton                 | `agent` | Textual governed AI actor boundary                       | AI Agent identity, purpose, bounded role, and governance-reference boundary                                                                            | No agent runtime, model invocation, self-authorization, autonomous planning, protected action, or duplicate Agent object schema                                   |
|   2 | Agent Contract            | Appendix C §11.2; Chapter 26 §8                                 | `core-ai-governance-agent-contract`                    | Core AI Agent Contract Skeleton                            | `agent` | Textual mandatory Agent Contract boundary                | Required agreement for allowed/prohibited capabilities, authorized knowledge, access, outputs, risk, review, audit, failure, and consumers             | No executable authorization, permission/policy evaluation, service access enforcement, dynamic contract generation, or agent delegation runtime                   |
|   3 | AI Capability             | Appendix C §11.3; Chapter 26 §§6, 9                             | `core-ai-governance-ai-capability-contract`            | Core AI Capability Governance Contract Skeleton            | `agent` | Textual AI assistance capability boundary                | Declared capability eligibility and prohibited-capability boundary under an Agent Contract                                                             | No Capability engine, tool execution, runtime authorization, marketplace, scoring, or implication that capability equals permission                               |
|   4 | AI Output                 | Appendix C §11.4; Chapter 26 §16                                | `core-ai-governance-ai-output-contract`                | Core AI Output Governance Contract Skeleton                | `agent` | Textual controlled AI-produced output boundary           | Output classification, AI-origin disclosure, source scope, risk, review, downstream-use, and storage-boundary metadata                                 | No content generation, output approval, professional truth, Product UI display, state mutation, or AI Output service implementation                               |
|   5 | AI Recommendation         | Appendix C §11.5; Chapter 26 §17                                | `core-ai-governance-ai-recommendation-contract`        | Core AI Recommendation Governance Contract Skeleton        | `agent` | Textual advisory AI recommendation boundary              | Basis, confidence/uncertainty, knowledge reference, risk, review, and consumer-boundary requirements                                                   | No final professional judgment, routing selection, filing decision, provider selection, task completion, or automatic downstream action                           |
|   6 | AI Audit Record           | Appendix C §11.6; Chapter 26 §21                                | `core-ai-governance-ai-audit-record-contract`          | Core AI Audit Record Governance Contract Skeleton          | `agent` | Textual AI invocation and governance trace boundary      | Agent, contract version, context, sources, access, output, risk, review, event, actor, failure, and timestamp trace requirements                       | No audit engine, compliance conclusion, event emission, log infrastructure, model evaluation platform, or mutation of event history                               |
|   7 | Structured Context        | Appendix C §11.7; Chapter 26 §§12–15; AI Context Contract §§6–8 | `core-ai-governance-structured-context-contract`       | Core Structured Context Governance Contract Skeleton       | `agent` | Textual authorized and bounded AI input-context boundary | Authorized knowledge, object/service access declarations, missing-context disclosure, restricted-field omission, and least-authorized-context boundary | No prompt construction runtime, RAG/vector architecture, unrestricted document/evidence access, credential access, source validation, or context assembly service |
|   8 | Human Review Requirement  | Appendix C §11.8; Chapter 26 §§18–19; AI Agent Governance §18   | `core-ai-governance-human-review-requirement-contract` | Core Human Review Requirement Governance Contract Skeleton | `agent` | Textual risk-based AI review-requirement boundary        | Explicit review level, protected-use trigger, reviewer-reference requirement, and downstream-use restriction                                           | No Review Record execution, approval decision, review routing, permission grant, policy evaluation, workflow gate, or protected action execution                  |

## Exact proposed ID lock

`CORE-TASK-017B` must use exactly these eight proposed IDs unless Book 02 is changed through its governed publication process:

1. `core-ai-governance-ai-agent-contract`
2. `core-ai-governance-agent-contract`
3. `core-ai-governance-ai-capability-contract`
4. `core-ai-governance-ai-output-contract`
5. `core-ai-governance-ai-recommendation-contract`
6. `core-ai-governance-ai-audit-record-contract`
7. `core-ai-governance-structured-context-contract`
8. `core-ai-governance-human-review-requirement-contract`

## Excluded concepts

| Concept                               | Result                                | Reason                                                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Agent Identity as a ninth skeleton | Excluded as duplicate                 | Identity is part of the canonical AI Agent boundary and required Agent Contract fields; Book 02 Appendix C lists AI Agent, not a separate ninth AI Agent Identity object in the eight-object AI Governance section. |
| Review Record                         | Excluded from this inventory          | Review Record is a broader Business Responsibility/review trace object. The accepted Human Review Requirement skeleton only declares when review is required and must not implement or duplicate the Review Record. |
| AI Context Contract                   | Excluded as a separate skeleton       | It is a canonical Common Contract and a source/dependency for Structured Context and AI Output boundaries, not a ninth AI Governance Object.                                                                        |
| Agent Registry                        | Excluded as a separate skeleton       | Agent Registry is a registry specification under AI Agent Governance. It is not one of the eight canonical AI Governance Objects in Appendix C.                                                                     |
| AI risk levels                        | Excluded as a standalone skeleton     | Risk Level is a controlled value and required field that drives output and review rules; it is not a separate contract skeleton in this inventory.                                                                  |
| AI events baseline                    | Excluded from this contract inventory | AI events belong to the Event specification and future explicit Event Catalog work. This task does not add or duplicate event definitions.                                                                          |
| AI permission and policy rules        | Excluded as separate skeletons        | Permission and Policy Contract Skeletons already exist. AI governance may reference them but must not replace or duplicate them.                                                                                    |
| AI assistance policy                  | Excluded as duplicate                 | `core-ai-assistance-policy` already exists in the Core Policy Contract Skeletons.                                                                                                                                   |
| AI audit policy                       | Excluded as duplicate                 | `core-audit-policy` already exists. AI Audit Record describes trace requirements and must not create another audit policy or audit engine.                                                                          |
| Specialized agents                    | Excluded from 017A/017B               | Classification, drafting, evidence, routing, workflow, Codex, and other specialized agents require later explicit Agent specification tasks.                                                                        |
| Production AI implementation          | Excluded                              | Prompts, model/provider selection, inference, embeddings, vector stores, RAG, fine-tuning, benchmarks, vendor APIs, AI infrastructure, and Product UI are explicitly outside Chapter 26.                            |
| Autonomous or protected execution     | Prohibited                            | AI may not approve, submit, send, select, certify, complete, mutate protected state, create professional truth, bypass services, or emit domain events directly.                                                    |

## Duplicate and overlap review

The eight proposed IDs do not exist in the current 98-entry `CORE_CONTRACT_INDEX`.

The accepted skeletons remain distinct from existing contract layers:

- Permission contracts define protected-action permission boundaries; AI governance only declares required permission references and fail-closed expectations.
- Policy contracts define contextual policy boundaries; AI governance only declares required policy references, review, redaction, and restricted-use expectations.
- Event catalog entries define semantic events; AI governance only declares event/audit trace requirements.
- Workflow catalog entries define workflow boundaries; AI governance does not apply, advance, approve, complete, or execute workflows.
- Object contracts define current baseline Core objects; this task does not add AI object schemas or lifecycle behavior.
- Service and API contracts define future governed access; AI governance does not implement or bypass services or APIs.

## Shared non-goals for CORE-TASK-017B

All eight skeletons must remain contract-only and metadata-only. They must collectively exclude:

- AI model or prompt execution;
- agent runtime or orchestration;
- autonomous authority or self-escalation;
- permission grants or permission evaluation;
- policy authoring, approval, evaluation, or enforcement;
- human review decisions or approval execution;
- service, API, workflow, event bus, database, or Product UI behavior;
- professional truth, legal conclusion, compliance decision, routing selection, filing, payment, sending, task completion, or state mutation;
- production data, restricted data, credentials, model/provider integration, RAG, vector stores, or AI infrastructure.

## Locked result

- Accepted skeletons: 8
- Excluded concepts: 12
- Unresolved concepts: 0
- Owning existing Domain: `agent` for all 8
- New Domain required: no
- Current `CORE_CONTRACT_INDEX`: unchanged at 98
- Current required fixture manifest: unchanged at 14
- Ready for `CORE-TASK-017B`: yes

`CORE-TASK-017B` may implement the type and exactly eight contract skeletons from this inventory. Index, fixture, validator, documentation integration, and count changes remain outside 017A and must occur only in their explicitly approved follow-on tasks.
