import {
  CORE_GOVERNED_API_REQUIRED_CAPABILITIES,
  CORE_GOVERNED_API_BOUNDARY_SPECS,
  CORE_TASK_057C_API_BOUNDARY_SPECS,
  validateCoreGovernedApiBoundarySpecs
} from '../api/index.ts';
import {
  CORE_API_BOUNDARY_EVIDENCE,
  type CoreApiBoundaryEvidence
} from './core-api-boundary-evidence.ts';

const expectedDomains = [
  'identity',
  'organization',
  'user',
  'permission',
  'policy',
  'customer',
  'brand',
  'trademark',
  'jurisdiction',
  'classification',
  'document',
  'evidence',
  'matter',
  'order',
  'workflow-contract',
  'task',
  'event',
  'communication'
] as const;

export function validateCoreApiBoundaryEvidence(
  evidence: readonly CoreApiBoundaryEvidence[] = CORE_API_BOUNDARY_EVIDENCE
): readonly string[] {
  if (!Array.isArray(evidence))
    return ['Core API boundary evidence must be an array.'];
  const errors = [
    ...validateCoreGovernedApiBoundarySpecs([
      ...CORE_GOVERNED_API_BOUNDARY_SPECS,
      ...CORE_TASK_057C_API_BOUNDARY_SPECS
    ])
  ];
  const requireCompleteInventory = evidence === CORE_API_BOUNDARY_EVIDENCE;
  if (requireCompleteInventory && evidence.length !== expectedDomains.length)
    errors.push(
      'CORE API evidence must contain exactly eighteen completed API entries.'
    );
  const domains = new Set<string>();
  evidence.forEach((entry, index) => {
    const spec = [
      ...CORE_GOVERNED_API_BOUNDARY_SPECS,
      ...CORE_TASK_057C_API_BOUNDARY_SPECS
    ].find((candidate) => candidate.domainId === entry.domainId);
    if (!spec) {
      errors.push(
        `evidence[${index}].domainId is not in the completed API boundary inventory.`
      );
      return;
    }
    if (domains.has(entry.domainId))
      errors.push(`evidence[${index}].domainId must be unique.`);
    domains.add(entry.domainId);
    if (entry.requirementId !== `must-api-${entry.domainId}-api-contract`)
      errors.push(`evidence[${index}].requirementId is invalid.`);
    if (entry.apiContractId !== spec.apiContractId)
      errors.push(`evidence[${index}].apiContractId is invalid.`);
    if (entry.owningServiceContractId !== spec.serviceContractId)
      errors.push(`evidence[${index}].owningServiceContractId is invalid.`);
    if (entry.sourcePath !== spec.sourcePath)
      errors.push(`evidence[${index}].sourcePath is invalid.`);
    if (entry.currentDepth !== 'level_2')
      errors.push(`evidence[${index}].currentDepth must be level_2.`);
    if (
      entry.operationCount !== spec.operations.length ||
      entry.operationCount < 5
    )
      errors.push(`evidence[${index}].operationCount is invalid.`);
    for (const capability of CORE_GOVERNED_API_REQUIRED_CAPABILITIES)
      if (!entry.provenCapabilities.includes(capability))
        errors.push(`evidence[${index}] must prove capability ${capability}.`);
    if (entry.unresolvedCapabilities.length !== 0)
      errors.push(`evidence[${index}].unresolvedCapabilities must be empty.`);
    if (entry.implementationFiles.length < 2)
      errors.push(`evidence[${index}] requires implementation files.`);
    if (entry.testFiles.length === 0)
      errors.push(`evidence[${index}] requires executable tests.`);
    if (entry.fixtureFiles.length === 0)
      errors.push(`evidence[${index}] requires a deterministic fixture.`);
    if (entry.directDomainMutation !== false)
      errors.push(`evidence[${index}] must prohibit direct Domain mutation.`);
    if (entry.directEventEmission !== false)
      errors.push(`evidence[${index}] must prohibit direct Event emission.`);
  });
  if (requireCompleteInventory)
    for (const domain of expectedDomains)
      if (!domains.has(domain)) errors.push(`Missing ${domain} API evidence.`);
  return errors;
}
