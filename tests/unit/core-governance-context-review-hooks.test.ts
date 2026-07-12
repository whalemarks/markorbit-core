import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { enforceCoreGovernedAction } from '../../src/index.ts';

const valid = {
  permission: {
    actorReferenceId: 'user:reviewer',
    intendedOperation: 'Submit',
    requiredPermissionKeys: ['matter.submit'],
    permissionDecisionReferenceId: 'permission-decision:1',
    permissionDecision: 'Allowed' as const,
    correlationId: 'request:1'
  },
  policy: {
    intendedOperation: 'Submit',
    requiredPolicyScopes: ['professional-action'],
    policyDecisionReferenceId: 'policy-decision:1',
    policyDecision: 'HumanReviewRequired' as const,
    restrictedFieldsOmitted: true,
    correlationId: 'request:1'
  },
  review: {
    humanReviewRequired: true,
    humanReviewReferenceId: 'review:1',
    reviewStatus: 'Completed' as const,
    reviewScope: 'ProfessionalSubmission',
    reviewDecision: 'Approved' as const,
    reviewerUserReferenceId: 'user:reviewer',
    targetObjectType: 'Matter',
    targetObjectReferenceId: 'matter:1'
  },
  audit: {
    operationName: 'SubmitMatter',
    operationCategory: 'Submit',
    actorReferenceId: 'user:reviewer',
    targetObjectType: 'Matter',
    targetObjectReferenceId: 'matter:1',
    permissionDecisionReferenceId: 'permission-decision:1',
    policyDecisionReferenceId: 'policy-decision:1',
    humanReviewReferenceId: 'review:1',
    correlationId: 'request:1'
  }
};

describe('CORE-TASK-030 Governance Context and Review Hooks', () => {
  it('allows a fully governed action and returns safe audit handoff', () =>
    assert.equal(enforceCoreGovernedAction(valid).ok, true));
  it('fails closed when permission is denied', () =>
    assert.equal(
      enforceCoreGovernedAction({
        ...valid,
        permission: { ...valid.permission, permissionDecision: 'Denied' }
      }).ok,
      false
    ));
  it('fails closed when policy restricts the action', () =>
    assert.equal(
      enforceCoreGovernedAction({
        ...valid,
        policy: { ...valid.policy, policyDecision: 'Restricted' }
      }).ok,
      false
    ));
  it('requires completed approved human review when policy requires it', () =>
    assert.equal(
      enforceCoreGovernedAction({
        ...valid,
        review: { ...valid.review, reviewStatus: 'Requested' }
      }).ok,
      false
    ));
  it('rejects incomplete audit trace', () =>
    assert.equal(
      enforceCoreGovernedAction({
        ...valid,
        audit: { ...valid.audit, correlationId: '' }
      }).ok,
      false
    ));
});
