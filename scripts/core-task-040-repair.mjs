import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/services/classification/core-classification-service.ts';
let content = readFileSync(path, 'utf8');

const filterBlock = `    const classReferenceFilter =
      typeof input.filters?.classReference === 'string'
        ? input.filters.classReference
        : undefined;`;
while (content.includes(`${filterBlock}\n${filterBlock}`)) {
  content = content.replace(`${filterBlock}\n${filterBlock}`, filterBlock);
}
if (!content.includes(filterBlock)) {
  content = content.replace(
    "    const items = this.deps.store\n      .list()",
    `${filterBlock}\n    const items = this.deps.store\n      .list()`
  );
}
content = content.replace(
  "          (input.filters?.classReference === undefined ||\n            record.classReferences.includes(input.filters.classReference))",
  "          (classReferenceFilter === undefined ||\n            record.classReferences.includes(classReferenceFilter))"
);

const versionGuard = `        if (current.objectRecord.version === undefined) {
          return safe(
            'ValidationFailed',
            'Classification Object version is required.',
            input.governance.correlationId
          );
        }`;
while (content.includes(`${versionGuard}\n${versionGuard}`)) {
  content = content.replace(`${versionGuard}\n${versionGuard}`, versionGuard);
}
if (!content.includes(versionGuard)) {
  content = content.replace(
    '        const updated: CoreClassificationServiceRecord = {',
    `${versionGuard}\n        const updated: CoreClassificationServiceRecord = {`
  );
}

writeFileSync(path, content);
