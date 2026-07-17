# CORE-TASK-057B Domain API Boundaries

## Authority

- Core base: merged CORE-TASK-057A correction (`bf001573fe978ca6915e86f547c1be44b275a045`).
- Book 02 remains locked to publication commit `3349ecb8955021a8714d023348f8b24f941eb98f`.

## Scope

This task upgrades seven structural APIs to executable governed boundaries:

- Customer API
- Brand API
- Trademark API
- Jurisdiction API
- Classification API
- Document API
- Evidence API

Each API must validate request and response envelopes, enforce version, governance, reference and idempotency requirements, delegate only to its owning Service contract, return safe immutable responses, and prove that it cannot mutate Domain state or emit Domain Events directly.

## Exclusions

- No HTTP server, router or transport runtime.
- No authentication/session/token implementation.
- No API-owned persistence or business logic.
- No direct Domain mutation or Domain Event emission.
- No CORE-TASK-057C API work.

## Expected Book 02 effect

Seven API requirements should move from `validated_skeleton_only` to `meets_required_depth`. Global all-API acceptance remains open until CORE-TASK-057C completes the final six APIs.
