import {
  CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
  CORE_GOVERNED_API_BOUNDARY_SPECS,
  CORE_TASK_057A_API_BOUNDARY_SPECS,
  CORE_TASK_057B_API_BOUNDARY_SPECS,
  CORE_TASK_057C_API_BOUNDARY_SPECS,
  type CoreGovernedApiCapability
} from '../api/index.ts';

export interface CoreApiBoundaryEvidence {
  readonly requirementId: string;
  readonly domainId: string;
  readonly apiType: string;
  readonly apiContractId: string;
  readonly owningServiceContractId: string;
  readonly sourcePath: string;
  readonly implementationTask:
    'CORE-TASK-057A' | 'CORE-TASK-057B' | 'CORE-TASK-057C';
  readonly currentDepth: 'level_2';
  readonly operationCount: number;
  readonly provenCapabilities: readonly CoreGovernedApiCapability[];
  readonly unresolvedCapabilities: readonly string[];
  readonly implementationFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly fixtureFiles: readonly string[];
  readonly directDomainMutation: false;
  readonly directEventEmission: false;
}

const implementationFiles = [
  'src/api/core-governed-api-boundary.ts',
  'src/api/core-governed-api-specs.ts',
  'src/api/index.ts'
] as const;

const evidenceFor = (
  specs: readonly import('../api/index.ts').CoreGovernedApiBoundarySpec[],
  implementationTask: 'CORE-TASK-057A' | 'CORE-TASK-057B' | 'CORE-TASK-057C'
): readonly CoreApiBoundaryEvidence[] =>
  specs.map((spec) => ({
    requirementId: `must-api-${spec.domainId}-api-contract`,
    domainId: spec.domainId,
    apiType: spec.apiType,
    apiContractId: spec.apiContractId,
    owningServiceContractId: spec.serviceContractId,
    sourcePath: spec.sourcePath,
    implementationTask,
    currentDepth: 'level_2',
    operationCount: spec.operations.length,
    provenCapabilities: CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
    unresolvedCapabilities: [],
    implementationFiles:
      implementationTask === 'CORE-TASK-057C'
        ? [...implementationFiles, 'src/api/core-governed-api-specs-057c.ts']
        : implementationFiles,
    testFiles: [
      `tests/unit/core-task-${implementationTask === 'CORE-TASK-057A' ? '057a' : implementationTask === 'CORE-TASK-057B' ? '057b' : '057c'}-api-boundary-foundation.test.ts`
    ],
    fixtureFiles: [
      `fixtures/api/core-task-${implementationTask === 'CORE-TASK-057A' ? '057a' : implementationTask === 'CORE-TASK-057B' ? '057b' : '057c'}-api-boundaries.fixture.json`
    ],
    directDomainMutation: false,
    directEventEmission: false
  }));

export const CORE_TASK_057A_API_BOUNDARY_EVIDENCE = evidenceFor(
  CORE_TASK_057A_API_BOUNDARY_SPECS,
  'CORE-TASK-057A'
);

export const CORE_TASK_057B_API_BOUNDARY_EVIDENCE = evidenceFor(
  CORE_TASK_057B_API_BOUNDARY_SPECS,
  'CORE-TASK-057B'
);

export const CORE_TASK_057C_API_BOUNDARY_EVIDENCE = evidenceFor(
  CORE_TASK_057C_API_BOUNDARY_SPECS,
  'CORE-TASK-057C'
);

export const CORE_API_BOUNDARY_EVIDENCE = [
  ...CORE_TASK_057A_API_BOUNDARY_EVIDENCE,
  ...CORE_TASK_057B_API_BOUNDARY_EVIDENCE,
  ...CORE_TASK_057C_API_BOUNDARY_EVIDENCE
] as readonly CoreApiBoundaryEvidence[];

void CORE_GOVERNED_API_BOUNDARY_SPECS;
