# Identity Service Authority Foundation

CORE-TASK-050 implements the Book 02 governed Identity Service boundary for stable actor recognition, lifecycle, governed reference linkage, explicit validation, deterministic resolution, archival, auditability, and Event trace handoff.

Identity Service recognizes an actor reference. It does not authenticate credentials, store passwords or OAuth/SAML secrets, create User profiles, define Organization membership, grant Permission, evaluate Policy decisions, assign roles, or authorize AI capability.

The Identity Object and Identity Service specifications use slightly different type vocabularies. This implementation locks the Service specification values (`Human`, `System`, `AIAgent`, `ServiceAccount`, `ExternalActor`, `Unknown`) because CORE-TASK-050 implements the Service contract. The mismatch remains explicit rather than silently widening the service API.

Mutations are organization-scoped, idempotent, immutable at the public boundary, and roll back when Event trace handoff fails. Suspended, review-required, archived, and deleted-reference identities cannot be treated as active actor references. AI-initiated human identity creation and sensitive User linkage preserve Human Review.

## Validation boundary

The foundation is accepted only when type checking, linting, formatting, all required fixture validators, the complete repository test suite, contract acceptance, behavior acceptance, and the Book 02 MVP gap baseline pass together against the clean branch state.
