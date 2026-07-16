import {
  BOOK_02_POST_SERVICE_COMPLETION_AUDIT,
  validateBook02PostServiceCompletionAudit
} from '../src/index.ts';

const issues = validateBook02PostServiceCompletionAudit(
  BOOK_02_POST_SERVICE_COMPLETION_AUDIT
);
const audit = BOOK_02_POST_SERVICE_COMPLETION_AUDIT;

console.log('Book 02 post-service completion audit');
console.log('====================================');
console.log(
  `Service gap: ${audit.serviceClosure.zeroServiceGap ? 'zero' : 'open'}`
);
console.log(
  `Unresolved Must Build requirements: ${audit.unresolvedInventory.total}`
);
console.log(
  `Unresolved acceptance criteria: ${audit.unresolvedInventory.unresolvedAcceptanceCriterionIds.length}`
);
console.log(
  `Completion-blocking non-Domain requirements: ${audit.completionSemantics.completionBlockingNonDomainRequirementIds.length}`
);
console.log(`Next task: ${audit.nextTask}`);

for (const workstream of audit.executionWorkstreams) {
  console.log(
    `${workstream.order}. ${workstream.id}: ${workstream.taskIds.join(', ')}`
  );
}

for (const auditIssue of issues) {
  console.error(
    `[${auditIssue.code}] ${auditIssue.message}${auditIssue.path ? ` (${auditIssue.path})` : ''}`
  );
}

if (issues.length > 0) process.exitCode = 1;
