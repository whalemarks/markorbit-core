import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreServiceContract } from './core-service-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const canonicalCreatedAt = '2026-07-11T00:00:00.000Z';
const specificationPath = 'books/book-02-core-specification/';
const serviceSourceRoot = `${specificationPath}core-specs/services/`;
const nonGoals = [
  'Executable service method definitions or service implementations.',
  'API routes, database access, workflow runtime, or Book 03 execution behavior.',
  'Product UI behavior, concrete business logic, or AI agent authority.'
] as const;
const allowedOperations = [
  'reference lookup category',
  'boundary evaluation category',
  'contract-owned coordination category'
] as const;

const serviceSkeleton = (
  serviceType: string,
  domainId: CoreDomainId,
  name: string,
  description: string,
  purpose: string,
  owns: readonly string[],
  consumes?: readonly string[],
  produces?: readonly string[]
): CoreServiceContract => ({
  id: createCoreContractId(`core-service-${serviceType}-contract`),
  serviceType,
  domainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  owns,
  consumes,
  produces,
  allowedOperations,
  nonGoals,
  createdAt
});

const canonicalServiceSkeleton = (
  serviceType: string,
  domainId: CoreDomainId,
  name: string,
  sourceFile: string,
  purpose: string,
  owns: readonly string[],
  consumes: readonly string[],
  produces: readonly string[],
  specificNonGoals: readonly string[],
  implementationTask:
    | 'CORE-TASK-021'
    | 'CORE-TASK-038'
    | 'CORE-TASK-039'
    | 'CORE-TASK-040'
    | 'CORE-TASK-041'
    | 'CORE-TASK-042'
    | 'CORE-TASK-043'
    | 'CORE-TASK-044'
    | 'CORE-TASK-045'
    | 'CORE-TASK-046'
    | 'CORE-TASK-047'
    | 'CORE-TASK-048'
    | 'CORE-TASK-049'
    | 'CORE-TASK-050'
    | 'CORE-TASK-051'
    | 'CORE-TASK-052'
    | 'CORE-TASK-053' = 'CORE-TASK-021'
): CoreServiceContract => ({
  ...serviceSkeleton(
    serviceType,
    domainId,
    name,
    `Canonical metadata skeleton for the ${domainId} Core Service boundary.`,
    purpose,
    owns,
    consumes,
    produces
  ),
  nonGoals: [...nonGoals, ...specificNonGoals],
  sourcePath: `${serviceSourceRoot}${sourceFile}`,
  implementationDepth: 'validated_skeleton',
  createdAt: canonicalCreatedAt,
  metadata: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath,
    implementationTask,
    ...(serviceType === 'permission-evaluation-service'
      ? {
          behaviorImplementationTask: 'CORE-TASK-053',
          behaviorDepth: 'level_2_3',
          implementedOperations: [
            'createPermission',
            'getPermission',
            'updatePermission',
            'changePermissionStatus',
            'evaluatePermission',
            'validatePermissionReference',
            'listActorPermissions',
            'archivePermission'
          ]
        }
      : serviceType === 'user-service'
        ? {
            behaviorImplementationTask: 'CORE-TASK-052',
            behaviorDepth: 'level_2_3',
            implementedOperations: [
              'createUser',
              'getUser',
              'updateUser',
              'changeUserStatus',
              'linkUserIdentity',
              'linkUserOrganization',
              'unlinkUserOrganization',
              'validateUserReference',
              'resolveUserByIdentity',
              'archiveUser'
            ]
          }
        : serviceType === 'organization-service'
          ? {
              behaviorImplementationTask: 'CORE-TASK-051',
              behaviorDepth: 'level_2_3',
              implementedOperations: [
                'createOrganization',
                'getOrganization',
                'updateOrganization',
                'changeOrganizationStatus',
                'linkOrganizationUser',
                'unlinkOrganizationUser',
                'validateOrganizationReference',
                'resolveOrganizationContext',
                'archiveOrganization'
              ]
            }
          : serviceType === 'identity-resolution-service'
            ? {
                behaviorImplementationTask: 'CORE-TASK-050',
                behaviorDepth: 'level_2_3',
                implementedOperations: [
                  'createIdentity',
                  'getIdentity',
                  'updateIdentity',
                  'changeIdentityStatus',
                  'linkIdentity',
                  'validateIdentityReference',
                  'resolveIdentity',
                  'archiveIdentity'
                ]
              }
            : serviceType === 'customer-service'
              ? {
                  behaviorImplementationTask: 'CORE-TASK-036',
                  behaviorDepth: 'level_2_3',
                  implementedOperations: [
                    'createCustomer',
                    'getCustomer',
                    'listCustomers',
                    'validateCustomerReference',
                    'changeCustomerStatus'
                  ]
                }
              : serviceType === 'brand-service'
                ? {
                    behaviorImplementationTask: 'CORE-TASK-037',
                    behaviorDepth: 'level_2_3',
                    implementedOperations: [
                      'createBrand',
                      'getBrand',
                      'listBrands',
                      'validateBrandReference',
                      'changeBrandStatus'
                    ]
                  }
                : serviceType === 'trademark-service'
                  ? {
                      behaviorImplementationTask: 'CORE-TASK-038',
                      behaviorDepth: 'level_2_3',
                      implementedOperations: [
                        'createTrademark',
                        'getTrademark',
                        'listTrademarks',
                        'validateTrademarkReference',
                        'changeTrademarkStatus'
                      ]
                    }
                  : serviceType === 'jurisdiction-service'
                    ? {
                        behaviorImplementationTask: 'CORE-TASK-039',
                        behaviorDepth: 'level_2_3',
                        implementedOperations: [
                          'createJurisdiction',
                          'getJurisdiction',
                          'listJurisdictions',
                          'validateJurisdictionReference',
                          'resolveJurisdictionByCode',
                          'changeJurisdictionStatus'
                        ]
                      }
                    : serviceType === 'classification-service'
                      ? {
                          behaviorImplementationTask: 'CORE-TASK-040',
                          behaviorDepth: 'level_2_3',
                          implementedOperations: [
                            'createClassification',
                            'getClassification',
                            'listClassifications',
                            'validateClassification',
                            'validateClassificationReference',
                            'changeClassificationStatus'
                          ]
                        }
                      : serviceType === 'document-service'
                        ? {
                            behaviorImplementationTask: 'CORE-TASK-041',
                            behaviorDepth: 'level_2_3',
                            implementedOperations: [
                              'createDocument',
                              'getDocument',
                              'listDocuments',
                              'validateDocumentReference',
                              'linkDocumentFile',
                              'requireDocumentReview',
                              'reviewDocument',
                              'changeDocumentStatus'
                            ]
                          }
                        : serviceType === 'evidence-service'
                          ? {
                              behaviorImplementationTask: 'CORE-TASK-042B',
                              behaviorDepth: 'level_2_3',
                              implementedOperations: [
                                'createEvidence',
                                'getEvidence',
                                'listEvidence',
                                'updateEvidence',
                                'validateEvidenceReference',
                                'linkEvidenceSource',
                                'linkEvidenceClaim',
                                'linkEvidenceDocument',
                                'linkEvidenceTrademark',
                                'linkEvidenceBrand',
                                'linkEvidenceClassification',
                                'requireEvidenceReview',
                                'reviewEvidence',
                                'changeEvidenceStatus'
                              ]
                            }
                          : serviceType === 'matter-service'
                            ? {
                                behaviorImplementationTask: 'CORE-TASK-043B',
                                behaviorDepth: 'level_2_3',
                                implementedOperations: [
                                  'createMatter',
                                  'getMatter',
                                  'listMatters',
                                  'updateMatter',
                                  'changeMatterStatus',
                                  'linkMatterOrder',
                                  'linkMatterCustomer',
                                  'linkMatterBrand',
                                  'linkMatterTrademark',
                                  'linkMatterWorkflowContract',
                                  'linkMatterTask',
                                  'linkMatterDocument',
                                  'linkMatterEvidence',
                                  'validateMatterReference'
                                ]
                              }
                            : serviceType === 'order-service'
                              ? {
                                  behaviorImplementationTask: 'CORE-TASK-044',
                                  behaviorDepth: 'level_2_3',
                                  implementedOperations: [
                                    'createOrder',
                                    'getOrder',
                                    'listOrders',
                                    'updateOrder',
                                    'changeOrderStatus',
                                    'linkOrderCustomer',
                                    'linkOrderOpportunity',
                                    'linkOrderBrand',
                                    'linkOrderTrademark',
                                    'linkOrderMatter',
                                    'validateOrderReference',
                                    'validateOrderReadiness',
                                    'acceptOrder',
                                    'cancelOrder'
                                  ]
                                }
                              : serviceType === 'opportunity-service'
                                ? {
                                    behaviorImplementationTask: 'CORE-TASK-045',
                                    behaviorDepth: 'level_2_3',
                                    implementedOperations: [
                                      'createOpportunity',
                                      'getOpportunity',
                                      'listOpportunities',
                                      'updateOpportunity',
                                      'changeOpportunityStatus',
                                      'qualifyOpportunity',
                                      'disqualifyOpportunity',
                                      'linkOpportunityCustomer',
                                      'linkOpportunityBrand',
                                      'linkOpportunityTrademark',
                                      'linkOpportunityCommunication',
                                      'convertOpportunityToOrder',
                                      'validateOpportunityReference',
                                      'archiveOpportunity'
                                    ]
                                  }
                                : serviceType === 'workflow-contract-service'
                                  ? {
                                      behaviorImplementationTask:
                                        'CORE-TASK-048',
                                      behaviorDepth: 'level_2_3',
                                      implementedOperations: [
                                        'createWorkflowContract',
                                        'getWorkflowContract',
                                        'updateWorkflowContract',
                                        'changeWorkflowContractStatus',
                                        'defineWorkflowState',
                                        'defineWorkflowTransition',
                                        'defineWorkflowGuard',
                                        'validateWorkflowTransition',
                                        'validateWorkflowApplicability',
                                        'validateWorkflowContractReference',
                                        'archiveWorkflowContract'
                                      ]
                                    }
                                  : serviceType ===
                                      'communication-reference-service'
                                    ? {
                                        behaviorImplementationTask:
                                          'CORE-TASK-049',
                                        behaviorDepth: 'level_2_3',
                                        implementedOperations: [
                                          'createCommunication',
                                          'getCommunication',
                                          'listCommunications',
                                          'updateCommunication',
                                          'changeCommunicationStatus',
                                          'linkCommunicationParticipant',
                                          'linkCommunicationMatter',
                                          'linkCommunicationCustomer',
                                          'linkCommunicationAgent',
                                          'linkCommunicationAttachment',
                                          'linkCommunicationDocument',
                                          'recordCommunicationSent',
                                          'recordCommunicationReceived',
                                          'validateCommunicationReference',
                                          'archiveCommunication'
                                        ]
                                      }
                                    : serviceType === 'task-service'
                                      ? {
                                          behaviorImplementationTask:
                                            'CORE-TASK-047',
                                          behaviorDepth: 'level_2_3',
                                          implementedOperations: [
                                            'createTask',
                                            'getTask',
                                            'listTasks',
                                            'updateTask',
                                            'changeTaskStatus',
                                            'assignTask',
                                            'reassignTask',
                                            'unassignTask',
                                            'linkTaskMatter',
                                            'linkTaskWorkflowContract',
                                            'linkTaskDependency',
                                            'completeTask',
                                            'cancelTask',
                                            'reopenTask',
                                            'validateTaskReference',
                                            'archiveTask'
                                          ]
                                        }
                                      : serviceType === 'event-service'
                                        ? {
                                            behaviorImplementationTask:
                                              'CORE-TASK-046',
                                            behaviorDepth: 'level_2_3',
                                            implementedOperations: [
                                              'recordEvent',
                                              'getEvent',
                                              'validateEventReference',
                                              'validateEventPayload',
                                              'updateEventStatus',
                                              'markEventDispatched',
                                              'markEventDispatchFailed',
                                              'linkEventConsumer',
                                              'archiveEvent'
                                            ]
                                          }
                                        : {})
  }
});

const stubServiceTargets = [
  ['opportunity', 'Opportunity'],
  ['notification', 'Notification'],
  ['partner', 'Partner'],
  ['agent', 'Agent'],
  ['service-provider', 'Service Provider'],
  ['service-network', 'Service Network'],
  ['routing', 'Routing']
] as const satisfies readonly (readonly [CoreDomainId, string])[];

const stubServiceSkeleton = (
  domainId: CoreDomainId,
  domainName: string
): CoreServiceContract => ({
  ...serviceSkeleton(
    `${domainId}-service`,
    domainId,
    `Core ${domainName} Service Contract Skeleton`,
    `Safe metadata-only stub for the ${domainName} Core Service boundary.`,
    `Reserves the canonical ${domainName} service ownership boundary without claiming methods, coordination, mutation, execution, or runtime availability.`,
    [`${domainName} structural service ownership and reference boundary.`],
    [`${domainName} Domain and Object contract references.`],
    [`${domainName} structural service-boundary references.`]
  ),
  nonGoals: [
    ...nonGoals,
    'Operational availability, fake success, or production readiness.',
    ...(domainId === 'opportunity'
      ? [
          'Full CRM, marketing automation, lead scoring, sales forecasting, direct Matter creation, or automatic Order creation without approved review and Order Service delegation.'
        ]
      : ['Implemented service behavior.'])
  ],
  sourcePath: `${serviceSourceRoot}${domainId}-service.md`,
  implementationDepth: 'validated_skeleton',
  createdAt: canonicalCreatedAt,
  metadata: {
    specificationRepository: 'whalemarks/markorbit-publication',
    specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
    specificationPath,
    implementationTask: 'CORE-TASK-023',
    mvpRequirement: 'stub_now',
    ...(domainId === 'opportunity'
      ? {
          behaviorImplementationTask: 'CORE-TASK-045',
          behaviorDepth: 'level_2_3',
          implementedOperations: [
            'createOpportunity',
            'getOpportunity',
            'listOpportunities',
            'updateOpportunity',
            'changeOpportunityStatus',
            'qualifyOpportunity',
            'disqualifyOpportunity',
            'linkOpportunityCustomer',
            'linkOpportunityBrand',
            'linkOpportunityTrademark',
            'linkOpportunityCommunication',
            'convertOpportunityToOrder',
            'validateOpportunityReference',
            'archiveOpportunity'
          ]
        }
      : {})
  }
});

export const CORE_SERVICE_CONTRACT_SKELETONS = [
  canonicalServiceSkeleton(
    'identity-resolution-service',
    'identity',
    'Identity Resolution Service Contract Skeleton',
    'identity-service.md',
    'Defines the Identity service ownership boundary for stable actor recognition, lifecycle, governed linkage, validation, resolution, and audit trace without implementing authentication, credential storage, User profiles, Organization membership, Permission grants, or Policy decisions.',
    [
      'Identity service ownership, stable actor reference, lifecycle, governed link, reference validation, resolution, and audit trace boundary.'
    ],
    [
      'identity, user, organization, system actor, AI agent, service account, external actor, permission, policy, review, and audit references'
    ],
    [
      'identity boundary references, governed safe views, validation results, deterministic resolution results, and Event trace handoff'
    ],
    [
      'Authentication provider, password or credential storage, OAuth or SAML implementation, User profile creation, Organization membership assignment, role engine, Permission grant, Policy decision, or AI capability authorization.'
    ],
    'CORE-TASK-050'
  ),
  canonicalServiceSkeleton(
    'permission-evaluation-service',
    'permission',
    'Permission Evaluation Service Contract Skeleton',
    'permission-service.md',
    'Defines the Permission service ownership boundary for explicit authorization rules, lifecycle, recognized actor-action-resource evaluation, safe reference validation, actor-scoped listing, archival, audit trace, and Policy handoff without absorbing Identity, User, Organization, authentication, Policy evaluation, approval, workflow, or professional judgment.',
    [
      'Permission service ownership, explicit authorization rule, lifecycle, actor-action-resource evaluation, reference validation, actor-scoped listing, archival, and audit trace boundary.'
    ],
    [
      'permission, identity, user, organization, AI agent, system actor, resource, scope, policy, review, audit, task, workflow, and event references'
    ],
    [
      'Permission boundary references, governed safe views, deterministic evaluation results, validation results, Policy-required handoff, and Event trace handoff'
    ],
    [
      'Identity, User, or Organization ownership; credential authentication; implicit grant from task assignment, role label, or organization membership; final Policy evaluation; workflow or professional approval; full RBAC or ABAC engine; external IAM integration; or autonomous AI permission grant or escalation.'
    ],
    'CORE-TASK-053'
  ),
  serviceSkeleton(
    'policy-evaluation-service',
    'policy',
    'Policy Evaluation Service Contract Skeleton',
    'Skeleton contract boundary for policy evaluation service responsibilities.',
    'Establishes a service contract placeholder for policy ownership boundaries without implementing policy execution.',
    ['Policy evaluation service contract boundary.'],
    ['policy domain references'],
    ['policy evaluation references']
  ),
  serviceSkeleton(
    'knowledge-reference-service',
    'knowledge',
    'Knowledge Reference Service Contract Skeleton',
    'Skeleton contract boundary for knowledge reference service responsibilities.',
    'Establishes a service contract placeholder for knowledge reference boundaries without implementing retrieval behavior.',
    ['Knowledge reference service contract boundary.'],
    ['knowledge domain references'],
    ['knowledge reference outputs']
  ),
  canonicalServiceSkeleton(
    'trademark-service',
    'trademark',
    'Core Trademark Service Contract Skeleton',
    'trademark-service.md',
    'Defines the Trademark service ownership boundary for legal and procedural protection records without implementing filing, prosecution, registry synchronization, deadline calculation, fee calculation, similarity scoring, or legal conclusions.',
    [
      'Trademark service ownership, validation, lifecycle, relationship-reference, and reference boundary.'
    ],
    [
      'trademark, brand, jurisdiction, classification, document, evidence, and matter references'
    ],
    ['trademark boundary references'],
    [
      'Official registry synchronization, filing execution, prosecution workflow, deadline engine, fee engine, registrability scoring, similarity search, or legal opinion automation.'
    ],
    'CORE-TASK-038'
  ),
  canonicalServiceSkeleton(
    'jurisdiction-service',
    'jurisdiction',
    'Core Jurisdiction Service Contract Skeleton',
    'jurisdiction-service.md',
    'Defines the Jurisdiction service ownership boundary for canonical territorial and procedural contexts without implementing legal rules, fees, deadlines, official synchronization, provider routing, or legal conclusions.',
    [
      'Jurisdiction service ownership, validation, lifecycle, code-resolution, and reference boundary.'
    ],
    [
      'jurisdiction, trademark, classification, matter, order, document, evidence, knowledge, policy, agent, service-provider, and routing references'
    ],
    ['jurisdiction boundary references and governed code-resolution results'],
    [
      'Legal rule engine, fee engine, deadline engine, official registry synchronization, agent selection, provider routing, or AI legal advice.'
    ],
    'CORE-TASK-039'
  ),
  canonicalServiceSkeleton(
    'classification-service',
    'classification',
    'Core Classification Service Contract Skeleton',
    'classification-service.md',
    'Defines the Classification service ownership boundary for governed goods/services scope without implementing filing, official item synchronization, fee calculation, AI recommendation, or legal conclusions.',
    [
      'Classification service ownership, scope validation, lifecycle, review-gating, and reference boundary.'
    ],
    [
      'classification, trademark, brand, jurisdiction, knowledge, document, evidence, matter, order, policy, and agent references'
    ],
    ['classification boundary references and governed validation results'],
    [
      'Item mutation operations, AI classification engine, official wording certification, fee engine, filing execution, or automatic approval.'
    ],
    'CORE-TASK-040'
  ),
  canonicalServiceSkeleton(
    'document-service',
    'document',
    'Core Document Service Contract Skeleton',
    'document-service.md',
    'Defines the Document service ownership boundary for governed artifact records without implementing storage, rendering, OCR, e-signature, evidence conversion, or external delivery.',
    [
      'Document service ownership, artifact lifecycle, file-reference linkage, professional review gating, confidentiality, validation, and reference boundary.'
    ],
    [
      'document, organization, trademark, matter, evidence, communication, user, permission, and policy references'
    ],
    [
      'document boundary references, governed validation results, and Event trace handoff'
    ],
    [
      'File storage, OCR, rendering, e-signature, template generation, automatic Evidence conversion, external delivery, or filing execution.'
    ],
    'CORE-TASK-041'
  ),
  canonicalServiceSkeleton(
    'evidence-service',
    'evidence',
    'Core Evidence Service Contract Skeleton',
    'evidence-service.md',
    'Defines the Evidence service ownership boundary for governed proof-layer records without implementing automatic sufficiency decisions, legal conclusions, OCR, authenticity verification, evidence-package runtime, or external integrations.',
    [
      'Evidence service ownership, proof purpose, source linkage, claim linkage, Document linkage, professional review gating, lifecycle, validation, and reference boundary.'
    ],
    [
      'evidence, document, trademark, brand, classification, jurisdiction, matter, order, communication, user, permission, and policy references'
    ],
    [
      'evidence boundary references, governed proof validation results, and Event trace handoff'
    ],
    [
      'Automatic evidence sufficiency scoring, professional legal conclusion, OCR or extraction, authenticity verification, litigation chronology, Evidence Package runtime, external evidence integrations, or filing execution.'
    ],
    'CORE-TASK-042'
  ),
  canonicalServiceSkeleton(
    'communication-reference-service',
    'communication',
    'Communication Reference Service Contract Skeleton',
    'communication-service.md',
    'Defines the Communication service ownership boundary for governed message and conversation lifecycle records without implementing external gateway delivery, full email or chat clients, marketing automation, or automatic Document or Evidence conversion.',
    [
      'Communication service ownership, lifecycle, participant linkage, related-reference linkage, delivery-status recording, validation, and audit trace boundary.'
    ],
    [
      'communication, matter, task, customer, agent, service-provider, notification, event, attachment, document, evidence, permission, policy, and review references'
    ],
    [
      'communication boundary references, governed safe views, delivery-status records, validation results, and Event trace handoff'
    ],
    [
      'External email or chat gateway delivery, full messaging client, marketing automation, mass mailing, automatic Document conversion, automatic Evidence conversion, official submission, or autonomous AI sending.'
    ],
    'CORE-TASK-049'
  ),
  canonicalServiceSkeleton(
    'organization-service',
    'organization',
    'Core Organization Service Contract Skeleton',
    'organization-service.md',
    'Defines the Organization service ownership boundary for stable operating-context records, lifecycle, explicit User linkage, hierarchy, safe validation, deterministic context resolution, and audit trace without absorbing Identity, User, Permission, Policy, billing, authentication, Customer, Partner, Agent, or Service Provider ownership.',
    [
      'Organization service ownership, stable operating-context reference, lifecycle, explicit User linkage, hierarchy, reference validation, deterministic context resolution, archival, and audit trace boundary.'
    ],
    [
      'organization, parent organization, identity, user, permission, policy, review, audit, customer, partner, agent, service-provider, billing, and authentication references'
    ],
    [
      'organization boundary references, governed safe views, membership-reference results, validation results, deterministic operating-context resolution results, and Event trace handoff'
    ],
    [
      'Identity or User ownership, implicit email-domain membership, Permission grant, Policy decision, billing account, authentication or credential system, Customer record, Partner record, Agent record, Service Provider record, full CRM/company profile, or autonomous AI organization administration.'
    ],
    'CORE-TASK-051'
  ),
  canonicalServiceSkeleton(
    'user-service',
    'user',
    'Core User Service Contract Skeleton',
    'user-service.md',
    'Defines the User service ownership boundary for stable account-participant records, lifecycle, governed Identity linkage, explicit Organization-context linkage, safe validation, deterministic Identity resolution, archival, and audit trace without absorbing Identity, Organization, Permission, Policy, authentication, or business-contact ownership.',
    [
      'User service ownership, stable account-participant reference, lifecycle, required Identity linkage, explicit Organization-context linkage, reference validation, deterministic Identity resolution, archival, and audit trace boundary.'
    ],
    [
      'user, identity, organization, permission, policy, review, audit, task, communication, customer, agent, partner, service-provider, and authentication references'
    ],
    [
      'user boundary references, governed safe views, Identity and Organization link results, validation results, deterministic participant resolution results, and Event trace handoff'
    ],
    [
      'Authentication, password or credential storage, OAuth or SAML, session or token issuance, Identity ownership, Organization ownership or implicit membership, Permission grant, Policy decision, Customer record, Agent record, Partner record, Service Provider record, product profile, or AI User impersonation.'
    ],
    'CORE-TASK-052'
  ),
  canonicalServiceSkeleton(
    'brand-service',
    'brand',
    'Core Brand Service Contract Skeleton',
    'brand-service.md',
    'Defines the Brand service ownership boundary for commercial-identity records without implementing intake, naming, trademark linkage mutation, recommendation, or product behavior.',
    [
      'Brand service ownership, validation, relationship, and reference boundary.'
    ],
    ['brand, customer, and trademark references'],
    ['brand boundary references'],
    [
      'Brand intake execution, naming generation, trademark filing, AI recommendations, record mutation, or product catalog behavior.'
    ]
  ),
  canonicalServiceSkeleton(
    'customer-service',
    'customer',
    'Core Customer Service Contract Skeleton',
    'customer-service.md',
    'Defines the Customer service ownership boundary for demand-side commercial-party records without implementing intake, CRM, billing, order creation, or relationship mutation.',
    [
      'Customer service ownership, validation, linkage, and reference boundary.'
    ],
    ['customer, organization, brand, and opportunity references'],
    ['customer boundary references'],
    [
      'Customer intake execution, CRM automation, billing accounts, order creation, relationship mutation, or contact management.'
    ]
  ),
  canonicalServiceSkeleton(
    'matter-service',
    'matter',
    'Core Matter Service Contract Skeleton',
    'matter-service.md',
    'Defines the Matter service ownership boundary for professional-execution containers without implementing case work, workflow application, task creation, status mutation, or professional decisions.',
    [
      'Matter service ownership, validation, linkage, lifecycle-reference, and boundary coordination.'
    ],
    ['matter, order, workflow, task, document, and evidence references'],
    ['matter boundary references'],
    [
      'Professional execution, case decisions, workflow apply, task creation, filing, or Product UI case cards.'
    ],
    'CORE-TASK-043'
  ),
  canonicalServiceSkeleton(
    'order-service',
    'order',
    'Core Order Service Contract Skeleton',
    'order-service.md',
    'Defines the Order service ownership boundary for commercial service requests without implementing conversion, pricing, payment, invoicing, matter creation, or workflow execution.',
    [
      'Order service ownership, validation, linkage, conversion-boundary, and reference coordination.'
    ],
    ['order, customer, opportunity, brand, trademark, and matter references'],
    ['order boundary references'],
    [
      'Pricing engine, payment, invoicing, checkout, Matter creation, workflow execution, or professional work.'
    ],
    'CORE-TASK-044'
  ),
  canonicalServiceSkeleton(
    'workflow-contract-service',
    'workflow-contract',
    'Core Workflow Contract Service Contract Skeleton',
    'workflow-contract-service.md',
    'Defines the Workflow Contract service ownership and governed definition/validation boundary for allowed execution structures without implementing running instances, task creation, direct mutation, or workflow runtime.',
    [
      'Workflow Contract service ownership, definition validation, reference, and governance boundary.'
    ],
    [
      'workflow contract, matter, task, event, permission, and policy references'
    ],
    ['workflow contract boundary references'],
    [
      'Workflow engine, running instances, automatic transition execution, direct Matter or Task mutation, task creation, Event Service replacement, permission grant, policy override, or review decisions.'
    ],
    'CORE-TASK-048'
  ),
  canonicalServiceSkeleton(
    'task-service',
    'task',
    'Core Task Service Contract Skeleton',
    'task-service.md',
    'Defines the Task service ownership boundary for actionable work units without implementing creation, assignment, scheduling, completion, review, status mutation, or event emission.',
    [
      'Task service ownership, validation, assignment-reference, scheduling-reference, and lifecycle boundary.'
    ],
    ['task, matter, workflow, user, permission, policy, and event references'],
    ['task boundary references'],
    [
      'Task execution outside governed operations, assignment automation, scheduling engine, time tracking, billing, notification delivery, or project-management analytics.'
    ],
    'CORE-TASK-047'
  ),
  canonicalServiceSkeleton(
    'event-service',
    'event',
    'Core Event Service Contract Skeleton',
    'event-service.md',
    'Defines the Event service ownership boundary for meaningful-occurrence records without implementing recording, dispatch, publication, consumption, persistence, or integration triggers.',
    [
      'Event service ownership, validation, source, visibility, reference, and trace boundary.'
    ],
    [
      'event, source-domain, source-object, actor, correlation, and causation references'
    ],
    ['event boundary references'],
    [
      'Event bus infrastructure, event sourcing, distributed queue runtime, replay engine, stream processing, subscription runtime, persistence, trigger execution, audit logging, or product activity feeds.'
    ],
    'CORE-TASK-046'
  ),
  ...stubServiceTargets.map(([domainId, domainName]) =>
    stubServiceSkeleton(domainId, domainName)
  )
] as const satisfies readonly CoreServiceContract[];
