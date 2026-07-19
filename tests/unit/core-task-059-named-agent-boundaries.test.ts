import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_NAMED_AGENT_DEFINITIONS,
  CORE_NAMED_AGENT_IDS,
  CORE_TASK_059_NAMED_AGENT_BOUNDARY_EVIDENCE,
  evaluateRegisteredCoreNamedAgent,
  type CoreAgentRequest
} from '../../src/index.ts';

const org = 'organization:ref:core-task-059';
const actor = 'user:ref:agent-actor-059';
function request(overrides: Partial<CoreAgentRequest> = {}): CoreAgentRequest {
  const base: CoreAgentRequest = {
    schemaVersion: 'core-agent-boundary.v1',
    agentId: 'knowledge-agent',
    operation: 'summarize-knowledge',
    capabilityId: 'summarize-governed-content',
    context: {
      organizationReferenceId: org,
      actorReferenceId: actor,
      authorizedOrganizationReferenceId: org,
      correlationReferenceId: 'corr:059',
      permission: {
        actorReferenceId: actor,
        intendedOperation: 'agent.invoke',
        requiredPermissionKeys: ['agent:invoke'],
        permissionDecisionReferenceId: 'permission:allow:059',
        permissionDecision: 'Allowed',
        correlationId: 'corr:059'
      },
      policy: {
        intendedOperation: 'agent.invoke',
        requiredPolicyScopes: ['agent.boundary'],
        policyDecisionReferenceId: 'policy:allow:059',
        policyDecision: 'Allowed',
        restrictedFieldsOmitted: true,
        correlationId: 'corr:059'
      },
      humanReview: {
        humanReviewRequired: true,
        humanReviewReferenceId: 'review:approved:059',
        reviewStatus: 'Completed',
        reviewScope: 'agent.protected-proposal',
        reviewDecision: 'Approved',
        reviewerUserReferenceId: 'user:ref:reviewer-059',
        targetObjectType: 'agent-request',
        targetObjectReferenceId: 'agent:request:059'
      },
      audit: {
        operationName: 'agent.invoke',
        operationCategory: 'Agent',
        actorReferenceId: actor,
        targetObjectType: 'agent-request',
        targetObjectReferenceId: 'agent:request:059',
        permissionDecisionReferenceId: 'permission:allow:059',
        policyDecisionReferenceId: 'policy:allow:059',
        humanReviewReferenceId: 'review:approved:059',
        correlationId: 'corr:059'
      }
    },
    inputReferences: [
      {
        referenceId: 'document:ref:059',
        referenceType: 'document',
        organizationReferenceId: org
      },
      {
        referenceId: 'event:ref:trace-059',
        referenceType: 'event',
        organizationReferenceId: org,
        traceOnly: true
      }
    ],
    proposedActions: [],
    eventReferences: ['event:ref:explicit-059']
  };
  return {
    ...base,
    ...overrides,
    context: { ...base.context, ...(overrides.context ?? {}) }
  };
}
const allowed = {
  'knowledge-agent': ['summarize-knowledge', 'summarize-governed-content'],
  'task-agent': ['recommend-task', 'prepare-task-proposal'],
  'communication-agent': ['draft-communication', 'draft-communication'],
  'workflow-agent': ['prepare-preview', 'prepare-workflow-preview'],
  'audit-agent': ['inspect-audit-trace', 'inspect-audit-trace']
} as const;

describe('CORE-TASK-059 named Agent boundaries', () => {
  it('registers exactly the five Book 02 named Agents and evidence entries', () => {
    assert.deepEqual([...CORE_NAMED_AGENT_IDS].sort(), [
      'audit-agent',
      'communication-agent',
      'knowledge-agent',
      'task-agent',
      'workflow-agent'
    ]);
    assert.equal(CORE_TASK_059_NAMED_AGENT_BOUNDARY_EVIDENCE.agents.length, 5);
  });
  it('fails closed for unknown Agent ids', () => {
    const result = evaluateRegisteredCoreNamedAgent(
      request({ agentId: 'unknown-agent' })
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, 'AgentContractRequired');
  });
  for (const agent of CORE_NAMED_AGENT_DEFINITIONS)
    it(`${agent.agentId} accepts its advisory operation`, () => {
      const [operation, capabilityId] = allowed[agent.agentId];
      const result = evaluateRegisteredCoreNamedAgent(
        request({ agentId: agent.agentId, operation, capabilityId })
      );
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.advisory, true);
        assert.deepEqual(result.value.sourceReferenceIds, [
          'document:ref:059',
          'event:ref:trace-059'
        ]);
        assert.deepEqual(result.value.eventReferences, [
          'event:ref:explicit-059',
          'event:ref:trace-059'
        ]);
      }
    });
  for (const agent of CORE_NAMED_AGENT_DEFINITIONS)
    it(`${agent.agentId} rejects another Agent operation`, () => {
      const result = evaluateRegisteredCoreNamedAgent(
        request({
          agentId: agent.agentId,
          operation: 'send-external-communication',
          capabilityId: 'external-send'
        })
      );
      assert.equal(result.ok, false);
    });
  it('fails closed on permission, policy and organization mismatches', () => {
    assert.equal(
      evaluateRegisteredCoreNamedAgent(
        request({
          context: {
            permission: {
              ...request().context.permission,
              permissionDecision: 'Denied'
            }
          } as never
        })
      ).ok,
      false
    );
    assert.equal(
      evaluateRegisteredCoreNamedAgent(
        request({
          context: {
            policy: {
              ...request().context.policy,
              policyDecision: 'Restricted'
            }
          } as never
        })
      ).ok,
      false
    );
    assert.equal(
      evaluateRegisteredCoreNamedAgent(
        request({
          context: {
            authorizedOrganizationReferenceId: 'organization:ref:other'
          } as never
        })
      ).ok,
      false
    );
  });
  it('blocks protected proposals without Human Review', () => {
    const result = evaluateRegisteredCoreNamedAgent(
      request({
        agentId: 'task-agent',
        operation: 'delegate-approved-task-mutation',
        capabilityId: 'delegate-task-api',
        proposedActions: [
          {
            actionId: 'create-task',
            capabilityId: 'delegate-task-api',
            protected: true,
            delegationTarget: 'task-api',
            requiresApprovalLevel: 'human-review'
          }
        ],
        context: {
          humanReview: {
            ...request().context.humanReview,
            reviewDecision: 'Rejected'
          }
        } as never
      })
    );
    assert.equal(result.ok, false);
  });
  it('rejects direct mutation, direct Event emission, Event commands and external protected actions', () => {
    for (const capabilityId of [
      'direct-domain-mutation',
      'direct-event-emission',
      'event-command',
      'external-protected-action'
    ])
      assert.equal(
        evaluateRegisteredCoreNamedAgent(
          request({
            proposedActions: [
              {
                actionId: capabilityId,
                capabilityId,
                protected: true,
                requiresApprovalLevel: 'external-protected-action'
              }
            ]
          })
        ).ok,
        false
      );
  });
  it('rejects unsupported versions, fabricated references, unsafe certifications, external sends, provider final decisions and audit rewrites with safe failures', () => {
    const cases = [
      request({ schemaVersion: 'v0' }),
      request({
        inputReferences: [
          {
            referenceId: 'fabricated:source',
            referenceType: 'document',
            organizationReferenceId: org
          }
        ]
      }),
      request({
        proposedActions: [
          {
            actionId: 'legal',
            capabilityId: 'legal-certification',
            protected: false,
            requiresApprovalLevel: 'none'
          }
        ]
      }),
      request({
        agentId: 'communication-agent',
        operation: 'draft-communication',
        capabilityId: 'draft-communication',
        proposedActions: [
          {
            actionId: 'send',
            capabilityId: 'external-send',
            protected: true,
            requiresApprovalLevel: 'human-review'
          }
        ]
      }),
      request({
        agentId: 'workflow-agent',
        operation: 'prepare-preview',
        capabilityId: 'prepare-workflow-preview',
        proposedActions: [
          {
            actionId: 'provider',
            capabilityId: 'provider-final-selection',
            protected: false,
            requiresApprovalLevel: 'none'
          }
        ]
      }),
      request({
        agentId: 'audit-agent',
        operation: 'inspect-audit-trace',
        capabilityId: 'inspect-audit-trace',
        proposedActions: [
          {
            actionId: 'rewrite',
            capabilityId: 'audit-history-rewrite',
            protected: false,
            requiresApprovalLevel: 'none'
          }
        ]
      })
    ];
    for (const c of cases) {
      const result = evaluateRegisteredCoreNamedAgent(c);
      assert.equal(result.ok, false);
      if (!result.ok)
        assert.doesNotMatch(
          JSON.stringify(result.error),
          /stack|secret|password|system prompt|raw sensitive/i
        );
    }
  });
  it('keeps Task and Workflow plans as proposals, validates delegation allowlists, digests and deterministic output', () => {
    const proposedActions = [
      {
        actionId: 'task-proposal',
        capabilityId: 'delegate-task-api',
        protected: true,
        delegationTarget: 'task-api',
        requiresApprovalLevel: 'human-review',
        planDigest: 'digest:1',
        approvedPlanDigest: 'digest:1'
      }
    ] as const;
    const first = evaluateRegisteredCoreNamedAgent(
      request({
        agentId: 'task-agent',
        operation: 'delegate-approved-task-mutation',
        capabilityId: 'delegate-task-api',
        requestedDelegationTarget: 'task-api',
        proposedActions
      })
    );
    const second = evaluateRegisteredCoreNamedAgent(
      request({
        agentId: 'task-agent',
        operation: 'delegate-approved-task-mutation',
        capabilityId: 'delegate-task-api',
        requestedDelegationTarget: 'task-api',
        proposedActions
      })
    );
    assert.deepEqual(first, second);
    if (first.ok)
      assert.equal(first.value.delegationIntent[0]?.execution, 'delegated');
    assert.equal(
      evaluateRegisteredCoreNamedAgent(
        request({ requestedDelegationTarget: 'forbidden-api' })
      ).ok,
      false
    );
    assert.equal(
      evaluateRegisteredCoreNamedAgent(
        request({
          agentId: 'task-agent',
          operation: 'delegate-approved-task-mutation',
          capabilityId: 'delegate-task-api',
          proposedActions: [
            { ...proposedActions[0], approvedPlanDigest: 'digest:changed' }
          ]
        })
      ).ok,
      false
    );
  });
});
