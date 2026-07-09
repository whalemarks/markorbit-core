import type { CoreDomainId } from '../domains/index.ts';
import type { CoreObjectId } from './core-object-id.ts';
import type { CoreObjectType } from './core-object-type.ts';

export interface CoreObjectReference {
  readonly id: CoreObjectId;
  readonly type: CoreObjectType;
  readonly domainId: CoreDomainId;
}
