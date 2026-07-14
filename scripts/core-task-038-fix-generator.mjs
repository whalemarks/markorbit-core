import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('src/services/trademark', { recursive: true });

const path = 'scripts/core-task-038-generate.mjs';
let content = readFileSync(path, 'utf8');

const initialStatusSearch = String.raw`      !['Draft', 'ReviewRequired', 'Active'].includes(\n        String(input.trademarkStatus)\n      )`;
const initialStatusReplacement = String.raw`      !['Draft', 'ReviewRequired', 'Active'].includes(String(input.trademarkStatus))`;
if (!content.includes(initialStatusSearch)) {
  throw new Error('Generator initial-status search target not found.');
}
content = content.replace(initialStatusSearch, initialStatusReplacement);

const brandTestSearch = String.raw`  it('requires a registered active Brand reference', () => {\n    const { service, traces } = setup(false);`;
const customerTestSearch = String.raw`  it('requires a registered active Customer reference', () => {\n    const { service, traces } = setup(false);`;
if (!content.includes(brandTestSearch)) {
  throw new Error('Generator Brand-test search target not found.');
}
content = content.replace(brandTestSearch, customerTestSearch);

writeFileSync(path, content);
