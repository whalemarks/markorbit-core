# Core Policy Contract Skeletons

Core Policy Contract Skeletons introduce an explicit Policy Contract layer in MarkOrbit Core. They provide stable, inspectable contract placeholders for baseline policy concerns before any executable policy capability exists.

These skeletons exist to name policy boundaries, register them in the Core Contract Index, and preserve separation between Core specification records and later execution behavior. They do not implement a policy engine, rule evaluation, runtime enforcement, or compliance decision logic.

The `protectedAction` and `requiresHumanReview` fields are contract flags only. They describe intended contract posture in text and metadata; they do not grant enforcement behavior, approve actions, deny actions, or gate workflows.

Book 03 may later consume approved Policy contracts for execution gates, but that work must happen in explicit future tasks. These skeletons do not add Book 03 runtime contracts and do not create workflow gates.

AI assistants and agents may not define, bypass, approve, enforce, or evaluate policies independently. Product UI may later display policy states, but it must not invent policy semantics or create policy behavior outside approved Core contracts.

Future tasks may expand selected policy skeletons into full Policy contracts through explicit approval while preserving Core / Execution / Product boundaries.
