import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  CORE_SAFETY_BOUNDARY_FIXTURE,
  validateCoreSafetyBoundaryFoundationsFixture
} from '../../src/index.ts';

const fixture = JSON.parse(
  await readFile(
    new URL(
      '../../fixtures/behaviors/core-safety-boundary-foundations.fixture.json',
      import.meta.url
    ),
    'utf8'
  )
) as unknown;

describe('core-safety-boundary-foundations fixture', () => {
  it('matches the canonical deterministic fixture exactly', () => {
    assert.deepEqual(fixture, CORE_SAFETY_BOUNDARY_FIXTURE);
  });

  it('passes executable fixture validation', () => {
    assert.equal(
      validateCoreSafetyBoundaryFoundationsFixture(fixture).ok,
      true
    );
  });
});
