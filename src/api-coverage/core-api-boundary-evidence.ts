import {
  CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
  CORE_TASK_057A_API_BOUNDARY_SPECS,
  type CoreGovernedApiCapability
} from '../api/index.ts';

export interface CoreApiBoundaryEvidence {
  readonly requirementId: string;
  readonly domainId: string;
  readonly apiType: string;
  readonly apiContractId: string;
  readonly owningServiceContractId: string;
  readonly sourcePath: string;
  readonly implementationTask: 'CORE-TASK-057A';
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
const testFiles = [
  'tests/unit/core-task-057a-api-boundary-foundation.test.ts'
] as const;
const fixtureFiles = [
  'fixtures/api/core-task-057a-api-boundaries.fixture.json'
] as const;

export const CORE_API_BOUNDARY_EVIDENCE = CORE_TASK_057A_API_BOUNDARY_SPECS.map(
  (spec): CoreApiBoundaryEvidence => ({
    requirementId: `must-api-${spec.domainId}-api-contract`,
    domainId: spec.domainId,
    apiType: spec.apiType,
    apiContractId: spec.apiContractId,
    owningServiceContractId: spec.serviceContractId,
    sourcePath: spec.sourcePath,
    implementationTask: 'CORE-TASK-057A',
    currentDepth: 'level_2',
    operationCount: spec.operations.length,
    provenCapabilities: CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
    unresolvedCapabilities: [],
    implementationFiles,
    testFiles,
    fixtureFiles,
    directDomainMutation: false,
    directEventEmission: false
  })
) as readonly CoreApiBoundaryEvidence[];
