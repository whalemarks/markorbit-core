# CORE-TASK-045 — Opportunity Service Potential-Demand Foundation

Opportunity Service records governed potential service needs before commercial commitment. It preserves the boundary `signal → Opportunity → qualified Opportunity → Order → Matter` and does not provide a general CRM, campaign engine, lead-scoring engine, sales forecast, or professional execution runtime.

AI recommendations remain source/reference material. AI-origin registration and qualification require explicit approved human review. Conversion is permitted only for a qualified Opportunity with Customer and service-scope context, and delegates creation to an approved Order Service port. The Opportunity mutation and external conversion are rolled back when the required Event trace cannot be appended.

This is a Phase 4 partial implementation under the locked Book 02 authority. Persistence, APIs, marketing automation, autonomous qualification, direct Matter creation, and production readiness remain out of scope.
