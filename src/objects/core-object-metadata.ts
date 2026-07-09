export interface CoreObjectMetadata {
  readonly createdAt: string;
  readonly createdBy?: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
  readonly tags?: readonly string[];
  readonly notes?: string;
}
