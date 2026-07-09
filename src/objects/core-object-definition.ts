import type { CoreDomainId } from '../domains/index.ts';
import type { CoreObjectId } from './core-object-id.ts';
import type { CoreObjectMetadata } from './core-object-metadata.ts';
import type { CoreObjectStatus } from './core-object-status.ts';
import type { CoreObjectType } from './core-object-type.ts';
import type { CoreObjectVersion } from './core-object-version.ts';

export interface CoreObjectDefinition {
  readonly id: CoreObjectId;
  readonly type: CoreObjectType;
  readonly domainId: CoreDomainId;
  readonly status: CoreObjectStatus;
  readonly version: CoreObjectVersion;
  readonly metadata: CoreObjectMetadata;
}
