import type { CoreDomainId } from '../domains/index.ts';

export const CORE_MVP_OBJECT_FIELD_REQUIREMENTS = [
  'required',
  'optional',
  'not_applicable'
] as const;
export type CoreObjectFieldRequirement =
  (typeof CORE_MVP_OBJECT_FIELD_REQUIREMENTS)[number];

export interface CoreMvpObjectProfile {
  readonly domainId: CoreDomainId;
  readonly objectType: string;
  readonly objectContractId: string;
  readonly sourcePath: string;
  readonly publicReferenceId: 'required';
  readonly metadata: 'required';
  readonly auditMetadata: 'required';
  readonly status: CoreObjectFieldRequirement;
  readonly version: CoreObjectFieldRequirement;
  readonly visibility: CoreObjectFieldRequirement;
}

export const CORE_MVP_OBJECT_PROFILE_ORDER = [
  "identity",
  "organization",
  "user",
  "permission",
  "policy",
  "customer",
  "brand",
  "trademark",
  "jurisdiction",
  "classification",
  "document",
  "evidence",
  "matter",
  "order",
  "workflow-contract",
  "task",
  "event",
  "communication"
] as const;

export const CORE_MVP_OBJECT_CANONICAL_PROFILES = [
  {
    "domainId": "identity",
    "objectType": "identity-record",
    "objectContractId": "core-object-identity-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/identity.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "optional"
  },
  {
    "domainId": "organization",
    "objectType": "organization-record",
    "objectContractId": "core-object-organization-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/organization.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "optional"
  },
  {
    "domainId": "user",
    "objectType": "user-record",
    "objectContractId": "core-object-user-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/user.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "optional"
  },
  {
    "domainId": "permission",
    "objectType": "permission-record",
    "objectContractId": "core-object-permission-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/permission.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "policy",
    "objectType": "permission-policy-record",
    "objectContractId": "core-object-permission-policy-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/policy.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "customer",
    "objectType": "customer-record",
    "objectContractId": "core-object-customer-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/customer.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "brand",
    "objectType": "brand-record",
    "objectContractId": "core-object-brand-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/brand.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "optional"
  },
  {
    "domainId": "trademark",
    "objectType": "trademark-record",
    "objectContractId": "core-object-trademark-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/trademark.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "optional"
  },
  {
    "domainId": "jurisdiction",
    "objectType": "jurisdiction-record",
    "objectContractId": "core-object-jurisdiction-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/jurisdiction.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "optional"
  },
  {
    "domainId": "classification",
    "objectType": "classification-record",
    "objectContractId": "core-object-classification-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/classification.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "optional"
  },
  {
    "domainId": "document",
    "objectType": "document-record",
    "objectContractId": "core-object-document-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/document.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "evidence",
    "objectType": "evidence-record",
    "objectContractId": "core-object-evidence-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/evidence.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "matter",
    "objectType": "matter-record",
    "objectContractId": "core-object-matter-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/matter.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "order",
    "objectType": "order-record",
    "objectContractId": "core-object-order-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/order.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "workflow-contract",
    "objectType": "workflow-contract-record",
    "objectContractId": "core-object-workflow-contract-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/workflow-contract.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "task",
    "objectType": "task-record",
    "objectContractId": "core-object-task-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/task.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "event",
    "objectType": "event-record",
    "objectContractId": "core-object-event-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/event.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  },
  {
    "domainId": "communication",
    "objectType": "communication-record",
    "objectContractId": "core-object-communication-record-contract",
    "sourcePath": "books/book-02-core-specification/core-specs/objects/communication.md",
    "publicReferenceId": "required",
    "metadata": "required",
    "auditMetadata": "required",
    "status": "required",
    "version": "required",
    "visibility": "required"
  }
] as const satisfies readonly CoreMvpObjectProfile[];

export const CORE_MVP_OBJECT_PROFILES = CORE_MVP_OBJECT_CANONICAL_PROFILES;
