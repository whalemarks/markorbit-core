import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

const evidence = CORE_SERVICE_CONTRACT_SKELETONS[8];

describe('CORE-TASK-042B Evidence Service contract metadata', () => {
  it('promotes the index-8 Evidence placeholder in place', () => {
    assert.equal(CORE_SERVICE_CONTRACT_SKELETONS.length, 26);
    assert.equal(evidence?.id, 'core-service-evidence-service-contract');
    assert.equal(evidence?.serviceType, 'evidence-service');
    assert.equal(evidence?.domainId, 'evidence');
    assert.equal(
      evidence?.sourcePath,
      'books/book-02-core-specification/core-specs/services/evidence-service.md'
    );
    assert.equal(evidence?.implementationDepth, 'validated_skeleton');
    assert.deepEqual(evidence?.metadata, {
      specificationRepository: 'whalemarks/markorbit-publication',
      specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
      specificationPath: 'books/book-02-core-specification/',
      implementationTask: 'CORE-TASK-042',
      behaviorImplementationTask: 'CORE-TASK-042B',
      behaviorDepth: 'level_2_3',
      implementedOperations: [
        'createEvidence',
        'getEvidence',
        'listEvidence',
        'updateEvidence',
        'validateEvidenceReference',
        'linkEvidenceSource',
        'linkEvidenceClaim',
        'linkEvidenceDocument',
        'linkEvidenceTrademark',
        'linkEvidenceBrand',
        'linkEvidenceClassification',
        'requireEvidenceReview',
        'reviewEvidence',
        'changeEvidenceStatus'
      ]
    });
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
    assert.equal(
      CORE_SERVICE_CONTRACT_SKELETONS.some(
        (entry) => entry.serviceType === 'evidence-reference-service'
      ),
      false
    );
  });
});
