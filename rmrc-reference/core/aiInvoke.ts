export interface AIInvokeParams {
  prompt: string;
  userInput: string;
}

export interface AIInvokeResult {
  output: string | null;
}

/**
 * AI invocation stub.
 *
 * This implementation is intentionally SDK-free
 * to keep builds stable and architecture isolated.
 *
 * A real AI provider is introduced later via
 * a separate integration layer or branch.
 */
export async function invokeAI(
  params: AIInvokeParams
): Promise<AIInvokeResult> {
  // Minimal placeholder behavior for build stability
  return {
    output: params.userInput
      ? `(${params.userInput})`
      : null,
  };
}
