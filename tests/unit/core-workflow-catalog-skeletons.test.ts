import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_DOMAIN_REGISTRY, CORE_WORKFLOW_CATALOG_SKELETONS, EXCLUDED_WORKFLOW_CONCEPTS, validateCoreWorkflowCatalogSkeletons } from '../../src/index.ts';

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('Core Workflow Catalog Skeletons', () => {
  it('has exactly 8 entries', () => assert.equal(CORE_WORKFLOW_CATALOG_SKELETONS.length, 8));
  it('validateCoreWorkflowCatalogSkeletons returns no errors', () => assert.deepEqual(validateCoreWorkflowCatalogSkeletons(CORE_WORKFLOW_CATALOG_SKELETONS), []));
  it('all skeleton ids are unique', () => assert.equal(new Set(CORE_WORKFLOW_CATALOG_SKELETONS.map((entry) => entry.id)).size, CORE_WORKFLOW_CATALOG_SKELETONS.length));
  it('all workflowTypes are unique', () => assert.equal(new Set(CORE_WORKFLOW_CATALOG_SKELETONS.map((entry) => entry.workflowType)).size, CORE_WORKFLOW_CATALOG_SKELETONS.length));
  it('every domainId exists in CORE_DOMAIN_REGISTRY', () => { const domainIds = new Set(CORE_DOMAIN_REGISTRY.map((domain) => domain.id)); for (const entry of CORE_WORKFLOW_CATALOG_SKELETONS) assert.equal(domainIds.has(entry.domainId), true); });
  it('no excluded workflow concepts are present', () => { const serialized = JSON.stringify(CORE_WORKFLOW_CATALOG_SKELETONS); for (const concept of EXCLUDED_WORKFLOW_CONCEPTS) assert.equal(serialized.includes(concept), false); });
  it('each skeleton has non-empty purpose', () => { for (const entry of CORE_WORKFLOW_CATALOG_SKELETONS) assert.equal(entry.purpose.length > 0, true); });
  it('each skeleton has owns array', () => { for (const entry of CORE_WORKFLOW_CATALOG_SKELETONS) assert.equal(Array.isArray(entry.owns), true); });
  it('each skeleton has nonGoals array', () => { for (const entry of CORE_WORKFLOW_CATALOG_SKELETONS) assert.equal(Array.isArray(entry.nonGoals), true); });
  it('workflowType values are kebab-case', () => { for (const entry of CORE_WORKFLOW_CATALOG_SKELETONS) assert.equal(kebabCasePattern.test(entry.workflowType), true); });
});
