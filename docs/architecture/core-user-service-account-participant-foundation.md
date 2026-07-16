# User Service Account-Participant Foundation

CORE-TASK-052 implements the Book 02 governed User Service boundary for stable account-participant references, lifecycle, required Identity linkage, explicit Organization-context linkage, safe reference validation, deterministic Identity resolution, archival, auditability, and Event trace handoff.

User Service owns the account participant. It does not authenticate credentials, store passwords or OAuth/SAML secrets, issue sessions or tokens, own Identity or Organization records, grant Permission, evaluate Policy, infer Organization membership, or create Customer, Agent, Partner, or Service Provider contact records.

The User Object and User Service specifications use different user-type vocabularies. This implementation locks the Service specification values (`InternalUser`, `ExternalUser`, `CustomerPortalUser`, `AgentPortalUser`, `ServiceProviderPortalUser`, `SystemLinkedUser`, `Unknown`) because CORE-TASK-052 implements the Service contract. The mismatch remains explicit rather than silently widening the service API.

Mutations are organization-scoped, idempotent, immutable at the public boundary, and roll back when Event trace handoff fails. A User always requires an active Identity. Suspended, inactive, review-required, archived, and deleted-reference Users cannot resolve as active participants. AI-initiated creation, Identity relinking, and privileged Organization linkage preserve Agent Contract and Human Review requirements.

The resulting Book 02 Must Build baseline is `48 / 3 / 41`, leaving Permission Service and Policy Service as the remaining foundational Service gaps.

## Validation boundary

The foundation is accepted only when type checking, linting, formatting, all required fixture validators, the complete repository test suite, contract acceptance, behavior acceptance, and the Book 02 MVP gap baseline pass together against the clean branch state.

The service-contract and Book 02 baseline fixtures are derived evidence. They must be rebuilt deterministically from the checked-in TypeScript authorities before validation, rather than edited independently as alternative sources of truth.
