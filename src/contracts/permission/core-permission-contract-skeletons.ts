import type { CoreDomainId } from '../../domains/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CorePermissionContract } from './core-permission-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-10T00:00:00.000Z';
const permissionDomainId = 'permission' as CoreDomainId;
const nonGoals = [
  'Executable permission evaluation, runtime authorization checks, or API guards.',
  'RBAC, authentication, login, session, or authorization middleware behavior.',
  'Book 03 execution runtime, product UI behavior, database schema, or AI agent permission authority.'
] as const;

const permissionSkeleton = (permissionType: string, name: string, description: string, purpose: string, protectedAction: boolean, requiresHumanReview: boolean): CorePermissionContract => ({
  id: createCoreContractId(`core-permission-${permissionType}-contract`),
  permissionType,
  domainId: permissionDomainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  appliesTo: ['Textual Core permission contract boundary only.'],
  protectedAction,
  requiresHumanReview,
  owns: [`${name} boundary.`],
  nonGoals,
  createdAt
});

export const CORE_PERMISSION_CONTRACT_SKELETONS = [
  permissionSkeleton('core-read-permission', 'Core Read Permission Contract Skeleton', 'Skeleton contract for Core read permission boundaries.', 'Defines the placeholder boundary for Core read permission semantics without evaluating access.', false, false),
  permissionSkeleton('core-create-permission', 'Core Create Permission Contract Skeleton', 'Skeleton contract for Core create permission boundaries.', 'Defines the placeholder boundary for Core create permission semantics without evaluating access.', false, false),
  permissionSkeleton('core-update-permission', 'Core Update Permission Contract Skeleton', 'Skeleton contract for Core update permission boundaries.', 'Defines the placeholder boundary for Core update permission semantics without evaluating access.', false, false),
  permissionSkeleton('core-delete-permission', 'Core Delete Permission Contract Skeleton', 'Skeleton contract for Core delete permission boundaries.', 'Defines the placeholder boundary for Core delete permission semantics without evaluating access.', false, false),
  permissionSkeleton('core-review-permission', 'Core Review Permission Contract Skeleton', 'Skeleton contract for Core review permission boundaries.', 'Defines the placeholder boundary for Core review permission semantics as a human-reviewed protected action flag only.', true, true),
  permissionSkeleton('core-approve-permission', 'Core Approve Permission Contract Skeleton', 'Skeleton contract for Core approve permission boundaries.', 'Defines the placeholder boundary for Core approve permission semantics as a human-reviewed protected action flag only.', true, true),
  permissionSkeleton('core-send-permission', 'Core Send Permission Contract Skeleton', 'Skeleton contract for Core send permission boundaries.', 'Defines the placeholder boundary for Core send permission semantics as a human-reviewed protected action flag only.', true, true),
  permissionSkeleton('core-admin-permission', 'Core Admin Permission Contract Skeleton', 'Skeleton contract for Core admin permission boundaries.', 'Defines the placeholder boundary for Core admin permission semantics as a human-reviewed protected action flag only.', true, true)
] as const satisfies readonly CorePermissionContract[];
