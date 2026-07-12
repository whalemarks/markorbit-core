export const CORE_IDEMPOTENCY_FIXTURE = Object.freeze({
  idempotencyKey: 'idem:create-order:001',
  idempotencyScope: 'Organization',
  operationName: 'CreateOrder',
  request: Object.freeze({
    organizationId: 'org:alpha',
    sku: 'book-02',
    quantity: 1
  }),
  permissionAllowed: true,
  policyAllowed: true,
  correlationId: 'request:idempotency:001',
  ttlMilliseconds: 60_000
});
