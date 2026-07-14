import { readFileSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const write = (path, content) => writeFileSync(path, content);
const edit = (path, transform) => write(path, transform(read(path)));
const replaceOnce = (content, before, after, label) => {
  if (content.includes(after)) return content;
  if (!content.includes(before)) throw new Error(`Missing replacement target: ${label}`);
  return content.replace(before, after);
};
const appendExport = (path, line) =>
  edit(path, (content) =>
    content.includes(line) ? content : `${content.trimEnd()}\n${line}\n`
  );

edit('src/behaviors/core-safe-error.ts', (content) =>
  replaceOnce(
    content,
    "  'ClassificationObjectMismatch',\n  'AuditContextMissing',",
    "  'ClassificationObjectMismatch',\n  'DocumentAlreadyExists',\n  'DocumentNotFound',\n  'InvalidDocumentType',\n  'InvalidDocumentStatus',\n  'InvalidDocumentReviewStatus',\n  'InvalidDocumentConfidentialityLevel',\n  'InvalidDocumentTransition',\n  'InvalidDocumentReference',\n  'DocumentTitleRequired',\n  'DocumentSourceReferenceRequired',\n  'DocumentFileReferenceRequired',\n  'DocumentFileAlreadyLinked',\n  'DocumentReviewNoteRequired',\n  'DocumentReasonReferenceRequired',\n  'DocumentObjectMismatch',\n  'AuditContextMissing',",
    'Document safe error codes'
  )
);

appendExport('src/services/index.ts', "export * from './document/index.ts';");
appendExport(
  'src/service-coverage/index.ts',
  "export * from './core-document-service-evidence-fixture.ts';"
);
appendExport(
  'src/validation/index.ts',
  "export * from './core-document-service-fixture-validation.ts';"
);

edit('src/contracts/service/core-service-contract-skeletons.ts', (content) => {
  content = replaceOnce(
    content,
    "    | 'CORE-TASK-040' = 'CORE-TASK-021'",
    "    | 'CORE-TASK-040'\n    | 'CORE-TASK-041' = 'CORE-TASK-021'",
    'Document implementation task union'
  );
  content = replaceOnce(
    content,
    "            : serviceType === 'classification-service'\n              ? {\n                  behaviorImplementationTask: 'CORE-TASK-040',\n                  behaviorDepth: 'level_2_3',\n                  implementedOperations: [\n                    'createClassification',\n                    'getClassification',\n                    'listClassifications',\n                    'validateClassification',\n                    'validateClassificationReference',\n                    'changeClassificationStatus'\n                  ]\n                }\n              : {})",
    "            : serviceType === 'classification-service'\n              ? {\n                  behaviorImplementationTask: 'CORE-TASK-040',\n                  behaviorDepth: 'level_2_3',\n                  implementedOperations: [\n                    'createClassification',\n                    'getClassification',\n                    'listClassifications',\n                    'validateClassification',\n                    'validateClassificationReference',\n                    'changeClassificationStatus'\n                  ]\n                }\n              : serviceType === 'document-service'\n                ? {\n                    behaviorImplementationTask: 'CORE-TASK-041',\n                    behaviorDepth: 'level_2_3',\n                    implementedOperations: [\n                      'createDocument',\n                      'getDocument',\n                      'listDocuments',\n                      'validateDocumentReference',\n                      'linkDocumentFile',\n                      'requireDocumentReview',\n                      'reviewDocument',\n                      'changeDocumentStatus'\n                    ]\n                  }\n                : {})",
    'Document behavior metadata'
  );
  content = replaceOnce(
    content,
    "  serviceSkeleton(\n    'document-reference-service',\n    'document',\n    'Document Reference Service Contract Skeleton',\n    'Skeleton contract boundary for document reference service responsibilities.',\n    'Establishes a service contract placeholder for document references without document storage or rendering behavior.',\n    ['Document reference service contract boundary.'],\n    ['document domain references'],\n    ['document reference outputs']\n  ),",
    "  canonicalServiceSkeleton(\n    'document-service',\n    'document',\n    'Core Document Service Contract Skeleton',\n    'document-service.md',\n    'Defines the Document service ownership boundary for governed artifact records without implementing storage, rendering, OCR, e-signature, evidence conversion, or external delivery.',\n    [\n      'Document service ownership, artifact lifecycle, file-reference linkage, professional review gating, confidentiality, validation, and reference boundary.'\n    ],\n    [\n      'document, organization, trademark, matter, evidence, communication, user, permission, and policy references'\n    ],\n    ['document boundary references, governed validation results, and Event trace handoff'],\n    [\n      'File storage, OCR, rendering, e-signature, template generation, automatic Evidence conversion, external delivery, or filing execution.'\n    ],\n    'CORE-TASK-041'\n  ),",
    'Document contract promotion'
  );
  return content;
});

edit('src/contracts/service/core-service-contract-validation.ts', (content) => {
  content = replaceOnce(
    content,
    "  'classification-service': {\n    task: 'CORE-TASK-040',\n    operations: [\n      'createClassification',\n      'getClassification',\n      'listClassifications',\n      'validateClassification',\n      'validateClassificationReference',\n      'changeClassificationStatus'\n    ]\n  }\n} as const;",
    "  'classification-service': {\n    task: 'CORE-TASK-040',\n    operations: [\n      'createClassification',\n      'getClassification',\n      'listClassifications',\n      'validateClassification',\n      'validateClassificationReference',\n      'changeClassificationStatus'\n    ]\n  },\n  'document-service': {\n    task: 'CORE-TASK-041',\n    operations: [\n      'createDocument',\n      'getDocument',\n      'listDocuments',\n      'validateDocumentReference',\n      'linkDocumentFile',\n      'requireDocumentReview',\n      'reviewDocument',\n      'changeDocumentStatus'\n    ]\n  }\n} as const;",
    'Document behavior lock'
  );
  content = replaceOnce(
    content,
    "  6: {\n    id: 'core-service-classification-service-contract',\n    serviceType: 'classification-service',\n    domainId: 'classification',\n    name: 'Core Classification Service Contract Skeleton',\n    sourceFile: 'classification-service.md',\n    task: 'CORE-TASK-040'\n  }\n} as const;",
    "  6: {\n    id: 'core-service-classification-service-contract',\n    serviceType: 'classification-service',\n    domainId: 'classification',\n    name: 'Core Classification Service Contract Skeleton',\n    sourceFile: 'classification-service.md',\n    task: 'CORE-TASK-040'\n  },\n  7: {\n    id: 'core-service-document-service-contract',\n    serviceType: 'document-service',\n    domainId: 'document',\n    name: 'Core Document Service Contract Skeleton',\n    sourceFile: 'document-service.md',\n    task: 'CORE-TASK-041'\n  }\n} as const;",
    'Document promoted contract validation'
  );
  return content;
});

edit('src/service-coverage/core-service-behavior-evidence.ts', (content) => {
  content = replaceOnce(
    content,
    "} from '../services/classification/index.ts';\n",
    "} from '../services/classification/index.ts';\nimport {\n  CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,\n  CORE_DOCUMENT_MINIMUM_CAPABILITIES\n} from '../services/document/index.ts';\n",
    'Document evidence imports'
  );
  return replaceOnce(
    content,
    "  }\n] as const satisfies readonly CoreServiceBehaviorEvidence[];",
    "  },\n  {\n    requirementId: 'must-service-document-service',\n    serviceType: 'document-service',\n    domainId: 'document',\n    contractId: 'core-service-document-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/document-service.md',\n    currentDepth: 'level_2_3',\n    operations: CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,\n    provenMinimumCapabilities: CORE_DOCUMENT_MINIMUM_CAPABILITIES,\n    unresolvedServiceOperations: [\n      'updateDocument',\n      'addDocumentVersion',\n      'linkDocumentVersion',\n      'linkDocumentTrademark',\n      'linkDocumentMatter',\n      'linkDocumentEvidence',\n      'linkDocumentCommunication',\n      'archiveDocument'\n    ],\n    implementationFiles: ['src/services/document/core-document-service.ts'],\n    testFiles: [\n      'tests/unit/core-document-service-governed-artifact-foundation.test.ts'\n    ],\n    fixtureFiles: [\n      'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json'\n    ]\n  }\n] as const satisfies readonly CoreServiceBehaviorEvidence[];",
    'Document Service evidence entry'
  );
});

edit('src/service-coverage/core-service-behavior-validation.ts', (content) => {
  content = replaceOnce(
    content,
    "} from '../services/classification/index.ts';\n",
    "} from '../services/classification/index.ts';\nimport {\n  CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,\n  CORE_DOCUMENT_MINIMUM_CAPABILITIES\n} from '../services/document/index.ts';\n",
    'Document validation imports'
  );
  content = replaceOnce(
    content,
    "import { validateCoreClassificationServiceEvidenceFixture } from './core-classification-service-evidence-fixture.ts';\n",
    "import { validateCoreClassificationServiceEvidenceFixture } from './core-classification-service-evidence-fixture.ts';\nimport { validateCoreDocumentServiceEvidenceFixture } from './core-document-service-evidence-fixture.ts';\n",
    'Document fixture validator import'
  );
  content = replaceOnce(
    content,
    "  readonly classificationFixture?: unknown;\n}",
    "  readonly classificationFixture?: unknown;\n  readonly documentFixture?: unknown;\n}",
    'Document fixture override option'
  );
  content = replaceOnce(
    content,
    "    'customer' | 'brand' | 'trademark' | 'jurisdiction' | 'classification';",
    "    | 'customer'\n    | 'brand'\n    | 'trademark'\n    | 'jurisdiction'\n    | 'classification'\n    | 'document';",
    'Document validation domain union'
  );
  content = replaceOnce(
    content,
    "    | 'classificationFixture';",
    "    | 'classificationFixture'\n    | 'documentFixture';",
    'Document fixture override union'
  );
  content = replaceOnce(
    content,
    "  }\n] as const satisfies readonly ExpectedServiceEvidence[];",
    "  },\n  {\n    requirementId: 'must-service-document-service',\n    serviceType: 'document-service',\n    domainId: 'document',\n    contractId: 'core-service-document-service-contract',\n    sourcePath:\n      'books/book-02-core-specification/core-specs/services/document-service.md',\n    operations: CORE_DOCUMENT_IMPLEMENTED_OPERATIONS,\n    capabilities: CORE_DOCUMENT_MINIMUM_CAPABILITIES,\n    unresolved: [\n      'updateDocument',\n      'addDocumentVersion',\n      'linkDocumentVersion',\n      'linkDocumentTrademark',\n      'linkDocumentMatter',\n      'linkDocumentEvidence',\n      'linkDocumentCommunication',\n      'archiveDocument'\n    ],\n    fixtureOverride: 'documentFixture',\n    fixtureValidator: validateCoreDocumentServiceEvidenceFixture\n  }\n] as const satisfies readonly ExpectedServiceEvidence[];",
    'Document expected evidence entry'
  );
  content = content.replace(
    'Service behavior evidence must contain exactly Customer, Brand, Trademark, Jurisdiction, and Classification entries in canonical order.',
    'Service behavior evidence must contain exactly Customer, Brand, Trademark, Jurisdiction, Classification, and Document entries in canonical order.'
  );
  return content;
});

edit('src/validation/core-fixture-manifest.ts', (content) => {
  content = replaceOnce(
    content,
    "  'core_classification_service_core_scope_validation'\n] as const;",
    "  'core_classification_service_core_scope_validation',\n  'core_document_service_governed_artifact_foundation'\n] as const;",
    'Document fixture type'
  );
  return replaceOnce(
    content,
    "  {\n    id: 'book-02-mvp-gap-baseline',",
    "  {\n    id: 'core-document-service-governed-artifact-foundation',\n    type: 'core_document_service_governed_artifact_foundation',\n    path: 'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json',\n    required: true\n  },\n  {\n    id: 'book-02-mvp-gap-baseline',",
    'Document fixture manifest entry'
  );
});

edit('scripts/validate-core-fixtures.mjs', (content) => {
  content = replaceOnce(
    content,
    "import { validateCoreClassificationServiceCoreScopeValidationFixture } from '../src/validation/core-classification-service-fixture-validation.ts';\n",
    "import { validateCoreClassificationServiceCoreScopeValidationFixture } from '../src/validation/core-classification-service-fixture-validation.ts';\nimport { validateCoreDocumentServiceGovernedArtifactFoundationFixture } from '../src/validation/core-document-service-fixture-validation.ts';\n",
    'Document fixture script import'
  );
  return replaceOnce(
    content,
    "  core_classification_service_core_scope_validation:\n    validateCoreClassificationServiceCoreScopeValidationFixture\n};",
    "  core_classification_service_core_scope_validation:\n    validateCoreClassificationServiceCoreScopeValidationFixture,\n  core_document_service_governed_artifact_foundation:\n    validateCoreDocumentServiceGovernedArtifactFoundationFixture\n};",
    'Document fixture script validator'
  );
});

edit('src/mvp-coverage/book-02-mvp-requirements.ts', (content) =>
  replaceOnce(content, '  fixtureCount: 32', '  fixtureCount: 33', 'Book 02 fixture count')
);

edit('tests/unit/core-fixture-manifest.test.ts', (content) => {
  content = content.replace("it('has exactly 32 entries'", "it('has exactly 33 entries'");
  content = content.replace('CORE_FIXTURE_MANIFEST.length, 32', 'CORE_FIXTURE_MANIFEST.length, 33');
  content = replaceOnce(
    content,
    "    assert.equal(\n      CORE_FIXTURE_TYPES.includes(\n        'core_classification_service_core_scope_validation'\n      ),\n      true\n    );\n",
    "    assert.equal(\n      CORE_FIXTURE_TYPES.includes(\n        'core_classification_service_core_scope_validation'\n      ),\n      true\n    );\n    assert.equal(\n      CORE_FIXTURE_TYPES.includes(\n        'core_document_service_governed_artifact_foundation'\n      ),\n      true\n    );\n",
    'Document fixture type assertion'
  );
  return replaceOnce(
    content,
    "      'core_classification_service_core_scope_validation'\n    ]);",
    "      'core_classification_service_core_scope_validation',\n      'core_document_service_governed_artifact_foundation'\n    ]);",
    'Document exact fixture type registry'
  );
});

const packagePath = 'package.json';
const packageJson = JSON.parse(read(packagePath));
const governedPaths = [
  'docs/architecture/core-document-service-governed-artifact-foundation.md',
  'fixtures/services/core-document-service-governed-artifact-foundation.fixture.json',
  'src/services/document/core-document-service.ts',
  'src/services/document/index.ts',
  'src/service-coverage/core-document-service-evidence-fixture.ts',
  'src/validation/core-document-service-fixture-validation.ts',
  'tests/fixtures/core-document-service-governed-artifact-foundation-fixture.test.ts',
  'tests/unit/core-document-service-governed-artifact-foundation.test.ts',
  'tests/unit/core-task-041-book-02-service-evidence.test.ts',
  'tests/unit/core-task-041-service-contract-metadata.test.ts'
];
for (const key of ['format', 'format:check']) {
  let command = packageJson.scripts[key];
  for (const path of governedPaths) {
    if (!command.includes(path)) command += ` ${path}`;
  }
  packageJson.scripts[key] = command;
}
write(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
