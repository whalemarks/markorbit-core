import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CORE_SERVICE_CONTRACT_SKELETONS,
  validateCoreServiceContractSkeletons
} from '../../src/index.ts';

describe('CORE-TASK-037 Service contract behavior metadata', () => {
  it('locks Customer and Brand behavior metadata without changing skeleton depth', () => {
    const customer = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'customer-service'
    );
    const brand = CORE_SERVICE_CONTRACT_SKELETONS.find(
      (contract) => contract.serviceType === 'brand-service'
    );
    assert.equal(customer?.implementationDepth, 'validated_skeleton');
    assert.equal(customer?.metadata?.implementationTask, 'CORE-TASK-021');
    assert.equal(
      customer?.metadata?.behaviorImplementationTask,
      'CORE-TASK-036'
    );
    assert.equal(customer?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(customer?.metadata?.implementedOperations, [
      'createCustomer',
      'getCustomer',
      'listCustomers',
      'validateCustomerReference',
      'changeCustomerStatus'
    ]);

    assert.equal(brand?.implementationDepth, 'validated_skeleton');
    assert.equal(brand?.metadata?.implementationTask, 'CORE-TASK-021');
    assert.equal(brand?.metadata?.behaviorImplementationTask, 'CORE-TASK-037');
    assert.equal(brand?.metadata?.behaviorDepth, 'level_2_3');
    assert.deepEqual(brand?.metadata?.implementedOperations, [
      'createBrand',
      'getBrand',
      'listBrands',
      'validateBrandReference',
      'changeBrandStatus'
    ]);
  });

  it('keeps behavior metadata absent from the remaining Service skeletons', () => {
    const remaining = CORE_SERVICE_CONTRACT_SKELETONS.filter(
      (contract) =>
        contract.serviceType !== 'customer-service' &&
        contract.serviceType !== 'brand-service'
    );
    assert.ok(
      remaining.every(
        (contract) =>
          contract.metadata?.behaviorImplementationTask === undefined &&
          contract.metadata?.behaviorDepth === undefined &&
          contract.metadata?.implementedOperations === undefined
      )
    );
    assert.deepEqual(
      validateCoreServiceContractSkeletons(CORE_SERVICE_CONTRACT_SKELETONS),
      []
    );
  });
});
