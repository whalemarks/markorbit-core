import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_MVP_EVENT_CONTRACT_LOCKS,
  CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS,
  CORE_MVP_EVENT_TYPES,
  evaluateCoreMvpEventReferenceUse,
  validateCoreMvpEventContractLocks,
  type CoreMvpEventContractLockEntry
} from '../../src/index.ts';

const clone = () =>
  structuredClone(
    CORE_MVP_EVENT_CONTRACT_LOCKS
  ) as unknown as CoreMvpEventContractLockEntry[];

describe('CORE-TASK-056 exact MVP Event contract and alias lock', () => {
  it('locks all 18 Must Build Event types in canonical order', () => {
    assert.equal(CORE_MVP_EVENT_CONTRACT_LOCKS.length, 18);
    assert.deepEqual(
      CORE_MVP_EVENT_CONTRACT_LOCKS.map((entry) => entry.eventType),
      CORE_MVP_EVENT_TYPES
    );
    assert.deepEqual(validateCoreMvpEventContractLocks(), []);
  });

  it('uses exact canonical contracts except for three explicit aliases', () => {
    const aliases = CORE_MVP_EVENT_CONTRACT_LOCKS.filter(
      (entry) => entry.resolution.kind === 'validated_alias'
    );
    assert.equal(aliases.length, 3);
    assert.deepEqual(
      aliases.map((entry) => [
        entry.eventType,
        entry.resolution.aliasTargetEventType
      ]),
      [
        ['document-attached', 'core-object-updated'],
        ['communication-reviewed', 'core-communication-approved'],
        ['workflow-contract-previewed', 'core-workflow-contract-registered']
      ]
    );
  });

  it('locks every required trace field and fail-closed boundary', () => {
    for (const entry of CORE_MVP_EVENT_CONTRACT_LOCKS) {
      assert.deepEqual(
        entry.requiredTraceFields,
        CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS
      );
      assert.equal(entry.boundaries.traceOnly, true);
      assert.equal(entry.boundaries.commandTriggerAllowed, false);
      assert.equal(entry.boundaries.directApiEmissionAllowed, false);
      assert.equal(entry.boundaries.directWorkflowEmissionAllowed, false);
      assert.equal(entry.boundaries.directAgentEmissionAllowed, false);
      assert.equal(entry.boundaries.owningServiceTraceHandoffRequired, true);
      assert.equal(entry.boundaries.eventBusImplemented, false);
    }
  });

  it('allows trace references but blocks command and direct-emitter uses', () => {
    assert.equal(
      evaluateCoreMvpEventReferenceUse('task-created', 'trace_reference')
        .allowed,
      true
    );
    for (const use of [
      'command_trigger',
      'api_direct_emit',
      'workflow_direct_emit',
      'agent_direct_emit'
    ] as const) {
      assert.equal(
        evaluateCoreMvpEventReferenceUse('task-created', use).allowed,
        false
      );
    }
  });

  it('rejects duplicate, incomplete, unsafe and unresolved alias records', () => {
    const duplicate = clone();
    duplicate[1] = { ...duplicate[1], eventType: duplicate[0].eventType };
    assert.ok(
      validateCoreMvpEventContractLocks(duplicate).some((error) =>
        error.includes('unique')
      )
    );

    const missingTrace = clone();
    missingTrace[0] = {
      ...missingTrace[0],
      requiredTraceFields: missingTrace[0].requiredTraceFields.slice(
        1
      ) as unknown as typeof CORE_MVP_EVENT_REQUIRED_TRACE_FIELDS
    };
    assert.ok(
      validateCoreMvpEventContractLocks(missingTrace).some((error) =>
        error.includes('requiredTraceFields')
      )
    );

    const command = clone();
    command[0] = {
      ...command[0],
      boundaries: {
        ...command[0].boundaries,
        commandTriggerAllowed: true as false
      }
    };
    assert.ok(
      validateCoreMvpEventContractLocks(command).some((error) =>
        error.includes('trace-only')
      )
    );

    const alias = clone();
    const aliasIndex = alias.findIndex(
      (entry) => entry.eventType === 'document-attached'
    );
    alias[aliasIndex] = {
      ...alias[aliasIndex],
      resolution: {
        ...alias[aliasIndex].resolution,
        aliasTargetEventType: 'unknown-event' as never
      }
    };
    assert.ok(
      validateCoreMvpEventContractLocks(alias).some((error) =>
        error.includes('alias target')
      )
    );
  });
});
