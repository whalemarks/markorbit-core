import type { CoreContractId } from './core-contract-id.ts';
import type { CoreContractStatus } from './core-contract-status.ts';
import type { CoreContractType } from './core-contract-type.ts';

export interface CoreContractReference {
  readonly id: CoreContractId;
  readonly type: CoreContractType;
  readonly status?: CoreContractStatus;
}
