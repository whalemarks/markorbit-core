import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CORE_SERVICE_CONTRACT_SKELETONS } from '../../src/contracts/service/core-service-contract-skeletons.ts';
import { validateCoreServiceContractSkeletons } from '../../src/contracts/service/core-service-contract-validation.ts';

const classification = CORE_SERVICE_CONTRACT_SKELETONS[6];

describe('CORE-TASK-040 Classification Service contract metadata', () => {
  it('promotes the index-6 Classification placeholder in place', () => {
    assert.equal(CORE_SERVICE_CONTRACT_SKELETONS.length, 26);
    assert.equal(classification?.id, 'core-service-classification-service-contract');
    assert.equal(classification?.serviceType, 'classification-service');
    assert.equal(classification?.domainId, 'classification');
    assert.equal(
      classification?.sourcePath,
      'books/book-02-core-specification/core-specs/services/classification-service.md'
    );
    assert.equal(classification?.implementationDepth, 'validated_skeleton');
    assert.deepEqual(classification?.metadata, {
      specificationRepository: 'whalemarks/markorbit-publication',
      specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
      specificationPath: 'books/book-02-core-specification/',
      implementationTask: 'CORE-TASK-040',
      behaviorImplementationTask: 'CORE-TASK-040',
      behaviorDepth: 'level_2_3',
      implementedOperations: [
        'createClassification',
        'getClassification',
        'listClassifications',
        'validateClassification',
        'validateClassificationReference',
        'changeClassificationStatus'
      ]
    });
    assert.deepEqual(validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS), []);
    assert.equal(
      CORE_SERVICE_CONTRACT_SKELETONS.some(
        (entry) => entry.serviceType === 'classification-reference-service'
      ),
      false
    );
  });
});
