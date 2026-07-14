import { readFileSync, writeFileSync } from 'node:fs';

const path = 'tests/unit/core-task-037-service-contract-metadata.test.ts';
let content = readFileSync(path, 'utf8');
content = content.replace(
  "  it('keeps behavior metadata absent from the remaining Service skeletons', () => {",
  "  it('keeps behavior metadata absent from Services without executable evidence', () => {"
);
content = content.replace(
  `    const remaining = CORE_SERVICE_CONTRACT_SKELETONS.filter(\n      (contract) =>\n        contract.serviceType !== 'customer-service' &&\n        contract.serviceType !== 'brand-service'\n    );`,
  `    const evidenceBackedServiceTypes = new Set([\n      'customer-service',\n      'brand-service',\n      'trademark-service'\n    ]);\n    const remaining = CORE_SERVICE_CONTRACT_SKELETONS.filter(\n      (contract) => !evidenceBackedServiceTypes.has(contract.serviceType)\n    );`
);
if (!content.includes("'trademark-service'")) {
  throw new Error('Trademark Service exclusion was not applied.');
}
writeFileSync(path, content);
