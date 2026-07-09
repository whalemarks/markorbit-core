import type { CoreEvent } from './core-event.ts';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

export function validateCoreEvent(event: CoreEvent): readonly string[] {
  const errors: string[] = [];

  if (!event.id) errors.push('CoreEvent.id is required.');
  if (!event.type) errors.push('CoreEvent.type is required.');
  if (!event.action) errors.push('CoreEvent.action is required.');
  if (!event.domainId) errors.push('CoreEvent.domainId is required.');
  if (!event.source) errors.push('CoreEvent.source is required.');
  if (!event.occurredAt) errors.push('CoreEvent.occurredAt is required.');

  if (event.object) {
    if (!event.object.id) errors.push('CoreEvent.object.id is required when object is present.');
    if (!event.object.type) errors.push('CoreEvent.object.type is required when object is present.');
    if (!event.object.domainId) errors.push('CoreEvent.object.domainId is required when object is present.');
  }

  if (event.payload !== undefined && !isPlainObject(event.payload)) {
    errors.push('CoreEvent.payload must be a plain object when present.');
  }

  if (event.metadata !== undefined && !isPlainObject(event.metadata)) {
    errors.push('CoreEvent.metadata must be a plain object when present.');
  }

  return errors;
}
