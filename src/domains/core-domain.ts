export type { CoreDomainCategory } from './core-domain-category.ts';

export type CoreDomainId = string;
export type CoreDomainName = string;

export interface CoreDomainDefinition {
  readonly id: CoreDomainId;
  readonly name: CoreDomainName;
  readonly category: import('./core-domain-category.ts').CoreDomainCategory;
  readonly description: string;
  readonly book: 'Book 02 — MarkOrbit Core Specification';
  readonly status: 'active';
}
