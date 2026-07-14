import { readFileSync, writeFileSync } from 'node:fs';

const packagePath = 'package.json';
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
packageJson.scripts['format:check'] = packageJson.scripts.format.replace(
  'prettier --write',
  'prettier --check'
);
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
