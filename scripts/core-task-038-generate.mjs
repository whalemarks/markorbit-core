import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, content) => writeFileSync(path, content.endsWith('\n') ? content : `${content}\n`);
const replaceRequired = (text, search, replacement, label) => {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
};
const replaceAllRequired = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replaceAll(search, replacement);
};

// 1. Generate Trademark Service from the accepted Brand governance pattern.
let service = read('src/services/brand/core-brand-service.ts')
  .replaceAll('BRAND', 'TRADEMARK')
  .replaceAll('Brand', 'Trademark')
  .replaceAll('brand', 'trademark');

service = replaceRequired(
  service,
  `export const CORE_TRADEMARK_TYPES = [\n  'Word',\n  'Logo',\n  'Combined',\n  'Slogan',\n  'Series',\n  'TradeName',\n  'ProductLine',\n  'Unknown'\n] as const;`,
  `export const CORE_TRADEMARK_TYPES = [\n  'Word',\n  'Device',\n  'Combined',\n  'Slogan',\n  'Sound',\n  'Color',\n  'ThreeDimensional',\n  'Series',\n  'Unknown'\n] as const;`,
  'Trademark types'
);
service = replaceRequired(
  service,
  `export const CORE_TRADEMARK_STATUSES = [\n  'Draft',\n  'Active',\n  'ReviewRequired',\n  'Archived',\n  'DeletedReferenceOnly'\n] as const;`,
  `export const CORE_TRADEMARK_STATUSES = [\n  'Draft',\n  'Planned',\n  'PendingFiling',\n  'Filed',\n  'UnderExamination',\n  'Published',\n  'Opposed',\n  'Registered',\n  'Refused',\n  'Abandoned',\n  'Cancelled',\n  'Expired',\n  'Invalidated',\n  'RenewalDue',\n  'ReviewRequired',\n  'Archived',\n  'DeletedReferenceOnly'\n] as const;`,
  'Trademark statuses'
);
service = replaceRequired(
  service,
  `export const CORE_TRADEMARK_STATUS_TO_OBJECT_STATUS: Record<\n  CoreTrademarkStatus,\n  CoreObjectStatus\n> = {\n  Draft: 'draft',\n  ReviewRequired: 'draft',\n  Active: 'active',\n  Archived: 'archived',\n  DeletedReferenceOnly: 'deleted'\n};`,
  `export const CORE_TRADEMARK_STATUS_TO_OBJECT_STATUS: Record<\n  CoreTrademarkStatus,\n  CoreObjectStatus\n> = {\n  Draft: 'draft',\n  Planned: 'draft',\n  PendingFiling: 'draft',\n  Filed: 'active',\n  UnderExamination: 'active',\n  Published: 'active',\n  Opposed: 'active',\n  Registered: 'active',\n  Refused: 'archived',\n  Abandoned: 'archived',\n  Cancelled: 'archived',\n  Expired: 'archived',\n  Invalidated: 'archived',\n  RenewalDue: 'active',\n  ReviewRequired: 'draft',\n  Archived: 'archived',\n  DeletedReferenceOnly: 'deleted'\n};`,
  'Trademark object status map'
);
service = replaceRequired(
  service,
  `const CUSTOMER_OBJECT_TYPE = 'customer-record';\nconst CUSTOMER_DOMAIN = 'customer';`,
  `const BRAND_OBJECT_TYPE = 'brand-record';\nconst BRAND_DOMAIN = 'brand';\nconst JURISDICTION_OBJECT_TYPE = 'jurisdiction-record';\nconst JURISDICTION_DOMAIN = 'jurisdiction';`,
  'Trademark related object constants'
);
service = replaceRequired(
  service,
  `const transitions = new Set([\n  'Draft->Active',\n  'Draft->ReviewRequired',\n  'ReviewRequired->Active',\n  'Active->ReviewRequired',\n  'Active->Archived',\n  'Draft->Archived',\n  'Archived->DeletedReferenceOnly'\n]);`,
  `const transitions = new Set([\n  'Draft->Planned',\n  'Draft->PendingFiling',\n  'Draft->ReviewRequired',\n  'Draft->Archived',\n  'Planned->PendingFiling',\n  'Planned->ReviewRequired',\n  'Planned->Archived',\n  'PendingFiling->Filed',\n  'PendingFiling->ReviewRequired',\n  'PendingFiling->Archived',\n  'Filed->UnderExamination',\n  'Filed->Published',\n  'Filed->ReviewRequired',\n  'Filed->Archived',\n  'UnderExamination->Published',\n  'UnderExamination->Registered',\n  'UnderExamination->Refused',\n  'UnderExamination->ReviewRequired',\n  'UnderExamination->Archived',\n  'Published->Opposed',\n  'Published->Registered',\n  'Published->Refused',\n  'Published->Archived',\n  'Opposed->Registered',\n  'Opposed->Refused',\n  'Opposed->Archived',\n  'Registered->RenewalDue',\n  'Registered->Archived',\n  'RenewalDue->Registered',\n  'RenewalDue->Expired',\n  'RenewalDue->Archived',\n  'ReviewRequired->Draft',\n  'ReviewRequired->Planned',\n  'ReviewRequired->PendingFiling',\n  'ReviewRequired->Filed',\n  'ReviewRequired->Archived',\n  'Refused->Archived',\n  'Abandoned->Archived',\n  'Cancelled->Archived',\n  'Expired->Archived',\n  'Invalidated->Archived',\n  'Archived->DeletedReferenceOnly'\n]);`,
  'Trademark transitions'
);
service = replaceRequired(
  service,
  `const reasonRequiredStatuses = new Set<CoreTrademarkStatus>([\n  'Archived',\n  'DeletedReferenceOnly'\n]);`,
  `const reasonRequiredStatuses = new Set<CoreTrademarkStatus>([\n  'Refused',\n  'Abandoned',\n  'Cancelled',\n  'Expired',\n  'Invalidated',\n  'Archived',\n  'DeletedReferenceOnly'\n]);`,
  'Trademark reason statuses'
);
service = service
  .replaceAll('InvalidTrademarkCustomerReference', 'InvalidTrademarkBrandReference')
  .replaceAll('TrademarkNameRequired', 'TrademarkMarkRepresentationRequired')
  .replaceAll('Trademark name reference', 'Trademark mark representation reference')
  .replaceAll('nameReference', 'markRepresentationReference')
  .replaceAll('customerReferenceId', 'brandReferenceId');
service = replaceRequired(
  service,
  `    InvalidTrademarkBrandReference: 'Reference',`,
  `    InvalidTrademarkBrandReference: 'Reference',\n    InvalidTrademarkJurisdictionReference: 'Reference',`,
  'Trademark error category mapping'
);
service = replaceAllRequired(
  service,
  `  readonly brandReferenceId: string | null;`,
  `  readonly jurisdictionReferenceId: string;\n  readonly brandReferenceId: string | null;`,
  'Trademark record and request relationship fields'
);
service = replaceRequired(
  service,
  `  readonly brandReferenceId?: string | null;\n    readonly idempotencyKey?: string | null;`,
  `  readonly jurisdictionReferenceId: string;\n    readonly brandReferenceId?: string | null;\n    readonly idempotencyKey?: string | null;`,
  'Trademark create relationship input'
);
service = replaceRequired(
  service,
  `function validateCustomerReference(\n  registry: CoreReferenceRegistry,\n  referenceId: string | null\n): CoreBehaviorResult<null> {\n  if (referenceId === null) return { ok: true, value: null };\n  const resolved = registry.resolve({\n    referenceId,\n    expectedObjectType: CUSTOMER_OBJECT_TYPE,\n    expectedDomain: CUSTOMER_DOMAIN\n  });\n  if (!resolved.ok || resolved.value.status !== 'Active') {\n    return safe(\n      'InvalidTrademarkBrandReference',\n      'Trademark Customer reference is invalid.'\n    );\n  }\n  return { ok: true, value: null };\n}`,
  `function validateBrandRelationshipReference(\n  registry: CoreReferenceRegistry,\n  referenceId: string | null\n): CoreBehaviorResult<null> {\n  if (referenceId === null) return { ok: true, value: null };\n  const resolved = registry.resolve({\n    referenceId,\n    expectedObjectType: BRAND_OBJECT_TYPE,\n    expectedDomain: BRAND_DOMAIN\n  });\n  if (!resolved.ok || resolved.value.status !== 'Active') {\n    return safe(\n      'InvalidTrademarkBrandReference',\n      'Trademark Brand reference is invalid.'\n    );\n  }\n  return { ok: true, value: null };\n}\n\nfunction validateJurisdictionReference(\n  registry: CoreReferenceRegistry,\n  referenceId: string\n): CoreBehaviorResult<null> {\n  const resolved = registry.resolve({\n    referenceId,\n    expectedObjectType: JURISDICTION_OBJECT_TYPE,\n    expectedDomain: JURISDICTION_DOMAIN\n  });\n  if (!resolved.ok || resolved.value.status !== 'Active') {\n    return safe(\n      'InvalidTrademarkJurisdictionReference',\n      'Trademark Jurisdiction reference is invalid.'\n    );\n  }\n  return { ok: true, value: null };\n}`,
  'Trademark related reference validators'
);
service = replaceRequired(
  service,
  `  const customer = validateCustomerReference(\n    registry,\n    record.brandReferenceId\n  );\n  if (!customer.ok) return customer;`,
  `  const jurisdiction = validateJurisdictionReference(\n    registry,\n    record.jurisdictionReferenceId\n  );\n  if (!jurisdiction.ok) return jurisdiction;\n  const brand = validateBrandRelationshipReference(\n    registry,\n    record.brandReferenceId\n  );\n  if (!brand.ok) return brand;`,
  'Trademark record relationship validation'
);
service = replaceRequired(
  service,
  `      !['Draft', 'ReviewRequired', 'Active'].includes(\n        String(input.trademarkStatus)\n      )`,
  `      !['Draft', 'Planned', 'PendingFiling', 'Filed', 'ReviewRequired'].includes(\n        String(input.trademarkStatus)\n      )`,
  'Trademark initial statuses'
);
service = replaceAllRequired(
  service,
  `          brandReferenceId: input.brandReferenceId ?? null`,
  `          jurisdictionReferenceId: input.jurisdictionReferenceId,\n          brandReferenceId: input.brandReferenceId ?? null`,
  'Trademark request and record relationship assignment'
);
service = replaceRequired(
  service,
  `                trademarkStatus: valid.value.trademarkStatus,\n                brandReferenceId: valid.value.brandReferenceId`,
  `                trademarkStatus: valid.value.trademarkStatus,\n                jurisdictionReferenceId: valid.value.jurisdictionReferenceId,\n                brandReferenceId: valid.value.brandReferenceId`,
  'Trademark create Event payload'
);
service = replaceRequired(
  service,
  `    | 'Valid'\n    | 'NotFound'\n    | 'Draft'\n    | 'ReviewRequired'\n    | 'Archived'\n    | 'DeletedReferenceOnly'\n    | 'InvalidReference';`,
  `    | 'Valid'\n    | 'NotFound'\n    | 'Archived'\n    | 'DeletedReferenceOnly'\n    | 'InvalidReference';`,
  'Trademark reference validation reasons'
);
service = replaceRequired(
  service,
  `        isValid: record.trademarkStatus === 'Active',\n        trademarkReferenceId: input.trademarkReferenceId,\n        trademarkType: record.trademarkType,\n        trademarkStatus: record.trademarkStatus,\n        reasonCode:\n          record.trademarkStatus === 'Active' ? 'Valid' : record.trademarkStatus`,
  `        isValid: !['Archived', 'DeletedReferenceOnly'].includes(\n          record.trademarkStatus\n        ),\n        trademarkReferenceId: input.trademarkReferenceId,\n        trademarkType: record.trademarkType,\n        trademarkStatus: record.trademarkStatus,\n        reasonCode:\n          record.trademarkStatus === 'Archived'\n            ? 'Archived'\n            : record.trademarkStatus === 'DeletedReferenceOnly'\n              ? 'DeletedReferenceOnly'\n              : 'Valid'`,
  'Trademark reference validity'
);
write('src/services/trademark/core-trademark-service.ts', service);
write('src/services/trademark/index.ts', `export * from './core-trademark-service.ts';`);

// 2. Fixture and executable evidence.
const fixture = {
  fixtureType: 'core_trademark_service_core_lifecycle',
  authority: {
    repository: 'whalemarks/markorbit-publication',
    commit: '3349ecb8955021a8714d023348f8b24f941eb98f'
  },
  fixedNow: '2026-07-14T01:00:00.000Z',
  updatedNow: '2026-07-14T01:05:00.000Z',
  trademarkReferenceId: 'trademark:ref:core-task-038',
  jurisdictionReferenceId: 'jurisdiction:ref:core-task-038',
  brandReferenceId: 'brand:ref:core-task-038',
  organizationScopeReferenceId: 'organization:ref:scope-0001',
  publicReferenceRecord: {
    referenceId: 'trademark:ref:core-task-038',
    objectType: 'trademark-record',
    referenceDomain: 'trademark',
    status: 'Active'
  },
  jurisdictionReferenceRecord: {
    referenceId: 'jurisdiction:ref:core-task-038',
    objectType: 'jurisdiction-record',
    referenceDomain: 'jurisdiction',
    status: 'Active'
  },
  brandReferenceRecord: {
    referenceId: 'brand:ref:core-task-038',
    objectType: 'brand-record',
    referenceDomain: 'brand',
    status: 'Active'
  },
  objectRecord: {
    publicReferenceId: 'trademark:ref:core-task-038',
    objectType: 'trademark-record',
    domainId: 'trademark',
    objectContractId: 'core-object-trademark-record-contract',
    status: 'draft',
    version: { version: 1, createdAt: '2026-07-14T01:00:00.000Z' },
    metadata: {},
    auditMetadata: {
      createdAt: '2026-07-14T01:00:00.000Z',
      createdByReferenceId: 'user:ref:actor-0001',
      correlationId: 'corr:core-task-038'
    },
    visibility: {
      permissionScopeReferenceId: 'permission:ref:scope-0001',
      policyScopeReferenceId: 'policy:ref:scope-0001',
      organizationScopeReferenceId: 'organization:ref:scope-0001'
    }
  },
  createRequest: {
    trademarkType: 'Word',
    trademarkStatus: 'Draft',
    markRepresentationReference: 'mark:representation:synthetic-038',
    sourceReference: 'source:synthetic:trademark-038',
    idempotencyKey: 'idem:create:core-task-038'
  },
  conflictingCreateRequest: { trademarkType: 'Device' },
  duplicateCreateRequest: { idempotencyKey: 'idem:create:duplicate-trademark-038' },
  statusTransitionRequest: {
    targetStatus: 'Planned',
    reasonReference: null,
    idempotencyKey: 'idem:status:core-task-038'
  },
  statusConflictRequest: {
    targetStatus: 'PendingFiling',
    reasonReference: null,
    idempotencyKey: 'idem:status:core-task-038'
  },
  invalidStatusTransitionRequest: {
    targetStatus: 'Registered',
    idempotencyKey: 'idem:status:invalid-core-task-038'
  },
  expected: {
    recordCountAfterCreate: 1,
    eventTraceCountAfterCreate: 1,
    eventTraceCountAfterReplay: 1,
    eventTraceCountAfterStatusChange: 2,
    eventTraceCountAfterStatusReplay: 2,
    sameKeyConflictCode: 'IdempotencyConflict',
    duplicateTrademarkCode: 'TrademarkAlreadyExists',
    invalidTransitionCode: 'InvalidTrademarkTransition',
    statusConflictCode: 'IdempotencyConflict'
  }
};
write(
  'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',
  JSON.stringify(fixture, null, 2)
);

let evidenceAdapter = read('src/service-coverage/core-brand-service-evidence-fixture.ts')
  .replaceAll('BRAND', 'TRADEMARK')
  .replaceAll('Brand', 'Trademark')
  .replaceAll('brand', 'trademark')
  .replaceAll('CustomerReference', 'BrandReference')
  .replaceAll('customerReference', 'brandReference')
  .replaceAll('customer reference', 'brand reference')
  .replaceAll('customerReferenceId', 'brandReferenceId')
  .replaceAll('nameReference', 'markRepresentationReference');
evidenceAdapter = replaceRequired(
  evidenceAdapter,
  `  const brandReference = fixture.brandReferenceRecord;\n  const objectRecord = fixture.objectRecord;`,
  `  const brandReference = fixture.brandReferenceRecord;\n  const jurisdictionReference = fixture.jurisdictionReferenceRecord;\n  const objectRecord = fixture.objectRecord;`,
  'Trademark evidence jurisdiction fixture field'
);
evidenceAdapter = replaceRequired(
  evidenceAdapter,
  `    typeof fixture.brandReferenceId !== 'string' ||\n    typeof fixture.organizationScopeReferenceId !== 'string' ||`,
  `    typeof fixture.brandReferenceId !== 'string' ||\n    typeof fixture.jurisdictionReferenceId !== 'string' ||\n    typeof fixture.organizationScopeReferenceId !== 'string' ||`,
  'Trademark evidence jurisdiction id shape'
);
evidenceAdapter = replaceRequired(
  evidenceAdapter,
  `    !isRecord(brandReference) ||\n    !isRecord(objectRecord) ||`,
  `    !isRecord(brandReference) ||\n    !isRecord(jurisdictionReference) ||\n    !isRecord(objectRecord) ||`,
  'Trademark evidence jurisdiction record shape'
);
evidenceAdapter = replaceRequired(
  evidenceAdapter,
  `  const brandReferenceRecord = referenceRecord(brandReference);\n  const traces = new CoreEventTraceRegistry();`,
  `  const brandReferenceRecord = referenceRecord(brandReference);\n  const jurisdictionReferenceRecord = referenceRecord(jurisdictionReference);\n  const traces = new CoreEventTraceRegistry();`,
  'Trademark evidence jurisdiction record'
);
evidenceAdapter = replaceRequired(
  evidenceAdapter,
  `      trademarkReferenceRecord,\n      brandReferenceRecord\n    ]),`,
  `      trademarkReferenceRecord,\n      brandReferenceRecord,\n      jurisdictionReferenceRecord\n    ]),`,
  'Trademark evidence reference registry'
);
evidenceAdapter = replaceRequired(
  evidenceAdapter,
  `      brandReferenceId: fixture.brandReferenceId,\n      idempotencyKey: String(createRequest.idempotencyKey),`,
  `      jurisdictionReferenceId: fixture.jurisdictionReferenceId,\n      brandReferenceId: fixture.brandReferenceId,\n      idempotencyKey: String(createRequest.idempotencyKey),`,
  'Trademark evidence create relationships'
);
evidenceAdapter = evidenceAdapter
  .replaceAll(`requestingDomain: 'trademark'`, `requestingDomain: 'matter'`)
  .replaceAll(`requestingService: 'trademark-reference-service'`, `requestingService: 'matter-service'`)
  .replaceAll(`String(statusRequest.reasonReference)`, `statusRequest.reasonReference === null ? null : String(statusRequest.reasonReference)`)
  .replaceAll(`String(statusConflictRequest.reasonReference)`, `statusConflictRequest.reasonReference === null ? null : String(statusConflictRequest.reasonReference)`);
write('src/service-coverage/core-trademark-service-evidence-fixture.ts', evidenceAdapter);
write(
  'src/validation/core-trademark-service-fixture-validation.ts',
  `import { validateCoreTrademarkServiceEvidenceFixture } from '../service-coverage/core-trademark-service-evidence-fixture.ts';\nimport { createCoreValidationResult } from './core-validation-result.ts';\n\nexport function validateCoreTrademarkServiceCoreLifecycleFixture(fixture: unknown) {\n  return createCoreValidationResult(\n    validateCoreTrademarkServiceEvidenceFixture(fixture).map((entry) => ({\n      code: entry.code,\n      severity: 'error' as const,\n      message: entry.message,\n      path: entry.path\n    }))\n  );\n}`
);

let unitTest = read('tests/unit/core-brand-service-core-lifecycle.test.ts')
  .replaceAll('BRAND', 'TRADEMARK')
  .replaceAll('Brand', 'Trademark')
  .replaceAll('brand', 'trademark')
  .replaceAll('CustomerReference', 'BrandReference')
  .replaceAll('customerReference', 'brandReference')
  .replaceAll('customer reference', 'brand reference')
  .replaceAll('customerReferenceId', 'brandReferenceId')
  .replaceAll('includeCustomer', 'includeBrand')
  .replaceAll('nameReference', 'markRepresentationReference');
unitTest = replaceRequired(
  unitTest,
  `const brandReference =\n  fixture.brandReferenceRecord as CoreReferenceRecord;\nconst objectRecord`,
  `const brandReference =\n  fixture.brandReferenceRecord as CoreReferenceRecord;\nconst jurisdictionReference =\n  fixture.jurisdictionReferenceRecord as CoreReferenceRecord;\nconst objectRecord`,
  'Trademark test jurisdiction record'
);
unitTest = replaceRequired(
  unitTest,
  `const brandReferenceId = String(fixture.brandReferenceId);\nconst organizationScopeReferenceId`,
  `const brandReferenceId = String(fixture.brandReferenceId);\nconst jurisdictionReferenceId = String(fixture.jurisdictionReferenceId);\nconst organizationScopeReferenceId`,
  'Trademark test jurisdiction id'
);
unitTest = replaceRequired(
  unitTest,
  `function setup(includeBrand = true) {`,
  `function setup(includeBrand = true, includeJurisdiction = true) {`,
  'Trademark test setup signature'
);
unitTest = replaceRequired(
  unitTest,
  `    ...(includeBrand ? [brandReference] : [])\n  ];`,
  `    ...(includeBrand ? [brandReference] : []),\n    ...(includeJurisdiction ? [jurisdictionReference] : [])\n  ];`,
  'Trademark test references'
);
unitTest = replaceRequired(
  unitTest,
  `    brandReferenceId,\n    idempotencyKey:`,
  `    jurisdictionReferenceId,\n    brandReferenceId,\n    idempotencyKey:`,
  'Trademark test create relationships'
);
unitTest = replaceRequired(
  unitTest,
  `    assert.deepEqual(CORE_TRADEMARK_TYPES, [\n      'Word',\n      'Logo',\n      'Combined',\n      'Slogan',\n      'Series',\n      'TradeName',\n      'ProductLine',\n      'Unknown'\n    ]);`,
  `    assert.deepEqual(CORE_TRADEMARK_TYPES, [\n      'Word',\n      'Device',\n      'Combined',\n      'Slogan',\n      'Sound',\n      'Color',\n      'ThreeDimensional',\n      'Series',\n      'Unknown'\n    ]);`,
  'Trademark test types'
);
unitTest = replaceRequired(
  unitTest,
  `    assert.deepEqual(CORE_TRADEMARK_STATUSES, [\n      'Draft',\n      'Active',\n      'ReviewRequired',\n      'Archived',\n      'DeletedReferenceOnly'\n    ]);`,
  `    assert.deepEqual(CORE_TRADEMARK_STATUSES, [\n      'Draft',\n      'Planned',\n      'PendingFiling',\n      'Filed',\n      'UnderExamination',\n      'Published',\n      'Opposed',\n      'Registered',\n      'Refused',\n      'Abandoned',\n      'Cancelled',\n      'Expired',\n      'Invalidated',\n      'RenewalDue',\n      'ReviewRequired',\n      'Archived',\n      'DeletedReferenceOnly'\n    ]);`,
  'Trademark test statuses'
);
unitTest = unitTest
  .replaceAll(`requestingDomain: 'trademark'`, `requestingDomain: 'matter'`)
  .replaceAll(`requestingService: 'trademark-reference-service'`, `requestingService: 'matter-service'`)
  .replaceAll(`assert.equal('brandReferenceId' in summary, false);`, `assert.equal('brandReferenceId' in summary, false);\n      assert.equal('jurisdictionReferenceId' in summary, false);`)
  .replaceAll(`assert.equal('brandReferenceId' in validation.value, false);`, `assert.equal('brandReferenceId' in validation.value, false);\n      assert.equal('jurisdictionReferenceId' in validation.value, false);`);
unitTest = replaceRequired(
  unitTest,
  `  it('requires a registered active Brand reference', () => {\n    const { service, traces } = setup(false);`,
  `  it('requires a registered active Brand reference', () => {\n    const { service, traces } = setup(false, true);`,
  'Trademark missing Brand setup'
);
unitTest = replaceRequired(
  unitTest,
  `  it('returns safe list and reference-validation outputs', () => {`,
  `  it('requires a registered active Jurisdiction reference', () => {\n    const { service, traces } = setup(true, false);\n    const result = createTrademark(service);\n    assert.equal(result.ok, false);\n    if (!result.ok) {\n      assert.deepEqual(\n        [result.error.code, result.error.category],\n        ['InvalidTrademarkJurisdictionReference', 'Reference']\n      );\n    }\n    assert.equal(traces.visibleTo(['Internal']).length, 0);\n  });\n\n  it('returns safe list and reference-validation outputs', () => {`,
  'Trademark missing Jurisdiction test'
);
write('tests/unit/core-trademark-service-core-lifecycle.test.ts', unitTest);
write(
  'tests/fixtures/core-trademark-service-core-lifecycle-fixture.test.ts',
  read('tests/fixtures/core-brand-service-core-lifecycle-fixture.test.ts')
    .replaceAll('Brand', 'Trademark')
    .replaceAll('brand', 'trademark')
);

// 3. Export and evidence registries.
write(
  'src/services/index.ts',
  replaceRequired(
    read('src/services/index.ts'),
    `export * from './brand/index.ts';`,
    `export * from './brand/index.ts';\nexport * from './trademark/index.ts';`,
    'Service exports'
  )
);
write(
  'src/service-coverage/index.ts',
  replaceRequired(
    read('src/service-coverage/index.ts'),
    `export * from './core-brand-service-evidence-fixture.ts';`,
    `export * from './core-brand-service-evidence-fixture.ts';\nexport * from './core-trademark-service-evidence-fixture.ts';`,
    'Service evidence exports'
  )
);
let evidence = read('src/service-coverage/core-service-behavior-evidence.ts');
evidence = replaceRequired(
  evidence,
  `} from '../services/customer/index.ts';`,
  `} from '../services/customer/index.ts';\nimport {\n  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n  CORE_TRADEMARK_MINIMUM_CAPABILITIES\n} from '../services/trademark/index.ts';`,
  'Trademark evidence imports'
);
evidence = replaceRequired(
  evidence,
  `  }\n] as const satisfies readonly CoreServiceBehaviorEvidence[];`,
  `  },\n  {\n    requirementId: 'must-service-trademark-service',\n    serviceType: 'trademark-service',\n    domainId: 'trademark',\n    contractId: 'core-service-trademark-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/trademark-service.md',\n    currentDepth: 'level_2_3',\n    operations: CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n    provenMinimumCapabilities: CORE_TRADEMARK_MINIMUM_CAPABILITIES,\n    unresolvedServiceOperations: [\n      'updateTrademark',\n      'linkTrademarkBrand',\n      'unlinkTrademarkBrand',\n      'linkTrademarkJurisdiction',\n      'linkTrademarkClassification',\n      'unlinkTrademarkClassification',\n      'linkTrademarkDocument',\n      'linkTrademarkEvidence',\n      'updateOfficialReference',\n      'archiveTrademark'\n    ],\n    implementationFiles: ['src/services/trademark/core-trademark-service.ts'],\n    testFiles: ['tests/unit/core-trademark-service-core-lifecycle.test.ts'],\n    fixtureFiles: [\n      'fixtures/services/core-trademark-service-core-lifecycle.fixture.json'\n    ]\n  }\n] as const satisfies readonly CoreServiceBehaviorEvidence[];`,
  'Trademark evidence entry'
);
write('src/service-coverage/core-service-behavior-evidence.ts', evidence);

let evidenceValidation = read('src/service-coverage/core-service-behavior-validation.ts');
evidenceValidation = replaceRequired(
  evidenceValidation,
  `} from '../services/customer/index.ts';`,
  `} from '../services/customer/index.ts';\nimport {\n  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n  CORE_TRADEMARK_MINIMUM_CAPABILITIES\n} from '../services/trademark/index.ts';`,
  'Trademark evidence validation imports'
);
evidenceValidation = replaceRequired(
  evidenceValidation,
  `import { validateCoreCustomerServiceEvidenceFixture } from './core-customer-service-evidence-fixture.ts';`,
  `import { validateCoreCustomerServiceEvidenceFixture } from './core-customer-service-evidence-fixture.ts';\nimport { validateCoreTrademarkServiceEvidenceFixture } from './core-trademark-service-evidence-fixture.ts';`,
  'Trademark fixture validator import'
);
evidenceValidation = replaceRequired(
  evidenceValidation,
  `  readonly brandFixture?: unknown;`,
  `  readonly brandFixture?: unknown;\n  readonly trademarkFixture?: unknown;`,
  'Trademark fixture override'
);
evidenceValidation = replaceRequired(
  evidenceValidation,
  `  readonly domainId: 'customer' | 'brand';`,
  `  readonly domainId: 'customer' | 'brand' | 'trademark';`,
  'Trademark evidence domain union'
);
evidenceValidation = replaceRequired(
  evidenceValidation,
  `  readonly fixtureOverride: 'customerFixture' | 'brandFixture';`,
  `  readonly fixtureOverride:\n    | 'customerFixture'\n    | 'brandFixture'\n    | 'trademarkFixture';`,
  'Trademark fixture override union'
);
evidenceValidation = replaceRequired(
  evidenceValidation,
  `  }\n] as const satisfies readonly ExpectedServiceEvidence[];`,
  `  },\n  {\n    requirementId: 'must-service-trademark-service',\n    serviceType: 'trademark-service',\n    domainId: 'trademark',\n    contractId: 'core-service-trademark-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/trademark-service.md',\n    operations: CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n    capabilities: CORE_TRADEMARK_MINIMUM_CAPABILITIES,\n    unresolved: [\n      'updateTrademark',\n      'linkTrademarkBrand',\n      'unlinkTrademarkBrand',\n      'linkTrademarkJurisdiction',\n      'linkTrademarkClassification',\n      'unlinkTrademarkClassification',\n      'linkTrademarkDocument',\n      'linkTrademarkEvidence',\n      'updateOfficialReference',\n      'archiveTrademark'\n    ],\n    fixtureOverride: 'trademarkFixture',\n    fixtureValidator: validateCoreTrademarkServiceEvidenceFixture\n  }\n] as const satisfies readonly ExpectedServiceEvidence[];`,
  'Trademark expected evidence'
);
evidenceValidation = evidenceValidation.replace(
  'Service behavior evidence must contain exactly Customer and Brand entries in canonical order.',
  'Service behavior evidence must contain exactly Customer, Brand, and Trademark entries in canonical order.'
);
write('src/service-coverage/core-service-behavior-validation.ts', evidenceValidation);

// 4. Safe errors.
let safeErrors = read('src/behaviors/core-safe-error.ts');
safeErrors = replaceRequired(
  safeErrors,
  `  'BrandObjectMismatch',\n  'AuditContextMissing',`,
  `  'BrandObjectMismatch',\n  'TrademarkAlreadyExists',\n  'TrademarkNotFound',\n  'InvalidTrademarkType',\n  'InvalidTrademarkStatus',\n  'InvalidTrademarkTransition',\n  'InvalidTrademarkReference',\n  'InvalidTrademarkBrandReference',\n  'InvalidTrademarkJurisdictionReference',\n  'TrademarkMarkRepresentationRequired',\n  'TrademarkSourceReferenceRequired',\n  'TrademarkReasonReferenceRequired',\n  'TrademarkObjectMismatch',\n  'AuditContextMissing',`,
  'Trademark safe errors'
);
write('src/behaviors/core-safe-error.ts', safeErrors);

// 5. Canonical Trademark Service contract.
let serviceContracts = read('src/contracts/service/core-service-contract-skeletons.ts');
serviceContracts = replaceRequired(
  serviceContracts,
  `        : {})`,
  `        : serviceType === 'trademark-service'\n          ? {\n              behaviorImplementationTask: 'CORE-TASK-038',\n              behaviorDepth: 'level_2_3',\n              implementedOperations: [\n                'createTrademark',\n                'getTrademark',\n                'listTrademarks',\n                'validateTrademarkReference',\n                'changeTrademarkStatus'\n              ]\n            }\n          : {})`,
  'Trademark contract behavior metadata'
);
serviceContracts = replaceRequired(
  serviceContracts,
  `  ...stubServiceTargets.map(([domainId, domainName]) =>`,
  `  canonicalServiceSkeleton(\n    'trademark-service',\n    'trademark',\n    'Core Trademark Service Contract Skeleton',\n    'trademark-service.md',\n    'Defines the Trademark service ownership boundary for legal and procedural protection records without implementing filing, prosecution, registry synchronization, deadline calculation, fee calculation, similarity scoring, or legal conclusions.',\n    ['Trademark service ownership, validation, lifecycle, relationship-reference, and reference boundary.'],\n    ['trademark, brand, jurisdiction, classification, document, evidence, and matter references'],\n    ['trademark boundary references'],\n    ['Official registry synchronization, filing execution, prosecution workflow, deadline engine, fee engine, registrability scoring, similarity search, or legal opinion automation.']\n  ),\n  ...stubServiceTargets.map(([domainId, domainName]) =>`,
  'Trademark canonical service contract'
);
write('src/contracts/service/core-service-contract-skeletons.ts', serviceContracts);

let serviceContractValidation = read('src/contracts/service/core-service-contract-validation.ts');
serviceContractValidation = replaceRequired(
  serviceContractValidation,
  `  ['event-service', 'event', 'Core Event Service Contract Skeleton', 'event-service.md', 'CORE-TASK-021'],\n  ['opportunity-service'`,
  `  ['event-service', 'event', 'Core Event Service Contract Skeleton', 'event-service.md', 'CORE-TASK-021'],\n  ['trademark-service', 'trademark', 'Core Trademark Service Contract Skeleton', 'trademark-service.md', 'CORE-TASK-038'],\n  ['opportunity-service'`,
  'Trademark canonical validation entry'
);
serviceContractValidation = serviceContractValidation
  .replace(`contracts.length !== 26`, `contracts.length !== 27`)
  .replace(`exactly 26 entries`, `exactly 27 entries`);
serviceContractValidation = replaceRequired(
  serviceContractValidation,
  `              : undefined;`,
  `              : canonicalEntry[0] === 'trademark-service'\n                ? {\n                    task: 'CORE-TASK-038',\n                    operations: [\n                      'createTrademark',\n                      'getTrademark',\n                      'listTrademarks',\n                      'validateTrademarkReference',\n                      'changeTrademarkStatus'\n                    ]\n                  }\n                : undefined;`,
  'Trademark contract behavior lock'
);
write('src/contracts/service/core-service-contract-validation.ts', serviceContractValidation);

let serviceContractTest = read('tests/unit/core-service-contract-skeletons.test.ts')
  .replace('has exactly 26 entries', 'has exactly 27 entries')
  .replace('CORE_SERVICE_CONTRACT_SKELETONS.length, 26', 'CORE_SERVICE_CONTRACT_SKELETONS.length, 27')
  .replace('const additions = CORE_SERVICE_CONTRACT_SKELETONS.slice(19);', 'const additions = CORE_SERVICE_CONTRACT_SKELETONS.slice(20);');
serviceContractTest = replaceRequired(
  serviceContractTest,
  `  it('adds exactly the 7 safe CORE-TASK-023 Service stubs', () => {`,
  `  it('adds the CORE-TASK-038 Trademark Service contract at index 19', () => {\n    const trademark = CORE_SERVICE_CONTRACT_SKELETONS[19];\n    assert.equal(trademark?.id, 'core-service-trademark-service-contract');\n    assert.equal(trademark?.metadata?.behaviorImplementationTask, 'CORE-TASK-038');\n    assert.deepEqual(trademark?.metadata?.implementedOperations, [\n      'createTrademark',\n      'getTrademark',\n      'listTrademarks',\n      'validateTrademarkReference',\n      'changeTrademarkStatus'\n    ]);\n  });\n  it('adds exactly the 7 safe CORE-TASK-023 Service stubs', () => {`,
  'Trademark contract test'
);
write('tests/unit/core-service-contract-skeletons.test.ts', serviceContractTest);

// 6. Fixture manifest and runner.
let manifest = read('src/validation/core-fixture-manifest.ts');
manifest = replaceRequired(
  manifest,
  `  'core_brand_service_core_lifecycle'\n] as const;`,
  `  'core_brand_service_core_lifecycle',\n  'core_trademark_service_core_lifecycle'\n] as const;`,
  'Trademark fixture type'
);
manifest = replaceRequired(
  manifest,
  `  {\n    id: 'book-02-mvp-gap-baseline',`,
  `  {\n    id: 'core-trademark-service-core-lifecycle',\n    type: 'core_trademark_service_core_lifecycle',\n    path: 'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',\n    required: true\n  },\n  {\n    id: 'book-02-mvp-gap-baseline',`,
  'Trademark fixture manifest entry'
);
write('src/validation/core-fixture-manifest.ts', manifest);

let fixtureRunner = read('scripts/validate-core-fixtures.mjs');
fixtureRunner = replaceRequired(
  fixtureRunner,
  `import { validateCoreBrandServiceCoreLifecycleFixture } from '../src/validation/core-brand-service-fixture-validation.ts';`,
  `import { validateCoreBrandServiceCoreLifecycleFixture } from '../src/validation/core-brand-service-fixture-validation.ts';\nimport { validateCoreTrademarkServiceCoreLifecycleFixture } from '../src/validation/core-trademark-service-fixture-validation.ts';`,
  'Trademark fixture runner import'
);
fixtureRunner = replaceRequired(
  fixtureRunner,
  `  core_brand_service_core_lifecycle: validateCoreBrandServiceCoreLifecycleFixture,`,
  `  core_brand_service_core_lifecycle: validateCoreBrandServiceCoreLifecycleFixture,\n  core_trademark_service_core_lifecycle:\n    validateCoreTrademarkServiceCoreLifecycleFixture,`,
  'Trademark fixture runner registration'
);
write('scripts/validate-core-fixtures.mjs', fixtureRunner);

let manifestTest = read('tests/unit/core-fixture-manifest.test.ts')
  .replace('has exactly 29 entries', 'has exactly 30 entries')
  .replace('CORE_FIXTURE_MANIFEST.length, 29', 'CORE_FIXTURE_MANIFEST.length, 30');
manifestTest = replaceRequired(
  manifestTest,
  `    assert.equal(CORE_FIXTURE_TYPES.includes('core_brand_service_core_lifecycle'), true);`,
  `    assert.equal(CORE_FIXTURE_TYPES.includes('core_brand_service_core_lifecycle'), true);\n    assert.equal(CORE_FIXTURE_TYPES.includes('core_trademark_service_core_lifecycle'), true);`,
  'Trademark manifest type assertion'
);
manifestTest = replaceRequired(
  manifestTest,
  `'core_brand_service_core_lifecycle']);`,
  `'core_brand_service_core_lifecycle', 'core_trademark_service_core_lifecycle']);`,
  'Trademark exact manifest types'
);
write('tests/unit/core-fixture-manifest.test.ts', manifestTest);

let requirements = read('src/mvp-coverage/book-02-mvp-requirements.ts').replace(
  'fixtureCount: 29',
  'fixtureCount: 30'
);
write('src/mvp-coverage/book-02-mvp-requirements.ts', requirements);
let gapFixtureTest = read('tests/fixtures/book-02-mvp-gap-baseline-fixture.test.ts')
  .replace('locks required fixture count at 29', 'locks required fixture count at 30')
  .replace('BOOK_02_EXPECTED_COUNTS.fixtureCount, 29', 'BOOK_02_EXPECTED_COUNTS.fixtureCount, 30');
write('tests/fixtures/book-02-mvp-gap-baseline-fixture.test.ts', gapFixtureTest);

// 7. Make Service evidence select its exact contract, then derive the new Book 02 state.
let mvpBaseline = read('src/mvp-coverage/book-02-mvp-gap-baseline.ts');
mvpBaseline = replaceRequired(
  mvpBaseline,
  `    const found = CORE_SERVICE_CONTRACT_SKELETONS.find(\n      (entry) => entry.domainId === serviceId\n    );\n    if (!found) return emptyEvidence();\n    const evidence = CORE_SERVICE_BEHAVIOR_EVIDENCE.find(\n      (entry) => entry.requirementId === identity.id\n    );`,
  `    const evidence = CORE_SERVICE_BEHAVIOR_EVIDENCE.find(\n      (entry) => entry.requirementId === identity.id\n    );\n    const found = evidence\n      ? CORE_SERVICE_CONTRACT_SKELETONS.find(\n          (entry) => entry.id === evidence.contractId\n        )\n      : CORE_SERVICE_CONTRACT_SKELETONS.find(\n          (entry) => entry.domainId === serviceId\n        );\n    if (!found) return emptyEvidence();`,
  'Exact Service contract evidence selection'
);
write('src/mvp-coverage/book-02-mvp-gap-baseline.ts', mvpBaseline);

// 8. Update the aggregate evidence tests.
let evidenceTest = read('tests/unit/core-service-behavior-evidence.test.ts');
evidenceTest = replaceRequired(
  evidenceTest,
  `  CORE_SERVICE_BEHAVIOR_EVIDENCE,`,
  `  CORE_SERVICE_BEHAVIOR_EVIDENCE,\n  CORE_TRADEMARK_IMPLEMENTED_OPERATIONS,\n  CORE_TRADEMARK_MINIMUM_CAPABILITIES,`,
  'Trademark aggregate test imports'
);
evidenceTest = evidenceTest
  .replace('validates exact Customer and Brand Service evidence in canonical order', 'validates exact Customer, Brand, and Trademark Service evidence in canonical order')
  .replace('CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 2', 'CORE_SERVICE_BEHAVIOR_EVIDENCE.length, 3')
  .replace(`['must-service-customer-service', 'must-service-brand-service']`, `['must-service-customer-service', 'must-service-brand-service', 'must-service-trademark-service']`)
  .replace('const [customer, brand] = CORE_SERVICE_BEHAVIOR_EVIDENCE;', 'const [customer, brand, trademark] = CORE_SERVICE_BEHAVIOR_EVIDENCE;')
  .replace('evidence: [customer]', 'evidence: [customer, brand]')
  .replace('evidence: [customer, customer]', 'evidence: [customer, customer, trademark]')
  .replace(`evidence: [{ ...customer, contractId: 'fake-contract' }, brand]`, `evidence: [{ ...customer, contractId: 'fake-contract' }, brand, trademark]`)
  .replace(`evidence: [customer, { ...brand, domainId: 'customer' }]`, `evidence: [customer, { ...brand, domainId: 'customer' }, trademark]`)
  .replace(`evidence: [customer, { ...brand, serviceType: 'customer-service' }]`, `evidence: [customer, { ...brand, serviceType: 'customer-service' }, trademark]`);
evidenceTest = replaceRequired(
  evidenceTest,
  `    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[1]?.provenMinimumCapabilities,\n      CORE_BRAND_MINIMUM_CAPABILITIES\n    );`,
  `    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[1]?.provenMinimumCapabilities,\n      CORE_BRAND_MINIMUM_CAPABILITIES\n    );\n    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[2]?.operations,\n      CORE_TRADEMARK_IMPLEMENTED_OPERATIONS\n    );\n    assert.deepEqual(\n      CORE_SERVICE_BEHAVIOR_EVIDENCE[2]?.provenMinimumCapabilities,\n      CORE_TRADEMARK_MINIMUM_CAPABILITIES\n    );`,
  'Trademark aggregate evidence assertions'
);
evidenceTest = evidenceTest
  .replace(`evidence: [\n          customer,\n          { ...brand, operations: brand.operations.slice(1) }\n        ]`, `evidence: [\n          customer,\n          { ...brand, operations: brand.operations.slice(1) },\n          trademark\n        ]`)
  .replace(`evidence: [\n          customer,\n          {\n            ...brand,\n            provenMinimumCapabilities: brand.provenMinimumCapabilities.slice(1)\n          }\n        ]`, `evidence: [\n          customer,\n          {\n            ...brand,\n            provenMinimumCapabilities: brand.provenMinimumCapabilities.slice(1)\n          },\n          trademark\n        ]`);
evidenceTest = replaceRequired(
  evidenceTest,
  `    assert.equal(\n      validateCoreServiceBehaviorEvidence({ brandFixture }).some(\n        (issue) => issue.code === 'core.service.fixture_invalid'\n      ),\n      true\n    );`,
  `    assert.equal(\n      validateCoreServiceBehaviorEvidence({ brandFixture }).some(\n        (issue) => issue.code === 'core.service.fixture_invalid'\n      ),\n      true\n    );\n\n    const trademarkFixture = JSON.parse(\n      await readFile(\n        'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',\n        'utf8'\n      )\n    ) as { expected: Record<string, unknown> };\n    trademarkFixture.expected.eventTraceCountAfterStatusReplay = 999;\n    assert.equal(\n      validateCoreServiceBehaviorEvidence({ trademarkFixture }).some(\n        (issue) => issue.code === 'core.service.fixture_invalid'\n      ),\n      true\n    );`,
  'Trademark corrupted fixture assertion'
);
write('tests/unit/core-service-behavior-evidence.test.ts', evidenceTest);

write(
  'tests/unit/core-task-038-book-02-service-evidence.test.ts',
  `import assert from 'node:assert/strict';\nimport { describe, it } from 'node:test';\nimport { BOOK_02_MVP_GAP_BASELINE } from '../../src/index.ts';\n\ndescribe('CORE-TASK-038 Book 02 Service evidence', () => {\n  it('promotes exactly Customer, Brand, and Trademark Services', () => {\n    const services = BOOK_02_MVP_GAP_BASELINE.requirements.filter(\n      (requirement) => requirement.layer === 'service'\n    );\n    const implemented = services.filter(\n      (requirement) => requirement.currentDisposition === 'meets_required_depth'\n    );\n    assert.deepEqual(\n      implemented.map((requirement) => requirement.id),\n      [\n        'must-service-customer-service',\n        'must-service-brand-service',\n        'must-service-trademark-service'\n      ]\n    );\n    assert.ok(implemented.every((requirement) => requirement.currentDepth === 'level_2_3'));\n    assert.equal(\n      services.filter(\n        (requirement) =>\n          requirement.currentDisposition === 'validated_skeleton_only'\n      ).length,\n      15\n    );\n  });\n\n  it('derives 35 / 3 / 54 and leaves global Service acceptance unresolved', () => {\n    assert.deepEqual(BOOK_02_MVP_GAP_BASELINE.summary.mustBuildNow, {\n      total: 115,\n      meets_required_depth: 35,\n      partial_evidence: 3,\n      validated_skeleton_only: 54,\n      boundary_scaffold_only: 5,\n      semantic_overlap_only: 18,\n      fixture_only: 0,\n      missing: 0\n    });\n    const criterion = BOOK_02_MVP_GAP_BASELINE.acceptanceCriteria.find(\n      (entry) => entry.id === 'must-build-services-own-behavior'\n    );\n    assert.equal(criterion?.satisfied, false);\n    assert.equal(\n      BOOK_02_MVP_GAP_BASELINE.summary.acceptance.acceptanceCriteriaSatisfied,\n      11\n    );\n    assert.equal(BOOK_02_MVP_GAP_BASELINE.summary.acceptance.book02MvpComplete, false);\n  });\n});`
);
write(
  'tests/unit/core-task-038-service-contract-metadata.test.ts',
  `import assert from 'node:assert/strict';\nimport { describe, it } from 'node:test';\nimport { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/index.ts';\n\ndescribe('CORE-TASK-038 Trademark Service contract metadata', () => {\n  it('locks the canonical behavior metadata without changing the reference-only contract', () => {\n    const trademark = CORE_SERVICE_CONTRACT_SKELETONS.find(\n      (entry) => entry.id === 'core-service-trademark-service-contract'\n    );\n    assert.equal(trademark?.serviceType, 'trademark-service');\n    assert.equal(trademark?.domainId, 'trademark');\n    assert.equal(trademark?.metadata?.behaviorImplementationTask, 'CORE-TASK-038');\n    assert.equal(trademark?.metadata?.behaviorDepth, 'level_2_3');\n    assert.deepEqual(trademark?.metadata?.implementedOperations, [\n      'createTrademark',\n      'getTrademark',\n      'listTrademarks',\n      'validateTrademarkReference',\n      'changeTrademarkStatus'\n    ]);\n    const referenceOnly = CORE_SERVICE_CONTRACT_SKELETONS.find(\n      (entry) => entry.id === 'core-service-trademark-reference-service-contract'\n    );\n    assert.equal(referenceOnly?.metadata?.behaviorImplementationTask, undefined);\n  });\n});`
);

// 9. Documentation and format governance.
const note = `\nCORE-TASK-038 note: Trademark Service core lifecycle behavior is implemented at the governed MVP boundary with create, read, list, reference validation, and status transition operations. Customer, Brand, and Trademark are the only three Must Build Services with executable owned behavior; the remaining 15 Services remain incomplete. Trademark update, relationship mutation, official-reference updates, API validators, workflows, Book 02 MVP completion, and production readiness remain unaccepted. The derived Must Build distribution is 35 meets_required_depth, 3 partial_evidence, 54 validated_skeleton_only, 5 boundary_scaffold_only, and 18 semantic_overlap_only; acceptance remains 11/19. Next governed task: CORE-TASK-039 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.\n`;
for (const path of ['README.md', 'CORE-MANIFEST.md', 'CORE-ROADMAP.md', 'CHANGELOG.md']) {
  const current = read(path);
  if (!current.includes('CORE-TASK-038 note:')) write(path, `${current.trimEnd()}\n${note}`);
}
write(
  'docs/architecture/core-trademark-service-lifecycle-boundary.md',
  `# Core Trademark Service lifecycle boundary\n\nTrademark Service is the third Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.\n\n## Selection rationale\n\nBook 02 places Trademark after Brand and before Jurisdiction, Classification, and Matter execution. Trademark is the legal and procedural protection object, while Brand remains the commercial identity object and Matter remains the professional execution container.\n\n## Exact operation scope\n\nImplemented operations:\n\n- createTrademark\n- getTrademark\n- listTrademarks\n- validateTrademarkReference\n- changeTrademarkStatus\n\nThe Service composes the accepted Core MVP Object foundation. Creation requires a pre-provisioned Trademark public reference, a valid active Jurisdiction reference, and an optional valid active Brand reference. It does not create or mutate Brand or Jurisdiction records.\n\n## Controlled values\n\nTrademark types and the 17 stored statuses follow the locked Trademark Object specification. Generic Object status is derived from the Trademark lifecycle without replacing the Trademark-specific status.\n\n## Governance and safety\n\nEvery operation validates Permission, Policy, Human Review, Audit, correlation, target, organization visibility, reference type, and reference Domain. Duplicate-sensitive mutations use success-only idempotency. Replays do not duplicate state or Event traces. Event handoff failure rolls back the mutation.\n\n## Executable evidence\n\nThe deterministic Trademark fixture is required fixture 30 and executes create, replay, conflict, duplicate rejection, Brand/Jurisdiction validation, read, list, reference validation, status transition, status replay, invalid transition, record counts, and Event counts.\n\n## Explicit non-goals\n\n- updateTrademark\n- relationship-link mutation\n- official registry synchronization\n- filing or prosecution execution\n- deadline or fee engines\n- registrability scoring or legal conclusions\n- Trademark API validators\n- Workflow preview/apply\n- persistence or Event bus runtime\n- Book 02 MVP completion\n- production readiness\n\nNext governed task: CORE-TASK-039 — select the next dependency-first Service-owned behavior batch from the updated Book 02 MVP gap baseline.\n`
);

const formatPaths = [
  'docs/architecture/core-trademark-service-lifecycle-boundary.md',
  'fixtures/services/core-trademark-service-core-lifecycle.fixture.json',
  'src/services/trademark/core-trademark-service.ts',
  'src/services/trademark/index.ts',
  'src/service-coverage/core-trademark-service-evidence-fixture.ts',
  'src/validation/core-trademark-service-fixture-validation.ts',
  'tests/fixtures/core-trademark-service-core-lifecycle-fixture.test.ts',
  'tests/unit/core-trademark-service-core-lifecycle.test.ts',
  'tests/unit/core-task-038-book-02-service-evidence.test.ts',
  'tests/unit/core-task-038-service-contract-metadata.test.ts'
].join(' ');
let packageJson = read('package.json');
packageJson = packageJson.replaceAll(
  'tests/unit/core-task-037-service-contract-metadata.test.ts"',
  `tests/unit/core-task-037-service-contract-metadata.test.ts ${formatPaths}"`
);
write('package.json', packageJson);

// 10. Regenerate deterministic contract and MVP fixtures after all source changes.
const cacheBust = `task038-${Date.now()}`;
const { CORE_SERVICE_CONTRACT_SKELETONS } = await import(
  `../src/contracts/service/core-service-contract-skeletons.ts?${cacheBust}`
);
write(
  'fixtures/contracts/core-service-contract-skeletons.fixture.json',
  JSON.stringify(CORE_SERVICE_CONTRACT_SKELETONS, null, 2)
);
const { BOOK_02_MVP_GAP_BASELINE } = await import(
  `../src/mvp-coverage/book-02-mvp-gap-baseline.ts?${cacheBust}`
);
write(
  'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
  JSON.stringify(BOOK_02_MVP_GAP_BASELINE, null, 2)
);
