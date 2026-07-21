export const CORE_ENGINEERING_BASELINE_ID =
  'book-02-mvp-engineering-baseline@0.1.0' as const;
export const CORE_COMPLETION_TASK = 'CORE-TASK-060' as const;
export const CORE_DISTRIBUTION_TASK = 'CORE-TASK-061' as const;
export const CORE_NEXT_GOVERNED_TASK =
  'EXECUTION-TASK-CONSUME-CORE-0.1.0' as const;
export const CORE_PUBLIC_EXPORT_PATHS = [
  '@markorbit/core',
  '@markorbit/core/objects',
  '@markorbit/core/events',
  '@markorbit/core/tasks',
  '@markorbit/core/contracts',
  '@markorbit/core/services',
  '@markorbit/core/api',
  '@markorbit/core/workflows',
  '@markorbit/core/governance'
] as const;

export interface CorePublicApiManifest {
  readonly packageName: '@markorbit/core';
  readonly packageVersion: '0.1.0';
  readonly baselineIdentity: typeof CORE_ENGINEERING_BASELINE_ID;
  readonly baselineName: 'Book 02 MVP Engineering Baseline';
  readonly coreCompletionTask: typeof CORE_COMPLETION_TASK;
  readonly distributionTask: typeof CORE_DISTRIBUTION_TASK;
  readonly supportedNodeVersions: readonly ['20', '22'];
  readonly moduleFormat: 'esm';
  readonly publicExportPaths: typeof CORE_PUBLIC_EXPORT_PATHS;
  readonly exportedPublicFamilies: readonly string[];
  readonly intentionallyNonPublicFamilies: readonly string[];
  readonly supportedConsumerRepositories: readonly [
    'whalemarks/markorbit-execution'
  ];
  readonly book02SemanticCompletion: true;
  readonly engineeringDistributionBaseline: true;
  readonly productionReadiness: false;
  readonly fullWorkflowRuntime: 'excluded';
  readonly executionCoordinationOwnership: 'markorbit-execution';
  readonly externalProtectedActionStatus: 'unauthorized';
  readonly autonomousAiAuthority: 'not_granted';
  readonly nextGovernedTask: typeof CORE_NEXT_GOVERNED_TASK;
  readonly consumerProof: {
    readonly mode: 'internal_fixture_only';
    readonly crossRepositoryConsumption: false;
  };
}

export const CORE_PUBLIC_API_MANIFEST: CorePublicApiManifest = {
  packageName: '@markorbit/core',
  packageVersion: '0.1.0',
  baselineIdentity: CORE_ENGINEERING_BASELINE_ID,
  baselineName: 'Book 02 MVP Engineering Baseline',
  coreCompletionTask: CORE_COMPLETION_TASK,
  distributionTask: CORE_DISTRIBUTION_TASK,
  supportedNodeVersions: ['20', '22'],
  moduleFormat: 'esm',
  publicExportPaths: CORE_PUBLIC_EXPORT_PATHS,
  exportedPublicFamilies: [
    'objects',
    'events',
    'tasks',
    'contracts',
    'services',
    'api',
    'workflows',
    'governance',
    'permissions',
    'policies',
    'agents'
  ],
  intentionallyNonPublicFamilies: [
    'tests',
    'fixtures',
    'validation scripts',
    'coverage output',
    'temporary task files',
    'runtime workflow engine',
    'external connectors',
    'database adapters',
    'UI/admin backend'
  ],
  supportedConsumerRepositories: ['whalemarks/markorbit-execution'],
  book02SemanticCompletion: true,
  engineeringDistributionBaseline: true,
  productionReadiness: false,
  fullWorkflowRuntime: 'excluded',
  executionCoordinationOwnership: 'markorbit-execution',
  externalProtectedActionStatus: 'unauthorized',
  autonomousAiAuthority: 'not_granted',
  nextGovernedTask: CORE_NEXT_GOVERNED_TASK,
  consumerProof: {
    mode: 'internal_fixture_only',
    crossRepositoryConsumption: false
  }
};

export function validateCorePublicApiManifest(
  manifest: CorePublicApiManifest = CORE_PUBLIC_API_MANIFEST
): readonly string[] {
  const errors: string[] = [];
  if (manifest.packageName !== '@markorbit/core')
    errors.push('package name must be @markorbit/core');
  if (manifest.packageVersion !== '0.1.0')
    errors.push('package version must be 0.1.0');
  if (!manifest.book02SemanticCompletion)
    errors.push('Book 02 semantic completion must remain true');
  if (!manifest.engineeringDistributionBaseline)
    errors.push('engineering distribution baseline must be true');
  if (manifest.productionReadiness)
    errors.push('production readiness must remain false');
  if (manifest.fullWorkflowRuntime !== 'excluded')
    errors.push('full Workflow Runtime must remain excluded');
  if (manifest.externalProtectedActionStatus !== 'unauthorized')
    errors.push('external protected actions must remain unauthorized');
  for (const path of CORE_PUBLIC_EXPORT_PATHS)
    if (!manifest.publicExportPaths.includes(path))
      errors.push(`missing public export ${path}`);
  return errors;
}
