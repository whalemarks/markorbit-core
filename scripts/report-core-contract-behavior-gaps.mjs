import { CORE_CONTRACT_BEHAVIOR_GAP_INVENTORY as inventory } from '../src/index.ts';

console.log('Core contract behavior gap inventory');
console.log('====================================');
console.log(
  `Baseline behavior targets: ${inventory.summary.baselineTargetCount}`
);
console.log(`Minimum-depth gap targets: ${inventory.summary.gapTargetCount}`);
console.log(`Total depth increment: ${inventory.summary.totalDepthIncrement}`);
console.log(
  `Implementation batches: ${inventory.summary.implementationBatchCount}`
);
console.log(
  `Minimum-satisfied exclusions: ${inventory.summary.excludedMinimumSatisfiedTargetCount}`
);
console.log('');
for (const batch of inventory.implementationBatches) {
  console.log(
    `- ${batch.id}: ${batch.name}; ${batch.targetCount} targets; +${batch.depthIncrement} depth; depends on ${batch.dependsOn.join(', ') || 'none'}`
  );
}
console.log('');
console.log(
  'Boundary: inventory lock only; no behavior is implemented by this task.'
);
