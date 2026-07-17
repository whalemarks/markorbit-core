from pathlib import Path

requirements = Path('src/mvp-coverage/book-02-mvp-requirements.ts')
text = requirements.read_text()
text = text.replace(
    "  'api-layer-does-not-emit-events-directly': ['must-test-api-contract-tests'],",
    "  'api-layer-does-not-emit-events-directly': MUST_BUILD_DOMAINS.map(\n    (domain) => `must-api-${domain}-api-contract`\n  ),",
)
requirements.write_text(text)

for path in Path('tests/unit').glob('*.test.ts'):
    text = path.read_text()
    original = text
    text = text.replace('meets_required_depth: 80', 'meets_required_depth: 86')
    text = text.replace('validated_skeleton_only: 27', 'validated_skeleton_only: 21')
    text = text.replace('acceptanceCriteriaSatisfied,\n      12', 'acceptanceCriteriaSatisfied,\n      14')
    if path.name == 'core-task-055-post-service-completion-audit.test.ts':
        text = text.replace("assert.equal(audit.nextTask, 'CORE-TASK-057C');", "assert.equal(audit.nextTask, 'CORE-TASK-058A');")
        text = text.replace('remaining 35 unresolved Must Build requirements', 'remaining 29 unresolved Must Build requirements')
        text = text.replace('audit.unresolvedInventory.total, 35', 'audit.unresolvedInventory.total, 29')
        text = text.replace('      api: 6,\n', '')
        text = text.replace('        17\n', '        11\n')
        text = text.replace('locks the seven unresolved acceptance criteria exactly', 'locks the five unresolved acceptance criteria exactly')
        text = text.replace("        'must-build-api-validators-exist',\n", '')
        text = text.replace("        'api-layer-does-not-emit-events-directly',\n", '')
        text = text.replace('[0, 7, 4, 6, 0]', '[0, 1, 4, 6, 0]')
    elif path.name == 'core-task-056-book-02-event-evidence.test.ts':
        text = text.replace('unresolvedInventory.total,\n      35', 'unresolvedInventory.total,\n      29')
        text = text.replace('completionBlockingNonDomainRequirementIds.length,\n      17', 'completionBlockingNonDomainRequirementIds.length,\n      11')
        text = text.replace("      'CORE-TASK-057C'", "      'CORE-TASK-058A'")
    elif path.name == 'core-task-057a-book-02-api-evidence.test.ts':
        text = text.replace('leaves the remaining six API requirements structural and fail-closed', 'confirms no Must Build API requirements remain structural')
        text = text.replace('assert.equal(incomplete.length, 6);', 'assert.equal(incomplete.length, 0);')
        text = text.replace('without falsely completing the API acceptance criterion', 'and completes the API acceptance criterion')
        text = text.replace('assert.equal(apiCriterion?.satisfied, false);', 'assert.equal(apiCriterion?.satisfied, true);')
        text = text.replace('retains six unresolved API blockers and selects CORE-TASK-057C', 'closes API blockers and selects CORE-TASK-058A')
        text = text.replace('unresolvedInventory.total,\n      35', 'unresolvedInventory.total,\n      29')
        text = text.replace("assert.equal(\n      BOOK_02_POST_SERVICE_COMPLETION_AUDIT.unresolvedInventory.byLayer.api,\n      6\n    );", "assert.equal(\n      'api' in BOOK_02_POST_SERVICE_COMPLETION_AUDIT.unresolvedInventory.byLayer,\n      false\n    );")
        text = text.replace('completionBlockingNonDomainRequirementIds.length,\n      17', 'completionBlockingNonDomainRequirementIds.length,\n      11')
        text = text.replace("      'CORE-TASK-057C'", "      'CORE-TASK-058A'")
    elif path.name == 'core-task-057b-book-02-api-evidence.test.ts':
        text = text.replace('without claiming all-API completion', 'as part of completed all-API coverage')
        text = text.replace('summary.mustBuildNow.meets_required_depth,\n      80', 'summary.mustBuildNow.meets_required_depth,\n      86')
        text = text.replace('summary.mustBuildNow.validated_skeleton_only,\n      27', 'summary.mustBuildNow.validated_skeleton_only,\n      21')
    if text != original:
        path.write_text(text)
