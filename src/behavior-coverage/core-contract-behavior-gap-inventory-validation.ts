import {
  CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY,
  CORE_CONTRACT_BEHAVIOR_GAP_TARGETS,
  CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES
} from './core-contract-behavior-gap-inventory.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateCoreContractBehaviorGapInventory(
  value: unknown
): readonly string[] {
  if (!isPlainObject(value))
    return ['Core contract behavior gap inventory must be a plain object.'];

  const errors: string[] = [];
  if (
    JSON.stringify(value) !==
    JSON.stringify(CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY)
  )
    errors.push(
      'Contract behavior gap inventory must match the canonical lock exactly.'
    );
  if (value.scope !== 'behavior_gap_inventory_lock_only')
    errors.push('Behavior gap inventory scope must remain inventory-only.');

  const ids = CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.map(
    (entry) => entry.behaviorId
  );
  if (new Set(ids).size !== ids.length)
    errors.push('Behavior gap target ids must be unique.');
  if (
    CORE_CONTRACT_BEHAVIOR_GAP_TARGETS.some(
      (entry) => entry.depthIncrement <= 0
    )
  )
    errors.push('Every behavior gap must require a positive depth increment.');

  const batchIds = new Set(
    CORE_CONTRACT_BEHAVIOR_IMPLEMENTATION_BATCHES.map((entry) => entry.id)
  );
  for (const target of CORE_CONTRACT_BEHAVIOR_GAP_TARGETS)
    if (!batchIds.has(target.implementationBatch))
      errors.push(
        `Unknown implementation batch: ${target.implementationBatch}.`
      );

  return errors;
}
