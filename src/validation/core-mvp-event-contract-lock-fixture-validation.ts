import {
  CORE_MVP_EVENT_CONTRACT_LOCKS,
  validateCoreMvpEventContractLocks,
  type CoreMvpEventContractLockEntry
} from '../contracts/event/index.ts';
import { createCoreValidationResult } from './core-validation-result.ts';

export function validateCoreMvpEventContractLockFixture(fixture: unknown) {
  const issues: {
    code: string;
    severity: 'error';
    message: string;
    path?: string;
  }[] = [];
  if (!Array.isArray(fixture)) {
    issues.push({
      code: 'core.mvp_event_lock.fixture_invalid',
      severity: 'error',
      message: 'MVP Event contract lock fixture must be an array.'
    });
    return createCoreValidationResult(issues);
  }
  for (const message of validateCoreMvpEventContractLocks(
    fixture as readonly CoreMvpEventContractLockEntry[]
  )) {
    issues.push({
      code: 'core.mvp_event_lock.validation',
      severity: 'error',
      message
    });
  }
  if (JSON.stringify(fixture) !== JSON.stringify(CORE_MVP_EVENT_CONTRACT_LOCKS))
    issues.push({
      code: 'core.mvp_event_lock.fixture_drift',
      severity: 'error',
      message:
        'MVP Event contract lock fixture must exactly match the deterministic source lock.'
    });
  return createCoreValidationResult(issues);
}
