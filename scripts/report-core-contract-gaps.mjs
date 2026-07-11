import { CORE_CONTRACT_GAP_INVENTORY } from '../src/contract-coverage/index.ts';

const { summary } = CORE_CONTRACT_GAP_INVENTORY;

console.log('Book 2 contract gap inventory');
console.log('=============================');
console.log(
  `Current indexed contracts: ${summary.currentIndexedContractCount}`
);
console.log(`Domain-layer targets: ${summary.domainTargetCount}`);
console.log(
  `Mapped to existing skeletons: ${summary.mappedExistingDomainTargetCount}`
);
console.log(`New domain-layer targets: ${summary.newDomainTargetCount}`);
console.log('');
console.log('New canonical targets by layer');
console.log(`- object: ${summary.newObjectTargetCount}`);
console.log(`- service: ${summary.newServiceTargetCount}`);
console.log(`- api: ${summary.newApiTargetCount}`);
console.log(`- common: ${summary.newCommonTargetCount}`);
console.log(`- workflow: ${summary.newWorkflowTargetCount}`);
console.log(`- test: ${summary.newTestTargetCount}`);
console.log('');
console.log(
  `Total new canonical targets: ${summary.totalNewCanonicalTargetCount}`
);
console.log(
  `Projected index after all batches: ${summary.projectedIndexedContractCount}`
);
console.log('');
console.log('Implementation batches');

for (const batch of CORE_CONTRACT_GAP_INVENTORY.implementationBatches) {
  console.log(`- ${batch.id}: ${batch.targetCount} — ${batch.name}`);
}

console.log('');
console.log(
  'Boundary: inventory lock only; CORE_CONTRACT_INDEX remains unchanged in CORE-TASK-019.'
);
