import { CORE_DOMAIN_REGISTRY } from '../../domains/index.ts';
import { CORE_EVENT_ACTIONS } from '../../events/index.ts';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../service/core-service-contract-skeletons.ts';
import { CORE_EVENT_CATALOG_SKELETONS } from './core-event-catalog-skeletons.ts';
import {
  CORE_MVP_EVENT_AUTHORITY_KINDS,
  CORE_MVP_EVENT_CONTRACT_LOCKS,
  CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS,
  CORE_MVP_EVENT_RESOLUTION_KINDS,
  CORE_MVP_EVENT_TYPES,
  type CoreMvpEventContractLockEntry
} from './core-mvp-event-contract-lock.ts';

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const objectTypePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validDomainIds = new Set<string>(
  CORE_DOMAIN_REGISTRY.map((entry) => entry.id)
);
const validActions = new Set<string>(Object.values(CORE_EVENT_ACTIONS));
const validResolutionKinds = new Set<string>(CORE_MVP_EVENT_RESOLUTION_KINDS);
const validAuthorityKinds = new Set<string>(CORE_MVP_EVENT_AUTHORITY_KINDS);
const genericEvents = new Map(
  CORE_EVENT_CATALOG_SKELETONS.map((entry) => [entry.eventType, entry])
);
const serviceContracts = new Map(
  CORE_SERVICE_CONTRACT_SKELETONS.map((entry) => [entry.id, entry])
);

const sameStrings = (
  actual: readonly string[],
  expected: readonly string[]
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

export function validateCoreMvpEventContractLocks(
  entries: readonly CoreMvpEventContractLockEntry[] = CORE_MVP_EVENT_CONTRACT_LOCKS
): readonly string[] {
  const errors: string[] = [];
  if (!Array.isArray(entries))
    return ['MVP Event contract locks must be an array.'];
  if (entries.length !== CORE_MVP_EVENT_TYPES.length)
    errors.push(
      `MVP Event contract locks must contain exactly ${CORE_MVP_EVENT_TYPES.length} entries.`
    );

  const ids = new Set<string>();
  const requirementIds = new Set<string>();
  const eventTypes = new Set<string>();

  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    const expectedEventType = CORE_MVP_EVENT_TYPES[index];
    if (entry.eventType !== expectedEventType)
      errors.push(`${path}.eventType must be ${expectedEventType}.`);
    if (entry.requirementId !== `must-event-${entry.eventType}`)
      errors.push(`${path}.requirementId must match eventType.`);
    if (entry.id !== `core-mvp-event-${entry.eventType}-contract`)
      errors.push(`${path}.id must be the exact MVP Event contract id.`);
    if (ids.has(entry.id)) errors.push(`${path}.id must be unique.`);
    if (requirementIds.has(entry.requirementId))
      errors.push(`${path}.requirementId must be unique.`);
    if (eventTypes.has(entry.eventType))
      errors.push(`${path}.eventType must be unique.`);
    ids.add(entry.id);
    requirementIds.add(entry.requirementId);
    eventTypes.add(entry.eventType);

    if (!kebabCasePattern.test(entry.eventType))
      errors.push(`${path}.eventType must be kebab-case.`);
    if (!validDomainIds.has(entry.domainId))
      errors.push(`${path}.domainId must exist in CORE_DOMAIN_REGISTRY.`);
    if (!validActions.has(entry.action))
      errors.push(`${path}.action must be a valid Core Event action.`);
    if (!objectTypePattern.test(entry.subjectObjectType))
      errors.push(`${path}.subjectObjectType must be kebab-case.`);
    if (!entry.sourceOperation)
      errors.push(`${path}.sourceOperation is required.`);
    if (
      entry.sourceSpecPath !==
      `books/book-02-core-specification/core-specs/events/${entry.eventType}.md`
    )
      errors.push(
        `${path}.sourceSpecPath must match the exact MVP Event path.`
      );
    if (!validAuthorityKinds.has(entry.authorityKind))
      errors.push(`${path}.authorityKind is invalid.`);
    if (!validResolutionKinds.has(entry.resolution.kind))
      errors.push(`${path}.resolution.kind is invalid.`);
    if (
      !sameStrings(
        entry.requiredTraceFields,
        CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS
      )
    )
      errors.push(
        `${path}.requiredTraceFields must match the locked trace fields.`
      );
    if (entry.schemaVersion !== '0.1.0')
      errors.push(`${path}.schemaVersion must be 0.1.0.`);
    if (entry.implementationTask !== 'CORE-TASK-056')
      errors.push(`${path}.implementationTask must be CORE-TASK-056.`);

    const service = serviceContracts.get(entry.sourceServiceContractId);
    if (!service) errors.push(`${path}.sourceServiceContractId must exist.`);
    else if (service.domainId !== entry.domainId)
      errors.push(`${path}.sourceServiceContractId must own the Event domain.`);

    if (
      entry.boundaries.traceOnly !== true ||
      entry.boundaries.commandTriggerAllowed !== false ||
      entry.boundaries.directApiEmissionAllowed !== false ||
      entry.boundaries.directWorkflowEmissionAllowed !== false ||
      entry.boundaries.directAgentEmissionAllowed !== false ||
      entry.boundaries.owningServiceTraceHandoffRequired !== true ||
      entry.boundaries.eventBusImplemented !== false
    )
      errors.push(
        `${path}.boundaries must preserve the locked trace-only boundary.`
      );

    if (entry.resolution.kind === 'canonical') {
      if (
        entry.resolution.aliasTargetEventType !== null ||
        entry.resolution.aliasTargetContractId !== null
      )
        errors.push(
          `${path}.canonical resolution must not include an alias target.`
        );
      if (entry.authorityKind === 'validated_alias')
        errors.push(`${path}.canonical resolution cannot use alias authority.`);
    } else {
      const targetType = entry.resolution.aliasTargetEventType;
      const target = targetType ? genericEvents.get(targetType) : undefined;
      if (!target)
        errors.push(
          `${path}.alias target must exist in the generic Event catalog.`
        );
      if (target && entry.resolution.aliasTargetContractId !== target.id)
        errors.push(
          `${path}.alias target contract id must match the generic catalog.`
        );
      if (entry.authorityKind !== 'validated_alias')
        errors.push(
          `${path}.alias resolution must use validated_alias authority.`
        );
      if (entry.resolution.compatibilityBasis.length < 2)
        errors.push(`${path}.alias compatibility basis must be explicit.`);
    }

    if (entry.authorityKind === 'event_spec') {
      if (!entry.sourceSpecId || !entry.payloadContractPath)
        errors.push(
          `${path}.event_spec authority requires spec and payload references.`
        );
    }
    if (entry.authorityKind === 'mvp_requirement_and_service_trace') {
      if (entry.implementationEvidenceFiles.length === 0)
        errors.push(
          `${path}.service-trace authority requires implementation evidence.`
        );
      if (entry.resolution.kind !== 'canonical')
        errors.push(
          `${path}.service-trace authority must resolve canonically.`
        );
    }
  });

  for (const eventType of CORE_MVP_EVENT_TYPES) {
    if (!eventTypes.has(eventType))
      errors.push(`Missing exact MVP Event contract for ${eventType}.`);
  }
  return errors;
}
