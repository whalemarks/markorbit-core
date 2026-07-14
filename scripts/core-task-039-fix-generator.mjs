import { readFileSync, writeFileSync } from 'node:fs';

const path = 'scripts/core-task-039-generate-service.mjs';
let text = readFileSync(path, 'utf8');
const oldTarget = "service = required(service, `          'publicReferenceId',\\n          'jurisdictionType',`, `          'publicReferenceId',\\n          'jurisdictionCode',\\n          'jurisdictionType',`, 'sort code');";
const newTarget = "service = required(service, `        allowedSortFields: ['publicReferenceId', 'jurisdictionType', 'jurisdictionStatus'],`, `        allowedSortFields: ['publicReferenceId', 'jurisdictionCode', 'jurisdictionType', 'jurisdictionStatus'],`, 'sort code');";
if (!text.includes(oldTarget)) throw new Error('Missing sort-field generator target.');
text = text.replace(oldTarget, newTarget);
writeFileSync(path, text);
