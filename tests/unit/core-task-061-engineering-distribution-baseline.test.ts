import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { MARKORBIT_CORE_VERSION } from '../../src/index.ts';
import {
  CORE_PUBLIC_API_MANIFEST,
  CORE_PUBLIC_EXPORT_PATHS,
  validateCorePublicApiManifest
} from '../../src/distribution/index.ts';
import { BOOK_02_FINAL_COMPLETION_AUDIT } from '../../src/mvp-coverage/book-02-final-completion-audit.ts';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  name: string;
  version: string;
  exports: Record<string, unknown>;
  files: string[];
};

test('CORE-TASK-061 package identity and exports are locked', () => {
  assert.equal(packageJson.name, '@markorbit/core');
  assert.equal(packageJson.version, '0.1.0');
  assert.equal(MARKORBIT_CORE_VERSION, '0.1.0');
  assert.deepEqual(
    Object.keys(packageJson.exports).filter(
      (path) => path !== './package.json'
    ),
    [
      '.',
      './objects',
      './events',
      './tasks',
      './contracts',
      './services',
      './api',
      './workflows',
      './governance'
    ]
  );
  assert.equal(packageJson.exports['./internal'], undefined);
  assert.equal(packageJson.exports['./fixtures'], undefined);
  assert.equal(packageJson.exports['./tests'], undefined);
  assert.deepEqual(packageJson.files, [
    'dist/',
    'README.md',
    'CORE-MANIFEST.md',
    'CORE-ROADMAP.md',
    'CHANGELOG.md'
  ]);
});

test('public API manifest validates Book 02 distribution guardrails', () => {
  assert.deepEqual(validateCorePublicApiManifest(), []);
  assert.deepEqual(
    CORE_PUBLIC_API_MANIFEST.publicExportPaths,
    CORE_PUBLIC_EXPORT_PATHS
  );
  assert.equal(CORE_PUBLIC_API_MANIFEST.book02SemanticCompletion, true);
  assert.equal(CORE_PUBLIC_API_MANIFEST.engineeringDistributionBaseline, true);
  assert.equal(CORE_PUBLIC_API_MANIFEST.productionReadiness, false);
  assert.equal(CORE_PUBLIC_API_MANIFEST.fullWorkflowRuntime, 'excluded');
  assert.equal(
    CORE_PUBLIC_API_MANIFEST.externalProtectedActionStatus,
    'unauthorized'
  );
  assert.equal(
    CORE_PUBLIC_API_MANIFEST.executionCoordinationOwnership,
    'markorbit-execution'
  );
});

test('negative manifest validation rejects changed authority claims', () => {
  assert(
    validateCorePublicApiManifest({
      ...CORE_PUBLIC_API_MANIFEST,
      productionReadiness: true
    } as unknown as typeof CORE_PUBLIC_API_MANIFEST).includes(
      'production readiness must remain false'
    )
  );
  assert(
    validateCorePublicApiManifest({
      ...CORE_PUBLIC_API_MANIFEST,
      fullWorkflowRuntime: 'included' as unknown as 'excluded'
    }).includes('full Workflow Runtime must remain excluded')
  );
  assert(
    validateCorePublicApiManifest({
      ...CORE_PUBLIC_API_MANIFEST,
      externalProtectedActionStatus: 'authorized' as unknown as 'unauthorized'
    }).includes('external protected actions must remain unauthorized')
  );
});

test('Book 02 final completion remains semantic-only and non-production', () => {
  assert.equal(BOOK_02_FINAL_COMPLETION_AUDIT.book02MvpComplete, true);
  assert.equal(BOOK_02_FINAL_COMPLETION_AUDIT.completionStatus, 'complete');
  assert(
    BOOK_02_FINAL_COMPLETION_AUDIT.exclusionsPreserved.includes(
      'no full workflow engine'
    )
  );
  assert(
    BOOK_02_FINAL_COMPLETION_AUDIT.exclusionsPreserved.includes(
      'no external protected action authorization'
    )
  );
});
