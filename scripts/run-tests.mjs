import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8');

if (!source.includes('MARKORBIT_CORE_VERSION')) {
  throw new Error('MARKORBIT_CORE_VERSION export is missing.');
}

console.log('MARKORBIT_CORE_VERSION exists.');
