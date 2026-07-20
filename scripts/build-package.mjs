import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const dist = join(root, 'dist');
await rm(dist, { recursive: true, force: true });
execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'], {
  stdio: 'inherit'
});
const files = execFileSync('rg', ['--files', 'src', '-g', '*.ts'], {
  encoding: 'utf8'
})
  .trim()
  .split('\n')
  .filter(Boolean);
for (const file of files) {
  const source = await readFile(join(root, file), 'utf8');
  const output = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        sourceMap: false
      }
    })
    .outputText.replace(
      /((?:from|import)\s*\(?\s*['"])(\.\.?\/[^'"]+)\.ts(['"])/g,
      '$1$2.js$3'
    );
  const out = join(dist, relative('src', file).replace(/\.ts$/, '.js'));
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, output);
}
