/**
 * Result returned by the dispatch engine
 *
 * Indicates whether the request was handled and provides the result if available
 */
export class DispatchResult<TResult> {
  private static readonly NOT_HANDLED = new DispatchResult<never>(false, null as never);

  private constructor(
    private readonly _handled: boolean,
    private readonly _result: TResult
  ) {}

  /**
   * Create a result indicating the request was handled
   */
  static handled<TResult>(result: TResult): DispatchResult<TResult> {
    return new DispatchResult(true, result);
  }

  /**
   * Create a result indicating the request was not handled
   */
  static notHandled<TResult>(): DispatchResult<TResult> {
    return DispatchResult.NOT_HANDLED as DispatchResult<TResult>;
  }

  /**
   * Check if the request was handled
   */
  isHandled(): boolean {
    return this._handled;
  }

  /**
   * Get the result (only valid if handled)
   */
  getResult(): TResult {
    return this._result;
  }
}
