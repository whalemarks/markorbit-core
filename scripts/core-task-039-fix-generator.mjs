import { readFileSync, writeFileSync } from 'node:fs';

const path = 'scripts/core-task-039-generate-service.mjs';
let text = readFileSync(path, 'utf8');

const replacements = [
  [
    "service = required(service, `          'publicReferenceId',\\n          'jurisdictionType',`, `          'publicReferenceId',\\n          'jurisdictionCode',\\n          'jurisdictionType',`, 'sort code');",
    "service = required(service, `        allowedSortFields: ['publicReferenceId', 'jurisdictionType', 'jurisdictionStatus'],`, `        allowedSortFields: ['publicReferenceId', 'jurisdictionCode', 'jurisdictionType', 'jurisdictionStatus'],`, 'sort code');"
  ],
  [
    "service = regexRequired(service, /isValid: !\\[[\\s\\S]*?record\\.jurisdictionStatus\\n        \\),/, `isValid: record.jurisdictionStatus === 'Active',`, 'valid status');",
    ""
  ],
  [
    "service = regexRequired(service, /reasonCode:\\n[\\s\\S]*?: 'Valid'/, `reasonCode:\\n          record.jurisdictionStatus === 'Draft'\\n            ? 'Draft'\\n            : record.jurisdictionStatus === 'ReviewRequired'\\n              ? 'ReviewRequired'\\n              : record.jurisdictionStatus === 'Deprecated'\\n                ? 'Deprecated'\\n                : record.jurisdictionStatus === 'Reserved'\\n                  ? 'Reserved'\\n                  : record.jurisdictionStatus === 'Archived'\\n                    ? 'Archived'\\n                    : 'Valid'`, 'reason output');",
    "service = required(service, `        reasonCode:\\n          record.jurisdictionStatus === 'Active' ? 'Valid' : record.jurisdictionStatus`, `        reasonCode:\\n          record.jurisdictionStatus === 'Draft'\\n            ? 'Draft'\\n            : record.jurisdictionStatus === 'ReviewRequired'\\n              ? 'ReviewRequired'\\n              : record.jurisdictionStatus === 'Deprecated'\\n                ? 'Deprecated'\\n                : record.jurisdictionStatus === 'Reserved'\\n                  ? 'Reserved'\\n                  : record.jurisdictionStatus === 'Archived'\\n                    ? 'Archived'\\n                    : 'Valid'`, 'reason output');"
  ]
];

for (const [search, replacement] of replacements) {
  if (!text.includes(search)) throw new Error(`Missing generator repair target: ${search.slice(0, 80)}`);
  text = text.replace(search, replacement);
}

writeFileSync(path, text);
