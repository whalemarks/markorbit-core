import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/services/jurisdiction/core-jurisdiction-service.ts';
let text = readFileSync(path, 'utf8');
text = text
  .replaceAll('BRAND_OBJECT_CONTRACT_ID', 'JURISDICTION_OBJECT_CONTRACT_ID')
  .replaceAll('BRAND_OBJECT_TYPE', 'JURISDICTION_OBJECT_TYPE')
  .replaceAll('BRAND_DOMAIN', 'JURISDICTION_DOMAIN')
  .replace(" || record.jurisdictionStatus === 'DeletedReferenceOnly'", '');
writeFileSync(path, text);
