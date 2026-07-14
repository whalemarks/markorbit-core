import { readFileSync, writeFileSync } from 'node:fs';

const path = 'scripts/core-task-038-generate.mjs';
const before = readFileSync(path, 'utf8');
const oldSearch = `      !['Draft', 'ReviewRequired', 'Active'].includes(\n        String(input.trademarkStatus)\n      )`;
const newSearch = `      !['Draft', 'ReviewRequired', 'Active'].includes(String(input.trademarkStatus))`;
if (!before.includes(oldSearch)) {
  throw new Error('Generator initial-status search target not found.');
}
writeFileSync(path, before.replace(oldSearch, newSearch));
