import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumedCoreVersion,
  consumedManifest,
  sampleApiBoundary,
  sampleEvent,
  samplePermission,
  sampleReference,
  sampleTask,
  sampleWorkflow
} from './package-consumer.ts';

test('independent consumer resolves bounded package exports', () => {
  assert.equal(consumedCoreVersion, '0.1.0');
  assert.equal(consumedManifest.packageName, '@markorbit/core');
  assert.equal(consumedManifest.productionReadiness, false);
  assert.equal(consumedManifest.fullWorkflowRuntime, 'excluded');
  assert.equal(sampleReference.domainId, 'customer');
  assert.equal(sampleEvent.object, sampleReference);
  assert.equal(sampleTask.object, sampleReference);
  assert.equal(samplePermission.requiresHumanReview, true);
  assert.equal(sampleApiBoundary.directDomainMutation, false);
  assert.equal(sampleApiBoundary.directEventEmission, false);
  assert.deepEqual(sampleWorkflow.steps, []);
});
