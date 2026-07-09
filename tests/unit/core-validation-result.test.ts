import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CORE_VALIDATION_SEVERITIES, createCoreValidationResult } from '../../src/index.ts';

describe('CoreValidationResult', () => {
  it('returns ok true with no issues', () => {
    assert.equal(createCoreValidationResult([]).ok, true);
  });

  it('returns ok true with only warnings and info', () => {
    assert.equal(createCoreValidationResult([
      { code: 'warning', severity: 'warning', message: 'warning' },
      { code: 'info', severity: 'info', message: 'info' }
    ]).ok, true);
  });

  it('returns ok false with at least one error', () => {
    assert.equal(createCoreValidationResult([
      { code: 'error', severity: 'error', message: 'error' }
    ]).ok, false);
  });

  it('CoreValidationSeverity contains exactly error, warning, info', () => {
    assert.deepEqual(CORE_VALIDATION_SEVERITIES, ['error', 'warning', 'info']);
  });
});
