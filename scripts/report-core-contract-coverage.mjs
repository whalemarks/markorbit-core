import { CORE_CONTRACT_COVERAGE_BASELINE } from '../src/contract-coverage/index.ts';

const { summary } = CORE_CONTRACT_COVERAGE_BASELINE;

console.log('Core contract coverage baseline');
console.log('===============================');
console.log(`Indexed contracts: ${summary.indexedContractCount}`);
console.log(
  `Structurally covered families: ${summary.structurallyCoveredContractFamilyCount}/${summary.totalContractFamilyCount}`
);
console.log(
  `Domains: ${summary.totalDomainCount} (${summary.mustBuildNowDomainCount} must build now, ${summary.stubNowDomainCount} stub now)`
);
console.log('');
console.log('Domain coverage by contract layer');

for (const [layer, count] of Object.entries(summary.layerDomainCounts)) {
  console.log(`- ${layer}: ${count}/${summary.totalDomainCount}`);
}

console.log('');
console.log(
  `Required layers present: ${summary.requiredLayerCompleteDomainCount}/${summary.totalDomainCount} domains`
);
console.log(
  `Missing required layer slots: ${summary.missingRequiredLayerSlotCount}`
);
console.log(
  `Collection-validated domains: ${summary.collectionValidatedDomainCount}/${summary.totalDomainCount}`
);
console.log(
  `Domain contract behavior-tested: ${summary.domainBehaviorTestedCount}/${summary.totalDomainCount}`
);
console.log(`Global API skeletons: ${summary.globalApiSkeletonCount}`);
console.log('');
console.log(
  'Boundary: this baseline measures contract structure only; runtime, behavior, and production readiness are not assessed.'
);
