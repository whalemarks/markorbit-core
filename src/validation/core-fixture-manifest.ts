export const CORE_FIXTURE_TYPES = [
  'domain_registry',
  'object_base',
  'event_base',
  'task_base',
  'workflow_contract_base',
  'contract_index',
  'domain_contract_skeletons',
  'object_contract_skeletons',
  'service_contract_skeletons',
  'api_contract_skeletons'
] as const;

export type CoreFixtureType = (typeof CORE_FIXTURE_TYPES)[number];

export interface CoreFixtureManifestEntry {
  readonly id: string;
  readonly type: CoreFixtureType;
  readonly path: string;
  readonly description?: string;
  readonly required?: boolean;
}

export const CORE_FIXTURE_MANIFEST = [
  {
    id: 'core-domain-registry',
    type: 'domain_registry',
    path: 'fixtures/domains/core-domain-registry.fixture.json',
    required: true
  },
  {
    id: 'core-object-base',
    type: 'object_base',
    path: 'fixtures/objects/core-object-base.fixture.json',
    required: true
  },
  {
    id: 'core-event-base',
    type: 'event_base',
    path: 'fixtures/events/core-event-base.fixture.json',
    required: true
  },
  {
    id: 'core-task-base',
    type: 'task_base',
    path: 'fixtures/tasks/core-task-base.fixture.json',
    required: true
  },
  {
    id: 'core-workflow-contract-base',
    type: 'workflow_contract_base',
    path: 'fixtures/workflows/core-workflow-contract-base.fixture.json',
    required: true
  },
  {
    id: 'core-contract-index',
    type: 'contract_index',
    path: 'fixtures/contracts/core-contract-index.fixture.json',
    required: true
  },
  {
    id: 'core-domain-contract-skeletons',
    type: 'domain_contract_skeletons',
    path: 'fixtures/contracts/core-domain-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-object-contract-skeletons',
    type: 'object_contract_skeletons',
    path: 'fixtures/contracts/core-object-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-service-contract-skeletons',
    type: 'service_contract_skeletons',
    path: 'fixtures/contracts/core-service-contract-skeletons.fixture.json',
    required: true
  },
  {
    id: 'core-api-contract-skeletons',
    type: 'api_contract_skeletons',
    path: 'fixtures/contracts/core-api-contract-skeletons.fixture.json',
    required: true
  }
] as const satisfies readonly CoreFixtureManifestEntry[];
