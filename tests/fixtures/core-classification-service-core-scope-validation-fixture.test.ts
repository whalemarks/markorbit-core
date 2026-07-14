import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { validateCoreClassificationServiceCoreScopeValidationFixture } from '../../src/validation/core-classification-service-fixture-validation.ts';

const fixture = JSON.parse(
  readFileSync(
    'fixtures/services/core-classification-service-core-scope-validation.fixture.json',
    'utf8'
  )
) as unknown;

describe('CORE-TASK-040 Classification Service fixture', () => {
  it('executes the governed Classification scope and validation scenarios', () => {
    const result =
      validateCoreClassificationServiceCoreScopeValidationFixture(fixture);
    assert.equal(result.ok, true);
    assert.deepEqual(result.issues, []);
  });
});
