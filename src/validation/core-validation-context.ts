export interface CoreValidationContext {
  readonly source: string;
  readonly phase?: string;
  readonly strict?: boolean;
  readonly metadata?: Record<string, unknown>;
}
