import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';

const tempDir = mkdtempSync(join(tmpdir(), 'markorbit-core-pack-'));
try {
  const packOutput = execFileSync(
    'pnpm',
    ['pack', '--pack-destination', tempDir, '--json'],
    { encoding: 'utf8' }
  );
  const packResult = JSON.parse(packOutput);
  const tarball = isAbsolute(packResult.filename)
    ? packResult.filename
    : join(tempDir, packResult.filename);
  const listed = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();

  const forbidden = [
    /^package\/src(?:\/|$)/,
    /^package\/tests(?:\/|$)/,
    /^package\/fixtures(?:\/|$)/,
    /^package\/coverage(?:\/|$)/,
    /^package\/.tmp(?:\/|$)/,
    /^package\/tmp(?:\/|$)/,
    /\.map$/,
    /^package\/CORE-TASK/i,
    /temporary/i
  ];
  const violations = listed.filter((file) =>
    forbidden.some((pattern) => pattern.test(file))
  );
  if (violations.length > 0) {
    console.error(`Forbidden package files:\n${violations.join('\n')}`);
    process.exit(1);
  }

  const required = [
    'package/dist/index.js',
    'package/dist/index.d.ts',
    'package/package.json',
    'package/README.md',
    'package/CORE-MANIFEST.md'
  ];
  const missing = required.filter((file) => !listed.includes(file));
  if (missing.length > 0) {
    console.error(`Missing package files:\n${missing.join('\n')}`);
    process.exit(1);
  }

  console.log('Package archive content check passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
