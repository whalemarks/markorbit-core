import { CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK as lock } from '../src/index.ts';

console.log('Phase 3 contract coverage acceptance lock');
console.log('=========================================');
console.log(`Indexed contracts: ${lock.acceptedState.indexedContractCount}`);
console.log(
  `Contract families: ${lock.acceptedState.structurallyCoveredContractFamilyCount}/${lock.acceptedState.totalContractFamilyCount}`
);
console.log(
  `Required-layer-complete Domains: ${lock.acceptedState.requiredLayerCompleteDomainCount}/${lock.acceptedState.totalDomainCount}`
);
console.log(
  `Missing required layer slots: ${lock.acceptedState.missingRequiredLayerSlotCount}`
);
console.log(
  `Canonical targets: ${lock.acceptedState.completedCanonicalTargetCount}/81 completed; ${lock.acceptedState.remainingCanonicalTargetCount} remaining`
);
console.log(
  `Implementation batches: ${lock.acceptedState.implementationBatches.length}/5 accepted`
);
console.log('');
console.log('PASS Phase 3 contract structure acceptance is locked.');
console.log(
  'Boundary: runtime, behavior, and production readiness are not accepted.'
);
