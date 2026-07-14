import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

const document = CORE_SERVICE_CONTRACT_SKELETONS[7];

describe('CORE-TASK-041 Document Service contract metadata', () => {
  it('promotes the index-7 Document placeholder in place', () => {
    assert.equal(CORE_SERVICE_CONTRACT_SKELETONS.length, 26);
    assert.equal(document?.id, 'core-service-document-service-contract');
    assert.equal(document?.serviceType, 'document-service');
    assert.equal(document?.domainId, 'document');
    assert.equal(
      document?.sourcePath,
      'books/book-02-core-specification/core-specs/services/document-service.md'
    );
    assert.equal(document?.implementationDepth, 'validated_skeleton');
    assert.deepEqual(document?.metadata, {
      specificationRepository: 'whalemarks/markorbit-publication',
      specificationCommit: '3349ecb8955021a8714d023348f8b24f941eb98f',
      specificationPath: 'books/book-02-core-specification/',
      implementationTask: 'CORE-TASK-041',
      behaviorImplementationTask: 'CORE-TASK-041',
      behaviorDepth: 'level_2_3',
      implementedOperations: [
        'createDocument',
        'getDocument',
        'listDocuments',
        'validateDocumentReference',
        'linkDocumentFile',
        'requireDocumentReview',
        'reviewDocument',
        'changeDocumentStatus'
      ]
    });
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
    assert.equal(
      CORE_SERVICE_CONTRACT_SKELETONS.some(
        (entry) => entry.serviceType === 'document-reference-service'
      ),
      false
    );
  });
});
