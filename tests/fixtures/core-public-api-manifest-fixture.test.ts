import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CORE_PUBLIC_API_MANIFEST } from '../../src/distribution/index.ts';

test('core public API manifest fixture matches baseline identity flags', () => {
  const fixture = JSON.parse(
    readFileSync(
      'fixtures/distribution/core-public-api-manifest.fixture.json',
      'utf8'
    )
  );
  assert.equal(fixture.packageName, CORE_PUBLIC_API_MANIFEST.packageName);
  assert.equal(fixture.packageVersion, CORE_PUBLIC_API_MANIFEST.packageVersion);
  assert.equal(fixture.book02SemanticCompletion, true);
  assert.equal(fixture.engineeringDistributionBaseline, true);
  assert.equal(fixture.productionReadiness, false);
  assert.equal(fixture.fullWorkflowRuntime, 'excluded');
  assert.equal(fixture.externalProtectedActionStatus, 'unauthorized');
});
