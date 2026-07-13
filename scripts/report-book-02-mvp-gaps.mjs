import { readFile } from 'node:fs/promises';
import {
  BOOK_02_MVP_GAP_BASELINE,
  validateBook02MvpGapBaseline,
  validateBook02MvpFixture
} from '../src/mvp-coverage/index.ts';
const baseline = BOOK_02_MVP_GAP_BASELINE;
const fixture = JSON.parse(
  await readFile(
    'fixtures/mvp-coverage/book-02-mvp-gap-baseline.fixture.json',
    'utf8'
  )
);
const issues = [
  ...validateBook02MvpGapBaseline(baseline),
  ...validateBook02MvpFixture(fixture)
];
console.log(
  `Book 02 authority: ${baseline.authority.repository} @ ${baseline.authority.commit}`
);
console.log('\nMust Build Now:');
for (const [k, v] of Object.entries(baseline.summary.mustBuildNow))
  console.log(`- ${k}: ${v}`);
console.log('\nStub Now:');
console.log(`- total: ${baseline.summary.stubNow.total}`);
console.log(`- safely bounded: ${baseline.summary.stubNow.safelyBounded}`);
console.log(
  `- overbuilt or production-depth violations: ${baseline.summary.stubNow.productionDepthViolations}`
);
console.log('\nDocument Only:');
console.log(`- total: ${baseline.summary.documentOnly.total}`);
console.log(
  `- inspection complete: ${baseline.summary.documentOnly.inspectionComplete}`
);
console.log(
  `- inspection incomplete: ${baseline.summary.documentOnly.inspectionIncomplete}`
);
console.log(
  `- unexpected implementation count: ${baseline.summary.documentOnly.unexpectedImplementationCount}`
);
console.log('\nDefer:');
console.log(`- total: ${baseline.summary.defer.total}`);
console.log(
  `- inspection complete: ${baseline.summary.defer.inspectionComplete}`
);
console.log(
  `- inspection incomplete: ${baseline.summary.defer.inspectionIncomplete}`
);
console.log(
  `- unexpected blocking implementation count: ${baseline.summary.defer.unexpectedBlockingImplementationCount}`
);
console.log('\nNever in MVP:');
console.log(`- total: ${baseline.summary.neverInMvp.total}`);
console.log(
  `- inspection complete: ${baseline.summary.neverInMvp.inspectionComplete}`
);
console.log(
  `- inspection incomplete: ${baseline.summary.neverInMvp.inspectionIncomplete}`
);
console.log(`- violation count: ${baseline.summary.neverInMvp.violationCount}`);
console.log('\nMVP acceptance:');
console.log(
  `- criteria satisfied / 19: ${baseline.summary.acceptance.acceptanceCriteriaSatisfied} / ${baseline.summary.acceptance.acceptanceCriteriaTotal}`
);
console.log(
  `- unresolved criteria: ${baseline.summary.acceptance.unresolvedCriteria.join(', ')}`
);
console.log(
  `- book02MvpComplete: ${baseline.summary.acceptance.book02MvpComplete}`
);
console.log('\nKnown execution-spine gaps:');
for (const gap of baseline.summary.knownExecutionSpineGaps)
  console.log(`- ${gap}`);
if (issues.length > 0) {
  console.error('\nBook 02 MVP gap validation failed.');
  for (const issue of issues)
    console.error(
      `[${issue.code}] ${issue.message}${issue.path ? ` (${issue.path})` : ''}`
    );
  process.exit(1);
}
console.log('\nBook 02 MVP gap baseline validation passed.');
