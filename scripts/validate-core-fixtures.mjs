import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CORE_FIXTURE_MANIFEST,
  validateCoreDomainRegistryFixture,
  validateCoreEventBaseFixture,
  validateCoreObjectBaseFixture,
  validateCoreTaskBaseFixture,
  validateCoreWorkflowContractBaseFixture,
  validateCoreContractIndexFixture,
  validateCoreDomainContractSkeletonsFixture,
  validateCoreObjectContractSkeletonsFixture,
  validateCoreServiceContractSkeletonsFixture,
  validateCoreApiContractSkeletonsFixture,
  validateCoreEventCatalogSkeletonsFixture,
  validateCoreWorkflowCatalogSkeletonsFixture,
  validateCorePermissionContractSkeletonsFixture
} from '../src/validation/index.ts';

const validators = {
  domain_registry: validateCoreDomainRegistryFixture,
  object_base: validateCoreObjectBaseFixture,
  event_base: validateCoreEventBaseFixture,
  task_base: validateCoreTaskBaseFixture,
  workflow_contract_base: validateCoreWorkflowContractBaseFixture,
  contract_index: validateCoreContractIndexFixture,
  domain_contract_skeletons: validateCoreDomainContractSkeletonsFixture,
  object_contract_skeletons: validateCoreObjectContractSkeletonsFixture,
  service_contract_skeletons: validateCoreServiceContractSkeletonsFixture,
  api_contract_skeletons: validateCoreApiContractSkeletonsFixture,
  event_catalog_skeletons: validateCoreEventCatalogSkeletonsFixture,
  workflow_catalog_skeletons: validateCoreWorkflowCatalogSkeletonsFixture,
  permission_contract_skeletons: validateCorePermissionContractSkeletonsFixture
};

let hasErrors = false;

console.log('Core fixture validation summary');
console.log('===============================');

for (const entry of CORE_FIXTURE_MANIFEST) {
  const validator = validators[entry.type];
  const fixturePath = resolve(entry.path);
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  const result = validator(fixture);
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  hasErrors ||= errors.length > 0 || (entry.required === true && !result.ok);

  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${entry.id} (${entry.path})`);

  for (const issue of result.issues) {
    console.log(`  [${issue.severity}] ${issue.code}: ${issue.message}${issue.path ? ` (${issue.path})` : ''}`);
  }
}

if (hasErrors) {
  console.error('Core fixture validation failed.');
  process.exit(1);
}

console.log('All required Core fixtures passed validation.');
