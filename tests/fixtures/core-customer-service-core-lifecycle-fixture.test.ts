import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { validateCoreCustomerServiceCoreLifecycleFixture } from '../../src/index.ts';

describe('Core Customer Service lifecycle fixture', () => {
  it('executes the deterministic Customer Service lifecycle scenarios', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-customer-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as unknown;
    const result = validateCoreCustomerServiceCoreLifecycleFixture(fixture);
    assert.equal(result.ok, true);
    assert.deepEqual(result.issues, []);
  });

  it('rejects fixture drift with stable validation issues', async () => {
    const fixture = JSON.parse(
      await readFile(
        'fixtures/services/core-customer-service-core-lifecycle.fixture.json',
        'utf8'
      )
    ) as { fixtureType: string };
    fixture.fixtureType = 'wrong_fixture';
    const result = validateCoreCustomerServiceCoreLifecycleFixture(fixture);
    assert.equal(result.ok, false);
    assert.equal(result.issues[0]?.code, 'core.customer_service.fixture_type');
  });
});
