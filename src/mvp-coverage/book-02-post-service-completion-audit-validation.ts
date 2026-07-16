import {
  BOOK_02_POST_SERVICE_COMPLETION_AUDIT,
  type Book02PostServiceCompletionAudit
} from './book-02-post-service-completion-audit.ts';

export interface Book02PostServiceAuditValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

const issue = (
  code: string,
  message: string,
  path?: string
): Book02PostServiceAuditValidationIssue => ({ code, message, path });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function validateBook02PostServiceCompletionAudit(
  value: unknown
): readonly Book02PostServiceAuditValidationIssue[] {
  if (!isRecord(value))
    return [
      issue(
        'book02.post_service_audit.invalid',
        'Post-Service audit must be an object.'
      )
    ];
  if (value.fixtureType !== 'book_02_post_service_completion_audit')
    return [
      issue(
        'book02.post_service_audit.fixture_type',
        'Post-Service audit fixture type is invalid.',
        'fixtureType'
      )
    ];
  const actual = value as unknown as Book02PostServiceCompletionAudit;
  const expected = BOOK_02_POST_SERVICE_COMPLETION_AUDIT;
  const issues: Book02PostServiceAuditValidationIssue[] = [];
  if (JSON.stringify(actual.authority) !== JSON.stringify(expected.authority))
    issues.push(
      issue(
        'book02.post_service_audit.authority_drift',
        'Post-Service audit authority drifted.',
        'authority'
      )
    );
  if (
    JSON.stringify(actual.sourceBaseline) !==
    JSON.stringify(expected.sourceBaseline)
  )
    issues.push(
      issue(
        'book02.post_service_audit.baseline_drift',
        'Post-Service source baseline drifted.',
        'sourceBaseline'
      )
    );
  if (
    JSON.stringify(actual.serviceClosure) !==
    JSON.stringify(expected.serviceClosure)
  )
    issues.push(
      issue(
        'book02.post_service_audit.service_closure_drift',
        'Post-Service Service closure drifted.',
        'serviceClosure'
      )
    );
  if (
    JSON.stringify(actual.unresolvedInventory) !==
    JSON.stringify(expected.unresolvedInventory)
  )
    issues.push(
      issue(
        'book02.post_service_audit.inventory_drift',
        'Post-Service unresolved inventory drifted.',
        'unresolvedInventory'
      )
    );
  if (
    JSON.stringify(actual.completionSemantics) !==
    JSON.stringify(expected.completionSemantics)
  )
    issues.push(
      issue(
        'book02.post_service_audit.completion_semantics_drift',
        'Post-Service completion semantics drifted.',
        'completionSemantics'
      )
    );
  if (
    JSON.stringify(actual.executionWorkstreams) !==
    JSON.stringify(expected.executionWorkstreams)
  )
    issues.push(
      issue(
        'book02.post_service_audit.workstream_drift',
        'Post-Service execution workstreams drifted.',
        'executionWorkstreams'
      )
    );
  if (actual.nextTask !== expected.nextTask)
    issues.push(
      issue(
        'book02.post_service_audit.next_task_drift',
        'Post-Service next task drifted.',
        'nextTask'
      )
    );
  if (actual.serviceClosure.zeroServiceGap !== true)
    issues.push(
      issue(
        'book02.post_service_audit.service_gap_reopened',
        'All 18 Must Build Services must remain closed.',
        'serviceClosure.zeroServiceGap'
      )
    );
  if (actual.sourceBaseline.book02MvpComplete !== false)
    issues.push(
      issue(
        'book02.post_service_audit.false_completion',
        'Post-Service state must not claim Book 02 MVP completion.',
        'sourceBaseline.book02MvpComplete'
      )
    );
  return issues;
}
