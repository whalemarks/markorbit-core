import { execFileSync } from 'node:child_process';
const output = execFileSync('pnpm', ['pack', '--dry-run'], {
  encoding: 'utf8'
});
const listed = output
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
const forbidden = [
  /^tests\//,
  /^fixtures\//,
  /^src\//,
  /^coverage\//,
  /AGENTS\.md$/,
  /\.map$/,
  /^CORE-TASK/i,
  /temporary/i,
  /tmp/i
];
const violations = listed.filter((file) =>
  forbidden.some((pattern) => pattern.test(file))
);
if (violations.length > 0) {
  console.error(`Forbidden package files:\n${violations.join('\n')}`);
  process.exit(1);
}
const required = [
  'dist/index.js',
  'dist/index.d.ts',
  'package.json',
  'README.md',
  'CORE-MANIFEST.md'
];
const missing = required.filter((file) => !listed.includes(file));
if (missing.length > 0) {
  console.error(`Missing package files:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log('Package content check passed.');
