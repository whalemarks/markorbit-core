import {
  CORE_CONTRACT_GAP_INVENTORY,
  CORE_CONTRACT_GAP_PROGRESS
} from '../src/contract-coverage/index.ts';

const { summary } = CORE_CONTRACT_GAP_INVENTORY;

console.log('Book 2 contract gap inventory');
console.log('=============================');
console.log(
  `Inventory baseline contracts: ${summary.currentIndexedContractCount}`
);
console.log(
  `Current indexed contracts: ${CORE_CONTRACT_GAP_PROGRESS.currentIndexedContractCount}`
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
  `Completed canonical targets: ${CORE_CONTRACT_GAP_PROGRESS.completedCanonicalTargetCount}`
);
console.log(
  `Remaining canonical targets: ${CORE_CONTRACT_GAP_PROGRESS.remainingCanonicalTargetCount}`
);
console.log(
  `Projected index after all batches: ${summary.projectedIndexedContractCount}`
);
console.log('');
console.log('Implementation batches');

for (const batch of CORE_CONTRACT_GAP_INVENTORY.implementationBatches) {
  const progress = CORE_CONTRACT_GAP_PROGRESS.batches.find(
    (entry) => entry.id === batch.id
  );
  console.log(
    `- ${batch.id}: ${progress?.completedTargetCount ?? 0}/${batch.targetCount} ${progress?.state ?? 'pending'} — ${batch.name}`
  );
}

console.log('');
console.log(
  'Boundary: progress tracks validated skeleton batches only; runtime and behavior remain unassessed.'
);
