import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/services/classification/core-classification-service.ts';
let content = readFileSync(path, 'utf8');

content = content.replace(
  "    const items = this.deps.store\n      .list()",
  "    const classReferenceFilter =\n      typeof input.filters?.classReference === 'string'\n        ? input.filters.classReference\n        : undefined;\n    const items = this.deps.store\n      .list()"
);
content = content.replace(
  "          (input.filters?.classReference === undefined ||\n            record.classReferences.includes(input.filters.classReference))",
  "          (classReferenceFilter === undefined ||\n            record.classReferences.includes(classReferenceFilter))"
);
content = content.replace(
  "        const updated: CoreClassificationServiceRecord = {",
  "        if (current.objectRecord.version === undefined) {\n          return safe(\n            'ValidationFailed',\n            'Classification Object version is required.',\n            input.governance.correlationId\n          );\n        }\n        const updated: CoreClassificationServiceRecord = {"
);

writeFileSync(path, content);
