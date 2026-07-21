import { MARKORBIT_CORE_VERSION } from '@markorbit/core';
import {
  createCoreObjectId,
  createCoreObjectType,
  type CoreObjectReference
} from '@markorbit/core/objects';
import type { CoreEvent } from '@markorbit/core/events';
import type { CoreTask } from '@markorbit/core/tasks';
import type { CorePermissionContract } from '@markorbit/core/contracts';
import type { CoreGovernedApiBoundarySpec } from '@markorbit/core/api';
import type { CoreWorkflowContract } from '@markorbit/core/workflows';
import { CORE_PUBLIC_API_MANIFEST } from '@markorbit/core/governance';

export const consumedCoreVersion = MARKORBIT_CORE_VERSION;
export const consumedManifest = CORE_PUBLIC_API_MANIFEST;
export const sampleReference: CoreObjectReference = {
  id: createCoreObjectId('customer-1'),
  type: createCoreObjectType('customer-record'),
  domainId: 'customer'
};
export const sampleEvent: Pick<CoreEvent, 'object'> = {
  object: sampleReference
};
export const sampleTask: Pick<CoreTask, 'object'> = { object: sampleReference };
export const samplePermission: Pick<
  CorePermissionContract,
  'protectedAction' | 'requiresHumanReview'
> = { protectedAction: true, requiresHumanReview: true };
export const sampleApiBoundary: Pick<
  CoreGovernedApiBoundarySpec,
  'directDomainMutation' | 'directEventEmission'
> = { directDomainMutation: false, directEventEmission: false };
export const sampleWorkflow: Pick<
  CoreWorkflowContract,
  'steps' | 'transitions'
> = { steps: [], transitions: [] };
