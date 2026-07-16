# Organization Service Operating-Context Foundation

CORE-TASK-051 implements the Book 02 governed Organization Service boundary for stable operating-context references, lifecycle, explicit User linkage, optional hierarchy, safe reference validation, deterministic context resolution, archival, auditability, and Event trace handoff.

Organization Service owns operating context. It does not own Identity or User records, grant Permission, evaluate Policy, create billing or authentication accounts, infer membership from email domains, or replace Customer, Partner, Agent, Service Provider, legal-entity, or CRM records.

The Organization Object and Organization Service specifications use different organization-type vocabularies. This implementation locks the Service specification values (`InternalOrganization`, `CustomerOrganization`, `PartnerOrganization`, `AgentOrganization`, `ServiceProviderOrganization`, `SystemOrganization`, `Unknown`) because CORE-TASK-051 implements the Service contract. The mismatch remains explicit rather than silently widening the service API.

Mutations are organization-scoped, idempotent, immutable at the public boundary, and roll back when Event trace handoff fails. Suspended, inactive, review-required, archived, and deleted-reference organizations cannot resolve as active operating contexts. AI-initiated creation and privileged Owner/Admin membership changes preserve Agent Contract and Human Review requirements.

## Validation boundary

The foundation is accepted only when type checking, linting, formatting, all required fixture validators, the complete repository test suite, contract acceptance, behavior acceptance, and the Book 02 MVP gap baseline pass together against the clean branch state.
