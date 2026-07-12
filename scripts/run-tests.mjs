import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

async function collectTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(path);
      }

      if (entry.isFile() && entry.name.endsWith('.test.ts')) {
        return [path];
      }

      return [];
    })
  );

  return files.flat().sort();
}

const testFiles = await collectTestFiles('tests');

if (testFiles.length === 0) {
  throw new Error('No test files found.');
}

const testProcess = spawn(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles],
  {
    stdio: 'inherit'
  }
);

testProcess.on('exit', (code, signal) => {
  if (signal) {
    throw new Error(`Test process exited with signal ${signal}.`);
  }

  process.exit(code ?? 1);
});
