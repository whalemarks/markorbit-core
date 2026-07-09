import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MARKORBIT_CORE_VERSION } from '../../src/index.ts';

describe('MARKORBIT_CORE_VERSION', () => {
  it('exists', () => {
    assert.ok(MARKORBIT_CORE_VERSION);
  });
});
