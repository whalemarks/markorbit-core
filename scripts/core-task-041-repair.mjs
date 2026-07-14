import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/service-coverage/core-document-service-evidence-fixture.ts';
let content = readFileSync(path, 'utf8');
content = content.replace(
  "  const clocks = fixture.clocks.map(String);\n  const service = new CoreDocumentService({",
  "  const clocks = fixture.clocks.map(String);\n  const lastClock = clocks.at(-1) ?? '';\n  const service = new CoreDocumentService({"
);
content = content.replace(
  "    now: () => clocks.shift() ?? String(fixture.clocks.at(-1)),",
  "    now: () => clocks.shift() ?? lastClock,"
);
writeFileSync(path, content);
