import { readFileSync, writeFileSync } from 'node:fs';

function update(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (before !== after) writeFileSync(path, after);
}

function replaceRequired(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) throw new Error(`Missing target: ${label}`);
  return text.replace(search, replacement);
}

update('src/services/brand/core-brand-service.ts', (text) => {
  text = text.replace(
    "import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../contracts/service/core-service-contract-skeletons.ts';\n",
    ''
  );
  text = replaceRequired(
    text,
    'export interface CoreBrandServiceDependencies {\n',
    `export interface CoreBrandRequestingServiceDirectoryEntry {\n  readonly domainId: CoreDomainId;\n  readonly serviceType: string;\n}\n\nexport interface CoreBrandServiceDependencies {\n`,
    'requesting Service directory type'
  );
  text = replaceRequired(
    text,
    '  readonly relatedReferenceRegistry: CoreReferenceRegistry;\n  readonly now: () => string;\n',
    '  readonly relatedReferenceRegistry: CoreReferenceRegistry;\n  readonly requestingServiceDirectory: readonly CoreBrandRequestingServiceDirectoryEntry[];\n  readonly now: () => string;\n',
    'requesting Service directory dependency'
  );
  text = replaceRequired(
    text,
    `function validateRequestingService(\n  requestingDomain: string,\n  requestingService: string\n): CoreBehaviorResult<null> {\n  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {\n    return safe('InvalidBrandReference', 'Requesting Domain is invalid.');\n  }\n  const service = CORE_SERVICE_CONTRACT_SKELETONS.find(\n    (contract) => contract.serviceType === requestingService\n  );\n  if (!service || service.domainId !== requestingDomain) {\n    return safe('InvalidBrandReference', 'Requesting Service is invalid.');\n  }\n  return { ok: true, value: null };\n}`,
    `function validateRequestingService(\n  requestingDomain: string,\n  requestingService: string,\n  directory: readonly CoreBrandRequestingServiceDirectoryEntry[]\n): CoreBehaviorResult<null> {\n  if (!CORE_DOMAIN_REGISTRY.some((domain) => domain.id === requestingDomain)) {\n    return safe('InvalidBrandReference', 'Requesting Domain is invalid.');\n  }\n  const service = directory.find(\n    (entry) =>\n      entry.serviceType === requestingService &&\n      entry.domainId === requestingDomain\n  );\n  if (!service) {\n    return safe('InvalidBrandReference', 'Requesting Service is invalid.');\n  }\n  return { ok: true, value: null };\n}`,
    'requesting Service validation'
  );
  return replaceRequired(
    text,
    `    const requester = validateRequestingService(\n      String(input.requestingDomain),\n      input.requestingService\n    );`,
    `    const requester = validateRequestingService(\n      String(input.requestingDomain),\n      input.requestingService,\n      this.deps.requestingServiceDirectory\n    );`,
    'requesting Service validation call'
  );
});

update('src/service-coverage/core-brand-service-evidence-fixture.ts', (text) => {
  text = replaceRequired(
    text,
    "import { createCoreEventId, type CoreEventId } from '../events/index.ts';",
    "import { CORE_SERVICE_CONTRACT_SKELETONS } from '../contracts/service/core-service-contract-skeletons.ts';\nimport { createCoreEventId, type CoreEventId } from '../events/index.ts';",
    'fixture contract import'
  );
  return replaceRequired(
    text,
    '    relatedReferenceRegistry: new CoreReferenceRegistry(',
    `    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(\n      ({ domainId, serviceType }) => ({ domainId, serviceType })\n    ),\n    relatedReferenceRegistry: new CoreReferenceRegistry(`,
    'fixture directory injection'
  );
});

update('tests/unit/core-brand-service-core-lifecycle.test.ts', (text) => {
  text = replaceRequired(
    text,
    "import { createCoreEventId, type CoreEventId } from '../../src/events/index.ts';",
    "import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/contracts/service/core-service-contract-skeletons.ts';\nimport { createCoreEventId, type CoreEventId } from '../../src/events/index.ts';",
    'test contract import'
  );
  return replaceRequired(
    text,
    '    relatedReferenceRegistry: new CoreReferenceRegistry(references),',
    `    requestingServiceDirectory: CORE_SERVICE_CONTRACT_SKELETONS.map(\n      ({ domainId, serviceType }) => ({ domainId, serviceType })\n    ),\n    relatedReferenceRegistry: new CoreReferenceRegistry(references),`,
    'test directory injection'
  );
});
