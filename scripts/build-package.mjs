import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const dist = join(root, 'dist');

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(path);
    }
  }
  return files.sort();
}

await rm(dist, { recursive: true, force: true });
execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'], {
  stdio: 'inherit'
});

const files = await collectTypeScriptFiles(sourceRoot);
for (const file of files) {
  const source = await readFile(file, 'utf8');
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
  const out = join(dist, relative(sourceRoot, file).replace(/\.ts$/, '.js'));
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, output);
}
