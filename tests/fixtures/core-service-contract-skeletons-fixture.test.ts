import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { CORE_SERVICE_CONTRACT_SKELETONS, EXCLUDED_CORE_SERVICE_CONCEPTS } from '../../src/index.ts';

const fixture = JSON.parse(readFileSync('fixtures/contracts/core-service-contract-skeletons.fixture.json', 'utf8')) as typeof CORE_SERVICE_CONTRACT_SKELETONS;

describe('Core service contract skeletons fixture', () => {
  it('fixture has exactly 10 entries', () => assert.equal(fixture.length, 10));
  it('fixture ids match CORE_SERVICE_CONTRACT_SKELETONS ids exactly', () => assert.deepEqual(fixture.map((s) => s.id), CORE_SERVICE_CONTRACT_SKELETONS.map((s) => s.id)));
  it('fixture serviceTypes match exactly', () => assert.deepEqual(fixture.map((s) => s.serviceType), CORE_SERVICE_CONTRACT_SKELETONS.map((s) => s.serviceType)));
  it('fixture domainIds match exactly', () => assert.deepEqual(fixture.map((s) => s.domainId), CORE_SERVICE_CONTRACT_SKELETONS.map((s) => s.domainId)));
  it('fixture names match exactly', () => assert.deepEqual(fixture.map((s) => s.name), CORE_SERVICE_CONTRACT_SKELETONS.map((s) => s.name)));
  it('fixture does not contain excluded service concepts', () => EXCLUDED_CORE_SERVICE_CONCEPTS.forEach((concept) => assert.equal(JSON.stringify(fixture).includes(concept), false)));
  it('fixture does not contain executable method definitions', () => {
    const forbiddenKeys = new Set(['methods', 'methodName', 'handler', 'function', 'execute']);
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) { value.forEach(visit); return; }
      if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
          assert.equal(forbiddenKeys.has(key), false);
          visit(child);
        }
      }
    };
    visit(fixture);
  });
});
