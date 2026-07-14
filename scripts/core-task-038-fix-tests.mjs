import { readFileSync, writeFileSync } from 'node:fs';

const path = 'tests/unit/core-trademark-service-core-lifecycle.test.ts';
let content = readFileSync(path, 'utf8');
const replacements = [
  ["    trademarkStatus: 'Active',", "    trademarkStatus: 'Draft',"],
  [
    "      filters: { trademarkType: 'Word', trademarkStatus: 'Active' },",
    "      filters: { trademarkType: 'Word', trademarkStatus: 'Draft' },"
  ]
];
for (const [search, replacement] of replacements) {
  if (!content.includes(search)) throw new Error(`Missing test target: ${search}`);
  content = content.replace(search, replacement);
}
writeFileSync(path, content);
