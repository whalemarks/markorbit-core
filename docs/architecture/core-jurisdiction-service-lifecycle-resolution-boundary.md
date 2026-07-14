# Core Jurisdiction Service lifecycle and resolution boundary

Jurisdiction Service is the fourth Service-owned behavior batch selected from the locked Book 02 MVP gap baseline.

## Selection rationale

Book 02 places Jurisdiction after Trademark and before Classification, Matter, Document/Evidence requirement scoping, and Routing input validation. Jurisdiction is the canonical territorial and procedural context required by downstream professional execution.

## Exact operation scope

Planned operations:

- createJurisdiction
- getJurisdiction
- listJurisdictions
- validateJurisdictionReference
- resolveJurisdictionByCode
- changeJurisdictionStatus

The Service will manage canonical Jurisdiction identity, code, type, lifecycle status, safe reference validation, and deterministic code resolution.

## Explicit non-goals

- updateJurisdiction
- office-reference linkage
- rule, Knowledge, or Policy linkage
- service-scope linkage
- parent or region hierarchy mutation
- legal-rule calculation
- fee or deadline calculation
- official registry synchronization
- Routing decisions
- Jurisdiction API validators
- Workflow preview/apply
- persistence or Event bus runtime
- Book 02 MVP completion
- production readiness
