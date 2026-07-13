import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/objects/core-mvp-object-validation.ts';
const before = readFileSync(path, 'utf8');
const search = `import {
  createCoreValidationResult,
  type CoreValidationIssue,
  type CoreValidationResult
} from '../validation/index.ts';`;
const replacement = `import {
  createCoreValidationResult,
  type CoreValidationIssue,
  type CoreValidationResult
} from '../validation/core-validation-result.ts';`;
if (!before.includes(search) && !before.includes(replacement)) {
  throw new Error('Missing Object validator validation import target.');
}
writeFileSync(path, before.replace(search, replacement));
