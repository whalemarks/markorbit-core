import { CORE_CONTRACT_BEHAVIOR_COVERAGE_BASELINE as baseline } from '../src/index.ts';

console.log('Core contract behavior coverage baseline');
console.log('========================================');
console.log(`Behavior targets: ${baseline.summary.totalTargetCount}`);
console.log(`Meets minimum depth: ${baseline.summary.meetsMinimumDepthCount}`);
console.log(`Partial: ${baseline.summary.partialTargetCount}`);
console.log(`Not implemented: ${baseline.summary.notImplementedTargetCount}`);
console.log(
  `Must Build Now at minimum depth: ${baseline.summary.mustBuildNowMeetsMinimumDepthCount}/${baseline.summary.mustBuildNowTargetCount}`
);
console.log('');
for (const target of baseline.targets) {
  console.log(
    `- ${target.id}: Level ${target.currentDepth}; required Level ${target.requiredMinimumDepth}-${target.requiredMaximumDepth}; ${target.status}`
  );
}
console.log('');
console.log(
  `Behavior acceptance ready: ${baseline.summary.behaviorAcceptanceReady ? 'yes' : 'no'}`
);
console.log(
  'Boundary: minimum-depth Core behavior hooks are accepted; Execution System and production readiness are not.'
);
