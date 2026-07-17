import type {
  CoreGovernedApiBoundarySpec,
  CoreGovernedApiOperationSpec
} from './core-governed-api-boundary.ts';

const operation = (
  apiOperation: string,
  serviceOperation: string,
  governanceOperation: string,
  operationCategory: string,
  duplicateSensitive: boolean,
  requiredPermissionKey: string,
  requiredPolicyScope: string,
  requiredPayloadFields: readonly string[],
  allowedPayloadFields: readonly string[],
  referenceFields: readonly string[] = [],
  objectFields: readonly string[] = [],
  arrayFields: readonly string[] = [],
  booleanFields: readonly string[] = []
): CoreGovernedApiOperationSpec => ({
  apiOperation,
  serviceOperation,
  governanceOperation,
  operationCategory,
  duplicateSensitive,
  requiredPermissionKey,
  requiredPolicyScope,
  requiredPayloadFields,
  allowedPayloadFields,
  referenceFields,
  objectFields,
  arrayFields,
  booleanFields
});

const identityOperations = [
  operation(
    'create',
    'createIdentity',
    'identity.create',
    'Create',
    true,
    'identity:create',
    'identity.write',
    [
      'objectRecord',
      'publicReferenceRecord',
      'identityType',
      'identityStatus',
      'displayReference',
      'sourceReference'
    ],
    [
      'objectRecord',
      'publicReferenceRecord',
      'identityType',
      'identityStatus',
      'displayReference',
      'sourceReference',
      'metadata',
      'aiInitiated',
      'agentContractReferenceId'
    ],
    ['agentContractReferenceId'],
    ['objectRecord', 'publicReferenceRecord', 'metadata'],
    [],
    ['aiInitiated']
  ),
  operation(
    'get',
    'getIdentity',
    'identity.read',
    'Read',
    false,
    'identity:read',
    'identity.read',
    ['identityReferenceId'],
    ['identityReferenceId'],
    ['identityReferenceId']
  ),
  operation(
    'update',
    'updateIdentity',
    'identity.update',
    'Update',
    true,
    'identity:update',
    'identity.write',
    ['identityReferenceId'],
    ['identityReferenceId', 'displayReference', 'metadata'],
    ['identityReferenceId'],
    ['metadata']
  ),
  operation(
    'change-status',
    'changeIdentityStatus',
    'identity.change_status',
    'Update',
    true,
    'identity:change_status',
    'identity.lifecycle',
    ['identityReferenceId', 'targetStatus', 'reasonReference'],
    ['identityReferenceId', 'targetStatus', 'reasonReference'],
    ['identityReferenceId', 'reasonReference']
  ),
  operation(
    'link',
    'linkIdentity',
    'identity.link',
    'Link',
    true,
    'identity:link',
    'identity.link',
    ['identityReferenceId', 'linkType', 'linkedObjectReferenceId'],
    ['identityReferenceId', 'linkType', 'linkedObjectReferenceId'],
    ['identityReferenceId', 'linkedObjectReferenceId']
  ),
  operation(
    'validate-reference',
    'validateIdentityReference',
    'identity.validate_reference',
    'Validate',
    false,
    'identity:validate_reference',
    'identity.reference',
    ['identityReferenceId', 'requestingDomain', 'requestingService'],
    ['identityReferenceId', 'requestingDomain', 'requestingService'],
    ['identityReferenceId']
  ),
  operation(
    'resolve',
    'resolveIdentity',
    'identity.resolve',
    'Read',
    false,
    'identity:resolve',
    'identity.reference',
    ['linkType', 'linkedObjectReferenceId'],
    ['linkType', 'linkedObjectReferenceId'],
    ['linkedObjectReferenceId']
  ),
  operation(
    'archive',
    'archiveIdentity',
    'identity.change_status',
    'Archive',
    true,
    'identity:change_status',
    'identity.lifecycle',
    ['identityReferenceId', 'reasonReference'],
    ['identityReferenceId', 'reasonReference'],
    ['identityReferenceId', 'reasonReference']
  )
] as const;

const organizationOperations = [
  operation(
    'create',
    'createOrganization',
    'organization.create',
    'Create',
    true,
    'organization:create',
    'organization.write',
    [
      'objectRecord',
      'publicReferenceRecord',
      'organizationType',
      'organizationStatus',
      'displayNameReference',
      'sourceReference'
    ],
    [
      'objectRecord',
      'publicReferenceRecord',
      'organizationType',
      'organizationStatus',
      'displayNameReference',
      'sourceReference',
      'parentOrganizationReferenceId',
      'ownerIdentityReferenceId',
      'metadata',
      'aiInitiated',
      'agentContractReferenceId'
    ],
    [
      'parentOrganizationReferenceId',
      'ownerIdentityReferenceId',
      'agentContractReferenceId'
    ],
    ['objectRecord', 'publicReferenceRecord', 'metadata'],
    [],
    ['aiInitiated']
  ),
  operation(
    'get',
    'getOrganization',
    'organization.read',
    'Read',
    false,
    'organization:read',
    'organization.read',
    ['organizationReferenceId'],
    ['organizationReferenceId'],
    ['organizationReferenceId']
  ),
  operation(
    'update',
    'updateOrganization',
    'organization.update',
    'Update',
    true,
    'organization:update',
    'organization.write',
    ['organizationReferenceId'],
    [
      'organizationReferenceId',
      'displayNameReference',
      'metadata',
      'ownerIdentityReferenceId'
    ],
    ['organizationReferenceId', 'ownerIdentityReferenceId'],
    ['metadata']
  ),
  operation(
    'change-status',
    'changeOrganizationStatus',
    'organization.change_status',
    'Update',
    true,
    'organization:change_status',
    'organization.lifecycle',
    ['organizationReferenceId', 'targetStatus', 'reasonReference'],
    ['organizationReferenceId', 'targetStatus', 'reasonReference'],
    ['organizationReferenceId', 'reasonReference']
  ),
  operation(
    'link-user',
    'linkOrganizationUser',
    'organization.user.link',
    'Link',
    true,
    'organization:user:link',
    'organization.relationship',
    ['organizationReferenceId', 'userReferenceId', 'linkType'],
    ['organizationReferenceId', 'userReferenceId', 'linkType'],
    ['organizationReferenceId', 'userReferenceId']
  ),
  operation(
    'unlink-user',
    'unlinkOrganizationUser',
    'organization.user.unlink',
    'Unlink',
    true,
    'organization:user:unlink',
    'organization.relationship',
    ['organizationReferenceId', 'userReferenceId', 'reasonReference'],
    ['organizationReferenceId', 'userReferenceId', 'reasonReference'],
    ['organizationReferenceId', 'userReferenceId', 'reasonReference']
  ),
  operation(
    'validate-reference',
    'validateOrganizationReference',
    'organization.validate_reference',
    'Validate',
    false,
    'organization:validate_reference',
    'organization.reference',
    ['organizationReferenceId', 'requestingDomain', 'requestingService'],
    ['organizationReferenceId', 'requestingDomain', 'requestingService'],
    ['organizationReferenceId']
  ),
  operation(
    'resolve-context',
    'resolveOrganizationContext',
    'organization.resolve',
    'Read',
    false,
    'organization:resolve',
    'organization.reference',
    ['organizationReferenceId'],
    ['organizationReferenceId', 'userReferenceId'],
    ['organizationReferenceId', 'userReferenceId']
  ),
  operation(
    'archive',
    'archiveOrganization',
    'organization.change_status',
    'Archive',
    true,
    'organization:change_status',
    'organization.lifecycle',
    ['organizationReferenceId', 'reasonReference'],
    ['organizationReferenceId', 'reasonReference'],
    ['organizationReferenceId', 'reasonReference']
  )
] as const;

const userOperations = [
  operation(
    'create',
    'createUser',
    'user.create',
    'Create',
    true,
    'user:create',
    'user.write',
    [
      'objectRecord',
      'publicReferenceRecord',
      'userType',
      'displayNameReference',
      'identityReferenceId',
      'sourceReference'
    ],
    [
      'objectRecord',
      'publicReferenceRecord',
      'userType',
      'displayNameReference',
      'identityReferenceId',
      'status',
      'sourceReference',
      'organizationLinks',
      'aiInitiated',
      'agentContractReferenceId'
    ],
    ['identityReferenceId', 'agentContractReferenceId'],
    ['objectRecord', 'publicReferenceRecord'],
    ['organizationLinks'],
    ['aiInitiated']
  ),
  operation(
    'get',
    'getUser',
    'user.get',
    'Read',
    false,
    'user:read',
    'user.read',
    ['userReferenceId'],
    ['userReferenceId'],
    ['userReferenceId']
  ),
  operation(
    'update',
    'updateUser',
    'user.update',
    'Update',
    true,
    'user:update',
    'user.write',
    ['userReferenceId'],
    ['userReferenceId', 'displayNameReference', 'metadata'],
    ['userReferenceId'],
    ['metadata']
  ),
  operation(
    'change-status',
    'changeUserStatus',
    'user.status.change',
    'Update',
    true,
    'user:status',
    'user.status',
    ['userReferenceId', 'nextStatus', 'reasonReference'],
    ['userReferenceId', 'nextStatus', 'reasonReference'],
    ['userReferenceId', 'reasonReference']
  ),
  operation(
    'link-identity',
    'linkUserIdentity',
    'user.identity.link',
    'Link',
    true,
    'user:identity:link',
    'user.relationship',
    ['userReferenceId', 'identityReferenceId', 'reasonReference'],
    ['userReferenceId', 'identityReferenceId', 'reasonReference'],
    ['userReferenceId', 'identityReferenceId', 'reasonReference']
  ),
  operation(
    'link-organization',
    'linkUserOrganization',
    'user.organization.link',
    'Link',
    true,
    'user:organization:link',
    'user.relationship',
    ['userReferenceId', 'organizationReferenceId', 'linkType'],
    ['userReferenceId', 'organizationReferenceId', 'linkType'],
    ['userReferenceId', 'organizationReferenceId']
  ),
  operation(
    'unlink-organization',
    'unlinkUserOrganization',
    'user.organization.unlink',
    'Unlink',
    true,
    'user:organization:unlink',
    'user.relationship',
    ['userReferenceId', 'organizationReferenceId', 'reasonReference'],
    ['userReferenceId', 'organizationReferenceId', 'reasonReference'],
    ['userReferenceId', 'organizationReferenceId', 'reasonReference']
  ),
  operation(
    'validate-reference',
    'validateUserReference',
    'user.reference.validate',
    'Validate',
    false,
    'user:read',
    'user.reference',
    ['userReferenceId', 'requestingDomain', 'requestingService'],
    [
      'userReferenceId',
      'requestingDomain',
      'requestingService',
      'organizationReferenceId'
    ],
    ['userReferenceId', 'organizationReferenceId']
  ),
  operation(
    'resolve-by-identity',
    'resolveUserByIdentity',
    'user.identity.resolve',
    'Read',
    false,
    'user:read',
    'user.resolve',
    ['identityReferenceId'],
    ['identityReferenceId', 'organizationReferenceId'],
    ['identityReferenceId', 'organizationReferenceId']
  ),
  operation(
    'archive',
    'archiveUser',
    'user.archive',
    'Archive',
    true,
    'user:archive',
    'user.status',
    ['userReferenceId', 'reasonReference'],
    ['userReferenceId', 'reasonReference'],
    ['userReferenceId', 'reasonReference']
  )
] as const;

const permissionOperations = [
  operation(
    'create',
    'createPermission',
    'permission.create',
    'Create',
    true,
    'permission:create',
    'permission.write',
    [
      'objectRecord',
      'publicReferenceRecord',
      'permissionType',
      'actorReferenceId',
      'actorType',
      'action',
      'resourceType',
      'scopeReference',
      'effect',
      'sourceReference'
    ],
    [
      'objectRecord',
      'publicReferenceRecord',
      'permissionType',
      'actorReferenceId',
      'actorType',
      'action',
      'resourceType',
      'resourceReferenceId',
      'organizationReferenceId',
      'scopeReference',
      'effect',
      'conditionReference',
      'status',
      'sourceReference',
      'policyRequired',
      'reviewRequired',
      'aiInitiated',
      'agentContractReferenceId'
    ],
    [
      'actorReferenceId',
      'resourceReferenceId',
      'organizationReferenceId',
      'conditionReference',
      'agentContractReferenceId'
    ],
    ['objectRecord', 'publicReferenceRecord'],
    [],
    ['policyRequired', 'reviewRequired', 'aiInitiated']
  ),
  operation(
    'get',
    'getPermission',
    'permission.get',
    'Read',
    false,
    'permission:read',
    'permission.read',
    ['permissionReferenceId'],
    ['permissionReferenceId'],
    ['permissionReferenceId']
  ),
  operation(
    'update',
    'updatePermission',
    'permission.update',
    'Update',
    true,
    'permission:update',
    'permission.write',
    ['permissionReferenceId', 'reasonReference'],
    [
      'permissionReferenceId',
      'action',
      'resourceType',
      'resourceReferenceId',
      'organizationReferenceId',
      'scopeReference',
      'effect',
      'conditionReference',
      'sourceReference',
      'policyRequired',
      'reviewRequired',
      'reasonReference'
    ],
    [
      'permissionReferenceId',
      'resourceReferenceId',
      'organizationReferenceId',
      'conditionReference',
      'reasonReference'
    ],
    [],
    [],
    ['policyRequired', 'reviewRequired']
  ),
  operation(
    'change-status',
    'changePermissionStatus',
    'permission.status.change',
    'Update',
    true,
    'permission:status',
    'permission.status',
    ['permissionReferenceId', 'nextStatus', 'reasonReference'],
    ['permissionReferenceId', 'nextStatus', 'reasonReference'],
    ['permissionReferenceId', 'reasonReference']
  ),
  operation(
    'evaluate',
    'evaluatePermission',
    'permission.evaluate',
    'Evaluate',
    false,
    'permission:evaluate',
    'permission.evaluate',
    [
      'requestingActorReferenceId',
      'actorType',
      'action',
      'resourceType',
      'resourceReferenceId'
    ],
    [
      'requestingActorReferenceId',
      'actorType',
      'action',
      'resourceType',
      'resourceReferenceId',
      'organizationReferenceId',
      'scopeReference',
      'taskAssignmentReferenceId',
      'organizationMembershipReferenceId'
    ],
    [
      'requestingActorReferenceId',
      'resourceReferenceId',
      'organizationReferenceId',
      'taskAssignmentReferenceId',
      'organizationMembershipReferenceId'
    ]
  ),
  operation(
    'validate-reference',
    'validatePermissionReference',
    'permission.reference.validate',
    'Validate',
    false,
    'permission:read',
    'permission.reference',
    ['permissionReferenceId', 'requestingDomain', 'requestingService'],
    ['permissionReferenceId', 'requestingDomain', 'requestingService'],
    ['permissionReferenceId']
  ),
  operation(
    'list-actor-permissions',
    'listActorPermissions',
    'permission.actor.list',
    'Read',
    false,
    'permission:read',
    'permission.read',
    ['actorReferenceId', 'actorType'],
    [
      'actorReferenceId',
      'actorType',
      'organizationReferenceId',
      'includeInactive'
    ],
    ['actorReferenceId', 'organizationReferenceId'],
    [],
    [],
    ['includeInactive']
  ),
  operation(
    'archive',
    'archivePermission',
    'permission.status.change',
    'Archive',
    true,
    'permission:status',
    'permission.status',
    ['permissionReferenceId', 'reasonReference'],
    ['permissionReferenceId', 'reasonReference'],
    ['permissionReferenceId', 'reasonReference']
  )
] as const;

const policyOperations = [
  operation(
    'create',
    'createPolicy',
    'policy.create',
    'Create',
    true,
    'policy:create',
    'policy.write',
    [
      'objectRecord',
      'publicReferenceRecord',
      'policyType',
      'policyStatus',
      'displayReference',
      'scopeReference',
      'effect',
      'sourceReference'
    ],
    [
      'objectRecord',
      'publicReferenceRecord',
      'policyType',
      'policyStatus',
      'displayReference',
      'scopeReference',
      'effect',
      'conditionReference',
      'organizationReferenceId',
      'targetObjectType',
      'targetObjectReferenceId',
      'restrictedFields',
      'reviewRequired',
      'approvalRequired',
      'redactionRequired',
      'sourceReference',
      'aiInitiated',
      'agentContractReferenceId'
    ],
    [
      'conditionReference',
      'organizationReferenceId',
      'targetObjectReferenceId',
      'agentContractReferenceId'
    ],
    ['objectRecord', 'publicReferenceRecord'],
    ['restrictedFields'],
    ['reviewRequired', 'approvalRequired', 'redactionRequired', 'aiInitiated']
  ),
  operation(
    'get',
    'getPolicy',
    'policy.get',
    'Read',
    false,
    'policy:read',
    'policy.read',
    ['policyReferenceId'],
    ['policyReferenceId'],
    ['policyReferenceId']
  ),
  operation(
    'update',
    'updatePolicy',
    'policy.update',
    'Update',
    true,
    'policy:update',
    'policy.write',
    ['policyReferenceId', 'reasonReference'],
    [
      'policyReferenceId',
      'displayReference',
      'scopeReference',
      'effect',
      'conditionReference',
      'organizationReferenceId',
      'targetObjectType',
      'targetObjectReferenceId',
      'restrictedFields',
      'reviewRequired',
      'approvalRequired',
      'redactionRequired',
      'sourceReference',
      'reasonReference'
    ],
    [
      'policyReferenceId',
      'conditionReference',
      'organizationReferenceId',
      'targetObjectReferenceId',
      'reasonReference'
    ],
    [],
    ['restrictedFields'],
    ['reviewRequired', 'approvalRequired', 'redactionRequired']
  ),
  operation(
    'change-status',
    'changePolicyStatus',
    'policy.status.change',
    'Update',
    true,
    'policy:status',
    'policy.status',
    ['policyReferenceId', 'nextStatus', 'reasonReference'],
    ['policyReferenceId', 'nextStatus', 'reasonReference'],
    ['policyReferenceId', 'reasonReference']
  ),
  operation(
    'evaluate',
    'evaluatePolicy',
    'policy.evaluate',
    'Evaluate',
    false,
    'policy:evaluate',
    'policy.evaluate',
    [
      'requestingActorReferenceId',
      'actorType',
      'intendedOperation',
      'requiredPolicyScopes',
      'permissionDecision'
    ],
    [
      'requestingActorReferenceId',
      'actorType',
      'organizationReferenceId',
      'targetObjectType',
      'targetObjectReferenceId',
      'intendedOperation',
      'requiredPolicyScopes',
      'requestedDataAccessScope',
      'permissionDecision',
      'aiContext'
    ],
    [
      'requestingActorReferenceId',
      'organizationReferenceId',
      'targetObjectReferenceId'
    ],
    ['permissionDecision', 'aiContext'],
    ['requiredPolicyScopes']
  ),
  operation(
    'validate-reference',
    'validatePolicyReference',
    'policy.reference.validate',
    'Validate',
    false,
    'policy:read',
    'policy.reference',
    ['policyReferenceId', 'requestingDomain', 'requestingService'],
    ['policyReferenceId', 'requestingDomain', 'requestingService'],
    ['policyReferenceId']
  ),
  operation(
    'list-applicable',
    'listApplicablePolicies',
    'policy.list',
    'Read',
    false,
    'policy:read',
    'policy.read',
    ['intendedOperation', 'requiredPolicyScopes'],
    [
      'intendedOperation',
      'requiredPolicyScopes',
      'organizationReferenceId',
      'targetObjectType',
      'targetObjectReferenceId',
      'includeInactive'
    ],
    ['organizationReferenceId', 'targetObjectReferenceId'],
    [],
    ['requiredPolicyScopes'],
    ['includeInactive']
  ),
  operation(
    'archive',
    'archivePolicy',
    'policy.status.change',
    'Archive',
    true,
    'policy:status',
    'policy.status',
    ['policyReferenceId', 'reasonReference'],
    ['policyReferenceId', 'reasonReference'],
    ['policyReferenceId', 'reasonReference']
  )
] as const;

export const CORE_TASK_057A_API_BOUNDARY_SPECS = [
  {
    domainId: 'identity',
    apiType: 'identity-api',
    apiContractId: 'core-api-identity-api-contract',
    serviceContractId: 'core-service-identity-resolution-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/contracts/api/identity-api-contract.md',
    implementationTask: 'CORE-TASK-057A',
    directDomainMutation: false,
    directEventEmission: false,
    operations: identityOperations
  },
  {
    domainId: 'organization',
    apiType: 'organization-api',
    apiContractId: 'core-api-organization-api-contract',
    serviceContractId: 'core-service-organization-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/contracts/api/organization-api-contract.md',
    implementationTask: 'CORE-TASK-057A',
    directDomainMutation: false,
    directEventEmission: false,
    operations: organizationOperations
  },
  {
    domainId: 'user',
    apiType: 'user-api',
    apiContractId: 'core-api-user-api-contract',
    serviceContractId: 'core-service-user-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/contracts/api/user-api-contract.md',
    implementationTask: 'CORE-TASK-057A',
    directDomainMutation: false,
    directEventEmission: false,
    operations: userOperations
  },
  {
    domainId: 'permission',
    apiType: 'permission-api',
    apiContractId: 'core-api-permission-api-contract',
    serviceContractId: 'core-service-permission-evaluation-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/contracts/api/permission-api-contract.md',
    implementationTask: 'CORE-TASK-057A',
    directDomainMutation: false,
    directEventEmission: false,
    operations: permissionOperations
  },
  {
    domainId: 'policy',
    apiType: 'policy-api',
    apiContractId: 'core-api-policy-api-contract',
    serviceContractId: 'core-service-policy-evaluation-service-contract',
    sourcePath:
      'books/book-02-core-specification/core-specs/contracts/api/policy-api-contract.md',
    implementationTask: 'CORE-TASK-057A',
    directDomainMutation: false,
    directEventEmission: false,
    operations: policyOperations
  }
] as const satisfies readonly CoreGovernedApiBoundarySpec[];
