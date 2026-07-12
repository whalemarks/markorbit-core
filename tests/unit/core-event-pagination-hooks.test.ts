import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CoreEventTraceRegistry, paginateCoreItems } from '../../src/index.ts';

const context = {
  permissionAllowed: true,
  policyAllowed: true,
  actorReferenceId: 'user:1',
  allowedSortFields: ['label'],
  totalCountAllowed: false,
  correlationId: 'request:1'
};
const options = {
  queryKey: 'brands:active',
  cursorSecret: 'fixture-secret',
  visible: (item: Record<string, unknown>) => item.visible === true,
  redact: ({ secret: _secret, ...item }: Record<string, unknown>) => item
};

describe('CORE-TASK-031 Event Trace and Pagination Hooks', () => {
  it('records immutable append-only event trace and filters visibility', () => {
    const registry = new CoreEventTraceRegistry();
    const event = {
      id: 'event:1' as never,
      type: 'matter-updated' as never,
      action: 'Updated' as never,
      domainId: 'matter' as never,
      source: { actorType: 'user', actorId: 'user:1' } as never,
      occurredAt: '2026-07-12T00:00:00.000Z',
      correlationId: 'request:1'
    };
    assert.equal(
      registry.append({
        event,
        visibility: 'Internal',
        auditContextReferenceId: 'audit:1'
      }).ok,
      true
    );
    assert.equal(
      registry.append({
        event,
        visibility: 'Internal',
        auditContextReferenceId: 'audit:1'
      }).ok,
      false
    );
    assert.equal(registry.visibleTo(['CustomerVisible']).length, 0);
    assert.equal(registry.visibleTo(['Internal']).length, 1);
  });
  it('returns bounded policy-filtered pages without revealing hidden totals', () => {
    const items = [
      { label: 'B', visible: true, secret: 1 },
      { label: 'A', visible: true, secret: 2 },
      { label: 'Hidden', visible: false, secret: 3 }
    ];
    const first = paginateCoreItems(
      items,
      {
        limit: 1,
        sortField: 'label',
        sortDirection: 'Asc',
        includeTotalCount: true
      },
      context,
      options
    );
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.deepEqual(first.value.items, [{ label: 'A', visible: true }]);
    assert.equal(first.value.pagination.totalCount, null);
    assert.equal(first.value.pagination.hasMore, true);
    const second = paginateCoreItems(
      items,
      {
        limit: 1,
        sortField: 'label',
        cursor: first.value.pagination.nextCursor
      },
      context,
      options
    );
    assert.equal(second.ok && second.value.items[0]?.label, 'B');
  });
  it('rejects permission, policy, limit, sort, and tampered cursor violations', () => {
    const items = [{ label: 'A', visible: true }];
    assert.equal(
      paginateCoreItems(
        items,
        {},
        { ...context, permissionAllowed: false },
        options
      ).ok,
      false
    );
    assert.equal(
      paginateCoreItems(
        items,
        {},
        { ...context, policyAllowed: false },
        options
      ).ok,
      false
    );
    assert.equal(
      paginateCoreItems(items, { limit: 101 }, context, options).ok,
      false
    );
    assert.equal(
      paginateCoreItems(items, { sortField: 'secret' }, context, options).ok,
      false
    );
    assert.equal(
      paginateCoreItems(items, { cursor: 'tampered.cursor' }, context, options)
        .ok,
      false
    );
  });
  it('applies the stricter Agent page limit', () => {
    assert.equal(
      paginateCoreItems(
        [],
        { limit: 51 },
        { ...context, actorReferenceId: null, agentReferenceId: 'agent:1' },
        { ...options, agentRequest: true }
      ).ok,
      false
    );
  });
});
