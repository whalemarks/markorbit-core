import { CORE_DOMAIN_REGISTRY } from '../domains/index.ts';
import {
  CORE_CONTRACT_COVERAGE_BASELINE,
  CORE_CONTRACT_COVERAGE_LAYERS,
  CORE_CONTRACT_FAMILY_COVERAGE,
  CORE_DOMAIN_CONTRACT_COVERAGE
} from './core-contract-coverage-baseline.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sameJson(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function validateCoreContractCoverageBaseline(
  value: unknown
): readonly string[] {
  if (!isPlainObject(value))
    return ['Core contract coverage baseline must be a plain object.'];

  const errors: string[] = [];
  if (value.id !== CORE_CONTRACT_COVERAGE_BASELINE.id)
    errors.push('Coverage baseline id must match the canonical baseline.');
  if (value.version !== CORE_CONTRACT_COVERAGE_BASELINE.version)
    errors.push('Coverage baseline version must match the canonical baseline.');
  if (value.scope !== 'contract_structure_only')
    errors.push('Coverage baseline scope must remain contract_structure_only.');

  if (!sameJson(value.authority, CORE_CONTRACT_COVERAGE_BASELINE.authority))
    errors.push('Coverage baseline authority must match Book 2 exactly.');
  if (
    !sameJson(
      value.assessmentBoundary,
      CORE_CONTRACT_COVERAGE_BASELINE.assessmentBoundary
    )
  )
    errors.push('Coverage assessment boundary must match exactly.');

  if (!Array.isArray(value.contractFamilies)) {
    errors.push('Coverage baseline contractFamilies must be an array.');
  } else if (!sameJson(value.contractFamilies, CORE_CONTRACT_FAMILY_COVERAGE)) {
    errors.push('Coverage baseline contractFamilies must match exactly.');
  }

  if (!Array.isArray(value.domains)) {
    errors.push('Coverage baseline domains must be an array.');
  } else {
    if (value.domains.length !== CORE_DOMAIN_REGISTRY.length)
      errors.push(
        `Coverage baseline must contain exactly ${CORE_DOMAIN_REGISTRY.length} domains.`
      );
    if (!sameJson(value.domains, CORE_DOMAIN_CONTRACT_COVERAGE))
      errors.push(
        'Coverage baseline domains must match current contracts exactly.'
      );
  }

  if (!sameJson(value.summary, CORE_CONTRACT_COVERAGE_BASELINE.summary))
    errors.push(
      'Coverage baseline summary must match current contracts exactly.'
    );

  const summary = isPlainObject(value.summary) ? value.summary : undefined;
  if (summary !== undefined) {
    const layerDomainCounts = isPlainObject(summary.layerDomainCounts)
      ? summary.layerDomainCounts
      : undefined;
    if (layerDomainCounts === undefined) {
      errors.push('Coverage summary layerDomainCounts must be a plain object.');
    } else {
      for (const layer of CORE_CONTRACT_COVERAGE_LAYERS) {
        if (typeof layerDomainCounts[layer] !== 'number')
          errors.push(`Coverage summary ${layer} count must be a number.`);
      }
    }
  }

  return errors;
}
