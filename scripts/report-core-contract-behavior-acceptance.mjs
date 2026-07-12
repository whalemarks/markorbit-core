import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK,
  deriveCoreContractBehaviorAcceptanceSummary,
  validateCoreContractBehaviorAcceptanceLock
} from '../src/behavior-coverage/index.ts';

const errors = validateCoreContractBehaviorAcceptanceLock(
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK
);
if (errors.length > 0) {
  console.error('Behavior acceptance lock validation failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const testFiles = [
  ...new Set(
    CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK.evidence.flatMap(
      (entry) => entry.testFiles
    )
  )
].sort();
for (const file of testFiles) {
  if (!existsSync(file)) {
    console.error(`Missing behavior acceptance evidence test file: ${file}`);
    process.exit(1);
  }
}

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles],
  { stdio: 'inherit' }
);
if (result.status !== 0) process.exit(result.status ?? 1);
const summary = deriveCoreContractBehaviorAcceptanceSummary(
  CORE_CONTRACT_BEHAVIOR_ACCEPTANCE_LOCK
);
console.log('\nPhase 4 Core behavior hook acceptance lock');
console.log('==========================================\n');
console.log(
  `Behavior targets: ${summary.behaviorTargetsAccepted}/${summary.behaviorTargetCount} accepted`
);
console.log(
  `Must Build Now targets: ${summary.mustBuildNowAccepted}/${summary.mustBuildNowTargetCount} accepted`
);
console.log(`Implemented-batch targets: ${summary.implementedBatchTargets}`);
console.log(
  `Preexisting-minimum targets: ${summary.preexistingMinimumTargets}`
);
console.log(
  `Implementation batches: ${summary.implementationBatchesAccepted}/4 accepted`
);
console.log(
  `Evidence mappings: ${summary.evidenceMappings}/${summary.behaviorTargetCount} valid`
);
console.log(`Evidence test files: ${testFiles.length}`);
console.log('Evidence tests: PASS\n');
console.log(
  'PASS Selected Core behavior-hook minimum-depth acceptance is locked.\n'
);
console.log('Boundary:');
console.log('- Book 02 MVP is not accepted.');
console.log('- Domain business behavior is not accepted.');
console.log('- Execution System is not accepted.');
console.log('- Production readiness is not accepted.');
