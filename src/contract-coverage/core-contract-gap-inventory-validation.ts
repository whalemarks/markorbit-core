import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import { CORE_CONTRACT_INDEX } from '../contracts/index.ts';
import {
  CORE_CANONICAL_LAYER_TARGETS,
  CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES,
  CORE_CONTRACT_GAP_INVENTORY,
  CORE_DOMAIN_CONTRACT_TARGETS
} from './core-contract-gap-inventory.ts';

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sameJson(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function validateCoreContractGapInventory(
  value: unknown
): readonly string[] {
  if (!isPlainObject(value))
    return ['Core contract gap inventory must be a plain object.'];

  const errors: string[] = [];
  if (value.id !== CORE_CONTRACT_GAP_INVENTORY.id)
    errors.push('Gap inventory id must match the canonical lock.');
  if (value.version !== CORE_CONTRACT_GAP_INVENTORY.version)
    errors.push('Gap inventory version must match the canonical lock.');
  if (value.scope !== 'inventory_lock_only')
    errors.push('Gap inventory scope must remain inventory_lock_only.');
  if (!sameJson(value.authority, CORE_CONTRACT_GAP_INVENTORY.authority))
    errors.push('Gap inventory authority must match Book 2 exactly.');
  if (
    !sameJson(
      value.requiredContractTypeAdditions,
      CORE_CONTRACT_GAP_INVENTORY.requiredContractTypeAdditions
    )
  )
    errors.push('Required contract type additions must match exactly.');
  if (!sameJson(value.domainTargets, CORE_DOMAIN_CONTRACT_TARGETS))
    errors.push('Domain contract targets must match the locked inventory.');
  if (!sameJson(value.canonicalLayerTargets, CORE_CANONICAL_LAYER_TARGETS))
    errors.push('Canonical layer targets must match the locked inventory.');
  if (
    !sameJson(
      value.retainedNoncanonicalScaffolds,
      CORE_CONTRACT_GAP_INVENTORY.retainedNoncanonicalScaffolds
    )
  )
    errors.push('Retained noncanonical scaffolds must match exactly.');
  if (
    !sameJson(
      value.implementationBatches,
      CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES
    )
  )
    errors.push('Implementation batches must match exactly.');
  if (!sameJson(value.summary, CORE_CONTRACT_GAP_INVENTORY.summary))
    errors.push('Gap inventory summary must match exactly.');

  const allTargets = [
    ...CORE_DOMAIN_CONTRACT_TARGETS.filter(
      (target) => target.disposition === 'add_canonical_skeleton'
    ),
    ...CORE_CANONICAL_LAYER_TARGETS
  ];
  const ids = allTargets.map((target) => target.targetContractId);
  if (new Set(ids).size !== ids.length)
    errors.push('New canonical target ids must be unique.');
  for (const id of ids)
    if (!kebabCasePattern.test(id))
      errors.push(`New canonical target id must be kebab-case: ${id}.`);
  const currentIds = new Set<string>(
    CORE_CONTRACT_INDEX.map((contract) => contract.id)
  );
  for (const id of ids)
    if (currentIds.has(id))
      errors.push(
        `New canonical target id already exists in the index: ${id}.`
      );

  if (CORE_DOMAIN_CONTRACT_TARGETS.length !== CORE_DOMAIN_REGISTRY.length * 3)
    errors.push(
      'Every Core Domain must have Object, Service, and API targets.'
    );

  return errors;
}
