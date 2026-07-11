import { CORE_CONTRACT_COVERAGE_BASELINE } from './core-contract-coverage-baseline.ts';
import {
  CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES,
  CORE_CONTRACT_GAP_PROGRESS
} from './core-contract-gap-inventory.ts';

export const CORE_CONTRACT_COVERAGE_ACCEPTANCE_LOCK = {
  id: 'core-contract-coverage-acceptance-lock-v0-1',
  version: '0.1.0',
  acceptedAt: '2026-07-11T00:00:00.000Z',
  task: 'CORE-TASK-025',
  scope: 'phase_3_contract_structure_acceptance_only',
  authority: CORE_CONTRACT_COVERAGE_BASELINE.authority,
  acceptedState: {
    indexedContractCount:
      CORE_CONTRACT_COVERAGE_BASELINE.summary.indexedContractCount,
    structurallyCoveredContractFamilyCount:
      CORE_CONTRACT_COVERAGE_BASELINE.summary
        .structurallyCoveredContractFamilyCount,
    totalContractFamilyCount:
      CORE_CONTRACT_COVERAGE_BASELINE.summary.totalContractFamilyCount,
    totalDomainCount: CORE_CONTRACT_COVERAGE_BASELINE.summary.totalDomainCount,
    requiredLayerCompleteDomainCount:
      CORE_CONTRACT_COVERAGE_BASELINE.summary.requiredLayerCompleteDomainCount,
    missingRequiredLayerSlotCount:
      CORE_CONTRACT_COVERAGE_BASELINE.summary.missingRequiredLayerSlotCount,
    completedCanonicalTargetCount:
      CORE_CONTRACT_GAP_PROGRESS.completedCanonicalTargetCount,
    remainingCanonicalTargetCount:
      CORE_CONTRACT_GAP_PROGRESS.remainingCanonicalTargetCount,
    implementationBatches: CORE_CONTRACT_GAP_IMPLEMENTATION_BATCHES.map(
      (batch) => ({
        id: batch.id,
        targetCount: batch.targetCount,
        completedTargetCount:
          CORE_CONTRACT_GAP_PROGRESS.batches.find(
            (entry) => entry.id === batch.id
          )?.completedTargetCount ?? 0,
        status: 'accepted' as const
      })
    )
  },
  acceptanceChecks: {
    indexMatchesProjectedFinalCount:
      CORE_CONTRACT_COVERAGE_BASELINE.summary.indexedContractCount === 187,
    allContractFamiliesStructurallyCovered:
      CORE_CONTRACT_COVERAGE_BASELINE.summary
        .structurallyCoveredContractFamilyCount ===
      CORE_CONTRACT_COVERAGE_BASELINE.summary.totalContractFamilyCount,
    allDomainsHaveRequiredLayers:
      CORE_CONTRACT_COVERAGE_BASELINE.summary
        .requiredLayerCompleteDomainCount ===
        CORE_CONTRACT_COVERAGE_BASELINE.summary.totalDomainCount &&
      CORE_CONTRACT_COVERAGE_BASELINE.summary.missingRequiredLayerSlotCount ===
        0,
    allCanonicalTargetsCompleted:
      CORE_CONTRACT_GAP_PROGRESS.completedCanonicalTargetCount === 81 &&
      CORE_CONTRACT_GAP_PROGRESS.remainingCanonicalTargetCount === 0,
    noPartialImplementationBatch:
      CORE_CONTRACT_GAP_PROGRESS.partialBatchIds.length === 0,
    currentIndexMatchesCompletedTargets:
      CORE_CONTRACT_GAP_PROGRESS.currentIndexMatchesCompletedTargets
  },
  assessmentBoundary: {
    structuralCoverageAccepted: true,
    sourceAlignmentAcceptedForLockedTargets: true,
    runtimeCoverageAccepted: false,
    behaviorCoverageAccepted: false,
    productionReadinessAccepted: false
  },
  nonGoals: [
    'No runtime behavior is accepted by this lock.',
    'No contract implementation completeness is asserted beyond validated skeleton structure.',
    'No workflow execution, state mutation, Task creation, or Event emission is authorized.',
    'No Product or Book 3 behavior is included.'
  ]
} as const;
