import { createCoreObjectType } from '../../objects/index.ts';
import { createCoreContractId } from '../core-contract-id.ts';
import { CORE_CONTRACT_STATUSES } from '../core-contract-status.ts';
import type { CoreObjectContract } from './core-object-contract.ts';

const coreBook = 'Book 02 — MarkOrbit Core Specification';
const createdAt = '2026-07-09T00:00:00.000Z';
const base = 'CoreObjectDefinition';
const requiredBaseFields = ['id', 'type', 'domainId', 'status', 'version', 'metadata'] as const;
const nonGoals = [
  'Full object schema fields or business-specific data fields.',
  'Service, API, workflow, runtime, database, or product UI behavior.',
  'Book 03 execution runtime concepts or AI agent authority.'
] as const;

const objectSkeleton = (objectType: string, domainId: CoreObjectContract['domainId'], name: string, description: string, purpose: string): CoreObjectContract => ({
  id: createCoreContractId(`core-object-${objectType}-contract`),
  objectType: createCoreObjectType(objectType),
  domainId,
  name,
  description,
  status: CORE_CONTRACT_STATUSES.active,
  book: coreBook,
  purpose,
  base,
  owns: [`Skeleton contract boundary for ${name}.`],
  requiredBaseFields,
  nonGoals,
  createdAt
});

export const CORE_OBJECT_CONTRACT_SKELETONS = [
  objectSkeleton('user-record', 'user', 'User Record Object Contract Skeleton', 'Skeleton contract boundary for User Record Core objects.', 'Establishes the object contract placeholder for user records using only CoreObjectDefinition base fields.'),
  objectSkeleton('organization-record', 'organization', 'Organization Record Object Contract Skeleton', 'Skeleton contract boundary for Organization Record Core objects.', 'Establishes the object contract placeholder for organization records using only CoreObjectDefinition base fields.'),
  objectSkeleton('permission-policy-record', 'policy', 'Permission Policy Record Object Contract Skeleton', 'Skeleton contract boundary for Permission Policy Record Core objects.', 'Establishes the object contract placeholder for permission policy records using only CoreObjectDefinition base fields.'),
  objectSkeleton('knowledge-source-record', 'knowledge', 'Knowledge Source Record Object Contract Skeleton', 'Skeleton contract boundary for Knowledge Source Record Core objects.', 'Establishes the object contract placeholder for knowledge source records using only CoreObjectDefinition base fields.'),
  objectSkeleton('brand-record', 'brand', 'Brand Record Object Contract Skeleton', 'Skeleton contract boundary for Brand Record Core objects.', 'Establishes the object contract placeholder for brand records using only CoreObjectDefinition base fields.'),
  objectSkeleton('trademark-record', 'trademark', 'Trademark Record Object Contract Skeleton', 'Skeleton contract boundary for Trademark Record Core objects.', 'Establishes the object contract placeholder for trademark records using only CoreObjectDefinition base fields.'),
  objectSkeleton('jurisdiction-record', 'jurisdiction', 'Jurisdiction Record Object Contract Skeleton', 'Skeleton contract boundary for Jurisdiction Record Core objects.', 'Establishes the object contract placeholder for jurisdiction records using only CoreObjectDefinition base fields.'),
  objectSkeleton('classification-record', 'classification', 'Classification Record Object Contract Skeleton', 'Skeleton contract boundary for Classification Record Core objects.', 'Establishes the object contract placeholder for classification records using only CoreObjectDefinition base fields.'),
  objectSkeleton('document-record', 'document', 'Document Record Object Contract Skeleton', 'Skeleton contract boundary for Document Record Core objects.', 'Establishes the object contract placeholder for document records using only CoreObjectDefinition base fields.'),
  objectSkeleton('evidence-record', 'evidence', 'Evidence Record Object Contract Skeleton', 'Skeleton contract boundary for Evidence Record Core objects.', 'Establishes the object contract placeholder for evidence records using only CoreObjectDefinition base fields.'),
  objectSkeleton('matter-record', 'matter', 'Matter Record Object Contract Skeleton', 'Skeleton contract boundary for Matter Record Core objects.', 'Establishes the object contract placeholder for matter records using only CoreObjectDefinition base fields.'),
  objectSkeleton('communication-record', 'communication', 'Communication Record Object Contract Skeleton', 'Skeleton contract boundary for Communication Record Core objects.', 'Establishes the object contract placeholder for communication records using only CoreObjectDefinition base fields.')
] as const satisfies readonly CoreObjectContract[];
